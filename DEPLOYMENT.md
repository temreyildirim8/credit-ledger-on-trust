# Deployment Checklist - Global Ledger v8 MVP

**Date:** February 24, 2026
**Status:** Ready for Beta Launch

---

## Pre-Deployment Verification ✅

- [x] All commits pushed to origin/main
- [x] Build successful (166 pages generated)
- [x] Lint passing (0 errors, 0 warnings)
- [x] PWA manifest configured
- [x] Environment variables documented

---

## Vercel Deployment (Manual)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy to Production
```bash
vercel --prod
```

### Step 4: Configure Environment Variables

In Vercel Dashboard (https://vercel.com), add these environment variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase project settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase project settings → API

**Optional:**
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://your-app.vercel.app)

**For Testing (if needed):**
- `TEST_USER_EMAIL` - Test account email
- `TEST_USER_PASSWORD` - Test account password

### Step 5: Verify Deployment

1. Check that the app loads at the production URL
2. Test authentication flow (signup/login)
3. Test onboarding wizard
4. Test customer creation
5. Test transaction creation
6. Test PWA installation on mobile device

---

## Post-Deployment Checklist

### Critical Flows to Test

1. **Authentication**
   - [ ] Email signup works
   - [ ] Email login works
   - [ ] Password reset email sends
   - [ ] Sign out redirects to marketing page

2. **Onboarding**
   - [ ] Currency selection works
   - [ ] Language selection works
   - [ ] Business category selection works
   - [ ] Can complete onboarding wizard

3. **Customer Management**
   - [ ] Can add new customer
   - [ ] Can view customer list
   - [ ] Can search customers
   - [ ] Can view customer details
   - [ ] Form validation works

4. **Transactions**
   - [ ] Can add debt transaction
   - [ ] Can add payment transaction
   - [ ] Transaction list shows correctly
   - [ ] Balance calculation is correct

5. **PWA Features**
   - [ ] App can be installed on mobile
   - [ ] Offline mode works (read-only)
   - [ ] Background sync works

6. **i18n**
   - [ ] Language switcher works on all pages
   - [ ] All languages display correctly (TR, EN, ID, AR, ZU)
   - [ ] Currency formatting is correct for each locale

7. **Paywall**
   - [ ] Free plan limits to 10 customers
   - [ ] Upgrade prompt shows when limit reached

---

## Supabase Configuration

### Environment Strategy

We use separate Supabase environments for TEST and PRODUCTION:

| Environment | Project ID | Purpose |
|-------------|------------|---------|
| TEST | `wohjeoashvprnlnlkaxv` | Development, testing, staging |
| PRODUCTION | TBD | Live production (create before launch) |

### Creating PRODUCTION Environment

#### Step 1: Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Configure:
   - **Project Name**: `global-ledger-prod`
   - **Region**: `eu-central-1` (Frankfurt) - closest to TR market
   - **Database Password**: Generate strong password (save this!)
4. Wait for project to be created (~2 minutes)

#### Step 2: Copy Credentials

After creation, go to **Settings > API** and copy:
- **Project URL** → This will be your `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → This will be your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Step 3: Run Database Migrations

1. Go to **SQL Editor** in your new PRODUCTION project
2. Click **"New Query"**
3. Copy the entire contents of `docs/supabase/migrations/000_production_setup.sql`
4. Paste and click **"Run"**
5. Verify success - you should see "Success. No rows returned" message

**Alternatively**, run migrations via Supabase CLI:
```bash
# Set your production project as current
supabase link --project-ref your-prod-project-ref

# Push migrations
supabase db push
```

#### Step 4: Create Local Environment File

Create `.env.production` in the project root:
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key-here
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
```

#### Step 5: Configure Authentication Settings

In Supabase Dashboard > Authentication > URL Configuration:
1. Set **Site URL** to your production domain (e.g., `https://your-app.vercel.app`)
2. Add **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback`

### Local Environment Files

Create these files locally (not committed to git):

```bash
# .env.test - TEST environment (current development)
NEXT_PUBLIC_SUPABASE_URL=https://wohjeoashvprnlnlkaxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# .env.production - PRODUCTION environment (create after prod project setup)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
```

### Database
- Project ID: `wohjeoashvprnlnlkaxv` (TEST)
- Region: `eu-central-1`
- All tables created and RLS policies configured

### Authentication
- Email/Password enabled
- Password reset flow configured
- Magic link disabled (using link-based reset)

### Edge Functions (if any)
- None required for MVP

---

## Monitoring & Analytics

### Vercel Analytics
- Enable in Vercel dashboard under project settings
- Monitor performance and errors

### Supabase Dashboard
- Monitor auth events
- Monitor database queries
- Check for RLS policy violations

---

## Rollback Plan

If deployment fails or critical bugs found:

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Click "..." on previous successful deployment
4. Select "Promote to Production"

---

## Support & Documentation

- **Fix Plan:** `.ralph/fix_plan.md`
- **PRD:** `.ralph/specs/prd-v8.md`
- **Design Handoff:** `.ralph/specs/handoff.md`
- **Database Schema:** `.ralph/specs/database.md`
- **Figma:** [Credit_Ledger_v4](https://www.figma.com/design/lScDg7yDwbuPXjK5g7KCfC/Credit_Ledger_v4)

---

## Beta Launch Checklist

After successful deployment:

- [ ] Share production URL with beta testers
- [ ] Monitor error logs for first 24 hours
- [ ] Collect feedback from beta testers
- [ ] Document any bugs found
- [ ] Plan v2 features based on feedback

---

## Appendix: Production Database Setup SQL

Run this SQL script in your new PRODUCTION Supabase project's SQL Editor:

```sql
-- ============================================
-- GLOBAL LEDGER (VERESIYE-X) - PRODUCTION SETUP
-- v8 MVP - Complete Database Setup
-- ============================================

-- 1. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    shop_name TEXT,
    phone TEXT,
    address TEXT,
    currency TEXT DEFAULT 'TRY',
    language TEXT DEFAULT 'tr',
    industry TEXT,
    logo_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customers" ON customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name) WHERE is_deleted = FALSE;

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('debt', 'payment')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);

