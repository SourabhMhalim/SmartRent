package com.smartrent.api.property;

import java.util.List;
import java.util.UUID;

import com.smartrent.api.common.DomainException;
import com.smartrent.api.property.PropertyModels.PropertyRequest;
import com.smartrent.api.property.PropertyModels.PropertyResponse;
import com.smartrent.api.property.PropertyModels.UnitRequest;
import com.smartrent.api.property.PropertyModels.UnitResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyService {

    private static final int MAX_ACTIVE_PROPERTIES_PER_LANDLORD = 3;
    private static final int MAX_ACTIVE_UNITS_PER_PROPERTY = 5;

    private final PropertyRepository repository;

    public PropertyService(PropertyRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public PropertyResponse createProperty(UUID landlordId, PropertyRequest request) {
        if (repository.countActiveProperties(landlordId) >= MAX_ACTIVE_PROPERTIES_PER_LANDLORD) {
            throw new DomainException(
                    409,
                    "This portfolio version supports up to 3 active properties per landlord.",
                    "property_limit_reached"
            );
        }
        return repository.createProperty(landlordId, request);
    }

    public List<PropertyResponse> listProperties(UUID landlordId, String search) {
        return repository.findProperties(landlordId, search);
    }

    public PropertyResponse getProperty(UUID landlordId, UUID propertyId) {
        return repository.findProperty(landlordId, propertyId)
                .orElseThrow(() -> notFound("Property"));
    }

    @Transactional
    public PropertyResponse updateProperty(
            UUID landlordId,
            UUID propertyId,
            PropertyRequest request
    ) {
        getProperty(landlordId, propertyId);
        return repository.updateProperty(landlordId, propertyId, request);
    }

    @Transactional
    public void archiveProperty(UUID landlordId, UUID propertyId) {
        PropertyResponse property = getProperty(landlordId, propertyId);
        if (property.occupiedUnits() > 0) {
            throw new DomainException(
                    409,
                    "A property with occupied units cannot be archived.",
                    "property_has_occupied_units"
            );
        }
        repository.archiveUnitsForProperty(landlordId, propertyId);
        repository.archiveProperty(landlordId, propertyId);
    }

    @Transactional
    public UnitResponse createUnit(
            UUID landlordId,
            UUID propertyId,
            UnitRequest request
    ) {
        getProperty(landlordId, propertyId);
        if (repository.countActiveUnits(landlordId, propertyId) >= MAX_ACTIVE_UNITS_PER_PROPERTY) {
            throw new DomainException(
                    409,
                    "This portfolio version supports up to 5 active units per property.",
                    "unit_limit_reached"
            );
        }
        ensureUniqueUnitNumber(landlordId, propertyId, request.unitNumber(), null);
        return repository.createUnit(landlordId, propertyId, request);
    }

    public List<UnitResponse> listUnits(UUID landlordId, UUID propertyId) {
        getProperty(landlordId, propertyId);
        return repository.findUnits(landlordId, propertyId);
    }

    @Transactional
    public UnitResponse updateUnit(UUID landlordId, UUID unitId, UnitRequest request) {
        UnitResponse unit = repository.findUnit(landlordId, unitId)
                .orElseThrow(() -> notFound("Unit"));
        ensureUniqueUnitNumber(landlordId, unit.propertyId(), request.unitNumber(), unitId);
        return repository.updateUnit(landlordId, unitId, request);
    }

    @Transactional
    public void archiveUnit(UUID landlordId, UUID unitId) {
        UnitResponse unit = repository.findUnit(landlordId, unitId)
                .orElseThrow(() -> notFound("Unit"));
        if (unit.status() == PropertyModels.UnitStatus.OCCUPIED) {
            throw new DomainException(
                    409,
                    "An occupied unit cannot be archived.",
                    "unit_is_occupied"
            );
        }
        repository.archiveUnit(landlordId, unitId);
    }

    private void ensureUniqueUnitNumber(
            UUID landlordId,
            UUID propertyId,
            String unitNumber,
            UUID excludedUnitId
    ) {
        if (repository.unitNumberExists(
                landlordId,
                propertyId,
                unitNumber,
                excludedUnitId
        )) {
            throw new DomainException(
                    409,
                    "A unit with this number already exists in the property.",
                    "unit_number_exists"
            );
        }
    }

    private DomainException notFound(String resource) {
        return new DomainException(
                404,
                resource + " was not found.",
                resource.toLowerCase() + "_not_found"
        );
    }
}
