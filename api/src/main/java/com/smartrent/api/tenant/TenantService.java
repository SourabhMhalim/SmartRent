package com.smartrent.api.tenant;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.smartrent.api.common.DomainException;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.tenant.TenantModels.AvailableUnitResponse;
import com.smartrent.api.tenant.TenantModels.EndLeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseResponse;
import com.smartrent.api.tenant.TenantModels.TenantRequest;
import com.smartrent.api.tenant.TenantModels.TenantResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantService {

    private static final int MAX_ACTIVE_TENANTS_PER_LANDLORD = 5;

    private final TenantRepository repository;

    public TenantService(TenantRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TenantResponse createTenant(UUID landlordId, TenantRequest request) {
        if (repository.countActiveTenants(landlordId) >= MAX_ACTIVE_TENANTS_PER_LANDLORD) {
            throw new DomainException(
                    409,
                    "This portfolio version supports up to 5 active tenants per landlord.",
                    "tenant_limit_reached"
            );
        }
        return repository.createTenant(landlordId, request);
    }

    public List<TenantResponse> listTenants(UUID landlordId, String search) {
        return repository.findTenants(landlordId, search);
    }

    public TenantResponse getTenant(UUID landlordId, UUID tenantId) {
        return repository.findTenant(landlordId, tenantId)
                .orElseThrow(() -> notFound("Tenant"));
    }

    public TenantResponse getTenantByUserId(UUID tenantUserId) {
        return repository.findTenantByUserId(tenantUserId)
                .orElseThrow(() -> notFound("Tenant"));
    }

    public List<InvoiceResponse> listTenantInvoices(UUID tenantUserId) {
        getTenantByUserId(tenantUserId);
        return repository.findInvoicesByTenantUserId(tenantUserId);
    }

    @Transactional
    public TenantResponse updateTenant(
            UUID landlordId,
            UUID tenantId,
            TenantRequest request
    ) {
        getTenant(landlordId, tenantId);
        return repository.updateTenant(landlordId, tenantId, request);
    }

    @Transactional
    public void archiveTenant(UUID landlordId, UUID tenantId) {
        TenantResponse tenant = getTenant(landlordId, tenantId);
        if (tenant.activeLease() != null) {
            throw new DomainException(
                    409,
                    "A tenant with an active lease cannot be archived.",
                    "tenant_has_active_lease"
            );
        }
        repository.archiveTenant(landlordId, tenantId);
    }

    public List<AvailableUnitResponse> listAvailableUnits(UUID landlordId) {
        return repository.findAvailableUnits(landlordId);
    }

    @Transactional
    public LeaseResponse createLease(
            UUID landlordId,
            UUID tenantId,
            LeaseRequest request
    ) {
        getTenant(landlordId, tenantId);
        if (repository.findActiveLeaseForTenant(landlordId, tenantId).isPresent()) {
            throw new DomainException(
                    409,
                    "This tenant already has an active lease.",
                    "tenant_has_active_lease"
            );
        }
        AvailableUnitResponse unit = repository.findAvailableUnit(landlordId, request.unitId())
                .orElseThrow(() -> new DomainException(
                        409,
                        "The selected unit is not available.",
                        "unit_not_available"
                ));

        LeaseRequest leaseRequest = new LeaseRequest(
                request.unitId(),
                request.startDate(),
                unit.baseRent(),
                request.securityDeposit(),
                request.notes()
        );
        LeaseResponse lease = repository.createLease(landlordId, tenantId, leaseRequest);
        repository.updateUnitStatus(landlordId, request.unitId(), "OCCUPIED");
        return lease;
    }

    @Transactional
    public LeaseResponse endLease(
            UUID landlordId,
            UUID leaseId,
            EndLeaseRequest request
    ) {
        LeaseResponse lease = repository.findLease(landlordId, leaseId)
                .orElseThrow(() -> notFound("Lease"));
        if (lease.status() != TenantModels.LeaseStatus.ACTIVE) {
            throw new DomainException(
                    409,
                    "Only an active lease can be ended.",
                    "lease_not_active"
            );
        }
        LocalDate endDate = request.endDate();
        if (endDate.isBefore(lease.startDate())) {
            throw new DomainException(
                    400,
                    "Lease end date cannot be before its start date.",
                    "invalid_lease_end_date"
            );
        }
        repository.endLease(landlordId, leaseId, endDate);
        repository.updateUnitStatus(landlordId, lease.unitId(), "VACANT");
        return repository.findLease(landlordId, leaseId).orElseThrow();
    }

    private DomainException notFound(String resource) {
        return new DomainException(
                404,
                resource + " was not found.",
                resource.toLowerCase() + "_not_found"
        );
    }
}