-- 5. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subscription" ON subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. SYNC QUEUE TABLE (PWA Offline Support)
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'synced', 'failed')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    client_timestamp TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync queue" ON sync_queue FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own sync items" ON sync_queue FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sync items" ON sync_queue FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own sync items" ON sync_queue FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 7. CUSTOMER BALANCES VIEW
CREATE OR REPLACE VIEW customer_balances AS
SELECT
    c.id, c.user_id, c.name, c.phone, c.is_deleted,
    COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE -t.amount END), 0) AS balance,
    COUNT(t.id) AS transaction_count,
    MAX(t.transaction_date) AS last_transaction_date,
    c.created_at
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id
WHERE c.is_deleted = FALSE
GROUP BY c.id, c.name, c.phone, c.is_deleted, c.user_id, c.created_at;

GRANT SELECT ON customer_balances TO authenticated;

-- 8. FREEMIUM PAYWALL TRIGGER
CREATE OR REPLACE FUNCTION check_customer_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_plan TEXT;
    v_customer_count INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT plan INTO v_plan FROM subscriptions WHERE user_id = NEW.user_id;
    IF v_plan IS NULL THEN v_plan := 'free'; END IF;
    v_limit := CASE v_plan
        WHEN 'free' THEN 10
        WHEN 'basic' THEN 100
        WHEN 'pro' THEN 1000
        WHEN 'enterprise' THEN 10000
        ELSE 10
    END;
    SELECT COUNT(*) INTO v_customer_count FROM customers WHERE user_id = NEW.user_id AND is_deleted = FALSE;
    IF v_customer_count >= v_limit THEN
        RAISE EXCEPTION 'Customer limit reached. You have % customers on the % plan (limit: %). Please upgrade.', v_customer_count, v_plan, v_limit;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER check_customer_limit_trigger BEFORE INSERT ON customers FOR EACH ROW EXECUTE FUNCTION check_customer_limit();

-- 9. AUTO-CREATE PROFILE & SUBSCRIPTION ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, shop_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'shop_name');
    INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 10. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON sync_queue TO authenticated;
GRANT SELECT ON customer_balances TO authenticated;
GRANT EXECUTE ON FUNCTION check_customer_limit() TO authenticated;
```

---

**Deployment Command:**
```bash
vercel --prod
```

**Good luck with the beta launch!**
