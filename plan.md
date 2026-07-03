# SmartRent Learning Plan

Version: 2.0
Owner: Sourabh Mhalim
Mode: Restart from zero, slowly

## 1. Purpose

SmartRent is a learning-first rental management project.

We are not trying to generate the full SaaS product immediately. We are going to build it step by step so each part is understandable:

- database design
- Java and Spring Boot
- REST APIs
- validation
- authentication
- frontend screens
- billing logic
- invoices
- payments
- deployment

The project should grow only when the previous step is working and understood.

## 2. Product Summary

SmartRent helps landlords manage rental rooms, tenants, rent bills, electricity readings, and UPI-based rent collection.

The first useful version should answer one simple question:

> Can a landlord create a tenant's monthly rent bill correctly?

Everything else comes after that.

## 3. MVP Scope

### Included In First MVP

- landlord account
- landlord profile with UPI ID
- property management
- room/unit management
- tenant management
- lease setup
- monthly electricity meter reading
- bill/invoice generation
- UPI payment link or QR
- manual mark-paid flow

### Excluded From First MVP

- tenant login
- property manager role
- WhatsApp/SMS reminders
- PDF invoices
- analytics dashboards
- mobile apps
- automatic payment verification
- production deployment

These are valuable, but they should not distract us during the first learning pass.

## 4. Architecture For Restart

Start with one backend service.

```text
Browser -> Spring Boot API -> PostgreSQL/Supabase
```

This is easier to learn than starting with a gateway and multiple microservices.

Later, we can split the backend if the project needs it:

```text
Browser -> Gateway -> Core Service / Billing Service / Ops Service -> Database
```

## 5. Recommended Folder Structure

```text
smartrent/
  apps/
    web/
  api/
  database/
    migrations/
  docs/
  README.md
```

For the restart, `api/` should be one Spring Boot application.

Avoid multiple services until the single-service version is comfortable.

## 6. Core Data Model

Start with these tables only:

- users/profiles
- properties
- units
- tenants
- leases
- meter_readings
- invoices
- payments

### Basic Relationships

- one landlord has many properties
- one property has many units
- one unit can have one active lease
- one lease belongs to one tenant
- one lease has many meter readings
- one invoice belongs to one lease
- one invoice can have one payment record

## 7. Billing Rule

The first billing formula is:

```text
electricity_units = current_reading - previous_reading
electricity_amount = electricity_units * unit_rate
total_amount = base_rent + electricity_amount
```

Validation rules:

- current reading cannot be less than previous reading
- base rent cannot be negative
- unit rate cannot be negative
- one lease should not have duplicate invoices for the same month
- invoice is pending by default
- landlord manually marks invoice as paid

## 8. Slow Development Roadmap

### Phase 0: Reset And Setup

Goal: clean the project and prepare a simple structure.

Learn:

- what files belong in a project
- what should not be committed
- how `.env` files work
- how Git tracks changes

Build:

- clean README
- safe `.env.example`
- basic folder structure
- one backend app folder
- one frontend app folder later

Done when:

- no secrets are committed
- the project structure is simple
- we know how to run basic commands

### Phase 1: Database Basics

Goal: understand the data before writing app code.

Learn:

- tables
- primary keys
- foreign keys
- indexes
- basic constraints

Build:

- first SQL migration
- properties table
- units table
- tenants table
- leases table

Done when:

- migration runs successfully
- sample data can be inserted
- relationships make sense

### Phase 2: First Spring Boot API

Goal: create a small backend that returns real data.

Learn:

- Spring Boot project structure
- controller
- service
- repository
- entity
- DTO
- validation

Build:

- health endpoint
- property create/list APIs
- unit create/list APIs

Done when:

- backend starts locally
- APIs work in browser/Postman/curl
- invalid input returns clear errors

### Phase 3: Tenant And Lease APIs

Goal: connect tenants to units through leases.

Learn:

- business rules in services
- database transactions
- active lease rules

Build:

- tenant create/list APIs
- lease create/list APIs
- prevent two active leases for one unit

Done when:

- landlord can create a tenant
- landlord can assign tenant to unit
- unit status updates correctly

### Phase 4: Billing Engine

Goal: calculate rent bills correctly.

Learn:

- domain logic
- unit tests
- money calculations
- date/month handling

Build:

- meter reading APIs
- billing calculation service
- invoice creation API
- tests for billing formula

Done when:

- invoice total is correct
- duplicate monthly invoices are blocked
- negative meter usage is blocked

### Phase 5: Simple Frontend

Goal: build screens only after APIs are understandable.

Learn:

- Next.js routing
- React components
- forms
- fetch calls
- loading and error states

Build:

- property list/create screen
- unit list/create screen
- tenant list/create screen
- lease create screen
- billing screen

Done when:

- frontend can create and display backend data
- forms show useful validation messages

### Phase 6: Authentication

Goal: add login after the basic app works.

Learn:

- Supabase Auth
- JWT
- protected backend routes
- current user context

Build:

- landlord signup/login
- profile creation
- backend JWT validation
- owner-scoped data access

Done when:

- landlord only sees own data
- unauthenticated users cannot access protected APIs

### Phase 7: UPI Payment Link

Goal: generate a payment instruction from invoice data.

Learn:

- URL encoding
- UPI URI format
- manual payment confirmation

Build:

- landlord UPI ID field
- UPI URI generation
- QR display later if needed
- mark invoice paid API

Done when:

- invoice has a valid UPI payment link
- landlord can mark invoice paid

### Phase 8: PDF, Notifications, Reports

Goal: add advanced features only after the core flow works.

Build later:

- PDF invoice
- WhatsApp/SMS reminders
- tenant portal
- dashboards
- reports
- deployment

## 9. Feature Workflow

For every feature, follow this rhythm:

1. Write the rule in plain English.
2. Design or update the table.
3. Write the backend API.
4. Test the backend API.
5. Build the frontend screen.
6. Run the app.
7. Explain what was learned.
8. Commit.

## 10. First Coding Task After Reset

Do not start with login.

Start with:

```text
Create a single Spring Boot API with:
- GET /health
- POST /properties
- GET /properties
```

This is small enough to understand and useful enough to prove the setup works.

## 11. MVP Completion Checklist

### Foundation

- [ ] clean project structure
- [ ] safe environment documentation
- [ ] no committed secrets
- [ ] backend app starts
- [ ] database connection works

### Backend

- [ ] health endpoint
- [ ] property APIs
- [ ] unit APIs
- [ ] tenant APIs
- [ ] lease APIs
- [ ] meter reading APIs
- [ ] invoice generation
- [ ] payment mark-paid
- [ ] UPI payment link
- [ ] validation
- [ ] unit tests for billing

### Frontend

- [ ] property screen
- [ ] unit screen
- [ ] tenant screen
- [ ] lease screen
- [ ] billing screen
- [ ] invoice screen

### Later

- [ ] authentication
- [ ] tenant portal
- [ ] PDF invoice
- [ ] notifications
- [ ] reports
- [ ] deployment
