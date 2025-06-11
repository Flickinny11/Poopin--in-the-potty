"""
Billing and subscription management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import stripe
import os
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone
from uuid import UUID

from ..schemas import (
    CheckoutSessionCreate, CheckoutSessionResponse, 
    SubscriptionResponse, SubscriptionPlanResponse,
    UsageStatsResponse, CustomerPortalResponse,
    APIResponse, ErrorResponse
)
from ..middleware.auth import get_current_active_user
from ..database import db_manager
from ..models import SubscriptionTier, SubscriptionStatus

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Subscription plan configuration
SUBSCRIPTION_PLANS = {
    SubscriptionTier.FREE: {
        "name": "Free",
        "price": 0.0,
        "currency": "usd",
        "interval": "month",
        "features": ["5 minutes/month", "1-on-1 calls", "5 languages", "Basic quality"],
        "limits": {
            "minutes_per_month": 5,
            "max_participants": 2,
            "languages": 5,
            "quality": "basic",
            "group_calls": False
        },
        "stripe_price_id": None
    },
    SubscriptionTier.BASIC: {
        "name": "Basic",
        "price": 4.99,
        "currency": "usd",
        "interval": "month",
        "features": ["60 minutes/month", "15 languages", "HD quality", "Email support"],
        "limits": {
            "minutes_per_month": 60,
            "max_participants": 2,
            "languages": 15,
            "quality": "hd",
            "group_calls": False
        },
        "stripe_price_id": os.getenv("STRIPE_PRICE_ID_BASIC")
    },
    SubscriptionTier.PRO: {
        "name": "Pro",
        "price": 19.99,
        "currency": "usd",
        "interval": "month",
        "features": ["300 minutes/month", "All 50+ languages", "Group calls", "Priority support"],
        "limits": {
            "minutes_per_month": 300,
            "max_participants": 10,
            "languages": 50,
            "quality": "hd",
            "group_calls": True
        },
        "stripe_price_id": os.getenv("STRIPE_PRICE_ID_PRO")
    },
    SubscriptionTier.BUSINESS: {
        "name": "Business",
        "price": 49.99,
        "currency": "usd",
        "interval": "month",
        "features": ["Unlimited minutes", "Team features", "Advanced analytics", "Dedicated support"],
        "limits": {
            "minutes_per_month": -1,  # Unlimited
            "max_participants": 100,
            "languages": 50,
            "quality": "ultra_hd",
            "group_calls": True,
            "team_features": True,
            "advanced_analytics": True
        },
        "stripe_price_id": os.getenv("STRIPE_PRICE_ID_BUSINESS")
    }
}

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans():
    """
    Get all available subscription plans
    """
    plans = []
    for tier, config in SUBSCRIPTION_PLANS.items():
        plans.append(SubscriptionPlanResponse(
            tier=tier,
            name=config["name"],
            price=config["price"],
            currency=config["currency"],
            interval=config["interval"],
            features=config["features"],
            limits=config["limits"]
        ))
    return plans

@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create a Stripe checkout session for subscription
    """
    try:
        # Get or create Stripe customer
        customer_id = await get_or_create_stripe_customer(current_user)
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': checkout_data.price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=checkout_data.success_url + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=checkout_data.cancel_url,
            metadata={
                'user_id': str(current_user['id'])
            },
            allow_promotion_codes=True,
            billing_address_collection='auto',
            automatic_tax={'enabled': True}
        )
        
        return CheckoutSessionResponse(
            session_id=session.id,
            url=session.url
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's current subscription details
    """
    try:
        subscription = await db_manager.get_user_subscription(UUID(current_user['id']))
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found"
            )
        
        return SubscriptionResponse(**subscription)
        
    except Exception as e:
        logger.error(f"Error getting subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription"
        )

@router.post("/subscription/cancel", response_model=APIResponse)
async def cancel_subscription(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Cancel user's subscription (at period end)
    """
    try:
        subscription = await db_manager.get_user_subscription(UUID(current_user['id']))
        if not subscription or not subscription.get('stripe_subscription_id'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        # Cancel at period end in Stripe
        stripe.Subscription.modify(
            subscription['stripe_subscription_id'],
            cancel_at_period_end=True
        )
        
        # Update local database
        await db_manager.update_subscription(
            subscription['id'],
            {'cancel_at_period_end': True}
        )
        
        return APIResponse(
            message="Subscription will be cancelled at the end of current period"
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error cancelling subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )

@router.post("/subscription/reactivate", response_model=APIResponse)
async def reactivate_subscription(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Reactivate a cancelled subscription
    """
    try:
        subscription = await db_manager.get_user_subscription(UUID(current_user['id']))
        if not subscription or not subscription.get('stripe_subscription_id'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found"
            )
        
        # Remove cancellation in Stripe
        stripe.Subscription.modify(
            subscription['stripe_subscription_id'],
            cancel_at_period_end=False
        )
        
        # Update local database
        await db_manager.update_subscription(
            subscription['id'],
            {'cancel_at_period_end': False}
        )
        
        return APIResponse(
            message="Subscription reactivated successfully"
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error reactivating subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error reactivating subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reactivate subscription"
        )

@router.get("/usage", response_model=UsageStatsResponse)
async def get_usage_stats(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get user's current usage statistics
    """
    try:
        subscription = await db_manager.get_user_subscription(UUID(current_user['id']))
        if not subscription:
            # Default to free tier limits
            tier = SubscriptionTier.FREE
        else:
            tier = SubscriptionTier(subscription['tier'])
        
        # Get usage stats from current billing period
        usage_stats = await db_manager.get_user_usage_stats(
            UUID(current_user['id']),
            subscription.get('current_period_start') if subscription else None,
            subscription.get('current_period_end') if subscription else None
        )
        
        # Get plan limits
        plan_limits = SUBSCRIPTION_PLANS[tier]['limits']
        minutes_limit = plan_limits['minutes_per_month']
        
        return UsageStatsResponse(
            current_period_start=subscription.get('current_period_start', datetime.now(timezone.utc)),
            current_period_end=subscription.get('current_period_end', datetime.now(timezone.utc)),
            total_minutes_used=usage_stats.get('total_minutes', 0),
            minutes_limit=minutes_limit if minutes_limit > 0 else 999999,
            overage_minutes=max(0, usage_stats.get('total_minutes', 0) - minutes_limit) if minutes_limit > 0 else 0,
            calls_count=usage_stats.get('calls_count', 0),
            features_used=usage_stats.get('features_used', {})
        )
        
    except Exception as e:
        logger.error(f"Error getting usage stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage statistics"
        )

@router.post("/portal", response_model=CustomerPortalResponse)
async def create_customer_portal_session(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Create a Stripe customer portal session
    """
    try:
        # Get Stripe customer ID
        subscription = await db_manager.get_user_subscription(UUID(current_user['id']))
        if not subscription or not subscription.get('stripe_customer_id'):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found"
            )
        
        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=subscription['stripe_customer_id'],
            return_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/dashboard/billing"
        )
        
        return CustomerPortalResponse(url=session.url)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating portal session: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating portal session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create customer portal session"
        )

async def get_or_create_stripe_customer(user_data: dict) -> str:
    """
    Get existing Stripe customer or create new one
    """
    try:
        # Check if user already has a subscription with customer ID
        subscription = await db_manager.get_user_subscription(UUID(user_data['id']))
        if subscription and subscription.get('stripe_customer_id'):
            return subscription['stripe_customer_id']
        
        # Create new Stripe customer
        customer = stripe.Customer.create(
            email=user_data['email'],
            name=user_data.get('full_name'),
            metadata={
                'user_id': str(user_data['id'])
            }
        )
        
        return customer.id
        
    except Exception as e:
        logger.error(f"Error getting/creating Stripe customer: {e}")
        raise