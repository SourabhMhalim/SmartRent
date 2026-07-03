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
