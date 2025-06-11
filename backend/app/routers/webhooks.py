"""
Stripe webhook handling with idempotency and retry logic
"""
from fastapi import APIRouter, HTTPException, Request, status, BackgroundTasks
import stripe
import os
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import json

from ..schemas import WebhookEventResponse, APIResponse
from ..database import db_manager
from ..models import SubscriptionTier, SubscriptionStatus

logger = logging.getLogger(__name__)
router = APIRouter()

# Stripe configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Webhook retry configuration
MAX_RETRIES = int(os.getenv("WEBHOOK_RETRY_MAX", "3"))
RETRY_BACKOFF_SECONDS = [1, 4, 16]  # Exponential backoff

# Events we handle
HANDLED_EVENTS = [
    'customer.subscription.created',
    'customer.subscription.updated', 
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.updated',
    'payment_method.attached',
    'payment_method.detached',
    'checkout.session.completed',
    'customer.subscription.trial_will_end'
]

@router.post("/stripe", response_model=APIResponse)
async def handle_stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """
    Handle Stripe webhook events with signature verification
    """
    try:
        # Get raw body and signature
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature"
            )
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid payload")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload"
            )
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # Check if we handle this event type
        if event['type'] not in HANDLED_EVENTS:
            logger.info(f"Ignoring unhandled event type: {event['type']}")
            return APIResponse(message="Event type not handled")
        
        # Check for idempotency - has this event already been processed?
        existing_event = await db_manager.get_webhook_event(event['id'])
        if existing_event and existing_event.get('status') == 'success':
            logger.info(f"Event {event['id']} already processed successfully")
            return APIResponse(message="Event already processed")
        
        # Store/update webhook event record
        await db_manager.upsert_webhook_event({
            'id': event['id'],
            'event_type': event['type'],
            'status': 'processing',
            'event_data': event['data'],
            'retry_count': existing_event.get('retry_count', 0) if existing_event else 0
        })
        
        # Process event in background with retry logic
        background_tasks.add_task(process_webhook_event_with_retry, event)
        
        return APIResponse(message="Webhook received and queued for processing")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

async def process_webhook_event_with_retry(event: Dict[str, Any]):
    """
    Process webhook event with exponential backoff retry
    """
    event_id = event['id']
    event_type = event['type']
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            # Process the event
            await process_webhook_event(event)
            
            # Mark as successful
            await db_manager.update_webhook_event(event_id, {
                'status': 'success',
                'processed_at': datetime.now(timezone.utc),
                'error_message': None
            })
            
            logger.info(f"Successfully processed webhook event {event_id} on attempt {attempt + 1}")
            return
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error processing webhook event {event_id} on attempt {attempt + 1}: {error_msg}")
            
            # Update retry count and error
            await db_manager.update_webhook_event(event_id, {
                'retry_count': attempt + 1,
                'error_message': error_msg
            })
            
            # If this was the last attempt, mark as failed
            if attempt == MAX_RETRIES:
                await db_manager.update_webhook_event(event_id, {
                    'status': 'failed'
                })
                logger.error(f"Failed to process webhook event {event_id} after {MAX_RETRIES + 1} attempts")
                break
            
            # Wait before retry (exponential backoff)
            if attempt < len(RETRY_BACKOFF_SECONDS):
                await asyncio.sleep(RETRY_BACKOFF_SECONDS[attempt])
            else:
                await asyncio.sleep(RETRY_BACKOFF_SECONDS[-1])

async def process_webhook_event(event: Dict[str, Any]):
    """
    Process individual webhook event based on type
    """
    event_type = event['type']
    data = event['data']['object']
    
    if event_type == 'customer.subscription.created':
        await handle_subscription_created(data)
    elif event_type == 'customer.subscription.updated':
        await handle_subscription_updated(data)
    elif event_type == 'customer.subscription.deleted':
        await handle_subscription_deleted(data)
    elif event_type == 'checkout.session.completed':
        await handle_checkout_session_completed(data)
    elif event_type == 'invoice.payment_succeeded':
        await handle_payment_succeeded(data)
    elif event_type == 'invoice.payment_failed':
        await handle_payment_failed(data)
    elif event_type == 'customer.updated':
        await handle_customer_updated(data)
    elif event_type == 'payment_method.attached':
        await handle_payment_method_attached(data)
    elif event_type == 'payment_method.detached':
        await handle_payment_method_detached(data)
    elif event_type == 'customer.subscription.trial_will_end':
        await handle_trial_will_end(data)

