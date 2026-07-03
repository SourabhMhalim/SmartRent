package com.smartrent.api.property;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.common.DomainException;
import com.smartrent.api.property.PropertyModels.PropertyRequest;
import com.smartrent.api.property.PropertyModels.PropertyResponse;
import com.smartrent.api.property.PropertyModels.PropertyType;
import com.smartrent.api.property.PropertyModels.UnitRequest;
import com.smartrent.api.property.PropertyModels.UnitResponse;
import com.smartrent.api.property.PropertyModels.UnitStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PropertyServiceTest {

    @Mock
    private PropertyRepository repository;

    private PropertyService service;

    @BeforeEach
    void setUp() {
        service = new PropertyService(repository);
    }

    @Test
    void rejectsUpdatingAPropertyOwnedByAnotherLandlord() {
        UUID landlordId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        PropertyRequest request = propertyRequest();
        when(repository.findProperty(landlordId, propertyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateProperty(landlordId, propertyId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("Property was not found.");

        verify(repository, never()).updateProperty(landlordId, propertyId, request);
    }

    @Test
    void rejectsArchivingAPropertyWithOccupiedUnits() {
        UUID landlordId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        when(repository.findProperty(landlordId, propertyId))
                .thenReturn(Optional.of(property(propertyId, 1)));

        assertThatThrownBy(() -> service.archiveProperty(landlordId, propertyId))
                .isInstanceOf(DomainException.class)
                .hasMessage("A property with occupied units cannot be archived.");

        verify(repository, never()).archiveUnitsForProperty(landlordId, propertyId);
        verify(repository, never()).archiveProperty(landlordId, propertyId);
    }

    @Test
    void archivesVacantUnitsBeforeArchivingTheirProperty() {
        UUID landlordId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        when(repository.findProperty(landlordId, propertyId))
                .thenReturn(Optional.of(property(propertyId, 0)));

        service.archiveProperty(landlordId, propertyId);

        verify(repository).archiveUnitsForProperty(landlordId, propertyId);
        verify(repository).archiveProperty(landlordId, propertyId);
    }

    @Test
    void rejectsDuplicateUnitNumbersWithinAProperty() {
        UUID landlordId = UUID.randomUUID();
        UUID propertyId = UUID.randomUUID();
        UnitRequest request = unitRequest();
        when(repository.findProperty(landlordId, propertyId))
                .thenReturn(Optional.of(property(propertyId, 0)));
        when(repository.unitNumberExists(
                landlordId,
                propertyId,
                request.unitNumber(),
                null
        )).thenReturn(true);

        assertThatThrownBy(() -> service.createUnit(landlordId, propertyId, request))
                .isInstanceOf(DomainException.class)
                .hasMessage("A unit with this number already exists in the property.");

        verify(repository, never()).createUnit(landlordId, propertyId, request);
    }

    @Test
    void rejectsArchivingAnOccupiedUnit() {
        UUID landlordId = UUID.randomUUID();
        UUID unitId = UUID.randomUUID();
        when(repository.findUnit(landlordId, unitId))
                .thenReturn(Optional.of(unit(unitId, UnitStatus.OCCUPIED)));

        assertThatThrownBy(() -> service.archiveUnit(landlordId, unitId))
                .isInstanceOf(DomainException.class)
                .hasMessage("An occupied unit cannot be archived.");

        verify(repository, never()).archiveUnit(landlordId, unitId);
    }

    private PropertyRequest propertyRequest() {
        return new PropertyRequest(
                "Lakeview Residency",
                PropertyType.APARTMENT,
                "12 Baner Road",
                "Pune",
                "Maharashtra",
                "411045",
                null
        );
    }

    private UnitRequest unitRequest() {
        return new UnitRequest(
                "A-101",
                "1",
                new BigDecimal("18500"),
                new BigDecimal("9"),
                UnitStatus.VACANT,
                null
        );
    }

    private PropertyResponse property(UUID id, int occupiedUnits) {
        return new PropertyResponse(
                id,
                "Lakeview Residency",
                PropertyType.APARTMENT,
                "12 Baner Road",
                "Pune",
                "Maharashtra",
                "411045",
                null,
                occupiedUnits + 1,
                occupiedUnits,
                1,
                Instant.now(),
                Instant.now()
        );
    }

    private UnitResponse unit(UUID id, UnitStatus status) {
        return new UnitResponse(
                id,
                UUID.randomUUID(),
                "A-101",
                "1",
                new BigDecimal("18500"),
                new BigDecimal("9"),
                status,
                null,
                Instant.now(),
                Instant.now()
        );
    }
}
