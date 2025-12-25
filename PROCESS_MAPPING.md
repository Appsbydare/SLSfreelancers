# Process Mapping - Hybrid Marketplace System

## System Overview

This document maps the user flows, system architecture, and data relationships for the hybrid Fiverr-Gig + Airtasker marketplace platform.

---

## 1. User Flows

### Customer Journey

#### Browse & Purchase Gigs (Fiverr Model)
```
1. Homepage
   ├── Search Bar → /browse-gigs?search={query}
   ├── Click Category → /browse-gigs?category={categoryId}
   ├── Click Sri Lanka Icon → Map drawer opens → Select district → /browse-gigs?district={district}
   └── View Scrolling Gigs Panel → Click gig → /gigs/{slug}

2. Browse Gigs Page
   ├── Apply filters (category, district, price, delivery time)
   ├── View gig cards
   └── Click gig → Gig detail page

3. Gig Detail Page
   ├── View gig images, description, seller info
   ├── Compare packages (Basic/Standard/Premium)
   ├── Select package
   └── Click "Continue" → Checkout page

4. Checkout
   ├── Review selected package
   ├── Answer gig requirements
   ├── Confirm order
   └── Payment → Order created

5. Order Management
   ├── View order in /orders
   ├── Communicate with seller
   ├── Receive delivery
   ├── Request revisions (if needed)
   └── Approve & complete order
```

#### Post Custom Request (Airtasker Model)
```
1. Homepage
   └── Click "Post Custom Request" → /post-task

2. Post Task
   ├── Fill task details
   ├── Set budget
   ├── Select category & location
   └── Publish task

3. Receive Bids
   ├── View bids from taskers
   ├── Compare proposals
   └── Select tasker → Create order

4. Order Management
   └── Same as gig orders
```

### Seller/Tasker Journey

#### Seller Dashboard (Fiverr-Style)
```
1. Login
   ├── Click "Tasker Login" button
   ├── Authenticate
   └── Redirect to /seller/dashboard

2. Dashboard Overview
   ├── View stats (earnings, orders, rating)
   ├── Recent activity
   └── Quick actions

3. Manage Gigs
   ├── View all gigs
   ├── Create new gig (/seller/gigs/create)
   ├── Edit existing gig
   ├── Pause/Activate gig
   └── Delete gig

4. Manage Orders
   ├── View active orders
   ├── Deliver work
   ├── Handle revisions
   └── Complete orders

5. Messages
   ├── View inbox
   ├── Reply to messages
   └── Manage conversations

6. Earnings
   ├── View earnings summary
   ├── Transaction history
   └── Payout settings

7. Profile
   ├── Edit profile
   ├── Manage portfolio
   └── Update settings

8. Custom Requests
   ├── Browse open requests
   ├── Submit bids
   └── Manage bids
```

---

## 2. System Architecture

### Frontend Structure
```
Next.js App Router
├── Pages
│   ├── Homepage (/)
│   │   ├── Hero with Search
│   │   ├── Category Grid → /browse-gigs?category=X
│   │   ├── Scrolling Gigs Panel
│   │   ├── Post Request Section
│   │   └── District Services
│   │
│   ├── Browse Gigs (/browse-gigs)
│   │   └── Filters + Gig Cards
│   │
│   ├── Gig Detail (/gigs/[slug])
│   │   └── Full gig information
│   │
│   ├── Checkout (/checkout/gig/[id])
│   │   └── Order creation
│   │
│   ├── Orders (/orders, /orders/[id])
│   │   └── Order management
│   │
│   └── Seller Dashboard (/seller/dashboard)
│       ├── Layout with Sidebar
│       ├── Dashboard Overview
│       ├── Gigs Management
│       ├── Orders Management
│       ├── Messages
│       ├── Earnings
│       ├── Profile
│       └── Custom Requests
│
├── Components
│   ├── Header (with Sri Lanka map drawer)
│   ├── ScrollingGigsPanel
│   ├── SellerSidebar
│   ├── GigCard
│   ├── CategoryGrid
│   └── ...
│
└── API Routes
    ├── /api/gigs (GET, POST)
    ├── /api/gigs/[id] (GET, PUT, DELETE)
    ├── /api/gigs/[id]/packages
    ├── /api/gigs/[id]/requirements
    ├── /api/orders (GET, POST)
    ├── /api/orders/[id] (GET, PUT)
    ├── /api/orders/[id]/deliver
    ├── /api/orders/[id]/revisions
    └── /api/taskers
```

### Database Schema (Supabase)
```
users
├── id, email, first_name, last_name, profile_image_url, user_type

taskers (sellers)
├── id, user_id, level_code, rating, completed_tasks, bio
└── service_areas → tasker_service_areas (district, city)

gigs
├── id, seller_id, title, slug, description, category, images
├── status, delivery_type, is_featured, views_count, orders_count, rating
└── packages → gig_packages (tier, price, delivery_days, features)
└── requirements → gig_requirements (question, answer_type, is_required)

orders
├── id, order_number, customer_id, seller_id, gig_id, package_tier
├── total_amount, platform_fee, seller_earnings, status
├── requirements_response, delivery_date, completed_at
└── deliveries → order_deliveries (message, attachments)
└── revisions → order_revisions (requested_by, message)

tasks (custom requests)
├── id, poster_id, title, description, budget, category, location
└── bids → task_bids (tasker_id, proposal, price)
```