async def handle_subscription_created(subscription_data: Dict[str, Any]):
    """Handle subscription creation"""
    try:
        # Get user from metadata or customer
        user_id = await get_user_id_from_subscription(subscription_data)
        if not user_id:
            logger.error(f"Could not find user for subscription {subscription_data['id']}")
            return
        
        # Determine subscription tier from price ID
        tier = get_tier_from_price_id(subscription_data['items']['data'][0]['price']['id'])
        
        # Create subscription record
        subscription_record = {
            'user_id': user_id,
            'stripe_subscription_id': subscription_data['id'],
            'stripe_customer_id': subscription_data['customer'],
            'stripe_price_id': subscription_data['items']['data'][0]['price']['id'],
            'tier': tier.value,
            'status': map_stripe_status(subscription_data['status']).value,
            'current_period_start': datetime.fromtimestamp(subscription_data['current_period_start'], timezone.utc),
            'current_period_end': datetime.fromtimestamp(subscription_data['current_period_end'], timezone.utc),
            'cancel_at_period_end': subscription_data['cancel_at_period_end'],
            'trial_end': datetime.fromtimestamp(subscription_data['trial_end'], timezone.utc) if subscription_data.get('trial_end') else None
        }
        
        await db_manager.create_subscription(subscription_record)
        
        # Update user's subscription tier
        await db_manager.update_user_subscription_tier(user_id, tier)
        
        logger.info(f"Created subscription for user {user_id}: {subscription_data['id']}")
        
    except Exception as e:
        logger.error(f"Error handling subscription created: {e}")
        raise

async def handle_subscription_updated(subscription_data: Dict[str, Any]):
    """Handle subscription updates"""
    try:
        subscription_id = subscription_data['id']
        existing_subscription = await db_manager.get_subscription_by_stripe_id(subscription_id)
        
        if not existing_subscription:
            logger.warning(f"Subscription not found in database: {subscription_id}")
            # Try to create it
            await handle_subscription_created(subscription_data)
            return
        
        # Determine tier from price ID
        tier = get_tier_from_price_id(subscription_data['items']['data'][0]['price']['id'])
        
        # Update subscription record
        updates = {
            'stripe_price_id': subscription_data['items']['data'][0]['price']['id'],
            'tier': tier.value,
            'status': map_stripe_status(subscription_data['status']).value,
            'current_period_start': datetime.fromtimestamp(subscription_data['current_period_start'], timezone.utc),
            'current_period_end': datetime.fromtimestamp(subscription_data['current_period_end'], timezone.utc),
            'cancel_at_period_end': subscription_data['cancel_at_period_end'],
            'cancelled_at': datetime.fromtimestamp(subscription_data['canceled_at'], timezone.utc) if subscription_data.get('canceled_at') else None,
            'trial_end': datetime.fromtimestamp(subscription_data['trial_end'], timezone.utc) if subscription_data.get('trial_end') else None
        }
        
        await db_manager.update_subscription(existing_subscription['id'], updates)
        
        # Update user's subscription tier
        await db_manager.update_user_subscription_tier(existing_subscription['user_id'], tier)
        
        logger.info(f"Updated subscription: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription updated: {e}")
        raise

async def handle_subscription_deleted(subscription_data: Dict[str, Any]):
    """Handle subscription cancellation"""
    try:
        subscription_id = subscription_data['id']
        existing_subscription = await db_manager.get_subscription_by_stripe_id(subscription_id)
        
        if not existing_subscription:
            logger.warning(f"Subscription not found in database: {subscription_id}")
            return
        
        # Update subscription status
        updates = {
            'status': SubscriptionStatus.CANCELLED.value,
            'cancelled_at': datetime.now(timezone.utc)
        }
        
        await db_manager.update_subscription(existing_subscription['id'], updates)
        
        # Downgrade user to free tier
        await db_manager.update_user_subscription_tier(existing_subscription['user_id'], SubscriptionTier.FREE)
        
        logger.info(f"Cancelled subscription: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription deleted: {e}")
        raise

async def handle_checkout_session_completed(session_data: Dict[str, Any]):
    """Handle completed checkout session"""
    try:
        if session_data['mode'] != 'subscription':
            return  # Only handle subscription checkouts
        
        subscription_id = session_data['subscription']
        if subscription_id:
            # Fetch full subscription data from Stripe
            subscription = stripe.Subscription.retrieve(subscription_id)
            await handle_subscription_created(subscription)
        
        logger.info(f"Processed checkout session: {session_data['id']}")
        
    except Exception as e:
        logger.error(f"Error handling checkout session completed: {e}")
        raise

