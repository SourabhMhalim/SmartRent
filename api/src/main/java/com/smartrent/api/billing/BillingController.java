package com.smartrent.api.billing;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.smartrent.api.billing.BillingModels.BillableLeaseResponse;
import com.smartrent.api.billing.BillingModels.GenerateInvoiceRequest;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.billing.BillingModels.VerifyPaymentRequest;
import jakarta.validation.Valid;
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
@RequestMapping("/api")
public class BillingController {

    private final BillingService service;

    public BillingController(BillingService service) {
        this.service = service;
    }

    @GetMapping("/billing/leases")
    public List<BillableLeaseResponse> listBillableLeases(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return service.listBillableLeases(landlordId(jwt));
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> listInvoices(@AuthenticationPrincipal Jwt jwt) {
        return service.listInvoices(landlordId(jwt));
    }

    @GetMapping("/invoices/{invoiceId}")
    public InvoiceResponse getInvoice(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return service.getInvoice(landlordId(jwt), invoiceId);
    }

    @PostMapping("/invoices")
    public ResponseEntity<InvoiceResponse> generateInvoice(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody GenerateInvoiceRequest request
    ) {
        InvoiceResponse invoice = service.generateInvoice(landlordId(jwt), request);
        return ResponseEntity.created(URI.create("/api/invoices/" + invoice.id()))
                .body(invoice);
    }

    @PostMapping("/invoices/{invoiceId}/verify-payment")
    public InvoiceResponse verifyPayment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return service.verifyPayment(landlordId(jwt), invoiceId, request);
    }

    private UUID landlordId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
