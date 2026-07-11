package com.smartrent.api.notification;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;

import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailNotificationService.class);

    private final EmailNotificationProperties properties;
    private final JdbcTemplate jdbcTemplate;
    private final String appBaseUrl;

    public EmailNotificationService(
            EmailNotificationProperties properties,
            JdbcTemplate jdbcTemplate,
            @Value("${smartrent.app.base-url:http://localhost:3000}") String appBaseUrl
    ) {
        this.properties = properties;
        this.jdbcTemplate = jdbcTemplate;
        this.appBaseUrl = appBaseUrl == null || appBaseUrl.isBlank()
                ? "http://localhost:3000"
                : appBaseUrl.trim().replaceAll("/+$", "");
    }

    public void invoiceGenerated(UUID landlordId, InvoiceResponse invoice) {
        tenantEmail(invoice.tenantId()).ifPresent(email -> {
            String paymentUri = hasUpiDetails(invoice) ? buildUpiUri(invoice) : null;
            String paymentPageUrl = paymentPageUrl(invoice);
            sendInvoiceGeneratedEmail(
                    email,
                    "SmartRent invoice " + invoice.invoiceNumber(),
                    invoiceText(invoice, paymentUri, paymentPageUrl),
                    invoiceHtml(invoice, paymentUri, paymentPageUrl),
                    paymentUri
            );
        });
    }

    private void sendInvoiceGeneratedEmail(
            String to,
            String subject,
            String text,
            String html,
            String paymentUri
    ) {
        if (!properties.isEnabled()) {
            return;
        }
        if (properties.getHost().isBlank() || properties.getFrom().isBlank()) {
            LOGGER.warn("Email notifications are enabled but SMTP_HOST or SMTP_FROM is missing.");
            return;
        }

        try {
            JavaMailSenderImpl sender = mailSender();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    paymentUri != null,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(properties.getFromName().isBlank()
                    ? properties.getFrom()
                    : properties.getFromName() + " <" + properties.getFrom() + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);
            if (paymentUri != null) {
                helper.addInline(
                        "paymentQr",
                        new ByteArrayResource(qrPng(paymentUri)),
                        "image/png"
                );
            }
            sender.send(message);
        } catch (MessagingException | RuntimeException exception) {
            LOGGER.warn("Invoice email notification could not be sent to {}: {}", to, exception.getMessage());
        }
    }

    public void paymentVerified(UUID landlordId, InvoiceResponse invoice) {
        List<String> recipients = java.util.stream.Stream.of(
                        tenantEmail(invoice.tenantId()),
                        landlordEmail(landlordId)
                )
                .flatMap(Optional::stream)
                .distinct()
                .toList();

        for (String email : recipients) {
            send(
                    email,
                    "Payment received for " + invoice.invoiceNumber(),
                    """
                            Payment has been marked as received for invoice %s.

                            Tenant: %s
                            Property: %s
                            Unit: %s
                            Amount: %s
                            UPI reference: %s

                            SmartRent
                            """.formatted(
                            invoice.invoiceNumber(),
                            invoice.tenantName(),
                            invoice.propertyName(),
                            invoice.unitNumber(),
                            currency(invoice.totalAmount()),
                            invoice.paymentUtr() == null ? "Not provided" : invoice.paymentUtr()
                    )
            );
        }
    }

    private void send(String to, String subject, String text) {
        if (!properties.isEnabled()) {
            return;
        }
        if (properties.getHost().isBlank() || properties.getFrom().isBlank()) {
            LOGGER.warn("Email notifications are enabled but SMTP_HOST or SMTP_FROM is missing.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(properties.getFromName().isBlank()
                    ? properties.getFrom()
                    : properties.getFromName() + " <" + properties.getFrom() + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender().send(message);
        } catch (MailException exception) {
            LOGGER.warn("Email notification could not be sent to {}: {}", to, exception.getMessage());
        }
    }

    private JavaMailSenderImpl mailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(properties.getHost());
        sender.setPort(properties.getPort());
        sender.setUsername(properties.getUsername());
        sender.setPassword(properties.getPassword());
        sender.setDefaultEncoding("UTF-8");

        Properties javaMailProperties = sender.getJavaMailProperties();
        javaMailProperties.put("mail.smtp.auth", Boolean.toString(!properties.getUsername().isBlank()));
        javaMailProperties.put("mail.smtp.starttls.enable", "true");
        javaMailProperties.put("mail.smtp.starttls.required", "false");
        javaMailProperties.put("mail.smtp.connectiontimeout", "5000");
        javaMailProperties.put("mail.smtp.timeout", "5000");
        javaMailProperties.put("mail.smtp.writetimeout", "5000");
        return sender;
    }

    private Optional<String> tenantEmail(UUID tenantId) {
        return jdbcTemplate.query("""
                select email
                from tenants
                where id = ? and email is not null and email <> ''
                """, (resultSet, rowNumber) -> resultSet.getString("email"), tenantId)
                .stream()
                .findFirst();
    }

    private Optional<String> landlordEmail(UUID landlordId) {
        return jdbcTemplate.query("""
                select email
                from auth.users
                where id = ? and email is not null and email <> ''
                """, (resultSet, rowNumber) -> resultSet.getString("email"), landlordId)
                .stream()
                .findFirst();
    }

    private String currency(BigDecimal value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-IN"));
        format.setMaximumFractionDigits(0);
        return format.format(value);
    }

    private boolean hasUpiDetails(InvoiceResponse invoice) {
        return invoice.landlordUpiId() != null
                && !invoice.landlordUpiId().isBlank()
                && invoice.landlordUpiPayeeName() != null
                && !invoice.landlordUpiPayeeName().isBlank();
    }

    private String buildUpiUri(InvoiceResponse invoice) {
        return "upi://pay?pa=" + encode(invoice.landlordUpiId())
                + "&pn=" + encode(invoice.landlordUpiPayeeName())
                + "&am=" + encode(invoice.totalAmount().setScale(2).toPlainString())
                + "&cu=INR"
                + "&tr=" + encode(invoice.invoiceNumber())
                + "&tn=" + encode("SmartRent " + invoice.invoiceNumber());
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private byte[] qrPng(String paymentUri) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix matrix = qrCodeWriter.encode(paymentUri, BarcodeFormat.QR_CODE, 320, 320);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate payment QR.", exception);
        }
    }

    private String invoiceText(InvoiceResponse invoice, String paymentUri, String paymentPageUrl) {
        String paymentSection = paymentUri == null
                ? """

                        Your property owner has not configured UPI collection details for this invoice yet.
                        """
                : """

                        Pay by UPI:
                        upi url: %s

                        Pay in SmartRent:
                        %s

                        You can also scan the QR code attached in this email.
                        After payment, sign in to SmartRent and submit the 12-digit UTR for property owner verification.
                        """.formatted(paymentUri, paymentPageUrl);

        return """
                Hello %s,

                Your rent invoice %s has been generated.

                Property: %s
                Unit: %s
                Billing month: %s
                Due date: %s
                Total amount: %s

                Please contact your property owner if any details look incorrect.

                SmartRent
                %s
                """.formatted(
                invoice.tenantName(),
                invoice.invoiceNumber(),
                invoice.propertyName(),
                invoice.unitNumber(),
                invoice.billingMonth(),
                invoice.dueDate(),
                currency(invoice.totalAmount()),
                paymentSection
        );
    }

    private String invoiceHtml(InvoiceResponse invoice, String paymentUri, String paymentPageUrl) {
        String paymentSection = paymentUri == null
                ? """
                        <div style="margin-top:24px;padding:16px;border-radius:12px;background:#fff7ed;color:#92400e;">
                          Your property owner has not configured UPI collection details for this invoice yet.
                        </div>
                        """
                : """
                        <div style="margin-top:24px;padding:20px;border-radius:16px;background:#f0fdfa;border:1px solid #99f6e4;text-align:center;">
                          <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:.08em;">Pay by UPI</p>
                          <img src="cid:paymentQr" alt="UPI QR for invoice %s" width="220" height="220" style="display:block;margin:0 auto 16px;border-radius:12px;background:white;padding:8px;" />
                          <p style="margin:0 0 14px;font-size:12px;line-height:18px;color:#64748b;word-break:break-all;">upi url: <a href="%s" style="color:#0f766e;font-weight:800;text-decoration:underline;">%s</a></p>
                          <a href="%s" style="display:inline-block;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 18px;">Pay with UPI</a>
                          <p style="margin:14px 0 0;font-size:12px;line-height:18px;color:#64748b;">This opens a SmartRent payment page with QR code and a mobile button to open GPay, PhonePe, Paytm, BHIM, or any UPI app.</p>
                          <p style="margin:12px 0 0;font-size:12px;line-height:18px;color:#64748b;">After payment, sign in to SmartRent and submit the 12-digit UTR for property owner verification.</p>
                        </div>
                        """.formatted(
                        escape(invoice.invoiceNumber()),
                        escape(paymentPageUrl),
                        escape(paymentUri),
                        escape(paymentPageUrl)
                );

        return """
                <!doctype html>
                <html>
                  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
                    <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
                      <div style="border-radius:20px;background:#ffffff;border:1px solid #e2e8f0;overflow:hidden;">
                        <div style="background:#0f172a;color:#ffffff;padding:24px;">
                          <p style="margin:0;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.16em;color:#99f6e4;">SmartRent invoice</p>
                          <h1 style="margin:10px 0 0;font-size:26px;line-height:32px;">%s</h1>
                          <p style="margin:8px 0 0;color:#cbd5e1;">%s · Due %s</p>
                        </div>
                        <div style="padding:24px;">
                          <p style="margin:0 0 18px;font-size:15px;line-height:24px;">Hello %s, your rent invoice has been generated.</p>
                          <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                            %s
                            %s
                            %s
                            %s
                            %s
                          </table>
                          <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#64748b;">Please contact your property owner if any details look incorrect.</p>
                          <p style="margin:20px 0 0;font-weight:800;color:#0f766e;">SmartRent</p>
                          %s
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
                """.formatted(
                escape(invoice.invoiceNumber()),
                escape(currency(invoice.totalAmount())),
                escape(invoice.dueDate().toString()),
                escape(invoice.tenantName()),
                detailRow("Property", invoice.propertyName()),
                detailRow("Unit", invoice.unitNumber()),
                detailRow("Billing month", invoice.billingMonth()),
                detailRow("Due date", invoice.dueDate().toString()),
                detailRow("Total amount", currency(invoice.totalAmount())),
                paymentSection
        );
    }

    private String detailRow(String label, String value) {
        return """
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;">%s</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800;">%s</td>
                </tr>
                """.formatted(escape(label), escape(value));
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String paymentPageUrl(InvoiceResponse invoice) {
        return appBaseUrl + "/pay/" + encode(invoice.publicPaymentToken());
    }
}
