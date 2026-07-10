package com.smartrent.api.billing;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartrent.api.billing.BillingModels.InvoiceResponse;
import com.smartrent.api.billing.BillingModels.InvoiceStatus;
import org.springframework.stereotype.Service;

@Service
public class InvoicePdfService {

    private static final Color INK = new Color(15, 23, 42);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color TEAL = new Color(15, 118, 110);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final Color SURFACE = new Color(248, 250, 252);

    private static final Font TITLE = new Font(Font.HELVETICA, 24, Font.BOLD, INK);
    private static final Font H2 = new Font(Font.HELVETICA, 14, Font.BOLD, INK);
    private static final Font BODY = new Font(Font.HELVETICA, 10, Font.NORMAL, INK);
    private static final Font BODY_BOLD = new Font(Font.HELVETICA, 10, Font.BOLD, INK);
    private static final Font SMALL = new Font(Font.HELVETICA, 8, Font.NORMAL, MUTED);
    private static final Font SMALL_BOLD = new Font(Font.HELVETICA, 8, Font.BOLD, TEAL);

    public byte[] generate(InvoiceResponse invoice) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 40, 40, 38, 38);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            addHeader(document, invoice);
            addBillToAndSummary(document, invoice);
            addChargeTable(document, invoice);
            addMeterTable(document, invoice);
            addPaymentSection(document, invoice);
            addFooter(document);

            document.close();
            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate invoice PDF.", exception);
        }
    }

    private void addHeader(Document document, InvoiceResponse invoice) throws Exception {
        PdfPTable header = new PdfPTable(new float[] { 1.2f, 1f });
        header.setWidthPercentage(100);
        header.setSpacingAfter(18);

        PdfPCell left = cell();
        left.addElement(new Paragraph("SmartRent Invoice", TITLE));
        Paragraph number = new Paragraph(invoice.invoiceNumber(), SMALL_BOLD);
        number.setSpacingBefore(6);
        left.addElement(number);
        header.addCell(left);

        PdfPCell right = cell();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.addElement(labelValue("Status", statusLabel(invoice.status()), true));
        right.addElement(labelValue("Billing month", invoice.billingMonth(), false));
        right.addElement(labelValue("Due date", invoice.dueDate().toString(), false));
        header.addCell(right);

        document.add(header);
    }

    private void addBillToAndSummary(Document document, InvoiceResponse invoice) throws Exception {
        PdfPTable table = new PdfPTable(new float[] { 1f, 1f });
        table.setWidthPercentage(100);
        table.setSpacingAfter(18);

        PdfPCell billTo = cardCell();
        billTo.addElement(sectionTitle("Billed to"));
        billTo.addElement(new Paragraph(invoice.tenantName(), H2));
        billTo.addElement(new Paragraph(invoice.propertyName() + " - Unit " + invoice.unitNumber(), BODY));
        table.addCell(billTo);

        PdfPCell summary = cardCell();
        summary.addElement(sectionTitle("Amount payable"));
        summary.addElement(new Paragraph(currency(invoice.totalAmount()), TITLE));
        summary.addElement(new Paragraph("Generated on " + formatInstant(invoice.createdAt()), SMALL));
        table.addCell(summary);

        document.add(table);
    }

    private void addChargeTable(Document document, InvoiceResponse invoice) throws Exception {
        document.add(sectionTitle("Charges"));
        PdfPTable table = new PdfPTable(new float[] { 2.8f, 1f });
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        addHeaderCell(table, "Description");
        addHeaderCell(table, "Amount");
        addRow(table, "Base rent", currency(invoice.baseRent()));
        addRow(table, "Electricity (" + invoice.electricityUnits() + " units x "
                + currency(invoice.electricityRate()) + ")", currency(invoice.electricityAmount()));
        addTotalRow(table, "Total payable", currency(invoice.totalAmount()));

        document.add(table);
    }

    private void addMeterTable(Document document, InvoiceResponse invoice) throws Exception {
        document.add(sectionTitle("Meter reading"));
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        addHeaderCell(table, "Previous");
        addHeaderCell(table, "Current");
        addHeaderCell(table, "Units");
        addHeaderCell(table, "Rate");
        addRowCell(table, invoice.previousReading().toPlainString(), false);
        addRowCell(table, invoice.currentReading().toPlainString(), false);
        addRowCell(table, invoice.electricityUnits().toPlainString(), false);
        addRowCell(table, currency(invoice.electricityRate()) + "/unit", false);

        document.add(table);
    }

    private void addPaymentSection(Document document, InvoiceResponse invoice) throws Exception {
        document.add(sectionTitle("Payment"));

        PdfPTable table = new PdfPTable(new float[] { 1.2f, 1f });
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        PdfPCell details = cardCell();
        if (invoice.status() == InvoiceStatus.PAID) {
            details.addElement(new Paragraph("Payment approved", H2));
            details.addElement(new Paragraph("UTR: " + safe(invoice.paymentUtr()), BODY));
            details.addElement(new Paragraph("Paid at: " + formatInstant(invoice.paidAt()), SMALL));
        } else if (invoice.submittedPaymentUtr() != null && !invoice.submittedPaymentUtr().isBlank()) {
            details.addElement(new Paragraph("Awaiting property owner review", H2));
            details.addElement(new Paragraph("Submitted UTR: " + invoice.submittedPaymentUtr(), BODY));
            details.addElement(new Paragraph("Submitted at: " + formatInstant(invoice.paymentSubmittedAt()), SMALL));
        } else if (hasUpiDetails(invoice)) {
            details.addElement(new Paragraph("Pay by UPI", H2));
            details.addElement(new Paragraph("Payee: " + invoice.landlordUpiPayeeName(), BODY));
            details.addElement(new Paragraph("UPI ID: " + invoice.landlordUpiId(), BODY));
            details.addElement(new Paragraph("Reference: " + invoice.invoiceNumber(), BODY));
            details.addElement(new Paragraph("After paying, submit the 12-digit UTR in SmartRent.", SMALL));
        } else {
            details.addElement(new Paragraph("Payment details unavailable", H2));
            details.addElement(new Paragraph("Please contact your property owner for payment instructions.", BODY));
        }
        table.addCell(details);

        PdfPCell qr = cardCell();
        qr.setHorizontalAlignment(Element.ALIGN_CENTER);
        if (hasUpiDetails(invoice) && invoice.status() != InvoiceStatus.PAID) {
            Image image = Image.getInstance(qrPng(buildUpiUri(invoice)));
            image.scaleToFit(140, 140);
            image.setAlignment(Element.ALIGN_CENTER);
            qr.addElement(image);
            Paragraph hint = new Paragraph("Scan with any UPI app", SMALL_BOLD);
            hint.setAlignment(Element.ALIGN_CENTER);
            qr.addElement(hint);
        } else {
            Paragraph note = new Paragraph("No QR needed for this invoice status.", SMALL);
            note.setAlignment(Element.ALIGN_CENTER);
            qr.addElement(note);
        }
        table.addCell(qr);

        document.add(table);
    }

    private void addFooter(Document document) throws Exception {
        Paragraph footer = new Paragraph(
                "SmartRent only records UTR/payment references for property owner verification. Never share your UPI PIN.",
                SMALL
        );
        footer.setSpacingBefore(8);
        document.add(footer);
    }

    private Paragraph sectionTitle(String text) {
        Paragraph paragraph = new Paragraph(text, H2);
        paragraph.setSpacingAfter(8);
        return paragraph;
    }

    private Paragraph labelValue(String label, String value, boolean highlight) {
        Paragraph paragraph = new Paragraph(label + ": " + value, highlight ? SMALL_BOLD : SMALL);
        paragraph.setAlignment(Element.ALIGN_RIGHT);
        paragraph.setSpacingAfter(4);
        return paragraph;
    }

    private PdfPCell cell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setPadding(0);
        return cell;
    }

    private PdfPCell cardCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER);
        cell.setBackgroundColor(SURFACE);
        cell.setPadding(14);
        return cell;
    }

    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, SMALL_BOLD));
        cell.setBackgroundColor(SURFACE);
        cell.setBorderColor(BORDER);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private void addRow(PdfPTable table, String label, String value) {
        addRowCell(table, label, false);
        addRowCell(table, value, false);
    }

    private void addTotalRow(PdfPTable table, String label, String value) {
        addRowCell(table, label, true);
        addRowCell(table, value, true);
    }

    private void addRowCell(PdfPTable table, String text, boolean emphasized) {
        PdfPCell cell = new PdfPCell(new Phrase(text, emphasized ? BODY_BOLD : BODY));
        cell.setBorderColor(BORDER);
        cell.setPadding(8);
        table.addCell(cell);
    }

    private String currency(BigDecimal value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("en-IN"));
        format.setMaximumFractionDigits(value.stripTrailingZeros().scale() > 0 ? 2 : 0);
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

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String statusLabel(InvoiceStatus status) {
        String name = status.name().toLowerCase(Locale.ROOT);
        return name.substring(0, 1).toUpperCase(Locale.ROOT) + name.substring(1);
    }

    private String formatInstant(java.time.Instant instant) {
        if (instant == null) {
            return "-";
        }
        return DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")
                .withZone(ZoneId.of("Asia/Kolkata"))
                .format(instant);
    }
}
