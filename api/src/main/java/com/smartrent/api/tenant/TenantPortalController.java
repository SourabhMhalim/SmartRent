package com.smartrent.api.tenant;

import java.util.List;
import java.util.UUID;

import com.smartrent.api.auth.AuthorizationService;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.billing.BillingModels.VerifyPaymentRequest;
import com.smartrent.api.billing.BillingService;
import com.smartrent.api.billing.InvoicePdfService;
import com.smartrent.api.tenant.TenantModels.TenantResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenant-portal")
public class TenantPortalController {

    private final AuthorizationService authorizationService;
    private final TenantService tenantService;
    private final BillingService billingService;
    private final InvoicePdfService invoicePdfService;

    public TenantPortalController(
            AuthorizationService authorizationService,
            TenantService tenantService,
            BillingService billingService,
            InvoicePdfService invoicePdfService
    ) {
        this.authorizationService = authorizationService;
        this.tenantService = tenantService;
        this.billingService = billingService;
        this.invoicePdfService = invoicePdfService;
    }

    @GetMapping("/me")
    public TenantResponse getTenantProfile(@AuthenticationPrincipal Jwt jwt) {
        UUID tenantUserId = authorizationService.requireTenant(jwt);
        return tenantService.getTenantByUserId(tenantUserId);
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> listInvoices(@AuthenticationPrincipal Jwt jwt) {
        UUID tenantUserId = authorizationService.requireTenant(jwt);
        return tenantService.listTenantInvoices(tenantUserId);
    }

    @GetMapping("/invoices/{invoiceId}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        UUID tenantUserId = authorizationService.requireTenant(jwt);
        InvoiceResponse invoice = billingService.getTenantInvoice(tenantUserId, invoiceId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"%s.pdf\"".formatted(filename(invoice))
                )
                .body(invoicePdfService.generate(invoice));
    }

    @PostMapping("/invoices/{invoiceId}/payment-submission")
    public InvoiceResponse submitPayment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        UUID tenantUserId = authorizationService.requireTenant(jwt);
        return billingService.submitTenantPayment(tenantUserId, invoiceId, request);
    }

    private String filename(InvoiceResponse invoice) {
        return invoice.invoiceNumber().replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
