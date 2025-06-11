# VidLiSync Stripe Billing System Setup

This document provides comprehensive instructions for setting up and testing the complete Stripe billing system implementation for VidLiSync.

## Overview

The implementation includes:
- ✅ Complete Stripe payment integration (no simulation)
- ✅ 4 subscription tiers: Free ($0), Basic ($4.99), Pro ($19.99), Business ($49.99)
- ✅ Secure checkout flows with Stripe Elements
- ✅ Subscription management (upgrade, downgrade, cancel, reactivate)
- ✅ Webhook handling with idempotency and retry logic
- ✅ Usage tracking and enforcement
- ✅ Customer portal integration
- ✅ Real-time usage monitoring
- ✅ Billing lifecycle management

## 🛠️ Setup Instructions

### 1. Stripe Configuration

#### Create Stripe Account & Products
1. Sign up for a Stripe account at https://stripe.com
2. Create products and prices in Stripe Dashboard:
   - Basic Plan: $4.99/month (and $49.90/year for 17% discount)
   - Pro Plan: $19.99/month (and $199.90/year for 17% discount)  
   - Business Plan: $49.99/month (and $499.90/year for 17% discount)

#### Get API Keys
1. Get your Stripe API keys from Dashboard → Developers → API Keys
2. For testing: Use test keys (pk_test_... and sk_test_...)
3. For production: Use live keys (pk_live_... and sk_live_...)

#### Setup Webhooks
1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/webhooks/stripe`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.updated`
   - `payment_method.attached`
   - `payment_method.detached`
   - `checkout.session.completed`
   - `customer.subscription.trial_will_end`

### 2. Environment Variables

#### Backend (.env)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_endpoint_secret
STRIPE_PRICE_ID_BASIC=price_your_basic_monthly_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_monthly_price_id
STRIPE_PRICE_ID_BUSINESS=price_your_business_monthly_price_id

# Optional: Annual price IDs for discounts
STRIPE_PRICE_ID_BASIC_ANNUAL=price_your_basic_annual_price_id
STRIPE_PRICE_ID_PRO_ANNUAL=price_your_pro_annual_price_id
STRIPE_PRICE_ID_BUSINESS_ANNUAL=price_your_business_annual_price_id

# Frontend URL for redirects
FRONTEND_URL=https://yourdomain.com

# Database & other existing config...
DATABASE_URL=postgresql://user:password@host:5432/dbname
# ... other vars
```

#### Frontend (.env.local)
```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# API Configuration  
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Optional: Annual price IDs for frontend
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY=price_id_here
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_ANNUAL=price_id_here
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY=price_id_here
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL=price_id_here
NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_MONTHLY=price_id_here
NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_ANNUAL=price_id_here

# ... other existing vars
```

### 3. Database Migration

Run the billing system migration:

```bash
cd backend
alembic upgrade head
```

This creates:
- Enhanced subscription table with Stripe fields
- Webhook events table for idempotency tracking
- Updated subscription tiers (business instead of enterprise)

### 4. Dependencies Installation

#### Backend
```bash
cd backend
pip install -r requirements.txt  # Includes stripe==8.0.0
```

#### Frontend  
```bash
npm install  # Includes @stripe/stripe-js and @stripe/react-stripe-js
```

## 🧪 Testing the System

### 1. Manual Testing Checklist

#### Subscription Flow
- [ ] Visit `/pricing` page
- [ ] Click upgrade on any paid plan
- [ ] Complete Stripe checkout with test card `4242 4242 4242 4242`
- [ ] Verify redirect to billing dashboard
- [ ] Check subscription status in `/dashboard/billing`

#### Subscription Management
- [ ] View current subscription details
- [ ] Test cancellation (should mark cancel_at_period_end)
- [ ] Test reactivation (should remove cancellation)
- [ ] Open Stripe Customer Portal
- [ ] Update payment method in portal

#### Usage Tracking
- [ ] Create calls as different tier users
- [ ] Verify usage limits enforced (free: 3 calls/day, 5 min/month)
- [ ] Check usage display in billing dashboard
- [ ] Test overage warnings

#### Webhook Processing
- [ ] Use Stripe CLI to test webhooks: `stripe listen --forward-to localhost:8000/webhooks/stripe`
- [ ] Trigger test events and verify database updates
- [ ] Check webhook event logs in database
- [ ] Test retry logic by temporarily breaking webhook handler

### 2. Test Cards

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires authentication: `4000 0000 0000 3220`

### 3. Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
# Listen to events and forward to local server
stripe listen --forward-to localhost:8000/webhooks/stripe

# In another terminal, trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
stripe trigger checkout.session.completed
```

