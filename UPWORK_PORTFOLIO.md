# SmartRent — Full-Stack Rental Property Management Platform

## Upwork Portfolio Title

SmartRent | Full-Stack Rental Management Web Application

## Short Description

SmartRent is a responsive rental-management platform that helps landlords manage properties, units, tenants, leases, invoices, and rent payments from one dashboard. It also provides tenants with a dedicated portal for viewing invoices, downloading PDF bills, and submitting payment details for verification.

## Project Overview

I designed and developed SmartRent as a full-stack web application for simplifying day-to-day rental operations. The platform replaces scattered spreadsheets and manual follow-ups with a structured workflow covering property setup, tenant onboarding, billing, payment review, and notifications.

The application includes separate, role-based experiences for landlords and tenants. Landlords can manage their rental portfolio, create leases and invoices, review submitted UTR payment references, and approve or reject payments. Tenants can securely access their invoices, use UPI payment details, submit a 12-digit UTR, and track the payment-verification status.

## Key Features

- Secure landlord and tenant registration, login, and password recovery
- Role-based access control for landlord and tenant accounts
- Property and rental-unit management
- Tenant onboarding and profile management
- Lease creation, assignment, and termination
- Invoice generation and payment-status tracking
- UPI payment links and QR-code support
- Public token-based invoice payment pages
- Tenant UTR payment submission workflow
- Landlord payment approval and rejection workflow
- In-app and optional email notifications
- Downloadable PDF invoices
- Responsive landlord and tenant dashboards
- Input validation, centralized error handling, and API rate limiting
- Version-controlled database migrations

## Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Java 21, Spring Boot 3, Maven
- **Database:** PostgreSQL with Supabase
- **Authentication:** Supabase Auth, JWT
- **Database Migrations:** Flyway
- **Additional Tools:** QR code generation, PDF generation, REST APIs

## My Contribution

- Planned the application architecture and relational data model
- Developed the responsive user interface and dashboard workflows
- Built REST APIs for properties, units, tenants, leases, invoices, and payments
- Integrated Supabase authentication and PostgreSQL persistence
- Implemented authorization rules for landlord and tenant data isolation
- Created the complete invoice and payment-verification workflow
- Added PDF invoice downloads, QR-based UPI payments, and notifications
- Wrote backend validation, service, and security tests
- Added an automated smoke test for the critical payment journey

## Business Value

SmartRent gives property owners a centralized view of their rental operations while making rent payment and invoice access easier for tenants. Its structured approval workflow helps landlords verify offline UPI payments before marking invoices as paid, providing a clear audit trail and reducing manual record-keeping errors.

## Suggested Upwork Skills

Java, Spring Boot, Next.js, React, TypeScript, PostgreSQL, Supabase, REST API, Tailwind CSS, Full-Stack Development, Web Application Development, Database Design, JWT Authentication, SaaS Development

## Recommended Portfolio Caption

Built a full-stack rental-management platform with separate landlord and tenant portals. The solution includes property and lease management, invoice generation, UPI/UTR payment verification, PDF downloads, notifications, secure authentication, and role-based access control.

## Media to Upload on Upwork

1. Landlord dashboard overview
2. Properties and units screen
3. Tenant and lease management screen
4. Invoice creation and payment-status screen
5. UPI QR/payment page
6. Payment review screen
7. Tenant invoice portal

## Links

- **Live Demo:** https://sourabhmhalim.in/app/smartrent
- **Source Code:** https://github.com/SourabhMhalim/SmartRent
