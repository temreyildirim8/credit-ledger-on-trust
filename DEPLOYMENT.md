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

### Database
- Project ID: `wohjeoashvprnlnlkaxv`
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

**Deployment Command:**
```bash
vercel --prod
```

**Good luck with the beta launch! 🚀**