## 📊 Subscription Tier Features

### Free Tier ($0)
- 5 minutes/month
- 3 calls/day max
- 1-on-1 calls only
- 5 languages
- Basic quality

### Basic Tier ($4.99/month)
- 60 minutes/month  
- 20 calls/day max
- 1-on-1 calls only
- 15 languages
- HD quality

### Pro Tier ($19.99/month) 
- 300 minutes/month
- 100 calls/day max
- Up to 10 participants
- All 50+ languages
- HD quality
- Group calls enabled

### Business Tier ($49.99/month)
- Unlimited minutes
- Unlimited calls
- Up to 100 participants  
- All 50+ languages
- Ultra HD quality
- Team features
- Advanced analytics

## 🔐 Security Features

### Payment Security
- All payment processing through Stripe (PCI compliant)
- No card data stored on servers
- Webhook signature verification required
- HTTPS required for all payment flows

### Usage Enforcement
- Real-time usage tracking
- Tier-based limits enforced at API level
- Automatic overage prevention
- Audit trail for all billing operations

### Webhook Security
- Signature verification on all events
- Idempotency prevents duplicate processing
- Exponential backoff retry logic
- Circuit breaker for failing webhooks

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoints to production URLs
- [ ] Configure SSL certificates  
- [ ] Set production environment variables
- [ ] Test all flows with real payment methods
- [ ] Setup monitoring and alerting

### Monitoring Setup
- [ ] Monitor webhook event processing
- [ ] Track subscription conversion rates
- [ ] Monitor usage patterns and limits
- [ ] Alert on payment failures
- [ ] Track billing revenue metrics

## 🐛 Troubleshooting

### Common Issues

#### Webhook Failures
- Check webhook signature verification
- Verify endpoint URL is accessible
- Check database connection in webhook handler
- Review retry logic and idempotency

#### Authentication Issues
- Verify Supabase JWT token extraction
- Check API authorization headers
- Validate user permissions and tier access

#### Usage Limit Issues
- Check subscription tier assignment
- Verify usage calculation logic
- Review period boundaries (monthly/daily)
- Check database queries for usage stats

### Debug Tools

#### Check Webhook Events
```sql
-- View recent webhook events
SELECT * FROM webhook_events 
ORDER BY created_at DESC LIMIT 10;

-- Check failed webhooks  
SELECT * FROM webhook_events 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

#### Check User Usage
```sql
-- Get user usage stats
SELECT 
  u.email,
  u.subscription_tier,
  COUNT(ul.*) as total_events,
  SUM(CASE WHEN ul.feature_used = 'call_minutes' THEN (ul.usage_data->>'minutes_used')::float ELSE 0 END) as total_minutes
FROM users u
LEFT JOIN usage_logs ul ON u.id = ul.user_id
WHERE u.id = 'user_id_here'
GROUP BY u.id, u.email, u.subscription_tier;
```

#### Verify Subscription Status
```sql
-- Check subscription details
SELECT 
  u.email,
  s.tier,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'user@example.com';
```

## 📞 Support

For billing-related support:
1. Check Stripe dashboard for payment details
2. Review webhook event logs for processing issues  
3. Use Stripe Customer Portal for user self-service
4. Monitor usage logs for limit enforcement

The system is designed to handle all major subscription lifecycle events automatically with proper error handling and recovery mechanisms.