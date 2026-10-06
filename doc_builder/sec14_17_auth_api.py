# -*- coding: utf-8 -*-
"""Section 14 - 17: Authentication, JWT Deep Dive, Authorization/RBAC, API Architecture."""

CONTENT = """## 14. Authentication

The system implements a dual-layer authentication model designed to support both modern serverless web workflows and decoupled microservice REST APIs.

```
                                  AUTHENTICATION FLOW
                                  
  ┌───────────────────────┐                  ┌──────────────────────────────────────┐
  │   User / Client UI    │                  │       Supabase GoTrue Service        │
  │   (Web or Mobile)     │                  │       (Managed Auth Provider)        │
  └──────────┬────────────┘                  └──────────────────┬───────────────────┘
             │                                                  │
             │ 1. POST /auth/v1/token (email, password)         │
             ├─────────────────────────────────────────────────►│
             │                                                  │
             │ 2. Validate Credentials & Issue GoTrue JWT       │
             │◄─────────────────────────────────────────────────┤
             │    { access_token, refresh_token, user: {...} }  │
             │                                                  │
             ▼                                                  ▼
  ┌───────────────────────┐                  ┌──────────────────────────────────────┐
  │ Client Local Storage  │                  │         FastAPI REST Backend         │
  │ `pcb_access_token`    │                  │         (`backend/app/auth.py`)      │
  └──────────┬────────────┘                  └──────────────────┬───────────────────┘
             │                                                  │
             │ 3. HTTP Request with Authorization Header        │
             │    `Bearer <JWT_TOKEN>`                          │
             ├─────────────────────────────────────────────────►│
             │                                                  │
             │                                                  │ 4. Verify Signature & Claims
             │                                                  │    - Check `exp` timestamp
             │                                                  │    - Extract `sub` & `role`
             │                                                  │    - Enforce RBAC permissions
             │                                                  │
             │ 5. Authorized HTTP JSON Response                 │
             │◄─────────────────────────────────────────────────┤
```

### 1. Web Portal Authentication Layer
- Managed via the official Supabase JavaScript SDK (`@supabase/supabase-js`) in `web/src/lib/api/auth.ts`.
- **Login**: `supabase.auth.signInWithPassword({ email, password })`. Upon successful authentication, Supabase issues an access token and refresh token.
- **Client-Side Token Persistence**: The access token is persisted in the browser's `localStorage` under the key `pcb_access_token` (configured in `web/src/lib/api/client.ts`).
- **Registration Flow**: `supabase.auth.signUp({ email, password, options: { data: { full_name, role: 'inspector' } } })`. New users are registered with email verification enabled, requiring the user to confirm their email address before activation.
- **Forgot Password Flow**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://pcb-fault-detection-system.vercel.app/reset-password' })`. When the user clicks the reset link in their email, they are directed to the deployed production reset-password page rather than `localhost`.
- **De-authentication (Logout)**: `supabase.auth.signOut()`. Clears active sessions and purges the token from browser storage.

### 2. Backend REST API Authentication Layer
- Implemented in `backend/app/auth.py` using **PyJWT** and **FastAPI Security** (`HTTPBearer`).
- Provides fallback direct authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`).
- Password hashing is enforced via **Passlib** using the **Bcrypt** algorithm:
  ```python
  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
  ```

---

## 15. JWT Deep Dive

Examiners frequently scrutinize JSON Web Tokens (JWT) to test a candidate's understanding of web security and stateless sessions.

### Precise Implementation Details from Source Code
- **Exact File Generating JWT**: `backend/app/auth.py`
- **Exact Function**: `create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str`
- **Underlying Cryptographic Library**: `PyJWT` (`import jwt`)
- **Signing Algorithm**: `HS256` (HMAC with SHA-256 symmetric signature)
- **Secret Key Source**: Loaded securely via Pydantic settings from `settings.jwt_secret` (environment variable `JWT_SECRET`).
- **Token Expiration Window**: Default configured to 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 60`), calculated as:
  ```python
  expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
  ```

### Anatomy of the Decoded Token Payload
The JWT token consists of three base64url-encoded parts separated by periods (`Header.Payload.Signature`):

```json
{
  "sub": "4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f",
  "email": "engineer@pcb-vision.com",
  "role": "admin",
  "iat": 1775440800,
  "exp": 1775444400
}
```

- `sub` (Subject): The unique UUID of the authenticated user in PostgreSQL.
- `email`: The verified email address of the account.
- `role`: The authorized Role-Based Access Control string (`admin` or `inspector`).
- `iat` (Issued At): Unix timestamp indicating when the token was generated.
- `exp` (Expiration): Unix timestamp after which the token is mathematically invalid.

### How the Backend Verifies the JWT
Verification occurs inside the FastAPI dependency function `get_current_user()` in `backend/app/auth.py`:
1. **Extraction**: The `HTTPBearer` security scheme extracts the raw token string from the inbound HTTP request header:
   ```http
   Authorization: Bearer <token_string>
   ```
2. **Cryptographic Validation**: `jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])` evaluates the digital signature against the server's private secret.
3. **Dual Verification Support**: To handle tokens issued directly by Supabase GoTrue, the verification logic in `auth.py` first attempts local HS256 validation with `settings.jwt_secret`. If the issuer is Supabase, it verifies against the Supabase JWT secret or fetches user details via the Supabase Admin API.
4. **Exception Handling**:
   - If the token signature is altered: raises `HTTPException(status_code=401, detail="Invalid token signature")`.
   - If `exp` has passed: raises `HTTPException(status_code=401, detail="Token has expired")`.
   - If `sub` is missing: raises `HTTPException(status_code=401, detail="Could not validate credentials")`.

### Storage Security Evaluation
- In the current web implementation, tokens are stored in the browser's `localStorage` under `pcb_access_token`.
- **Viva Defense Point**: While `localStorage` is vulnerable to Cross-Site Scripting (XSS) if untrusted third-party scripts are injected, it was selected here to facilitate direct client-side PostgREST calls to Supabase. In a future enterprise hardening phase, tokens can be migrated to `HttpOnly`, `Secure`, `SameSite=Strict` browser cookies to eliminate XSS token exfiltration risks.

---

## 16. Authorization / RBAC

The system enforces strict **Role-Based Access Control (RBAC)** to ensure industrial data isolation and governance.

```
                    ROLE-BASED ACCESS CONTROL MATRIX
                    
  Capability / Route              Inspector / Operator        Administrator
  ─────────────────────────────────────────────────────────────────────────────
  Execute Local Edge Inspection           YES                      YES
  View Own Line Inspections               YES                      YES
  View All Other Users' Inspections        NO                      YES
  Override AI Defect Verdict (QA)         YES                      YES
  Generate Personal Line Reports          YES                      YES
  Generate System-Wide Audit Reports       NO                      YES
  Export Inspection CSV / JSON            YES (Own data only)      YES (All data)
  View Deep Learning Model Metrics        YES                      YES
  Change Active AI Model Thresholds        NO                      YES
  Access User Administration Panel         NO (Redirects /403)     YES
  Deactivate Other Users                   NO                      YES
  Deactivate Self                          NO                      NO (Blocked)
  Receive Automated Critical Alert Emails  NO                      YES (All active admins)
```

### Implementation & Enforcement Across the Codebase

#### 1. Preventing Admin Self-Deactivation
In `backend/app/routers/users.py` and `web/src/lib/api/users.ts`:
To prevent catastrophic administrative lockout, the system enforces a strict programmatic check:
```python
if target_user_id == current_user.id and updated_data.is_active is False:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Administrators cannot deactivate their own account."
    )
```

#### 2. Isolation of Inspections by User Role
In `web/src/lib/api/inspections.ts` and `backend/app/routers/inspections.py`:
- When an `inspector` requests the inspection list:
  ```sql
  SELECT * FROM inspections WHERE user_id = :current_user_id ORDER BY created_at DESC;
  ```
- When an `admin` requests the inspection list:
  ```sql
  SELECT * FROM inspections ORDER BY created_at DESC;
  ```
This ensures operators can never view or tamper with inspections performed by other operators or lines.

#### 3. Isolation of Report Generation by User Role
In `web/src/lib/api/reports.ts`:
- Inspectors can generate reports summarizing only their own inspections.
- Administrators can generate plant-wide compliance reports aggregating records across all production lines and operators.

#### 4. Frontend Route Guards (`web/src/app/users/page.tsx`)
If an authenticated user with role `inspector` attempts to navigate directly to `/users`:
The `AuthContext` detects that `user.role !== 'admin'` and immediately redirects the browser to `/403` (Forbidden).

---

## 17. API Architecture

The system utilizes a modern, RESTful API architecture built on HTTP/1.1 and JSON.

### Core Architectural Principles
1. **Stateless Communication**: Every HTTP request is entirely self-contained, transmitting the authorization credential inside the `Authorization: Bearer <token>` header. The server maintains no server-side HTTP session state.
2. **Semantic HTTP Verbs**:
   - `GET`: Safe, idempotent retrieval of resource representations.
   - `POST`: Creation of new subordinate resources (inspections, reports, reviews, users).
   - `PATCH`: Partial updates to existing records (updating inspection status, deactivating user).
   - `DELETE`: Removal of resources (deleting inspection, removing user).
3. **Uniform Error Structure**: Errors return standard RFC 7807-compliant HTTP status codes paired with structured JSON payloads:
   ```json
   {
     "detail": "Descriptive error message explaining the failure."
   }
   ```
4. **Interactive OpenAPI Documentation**: The FastAPI backend automatically generates interactive Swagger UI documentation at `/docs` and ReDoc documentation at `/redoc`.
5. **CORS Configuration**: In `backend/app/main.py`, CORS middleware is configured to allow secure cross-origin requests from the Next.js web portal (`http://localhost:3000` and production Vercel domains):
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=settings.allowed_origins,
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
"""
