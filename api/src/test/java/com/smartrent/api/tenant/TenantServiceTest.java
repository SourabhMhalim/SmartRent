package com.smartrent.api.tenant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.common.DomainException;
import com.smartrent.api.tenant.TenantModels.AvailableUnitResponse;
import com.smartrent.api.tenant.TenantModels.EndLeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseResponse;
import com.smartrent.api.tenant.TenantModels.LeaseStatus;
import com.smartrent.api.tenant.TenantModels.TenantResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TenantServiceTest {

    @Mock
    private TenantRepository repository;

    private TenantService service;

    @BeforeEach
    void setUp() {
        service = new TenantService(repository);
    }

    @Test
    void rejectsArchivingTenantWithActiveLease() {
        UUID landlordId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        when(repository.findTenant(landlordId, tenantId))
                .thenReturn(Optional.of(tenant(tenantId, lease(tenantId, LeaseStatus.ACTIVE))));

        assertThatThrownBy(() -> service.archiveTenant(landlordId, tenantId))
                .isInstanceOf(DomainException.class)
                .hasMessage("A tenant with an active lease cannot be archived.");

        verify(repository, never()).archiveTenant(landlordId, tenantId);
    }

    @Test
    void rejectsAssigningUnavailableUnit() {
        UUID landlordId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        LeaseRequest request = leaseRequest();
        when(repository.findTenant(landlordId, tenantId))
                .thenReturn(Optional.of(tenant(tenantId, null)));
        when(repository.findActiveLeaseForTenant(landlordId, tenantId))
                .thenReturn(Optional.empty());
        when(repository.findAvailableUnit(landlordId, request.unitId()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createLease(landlordId, tenantId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("The selected unit is not available.");

        verify(repository, never()).createLease(landlordId, tenantId, request);
    }

    @Test
    void createsLeaseAndMarksUnitOccupied() {
        UUID landlordId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        LeaseRequest request = leaseRequest();
        BigDecimal unitBaseRent = new BigDecimal("21500");
        LeaseRequest expectedRequest = new LeaseRequest(
                request.unitId(),
                request.startDate(),
                unitBaseRent,
                request.securityDeposit(),
                request.notes()
        );
        LeaseResponse lease = lease(tenantId, LeaseStatus.ACTIVE);
        when(repository.findTenant(landlordId, tenantId))
                .thenReturn(Optional.of(tenant(tenantId, null)));
        when(repository.findActiveLeaseForTenant(landlordId, tenantId))
                .thenReturn(Optional.empty());
        when(repository.findAvailableUnit(landlordId, request.unitId()))
                .thenReturn(Optional.of(new AvailableUnitResponse(
                        request.unitId(), "A-101", "1", unitBaseRent,
                        UUID.randomUUID(), "Lakeview"
                )));
        when(repository.createLease(landlordId, tenantId, expectedRequest)).thenReturn(lease);

        service.createLease(landlordId, tenantId, request);

        verify(repository).createLease(landlordId, tenantId, expectedRequest);
        verify(repository).updateUnitStatus(landlordId, request.unitId(), "OCCUPIED");
    }

    @Test
    void rejectsLeaseEndDateBeforeStartDate() {
        UUID landlordId = UUID.randomUUID();
        LeaseResponse lease = lease(UUID.randomUUID(), LeaseStatus.ACTIVE);
        when(repository.findLease(landlordId, lease.id())).thenReturn(Optional.of(lease));

        assertThatThrownBy(() -> service.endLease(
                landlordId,
                lease.id(),
                new EndLeaseRequest(lease.startDate().minusDays(1))
        )).isInstanceOf(DomainException.class)
                .hasMessage("Lease end date cannot be before its start date.");

        verify(repository, never()).endLease(
                landlordId,
                lease.id(),
                lease.startDate().minusDays(1)
        );
    }

    private LeaseRequest leaseRequest() {
        return new LeaseRequest(
                UUID.randomUUID(),
                LocalDate.now(),
                new BigDecimal("18500"),
                new BigDecimal("37000"),
                null
        );
    }

    private TenantResponse tenant(UUID id, LeaseResponse activeLease) {
        return new TenantResponse(
                id, "Neha Shah", "neha@example.com", "+919876543210",
                null, null, null, null, null, activeLease, Instant.now(), Instant.now()
        );
    }

    private LeaseResponse lease(UUID tenantId, LeaseStatus status) {
        return new LeaseResponse(
                UUID.randomUUID(), tenantId, UUID.randomUUID(), "A-101",
                UUID.randomUUID(), "Lakeview", LocalDate.now(), null,
                new BigDecimal("18500"), new BigDecimal("37000"), status,
                null, Instant.now(), Instant.now()
        );
    }
}
