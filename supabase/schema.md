# Salman Driver – Production Database Architecture & Schema Documentation

> **Platform:** Pan-India On-Demand Personal Driver Marketplace  
> **Brand Promise:** *"Your Car. Your Journey. Our Drivers."*  
> **Core Principle:** Customers own their vehicles; verified professional drivers operate customers' vehicles on-demand.

---

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o| CUSTOMER_PROFILES : "extends"
    USERS ||--o| DRIVERS : "registers as"
    USERS ||--o{ BOOKINGS : "places as customer"
    DRIVERS ||--o{ DRIVER_DOCUMENTS : "submits for KYC"
    DRIVERS ||--o{ BOOKINGS : "fulfills as chauffeur"
    DRIVERS ||--o{ DRIVER_LOCATION_LOGS : "broadcasts GPS"
    DRIVERS ||--o{ DISPATCH_REQUESTS : "receives match"
    BOOKINGS ||--o{ BOOKING_STATUS_HISTORY : "tracks state"
    BOOKINGS ||--o{ DISPATCH_REQUESTS : "dispatches to candidates"
    BOOKINGS ||--o{ FINANCIAL_TRANSACTIONS : "settles payment"
    BOOKINGS ||--o| REVIEWS : "generates feedback"
    USERS ||--o{ SUPPORT_TICKETS : "raises grievance"
    USERS ||--o{ ADMIN_AUDIT_LOGS : "administers"

    USERS {
        uuid id PK
        string full_name
        string phone UK
        string email UK
        string password_hash
        string role "customer|driver|admin"
        boolean is_phone_verified
        boolean is_suspended
    }

    DRIVERS {
        uuid id PK
        uuid user_id FK
        string full_name
        string primary_city
        int experience_years
        string_array transmission_skills "Manual, Automatic"
        string_array vehicle_types "Hatchback, Sedan, SUV, Luxury"
        numeric hourly_rate
        numeric rating
        string verification_status "pending|approved|suspended|rejected"
        boolean is_online
        numeric current_latitude
        numeric current_longitude
        string driving_licence_no
        string aadhaar_masked
    }

    BOOKINGS {
        uuid id PK
        string booking_reference UK
        uuid customer_id FK
        uuid driver_id FK
        string service_type "quick|hourly|outstation|airport|monthly|emergency"
        string transmission_type "Manual|Automatic|Both"
        string vehicle_type
        numeric pickup_latitude
        numeric pickup_longitude
        string status "requested|dispatched|accepted|arriving|arrived|in_progress|completed|cancelled"
        string trip_start_otp
        numeric total_fare
        string payment_status "pending|authorized|captured|refunded"
    }

    DISPATCH_REQUESTS {
        uuid id PK
        uuid booking_id FK
        uuid driver_id FK
        string status "sent|accepted|rejected|timed_out"
        timestamptz expires_at
    }
```

---

## 2. Table Specifications & Security Model

| Table Name | Primary Key | Foreign Keys | Row Level Security (RLS) Policy |
| :--- | :--- | :--- | :--- |
| `users` | `id (UUID)` | None | Self read/write; Admin full access |
| `customer_profiles` | `user_id (UUID)` | `users(id)` | Customer read/write; Admin read |
| `drivers` | `id (UUID)` | `users(id)` | Public read approved; Driver self duty update; Admin full |
| `driver_documents` | `id (UUID)` | `drivers(id)` | Submitting driver & Admin only (Aadhaar & DL protected) |
| `service_areas` | `id (VARCHAR)` | None | Public read active; Admin write |
| `bookings` | `id (UUID)` | `users(id)`, `drivers(id)` | Customer & assigned driver read/write; Admin full |
| `booking_status_history` | `id (UUID)` | `bookings(id)` | Immutable append-only audit trail of transitions |
| `dispatch_requests` | `id (UUID)` | `bookings(id)`, `drivers(id)` | Targeted driver read/respond; Admin read |
| `driver_location_logs` | `id (BIGSERIAL)` | `drivers(id)` | Driver append; In-transit customer read; Admin read |
| `financial_transactions`| `id (UUID)` | `bookings(booking_reference)` | Customer/driver read own transactions; Admin full |
| `admin_audit_logs` | `id (UUID)` | `users(id)` | Admin read-only; System append-only |
| `support_tickets` | `id (UUID)` | `users(id)` | User read own; Admin read/write |
| `reviews` | `id (UUID)` | `bookings(id)`, `drivers(id)` | Public read approved; Customer insert; Admin moderate |
