package com.smartrent.api.tenant;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.smartrent.api.tenant.TenantModels.AvailableUnitResponse;
import com.smartrent.api.tenant.TenantModels.EndLeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseRequest;
import com.smartrent.api.tenant.TenantModels.LeaseResponse;
import com.smartrent.api.tenant.TenantModels.TenantRequest;
import com.smartrent.api.tenant.TenantModels.TenantResponse;
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
public class TenantController {

    private final TenantService service;

    public TenantController(TenantService service) {
        this.service = service;
    }

    @PostMapping("/tenants")
    public ResponseEntity<TenantResponse> createTenant(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TenantRequest request
    ) {
        TenantResponse tenant = service.createTenant(landlordId(jwt), request);
        return ResponseEntity.created(URI.create("/api/tenants/" + tenant.id()))
                .body(tenant);
    }

    @GetMapping("/tenants")
    public List<TenantResponse> listTenants(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "") String search
    ) {
        return service.listTenants(landlordId(jwt), search);
    }

    @GetMapping("/tenants/{tenantId}")
    public TenantResponse getTenant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tenantId
    ) {
        return service.getTenant(landlordId(jwt), tenantId);
    }

    @PutMapping("/tenants/{tenantId}")
    public TenantResponse updateTenant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantRequest request
    ) {
        return service.updateTenant(landlordId(jwt), tenantId, request);
    }

    @DeleteMapping("/tenants/{tenantId}")
    public ResponseEntity<Void> archiveTenant(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tenantId
    ) {
        service.archiveTenant(landlordId(jwt), tenantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/units/available")
    public List<AvailableUnitResponse> listAvailableUnits(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return service.listAvailableUnits(landlordId(jwt));
    }

    @PostMapping("/tenants/{tenantId}/leases")
    public ResponseEntity<LeaseResponse> createLease(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID tenantId,
            @Valid @RequestBody LeaseRequest request
    ) {
        LeaseResponse lease = service.createLease(landlordId(jwt), tenantId, request);
        return ResponseEntity.created(URI.create("/api/leases/" + lease.id())).body(lease);
    }

    @PostMapping("/leases/{leaseId}/end")
    public LeaseResponse endLease(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID leaseId,
            @Valid @RequestBody EndLeaseRequest request
    ) {
        return service.endLease(landlordId(jwt), leaseId, request);
    }

    private UUID landlordId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