---

## 3. API Endpoints Mapping

### Gigs API
```
GET  /api/gigs
    Query params: category, district, search, minPrice, maxPrice, 
                  deliveryTime, sellerLevel, sortBy, page, limit
    Returns: { gigs: [], pagination: {} }

POST /api/gigs
    Body: { sellerId, title, description, category, images, ... }
    Returns: { gig: {} }

GET  /api/gigs/[id]
    Returns: { gig: {} }

PUT  /api/gigs/[id]
    Body: { status, title, description, ... }
    Returns: { gig: {} }

DELETE /api/gigs/[id]
    Returns: { success: true }
```

### Orders API
```
GET  /api/orders
    Query params: userId, userType (buyer/seller), status, limit
    Returns: { orders: [] }

POST /api/orders
    Body: { customerId, gigId, packageTier, requirementsResponse }
    Returns: { order: {} }

GET  /api/orders/[id]
    Returns: { order: {} }

PUT  /api/orders/[id]
    Body: { status }
    Returns: { order: {} }

POST /api/orders/[id]/deliver
    Body: { message, attachments }
    Returns: { delivery: {} }

POST /api/orders/[id]/revisions
    Body: { requestedBy, message }
    Returns: { revision: {} }
```

---

## 4. Data Flow Diagrams

### Category Selection Flow
```
User clicks category
    ↓
CategoryGrid component
    ↓
Router.push(/browse-gigs?category={id})
    ↓
BrowseGigsPage fetches /api/gigs?category={id}
    ↓
Display filtered gigs
```

### District Filtering Flow
```
User clicks Sri Lanka icon in header
    ↓
Header opens map drawer
    ↓
User selects district
    ↓
DistrictContext updates selectedDistrict
    ↓
Router.push(/browse-gigs?district={district})
    ↓
BrowseGigsPage fetches /api/gigs?district={district}
    ↓
Display filtered gigs
```

### Gig Order Flow
```
User views gig detail
    ↓
Selects package tier
    ↓
Clicks "Continue"
    ↓
Checkout page loads
    ↓
User answers requirements
    ↓
Clicks "Place Order"
    ↓
POST /api/orders
    ↓
Order created
    ↓
Redirect to /orders/[id]
```

### Seller Dashboard Flow
```
Seller logs in
    ↓
Redirect to /seller/dashboard
    ↓
Dashboard layout loads with sidebar
    ↓
Sidebar shows active section
    ↓
Main content area shows section page
    ↓
Section page fetches relevant data
    ↓
Displays content
```

---

## 5. Component Relationships

### Homepage Components
```
HomePage
├── HeroBanner (search bar)
├── ScrollingGigsPanel (featured gigs)
├── CategoryGrid (category links)
├── PostRequestSection (CTA)
└── DistrictServices (district info)
```

### Seller Dashboard Components
```
SellerDashboardLayout
├── SellerSidebar (navigation)
└── MainContent
    ├── DashboardPage (overview)
    ├── GigsPage (gig management)
    ├── OrdersPage (order management)
    ├── MessagesPage (inbox)
    ├── EarningsPage (earnings)
    ├── ProfilePage (settings)
    └── RequestsPage (custom requests)
```

---

## 6. State Management

### Context Providers
- **AuthContext**: User authentication state
- **DistrictContext**: Selected district for filtering

### Local State
- Component-level state for UI interactions
- Form state for inputs
- Loading states for API calls

---

## 7. Key Features

### Customer Features
- Search gigs by keyword
- Filter by category, district, price, delivery time
- Browse featured gigs in scrolling panel
- View gig details with package comparison
- Place orders with requirements
- Manage orders and communicate with sellers
- Post custom requests and receive bids

### Seller Features
- Create and manage gigs
- Set up 3-tier packages
- Define custom requirements
- Manage orders and deliveries
- Handle revision requests
- View earnings and transactions
- Browse and bid on custom requests
- Manage profile and portfolio

---

## 8. Security & Permissions

### Row Level Security (RLS)
- Users can only view their own orders
- Sellers can only edit their own gigs
- Customers can only create orders for themselves
- Sellers can only deliver their own orders

### Authentication
- JWT tokens via Supabase Auth
- Role-based access (customer vs seller)
- Protected routes for seller dashboard

---

## 9. Performance Considerations

### Optimization Strategies
- Lazy load gig images
- Paginate gig listings
- Cache category/district data
- Optimize map rendering
- Use Next.js Image component
- Implement virtual scrolling for long lists

---

## 10. Future Enhancements

### Planned Features
- Real-time messaging
- Advanced analytics for sellers
- Review and rating system
- Payment gateway integration
- Mobile app
- Push notifications
- Email notifications
- Advanced search filters