async def handle_payment_succeeded(invoice_data: Dict[str, Any]):
    """Handle successful payment"""
    try:
        subscription_id = invoice_data['subscription']
        if not subscription_id:
            return
        
        existing_subscription = await db_manager.get_subscription_by_stripe_id(subscription_id)
        if not existing_subscription:
            return
        
        # Update subscription status to active if it was past due
        if existing_subscription.get('status') == SubscriptionStatus.PAST_DUE.value:
            await db_manager.update_subscription(existing_subscription['id'], {
                'status': SubscriptionStatus.ACTIVE.value
            })
            
            # Restore user's subscription tier
            tier = SubscriptionTier(existing_subscription['tier'])
            await db_manager.update_user_subscription_tier(existing_subscription['user_id'], tier)
        
        logger.info(f"Payment succeeded for subscription: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment succeeded: {e}")
        raise

async def handle_payment_failed(invoice_data: Dict[str, Any]):
    """Handle failed payment"""
    try:
        subscription_id = invoice_data['subscription']
        if not subscription_id:
            return
        
        existing_subscription = await db_manager.get_subscription_by_stripe_id(subscription_id)
        if not existing_subscription:
            return
        
        # Update subscription status to past due
        await db_manager.update_subscription(existing_subscription['id'], {
            'status': SubscriptionStatus.PAST_DUE.value
        })
        
        # Optionally downgrade user to free tier after grace period
        # This could be implemented with a background job
        
        logger.info(f"Payment failed for subscription: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment failed: {e}")
        raise

async def handle_customer_updated(customer_data: Dict[str, Any]):
    """Handle customer updates"""
    # This could update user profile information if needed
    logger.info(f"Customer updated: {customer_data['id']}")

async def handle_payment_method_attached(payment_method_data: Dict[str, Any]):
    """Handle payment method attachment"""
    logger.info(f"Payment method attached: {payment_method_data['id']}")

async def handle_payment_method_detached(payment_method_data: Dict[str, Any]):
    """Handle payment method detachment"""
    logger.info(f"Payment method detached: {payment_method_data['id']}")

async def handle_trial_will_end(subscription_data: Dict[str, Any]):
    """Handle trial ending notification"""
    # This could send notification to user
    logger.info(f"Trial will end for subscription: {subscription_data['id']}")

async def get_user_id_from_subscription(subscription_data: Dict[str, Any]) -> Optional[str]:
    """Get user ID from subscription metadata or customer"""
    try:
        # First try metadata
        metadata = subscription_data.get('metadata', {})
        user_id = metadata.get('user_id')
        if user_id:
            return user_id
        
        # Try to get from customer
        customer_id = subscription_data['customer']
        customer = stripe.Customer.retrieve(customer_id)
        user_id = customer.metadata.get('user_id')
        if user_id:
            return user_id
        
        # Last resort: find by customer email
        if customer.email:
            user = await db_manager.get_user_by_email(customer.email)
            if user:
                return str(user['id'])
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting user ID from subscription: {e}")
        return None

def get_tier_from_price_id(price_id: str) -> SubscriptionTier:
    """Map Stripe price ID to subscription tier"""
    price_id_map = {
        os.getenv("STRIPE_PRICE_ID_BASIC"): SubscriptionTier.BASIC,
        os.getenv("STRIPE_PRICE_ID_PRO"): SubscriptionTier.PRO,
        os.getenv("STRIPE_PRICE_ID_BUSINESS"): SubscriptionTier.BUSINESS,
    }
    
    return price_id_map.get(price_id, SubscriptionTier.FREE)

def map_stripe_status(stripe_status: str) -> SubscriptionStatus:
    """Map Stripe subscription status to our enum"""
    status_map = {
        'active': SubscriptionStatus.ACTIVE,
        'canceled': SubscriptionStatus.CANCELLED,
        'past_due': SubscriptionStatus.PAST_DUE,
        'trialing': SubscriptionStatus.TRIALING,
        'incomplete': SubscriptionStatus.PAST_DUE,
        'incomplete_expired': SubscriptionStatus.CANCELLED,
        'unpaid': SubscriptionStatus.PAST_DUE
    }
    
    return status_map.get(stripe_status, SubscriptionStatus.CANCELLED)

@router.get("/events/{event_id}", response_model=WebhookEventResponse)
async def get_webhook_event(event_id: str):
    """
    Get webhook event details (for debugging)
    """
    try:
        event = await db_manager.get_webhook_event(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook event not found"
            )
        
        return WebhookEventResponse(**event)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting webhook event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get webhook event"
        )