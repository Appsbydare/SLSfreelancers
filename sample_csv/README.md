# Sample CSV Data for Supabase Import

This folder contains CSV files with sample data for the Sri Lanka Tasks marketplace platform.

## Files Included

1. **02_users.csv** - 16 users (8 customers, 7 taskers, 1 admin)
2. **03_customers.csv** - 8 customer profiles
3. **04_taskers.csv** - 7 tasker profiles with ratings and performance metrics
4. **05_tasker_skills.csv** - 16 skills across all taskers
5. **06_tasker_service_areas.csv** - 17 service area coverages
6. **07_tasks.csv** - 15 tasks (various statuses: open, in_progress, completed)
7. **08_offers.csv** - 15 offers/bids on tasks
8. **09_reviews.csv** - 6 reviews (5-star ratings with comments)
9. **10_messages.csv** - 12 messages between customers and taskers
10. **11_notifications.csv** - 10 notifications
11. **12_verifications.csv** - 11 verification records (NIC and police reports)
12. **13_tasker_portfolio.csv** - 10 portfolio items with work samples
13. **14_tasker_availability.csv** - 30 availability slots across taskers
14. **15_tasker_pricing.csv** - 13 pricing entries for different services

**Note:** `tasker_levels` table is automatically populated by the schema SQL, no CSV needed.

## Import Order (Important!)

Import the CSV files in this exact order to maintain referential integrity:

1. users (no dependencies)
2. customers (depends on users)
3. taskers (depends on users, tasker_levels)
4. tasker_skills (depends on taskers)
5. tasker_service_areas (depends on taskers)
6. tasker_pricing (depends on taskers)
7. tasker_availability (depends on taskers)
8. tasker_portfolio (depends on taskers)
9. tasks (depends on customers)
10. offers (depends on tasks, taskers)
11. messages (depends on tasks, users)
12. reviews (depends on tasks, users)
13. notifications (depends on users)
14. verifications (depends on users)

## How to Import in Supabase

### Method 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Select the table you want to import data into
4. Click **Insert** → **Import data from CSV**
5. Upload the corresponding CSV file
6. Map the CSV columns to table columns (should auto-match)
7. Click **Import**
8. Repeat for all tables in the order listed above

## Sample Data Overview

### Users
- **Customers**: 8 users from various Sri Lankan cities (Colombo, Kandy, Galle, Negombo, Jaffna, etc.)
- **Taskers**: 7 service providers with different specialties
- **Admin**: 1 admin user for platform management
- **Password**: All users have placeholder password hash `$2a$10$abcdefghijklmnopqrstuv`

### Taskers
- Saman (Handyman - Plumbing/Electrical) - Secure Elite
- Rohan (Cleaning Services) - Top Performer  
- Kamal (Carpentry) - Trusted Specialist
- Prasad (Tuition Teacher) - Trusted Specialist
- Chaminda (Delivery Service) - Secure Elite
- Tharindu (Web Developer/Designer) - Trusted Specialist
- Ruwan (Painting Services) - Secure Elite

### Tasks
- Various categories: plumbing, cleaning, carpentry, tutoring, delivery, design, painting
- Different statuses: open (12), in_progress (2), completed (1)
- Budget ranges from LKR 1,500 to LKR 40,000

## Column Mapping Notes

All CSV files have been updated to match the exact Supabase schema column names:

- `users`: includes `password_hash`, `email_verified`, `phone_verified` (boolean)
- `taskers`: uses `level_code` (not level_id), `response_time_minutes` (not hours)
- `tasks`: single `budget` column (not min/max), `deadline` is date only
- `offers`: removed `estimated_days`, uses `estimated_hours` only
- `reviews`: uses `quality`, `communication`, `timeliness` (not with `_rating` suffix)
- `messages`: uses `recipient_id` (not `receiver_id`), removed `is_read` and `offer_id`
- `notifications`: uses `notification_type` (not `type`), removed `link`
- `tasker_portfolio`: uses `image_urls` (not `images`)

## Troubleshooting

If you encounter import errors:

1. **Column Mismatch**: Ensure CSV headers exactly match table column names
2. **UUID Format**: Ensure table columns are set to `uuid` type
3. **Timestamps**: Format should be `YYYY-MM-DD HH:MM:SS`
4. **Foreign Keys**: Import parent tables before child tables
5. **Array Fields**: PostgreSQL array format is `{value1,value2}`
6. **Empty Values**: Empty cells represent NULL values

## Next Steps After Import

1. Verify all data imported correctly
2. Check foreign key relationships
3. Upload sample images to Supabase Storage buckets (optional)
4. Test the application with this sample data
5. Create additional test users as needed through the signup form

## Support

If you need help with the import process or encounter any issues, let me know!
