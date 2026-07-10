# SmartRent API

Spring Boot API backed by Supabase PostgreSQL.

## Run locally

The application loads database variables from the root `.env` file.

```powershell
cd api
mvn spring-boot:run
```

Check the database connection:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

Flyway migrations run automatically from:

```text
src/main/resources/db/migration
```

## Supabase/Auth notes

Passwords are handled by Supabase Auth. SmartRent tables store profile IDs,
roles, tenant links, and invoice/payment metadata, not plaintext passwords.

When a tenant activates, the backend links the Supabase auth user to the matching
tenant invitation email. If Supabase returns a signup response without a user ID,
the API falls back to a safe lookup by email and completes the link.

## Payment notification events

The API creates in-app notifications for:

- invoice generated;
- tenant UTR submitted for landlord review;
- landlord payment approval;
- landlord payment rejection.

The `notifications.notification_type` check constraint must include every enum
value used by `NotificationModels.NotificationType`.
