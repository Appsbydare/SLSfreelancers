# Service Provider Data Storage Plan

## Current Implementation

Currently, service providers (taskers) are stored in the same `users.json` file as all users, with `userType: 'tasker'`.

## Recommended Data Storage Strategy

### Phase 1: Enhanced JSON Structure (Current - MVP)
**Location:** `data/users.json` and `data/taskers.json` (separate file)

**Service Provider Data Structure:**
```json
{
  "id": "tasker_123",
  "userId": "user_123", // Reference to base user
  "userType": "tasker",
  
  // Basic Info (from user profile)
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+94771234567",
  "location": "Colombo",
  
  // Service Provider Specific
  "businessName": "John's Handyman Services", // Optional
  "verificationStatus": {
    "emailVerified": true,
    "phoneVerified": true,
    "idVerified": false,
    "addressVerified": false
  },
  
  // Skills & Services
  "skills": ["Plumbing", "Electrical", "Carpentry"],
  "serviceCategories": ["home-improvements", "repairs"],
  "serviceAreas": ["Colombo", "Gampaha", "Kalutara"], // Districts they serve
  
  // Portfolio & Media
  "portfolio": [
    {
      "id": "port_1",
      "title": "Kitchen Renovation",
      "description": "Complete kitchen makeover",
      "images": ["/portfolio/kitchen1.jpg"],
      "category": "home-improvements",
      "completedDate": "2024-01-15"
    }
  ],
  "profileImage": "/profiles/john.jpg",
  
  // Performance Metrics
  "rating": 4.8,
  "totalReviews": 45,
  "completedTasks": 120,
  "cancelledTasks": 3,
  "responseTime": "2 hours", // Average
  "acceptanceRate": 95,
  
  // Availability
  "availability": {
    "schedule": "flexible", // flexible, specific-hours
    "workingHours": {
      "monday": { "start": "09:00", "end": "18:00", "available": true },
      "tuesday": { "start": "09:00", "end": "18:00", "available": true },
      // ... other days
    },
    "timezone": "Asia/Colombo"
  },
  
  // Pricing
  "pricing": {
    "hourlyRate": 2000, // LKR per hour
    "serviceRates": {
      "plumbing": { "min": 1500, "max": 5000 },
      "electrical": { "min": 2000, "max": 6000 }
    }
  },
  
  // Payment & Banking
  "paymentMethods": {
    "bankAccount": {
      "accountName": "John Doe",
      "accountNumber": "****1234",
      "bank": "Commercial Bank"
    },
    "mobileWallet": {
      "provider": "mCash",
      "number": "+94771234567"
    }
  },
  
  // Badges & Achievements
  "badges": [
    "verified",
    "top-tasker",
    "fast-responder",
    "reliable"
  ],
  
  // Insurance & Certifications
  "insurance": {
    "hasLiabilityInsurance": true,
    "insuranceProvider": "Ceylinco Insurance",
    "policyNumber": "POL-123456",
    "expiryDate": "2025-12-31"
  },
  "certifications": [
    {
      "name": "Electrician License",
      "issuer": "CEB",
      "number": "EL-12345",
      "expiryDate": "2025-06-30"
    }
  ],
  
  // Metadata
  "createdAt": "2024-01-01T00:00:00Z",
  "lastActive": "2024-01-20T10:30:00Z",
  "isActive": true,
  "isVerified": true,
  "isSuspended": false
}
```

### Phase 2: Database Migration (Production Ready)

**Recommended Database Options:**

1. **PostgreSQL** (Recommended)
   - Relational database for structured data
   - Good for complex queries and relationships
   - Free tier available (Supabase, Railway, etc.)

2. **MongoDB**
   - NoSQL, flexible schema
   - Good for document-based data
   - Free tier available (MongoDB Atlas)

3. **SQLite** (Simple start)
   - File-based, no server needed
   - Easy migration from JSON
   - Good for small to medium scale

**Database Schema (PostgreSQL):**

```sql
-- Users table (base)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL, -- customer, tasker, admin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service Providers (Taskers) table
CREATE TABLE taskers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  profile_image_url TEXT,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  completed_tasks INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Skills table
CREATE TABLE tasker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID REFERENCES taskers(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  experience_years INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service Areas table
CREATE TABLE tasker_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID REFERENCES taskers(id) ON DELETE CASCADE,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE tasker_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID REFERENCES taskers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  images TEXT[], -- Array of image URLs
  completed_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Availability table
CREATE TABLE tasker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID REFERENCES taskers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pricing table
CREATE TABLE tasker_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID REFERENCES taskers(id) ON DELETE CASCADE,
  service_category VARCHAR(100),
  hourly_rate DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Implementation Steps

1. **Create Enhanced API Routes:**
   - `/api/taskers` - CRUD operations for service providers
   - `/api/taskers/[id]` - Get specific tasker details
   - `/api/taskers/search` - Search and filter taskers
   - `/api/taskers/[id]/portfolio` - Manage portfolio
   - `/api/taskers/[id]/availability` - Manage availability

2. **Data Migration Script:**
   - Convert existing JSON data to new structure
   - Validate data integrity
   - Backup existing data

3. **Service Provider Profile Page:**
   - Display all tasker information
   - Portfolio gallery
   - Reviews and ratings
   - Availability calendar
   - Contact/booking options

### Security Considerations

1. **Password Hashing:** Use bcrypt or similar (currently plain text - needs fixing)
2. **Data Validation:** Validate all inputs server-side
3. **Rate Limiting:** Prevent abuse of API endpoints
4. **File Upload Security:** Validate image types and sizes
5. **Sensitive Data:** Never expose payment details, passwords, etc.

### File Storage

**For Images/Portfolio:**
- **Development:** `public/uploads/` folder
- **Production:** Cloud storage (AWS S3, Cloudinary, or Vercel Blob)

### Next Steps

1. Create `data/taskers.json` structure
2. Update signup flow to save tasker-specific data
3. Create tasker profile management page
4. Implement portfolio upload functionality
5. Add availability management
6. Plan database migration for production

