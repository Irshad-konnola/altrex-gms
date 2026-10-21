# Supabase Database Guide

This directory contains the database definitions, performance indexes, Row Level Security (RLS) policies, and maintenance scripts for **Altrex GMS**.

## Structure

```
supabase/
├── schema.sql                 # Complete database schema, RLS policies, indexes, and storage buckets
├── scripts/
│   ├── set_owner.sql          # Promotes a Supabase user to the 'owner' role
│   └── reset_test_data.sql    # Wipes test transactions and members while retaining plans & packages
└── README.md                  # This documentation
```

---

## 🚀 Initial Database Setup

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor**.
3. Copy the contents of [`supabase/schema.sql`](./schema.sql) and execute the query.
4. Verify that:
   - All tables are created under the `public` schema.
   - Row Level Security (RLS) is enabled for all tables.
   - The `member_photos` and `member-avatars` storage buckets are created and configured with public read access.

---

## 👤 Assigning the Owner Role

By default, newly registered accounts operate with front-desk staff permissions. To grant owner privileges (giving full access to revenue metrics and settings):

1. Open [`supabase/scripts/set_owner.sql`](./scripts/set_owner.sql).
2. Replace `'your_owner_email@example.com'` with the user's login email.
3. Run the script in the Supabase SQL Editor.

---

## 🧹 Resetting Test Data

To clear testing members, attendance records, and payments before deploying to production:

1. Open [`supabase/scripts/reset_test_data.sql`](./scripts/reset_test_data.sql).
2. Execute the script in the Supabase SQL Editor.
3. Your membership plans and PT package configurations will be preserved.
