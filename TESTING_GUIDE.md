# 🧪 Testing Guide - EasyFinder Platform

## 📍 Navigation & Form Paths

### **Homepage & Main Navigation**
- **Homepage**: `/` 
  - Click "Post a Task" button → Goes to `/post-task`
  - Click "Sign Up" button → Goes to `/signup`
  - Click "Log In" button → Goes to `/login`
  - Click "Become a Tasker" button → Goes to `/become-tasker`

---

## 👥 Customer Journey

### 1. **Customer Registration**
**Path**: `/signup`
- Fill out: First Name, Last Name, Email, Phone, Password
- Click "Sign Up" → Creates customer account in Supabase
- Redirects to homepage after successful signup

### 2. **Customer Login**
**Path**: `/login`
- Enter Email and Password
- Click "Log In" → Authenticates against Supabase
- Redirects to homepage after successful login

### 3. **Post a Task** (Requires Login)
**Path**: `/post-task`
- Fill out:
  - Task title
  - Description
  - Category
  - Budget (LKR)
  - Location
  - Deadline date
  - Photos (optional)
- Click "Post Task for Free" → Saves task to Supabase `tasks` table
- Redirects to task confirmation page

### 4. **Browse Tasks**
**Path**: `/browse-tasks`
- View all available tasks
- Filter by category, location
- Click on a task → View task details

---

## 🛠️ Tasker Journey

### **Option A: Quick Tasker Signup** (Old Flow)
**Path**: `/become-tasker`
- Simple one-page form
- Creates basic tasker account
- **Note**: This is the old flow, recommend using the new 4-stage onboarding below

### **Option B: Complete Tasker Onboarding** (New 4-Stage Flow) ⭐ **RECOMMENDED**

#### **Stage 1: Quick Signup**
**Path**: `/tasker/onboarding/stage-1`
- Fill out:
  - First Name, Last Name
  - Email Address
  - Phone Number
  - NIC Number
  - Preferred Language (English/Sinhala/Tamil)
  - Password (8+ chars, uppercase, lowercase, number)
  - Confirm Password
  - Agree to Terms
- Click "Continue to Email Verification" → Creates user account in Supabase
- Auto-redirects to Stage 2

#### **Stage 2: Email Verification**
**Path**: `/tasker/onboarding/email-verify`
- Enter 6-digit OTP code
- **Demo Code**: `123456` (hardcoded for testing)
- Click "Verify & Continue" → Marks email as verified
- Auto-redirects to Stage 3

#### **Stage 3: Identity Verification**
**Path**: `/tasker/onboarding/stage-2`
- Upload documents:
  - NIC Front (required) - Image or PDF
  - NIC Back (required) - Image or PDF
  - Police Report (optional but recommended)
  - Address Proof (required) - Utility bill, bank statement, etc.
- Click "Continue" → Uploads files to Supabase Storage (`verifications` bucket)
- Saves verification records to `verifications` table
- Can click "Skip for now" to proceed without uploading
- Auto-redirects to Stage 4

#### **Stage 4: Professional Profile**
**Path**: `/tasker/onboarding/stage-3`
- Upload Profile Photo (required)
- Write Bio (minimum 50 characters)
- Select Service Categories (at least 1)
- Add Skills (at least 1)
- Select Service Areas/Districts (at least 1)
- Set Hourly Rate (minimum LKR 100)
- Upload Portfolio Images (optional, multiple)
- Click "Continue" → Saves to:
  - `taskers` table (bio, skills, hourly_rate)
  - `tasker_skills` table
  - `tasker_service_areas` table
  - `tasker_portfolio` table
  - Uploads images to Supabase Storage (`profiles` and `portfolios` buckets)
- Auto-redirects to Stage 5

#### **Stage 5: Trust & Safety**
**Path**: `/tasker/onboarding/stage-4`
- Insurance Information (optional):
  - Check "I have professional liability insurance"
  - Enter Insurance Provider
  - Enter Policy Number
- Emergency Contact (required):
  - Full Name
  - Phone Number
  - Relationship (spouse/parent/sibling/child/friend/other)
- Agreements (all required):
  - ✓ Consent to background checks
  - ✓ Agree to Tasker Code of Conduct
  - ✓ Agree to Terms of Service and Privacy Policy
- Click "Complete Registration" → Saves to `taskers` table
- Marks onboarding as complete
- Auto-redirects to completion page

#### **Completion Page**
**Path**: `/tasker/onboarding/complete`
- Shows success message
- Explains next steps (document verification, profile activation)
- Buttons:
  - "Go to Homepage" → `/`
  - "View My Profile" → `/tasker/dashboard`

---

## 📊 Tasker Dashboard

