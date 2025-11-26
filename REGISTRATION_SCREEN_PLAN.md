## Registration & Verification Screens Plan

### 1. Existing Screens
- **`/signup` – Customer Registration:** Collects basic customer info (name, email, phone, location, password). Email verification and profile completion still needed.
- **`/become-tasker` – Tasker Application:** Single-step form for contact + skills; lacks staged onboarding, document uploads, and verification logic.
- **`/login` – Auth:** Shared login (email/password + Google) for both user types.
- **`/post-task` – Customer Task Submission:** Lets customers describe a job; depends on customer verification for high-value jobs.
- **`/project-status` – Status Tracker:** Placeholder for monitoring posted tasks.

### 2. Required Screens & Forms
| Area | Screen/Form | Purpose |
| --- | --- | --- |
| Tasker Onboarding | **Stage 1: Quick Signup** | Capture name, email, phone, NIC, password, preferred language. Triggers email OTP. |
|  | **Email Verification** | Prompt to confirm email before accessing dashboard. |
|  | **Stage 2: Identity Completion** | Collect profile photo, NIC front/back upload, address, district coverage, emergency contact. |
|  | **Stage 3: Professional Profile** | Education, degrees, certifications, skills, hourly/service rates, bio, experience years. |
|  | **Stage 4: Trust & Safety** | Police report upload, insurance/certification attachments, consent agreements. |
|  | **Profile Completion Dashboard** | Shows outstanding steps, progress %, badges earned. |
|  | **Availability & Pricing Manager** | Schedule, working hours, service areas, pricing tiers. |
|  | **Portfolio & Media Upload** | Showcase work photos/videos, before/after. |
|  | **Performance & Ratings** | View customer reviews, response stats, on-time metric. |
| Customer Experience | **Customer Profile Completion** | Add address, profile pic, verification docs for high-value jobs. |
|  | **Customer Task History** | Track tasks, ratings left, disputes. |
| Admin/Support | **Verification Console** | Review NIC, address proofs, police reports, approve/reject, leave notes. |
|  | **Badge Management** | Update badge/level status, view audit logs. |
| Shared | **Media Upload Review** | Moderate flagged uploads (NIC, police reports, portfolio). |

### 3. Tasker Level System
- **Level Names & Requirements**
  1. **Starter Pro** – Completed Stage 1, verified email & phone.
  2. **Trusted Specialist** – Starter Pro + NIC/document approved + address verified; earns green verified badge.
  3. **Secure Elite** – Trusted Specialist + police report approved (<=12 months old). Receives gold shield badge.
  4. **Top Performer** – Secure Elite + performance metrics (rating ≥4.7, on-time ≥95%, cancellation ≤2%) over last 50 tasks; gets “Top Performer” ribbon badge.
- **Badge Display:** Surfaces on listings, profile header, and search filters (e.g., “Show only Secure Elite+”).

### 4. Verification & Rating Flow
1. **Registration:** Tasker completes Stage 1 form → account created as `Starter Pro (Pending)`.
2. **Email OTP:** Must verify before proceeding to dashboard.
3. **Identity Completion:** Upload NIC images + address proof → admin review queue.
4. **Badge Upgrade:** Upon approval, system auto-upgrades to **Trusted Specialist**.
5. **Police Report Upload:** Submit PDF/JPEG + expiry date → admin verifies → upgrade to **Secure Elite**.
6. **Performance Monitoring:** Cron aggregates KPIs weekly; once thresholds met, tag as **Top Performer**. Drop level if metrics fall.
7. **Customer Ratings:** Post-task review form captures 1–5 stars + metrics (quality, communication, timeliness). Feeds level evaluation.

### 5. Data Capture Stages
- **Stage 1 Fields:** firstName, lastName, email, phone, NIC number, password, preferredLanguage, consent.
- **Stage 2 Fields:** profilePhoto, nicFrontUrl, nicBackUrl, addressLine1/2, city, district, postalCode, emergencyContact, serviceAreas.
- **Stage 3 Fields:** educationLevel, degrees[], certifications[], skills[], hourlyRate, serviceCategoryRates, bio, yearsExperience.
- **Stage 4 Fields:** policeReportUrl + issuedAt, insuranceDetails, complianceAcknowledgement.
- **Ongoing:** availability slots, pricing updates, portfolio entries, performance stats.

### 6. Customer Flow Enhancements
- **Customer Step 1:** Signup + email verification (already built, needs OTP hook).
- **Step 2:** Optional profile completion for low-risk tasks; mandatory identity proof (NIC/utility bill) for high-value bookings.
- **Step 3:** Payment method setup (future), saved addresses, review history.

### 7. Dependencies Before DB Purchase
1. Finalize the forms listed above so schema reflects staged onboarding.
2. Confirm document storage strategy (Azure Blob containers per document type).
3. Define admin workflow states (`submitted`, `in_review`, `approved`, `rejected`) for NIC and police report tables.
4. Outline rating/performance aggregation to size reporting tables.

This document should guide UI build-out and inform final database schema (tables for users, taskers, verifications, education, ratings, badges, uploads). Once approved, we can lock the DB structure and provision Azure SQL + Blob Storage.

