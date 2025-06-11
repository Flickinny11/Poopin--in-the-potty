'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { 
  CreditCardIcon, 
  CalendarIcon, 
  TrendingUpIcon, 
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ExternalLinkIcon 
} from 'lucide-react'

interface Subscription {
  id: string
  tier: 'free' | 'basic' | 'pro' | 'business'
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at?: string
  stripe_subscription_id?: string
}

interface UsageStats {
  current_period_start: string
  current_period_end: string
  total_minutes_used: number
  minutes_limit: number
  overage_minutes: number
  calls_count: number
  features_used: Record<string, number>
}

interface SubscriptionPlan {
  tier: string
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
  limits: Record<string, any>
}

export default function BillingPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    fetchBillingData()
  }, [user, router])

  const fetchBillingData = async () => {
    if (!user?.access_token) return

    try {
      setLoading(true)
      
      // Fetch subscription
      const subscriptionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/subscription`,
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        }
      )

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json()
        setSubscription(subscriptionData)
      }

      // Fetch usage stats
      const usageResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/usage`,
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        }
      )

      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        setUsage(usageData)
      }

      // Fetch plans
      const plansResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/plans`
      )

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData)
      }

    } catch (err) {
      setError('Failed to load billing information')
      console.error('Error fetching billing data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user?.access_token || !subscription) return

    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/subscription/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        }
      )

      if (response.ok) {
        await fetchBillingData() // Refresh data
      } else {
        setError('Failed to cancel subscription')
      }
    } catch (err) {
      setError('Error cancelling subscription')
      console.error('Error:', err)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!user?.access_token || !subscription) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/subscription/reactivate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        }
      )

      if (response.ok) {
        await fetchBillingData() // Refresh data
      } else {
        setError('Failed to reactivate subscription')
      }
    } catch (err) {
      setError('Error reactivating subscription')
      console.error('Error:', err)
    }
  }

  const handleManageBilling = async () => {
    if (!user?.access_token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/portal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        }
      )

      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      } else {
        setError('Failed to open billing portal')
      }
    } catch (err) {
      setError('Error opening billing portal')
      console.error('Error:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'trialing': return 'text-blue-600 bg-blue-100'
      case 'past_due': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTierName = (tier: string) => {
    const plan = plans.find(p => p.tier === tier)
    return plan ? plan.name : tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">Manage your subscription and view usage statistics</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Current Subscription */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              <CreditCardIcon className="w-6 h-6 text-gray-400" />
            </div>
            
            {subscription ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {getTierName(subscription.tier)}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                      {subscription.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span>
                      Current period: {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertTriangleIcon className="w-4 h-4 mr-2" />
                      <span>Will cancel at period end</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  {subscription.tier !== 'free' && (
                    <button
                      onClick={handleManageBilling}
                      className="btn-primary flex items-center justify-center"
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      Manage Billing
                    </button>
                  )}
                  
                  {subscription.cancel_at_period_end ? (
                    <button
                      onClick={handleReactivateSubscription}
                      className="btn-secondary"
                    >
                      Reactivate Subscription
                    </button>
                  ) : subscription.tier !== 'free' && (
                    <button
                      onClick={handleCancelSubscription}
                      className="btn-secondary text-red-600 hover:text-red-700"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Plan</h3>
                <p className="text-gray-600 mb-6">You're currently on the free plan.</p>
                <a href="/pricing" className="btn-primary">
                  Upgrade Plan
                </a>
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Usage This Period</h2>
              <TrendingUpIcon className="w-6 h-6 text-gray-400" />
            </div>

            {usage ? (
              <div className="space-y-4">
                {/* Minutes Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Minutes Used</span>
                    <span className="text-sm text-gray-600">
                      {usage.total_minutes_used} / {usage.minutes_limit === -1 ? '∞' : usage.minutes_limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        usage.overage_minutes > 0 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: usage.minutes_limit === -1 ? '10%' : `${Math.min((usage.total_minutes_used / usage.minutes_limit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  {usage.overage_minutes > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {usage.overage_minutes} minutes over limit
                    </p>
                  )}
                </div>

                {/* Calls Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">Total Calls</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {usage.calls_count}
                  </span>
                </div>

                {/* Period Info */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Period: {new Date(usage.current_period_start).toLocaleDateString()} - {new Date(usage.current_period_end).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No usage data available</p>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.tier === plan.tier
              
              return (
                <div 
                  key={plan.tier}
                  className={`border rounded-lg p-6 ${
                    isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500">/{plan.interval}</span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="text-center">
                      <span className="inline-flex px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  ) : (
                    <a 
                      href="/pricing"
                      className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {plan.tier === 'free' ? 'Downgrade' : 'Upgrade'}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}