### **Tasker Dashboard**
**Path**: `/tasker/dashboard`
- View profile information
- See stats: Rating, Completed Tasks, In Progress, Earnings
- View bio, skills, service areas
- View portfolio images
- See recent tasks
- Edit profile (button available)

---

## 🗄️ Database Tables Used

### **User Management**
- `users` - All user accounts (customers, taskers, admins)
- `customers` - Customer-specific data
- `taskers` - Tasker-specific data

### **Tasker Profile**
- `tasker_skills` - Skills and categories
- `tasker_service_areas` - Districts where tasker operates
- `tasker_portfolio` - Portfolio images
- `tasker_availability` - Schedule/availability
- `tasker_pricing` - Custom pricing for categories

### **Tasks & Offers**
- `tasks` - Posted tasks
- `offers` - Tasker bids on tasks
- `reviews` - Reviews and ratings

### **Communication**
- `messages` - Direct messages between users
- `notifications` - System notifications

### **Verification**
- `verifications` - Document verification records

---

## 🪣 Supabase Storage Buckets Required

Before testing file uploads, create these buckets in Supabase:

1. **`verifications`** - For ID documents (NIC, police reports, address proof)
2. **`profiles`** - For profile photos
3. **`portfolios`** - For portfolio images
4. **`tasks`** - For task-related images

### How to Create Buckets:
1. Go to Supabase Dashboard
2. Select your project
3. Click "Storage" in sidebar
4. Click "New bucket"
5. Enter bucket name
6. Set to "Public" (for profile images) or "Private" (for verification docs)
7. Click "Create bucket"

---

## 📋 Sample CSV Data

Import the CSV files in this order (from `sample_csv/` folder):

1. `02_users.csv` - User accounts
2. `03_customers.csv` - Customer profiles
3. `04_taskers.csv` - Tasker profiles
4. `05_tasker_skills.csv` - Skills data
5. `06_tasker_service_areas.csv` - Service areas
6. `07_tasks.csv` - Sample tasks
7. `08_offers.csv` - Sample offers
8. `09_reviews.csv` - Sample reviews
9. `10_messages.csv` - Sample messages
10. `11_notifications.csv` - Sample notifications
11. `12_verifications.csv` - Verification records
12. `13_tasker_portfolio.csv` - Portfolio items
13. `14_tasker_availability.csv` - Availability schedules
14. `15_tasker_pricing.csv` - Custom pricing

---

## ✅ Testing Checklist

### **Before Testing:**
- [ ] Vercel deployment successful
- [ ] Environment variables added to Vercel
- [ ] Supabase storage buckets created
- [ ] CSV sample data imported
- [ ] Database schema applied (`supabase-schema.sql`)

### **Customer Flow:**
- [ ] Register new customer account (`/signup`)
- [ ] Login with customer account (`/login`)
- [ ] Post a new task (`/post-task`)
- [ ] Browse available tasks (`/browse-tasks`)

### **Tasker Flow:**
- [ ] Complete Stage 1: Signup (`/tasker/onboarding/stage-1`)
- [ ] Complete Stage 2: Email verification (`/tasker/onboarding/email-verify`)
- [ ] Complete Stage 3: Identity docs (`/tasker/onboarding/stage-2`)
- [ ] Complete Stage 4: Professional profile (`/tasker/onboarding/stage-3`)
- [ ] Complete Stage 5: Trust & safety (`/tasker/onboarding/stage-4`)
- [ ] View completion page (`/tasker/onboarding/complete`)
- [ ] View tasker dashboard (`/tasker/dashboard`)

### **Database Verification:**
- [ ] Check `users` table for new entries
- [ ] Check `customers` or `taskers` table
- [ ] Check `tasks` table for posted tasks
- [ ] Check `verifications` table for uploaded docs
- [ ] Check Supabase Storage for uploaded files

---

## 🐛 Troubleshooting

### **"Missing environment variable" error**
- Ensure all 3 environment variables are added to Vercel
- Redeploy after adding environment variables

### **File upload fails**
- Check if storage buckets are created
- Verify bucket permissions (public/private)
- Check file size limits (default 5-10MB)

### **Database insert fails**
- Check if schema is applied
- Verify RLS policies are set up
- Check browser console for error messages

### **OTP not working**
- Use demo code: `123456`
- Email sending is not implemented yet (future feature)

---

## 🎯 Quick Start Testing Path

**Fastest way to test the complete system:**

1. Go to `/tasker/onboarding/stage-1`
2. Fill out the signup form
3. Use OTP: `123456`
4. Upload sample documents (any images/PDFs)
5. Complete professional profile
6. Complete trust & safety
7. View your dashboard at `/tasker/dashboard`

**Total time**: ~5-10 minutes for complete onboarding

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Supabase logs (Database → Logs)
4. Verify environment variables are set correctly

