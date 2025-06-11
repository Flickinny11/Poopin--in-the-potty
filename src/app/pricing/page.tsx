'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VidLiSyncLogo } from '@/components/VidLiSyncLogo'
import { CheckIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyPrice: '$0',
    annualPrice: '$0',
    period: 'forever',
    features: ['5 minutes/month', '1-on-1 calls only', '5 languages', 'Basic quality'],
    limits: {
      minutes: 5,
      participants: 2,
      languages: 5,
      quality: 'basic'
    },
    cta: 'Get Started',
    popular: false,
    stripeMonthlyPriceId: null,
    stripeAnnualPriceId: null
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    monthlyPrice: '$4.99',
    annualPrice: '$49.90',
    period: 'per month',
    features: ['60 minutes/month', '15 languages', 'HD quality', 'Email support'],
    limits: {
      minutes: 60,
      participants: 2,
      languages: 15,
      quality: 'hd'
    },
    cta: 'Start Free Trial',
    popular: false,
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY,
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_ANNUAL
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    monthlyPrice: '$19.99',
    annualPrice: '$199.90',
    period: 'per month',
    features: ['300 minutes/month', 'All 50+ languages', 'Group calls', 'Priority support'],
    limits: {
      minutes: 300,
      participants: 10,
      languages: 50,
      quality: 'hd',
      groupCalls: true
    },
    cta: 'Start Free Trial',
    popular: true,
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL
  },
  {
    id: 'business',
    name: 'Business',
    price: 49.99,
    monthlyPrice: '$49.99',
    annualPrice: '$499.90',
    period: 'per month',
    features: ['Unlimited minutes', 'Team features', 'Advanced analytics', 'Dedicated support'],
    limits: {
      minutes: -1, // Unlimited
      participants: 100,
      languages: 50,
      quality: 'ultra_hd',
      groupCalls: true,
      teamFeatures: true,
      analytics: true
    },
    cta: 'Start Free Trial',
    popular: false,
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_MONTHLY,
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS_ANNUAL
  }
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const { user } = useAuthStore()

  const handleSubscribe = async (plan: typeof PRICING_PLANS[0]) => {
    if (plan.id === 'free') {
      // For free plan, just redirect to signup or dashboard
      if (user) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/auth/signup'
      }
      return
    }

    // For paid plans, create checkout session
    const priceId = isAnnual ? plan.stripeAnnualPriceId : plan.stripeMonthlyPriceId
    
    if (!priceId) {
      console.error('Price ID not configured for plan:', plan.id)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/dashboard/billing?success=true`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      // Handle error - maybe show a toast notification
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <VidLiSyncLogo size={32} />
              <span className="text-xl font-bold text-gray-900">VidLiSync</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`card relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {isAnnual && plan.id !== 'free' ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="text-gray-500 ml-1">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                {isAnnual && plan.id !== 'free' && (
                  <p className="text-sm text-gray-500">
                    ${(plan.price * 12 * 0.83).toFixed(2)} billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be prorated for any differences.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my minutes?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limit. You can upgrade your plan or wait for your next billing cycle to continue using the service.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use Stripe for payment processing, which is PCI DSS compliant. We never store your payment information on our servers.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to break language barriers?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who are already having seamless conversations in any language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary">
              Start Free Trial
            </Link>
            <Link href="/demo" className="btn-secondary">
              Watch Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}