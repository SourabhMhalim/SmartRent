package com.smartrent.api.property;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.smartrent.api.auth.AuthorizationService;
import com.smartrent.api.property.PropertyModels.PropertyRequest;
import com.smartrent.api.property.PropertyModels.PropertyResponse;
import com.smartrent.api.property.PropertyModels.UnitRequest;
import com.smartrent.api.property.PropertyModels.UnitResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PropertyController {

    private final AuthorizationService authorizationService;
    private final PropertyService service;

    public PropertyController(AuthorizationService authorizationService, PropertyService service) {
        this.authorizationService = authorizationService;
        this.service = service;
    }

    @PostMapping("/properties")
    public ResponseEntity<PropertyResponse> createProperty(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PropertyRequest request
    ) {
        PropertyResponse property = service.createProperty(landlordId(jwt), request);
        return ResponseEntity.created(URI.create("/api/properties/" + property.id()))
                .body(property);
    }

    @GetMapping("/properties")
    public List<PropertyResponse> listProperties(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "") String search
    ) {
        return service.listProperties(landlordId(jwt), search);
    }

    @GetMapping("/properties/{propertyId}")
    public PropertyResponse getProperty(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID propertyId
    ) {
        return service.getProperty(landlordId(jwt), propertyId);
    }

    @PutMapping("/properties/{propertyId}")
    public PropertyResponse updateProperty(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyRequest request
    ) {
        return service.updateProperty(landlordId(jwt), propertyId, request);
    }

    @DeleteMapping("/properties/{propertyId}")
    public ResponseEntity<Void> archiveProperty(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID propertyId
    ) {
        service.archiveProperty(landlordId(jwt), propertyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/properties/{propertyId}/units")
    public ResponseEntity<UnitResponse> createUnit(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID propertyId,
            @Valid @RequestBody UnitRequest request
    ) {
        UnitResponse unit = service.createUnit(landlordId(jwt), propertyId, request);
        return ResponseEntity.created(URI.create("/api/units/" + unit.id())).body(unit);
    }

    @GetMapping("/properties/{propertyId}/units")
    public List<UnitResponse> listUnits(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID propertyId
    ) {
        return service.listUnits(landlordId(jwt), propertyId);
    }

    @PutMapping("/units/{unitId}")
    public UnitResponse updateUnit(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID unitId,
            @Valid @RequestBody UnitRequest request
    ) {
        return service.updateUnit(landlordId(jwt), unitId, request);
    }

    @DeleteMapping("/units/{unitId}")
    public ResponseEntity<Void> archiveUnit(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID unitId
    ) {
        service.archiveUnit(landlordId(jwt), unitId);
        return ResponseEntity.noContent().build();
    }

    private UUID landlordId(Jwt jwt) {
        return authorizationService.requireLandlordWorkspace(jwt);
    }
}
