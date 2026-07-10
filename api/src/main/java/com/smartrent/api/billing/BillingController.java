package com.smartrent.api.billing;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.smartrent.api.auth.AuthorizationService;
import com.smartrent.api.billing.BillingModels.BillableLeaseResponse;
import com.smartrent.api.billing.BillingModels.GenerateInvoiceRequest;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.billing.BillingModels.PublicInvoicePaymentResponse;
import com.smartrent.api.billing.BillingModels.VerifyPaymentRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    private final AuthorizationService authorizationService;
    private final BillingService service;
    private final InvoicePdfService invoicePdfService;

    public BillingController(
            AuthorizationService authorizationService,
            BillingService service,
            InvoicePdfService invoicePdfService
    ) {
        this.authorizationService = authorizationService;
        this.service = service;
        this.invoicePdfService = invoicePdfService;
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

    @GetMapping("/public/invoices/{invoiceId}/payment")
    public PublicInvoicePaymentResponse getPublicInvoicePayment(
            @PathVariable UUID invoiceId
    ) {
        return service.getPublicInvoicePayment(invoiceId);
    }

    @GetMapping("/invoices/{invoiceId}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        InvoiceResponse invoice = service.getInvoice(landlordId(jwt), invoiceId);
        return pdfResponse(invoice, invoicePdfService.generate(invoice));
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

    @PostMapping("/invoices/{invoiceId}/approve-payment")
    public InvoiceResponse approveSubmittedPayment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return service.approveSubmittedPayment(landlordId(jwt), invoiceId);
    }

    @PostMapping("/invoices/{invoiceId}/reject-payment")
    public InvoiceResponse rejectSubmittedPayment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return service.rejectSubmittedPayment(landlordId(jwt), invoiceId);
    }

    private UUID landlordId(Jwt jwt) {
        return authorizationService.requireLandlordWorkspace(jwt);
    }

    private ResponseEntity<byte[]> pdfResponse(InvoiceResponse invoice, byte[] pdf) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"%s.pdf\"".formatted(filename(invoice))
                )
                .body(pdf);
    }

    private String filename(InvoiceResponse invoice) {
        return invoice.invoiceNumber().replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
