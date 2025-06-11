import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | VidLiSync',
  description: 'Refund and Cancellation Policy for VidLiSync subscriptions and services',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
              ← Back to VidLiSync
            </Link>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Refund Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 mb-4">
                At VidLiSync, we want you to be completely satisfied with our service. This Refund Policy 
                outlines the circumstances under which we provide refunds for our subscription services 
                and explains our cancellation process.
              </p>
              <p className="text-gray-700">
                This policy applies to all VidLiSync subscription plans and is part of our 
                <Link href="/terms" className="text-blue-600 hover:text-blue-500 ml-1">Terms of Service</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Free Trial and Money-Back Guarantee</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Free Trial Period</h3>
              <p className="text-gray-700 mb-4">
                New users can try VidLiSync with our free tier, which includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Limited monthly translation minutes</li>
                <li>Basic video call features</li>
                <li>Standard AI translation quality</li>
                <li>No time limit on free tier usage</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 30-Day Money-Back Guarantee</h3>
              <p className="text-gray-700 mb-4">
                We offer a 30-day money-back guarantee for all new paid subscriptions:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Full refund available within 30 days of initial subscription</li>
                <li>Applies to first-time subscribers only</li>
                <li>No questions asked - simply contact our support team</li>
                <li>Refund processed within 5-10 business days</li>
                <li>Account will be downgraded to free tier after refund</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Subscription Cancellation</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 How to Cancel</h3>
              <p className="text-gray-700 mb-4">
                You can cancel your subscription at any time through:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your account dashboard under &quot;Billing &amp; Subscription&quot;</li>
                <li>Emailing our support team at <a href="mailto:billing@vidlisync.com" className="text-blue-600 hover:text-blue-500">billing@vidlisync.com</a></li>
                <li>Using the Stripe Customer Portal (linked in your billing page)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 When Cancellation Takes Effect</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800">
                  <strong>Important:</strong> When you cancel, your subscription remains active until the end 
                  of your current billing period. You&rsquo;ll continue to have access to all paid features until then.
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Monthly subscriptions: Active until the next billing date</li>
                <li>Annual subscriptions: Active until the annual renewal date</li>
                <li>No partial refunds for unused time (except within 30-day guarantee period)</li>
                <li>Account automatically downgrades to free tier at period end</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Refund Eligibility</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Eligible for Full Refund</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>30-Day Guarantee:</strong> New subscriptions within 30 days</li>
                <li><strong>Service Outages:</strong> Extended service unavailability (24+ hours)</li>
                <li><strong>Billing Errors:</strong> Incorrect charges due to our system errors</li>
                <li><strong>Duplicate Charges:</strong> Multiple charges for the same billing period</li>
                <li><strong>Unauthorized Charges:</strong> Charges without your authorization</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Eligible for Partial Refund</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Service Downgrades:</strong> Significant feature removal affecting your use case</li>
                <li><strong>Performance Issues:</strong> Documented quality degradation lasting multiple days</li>
                <li><strong>Plan Changes:</strong> Downgrading within the first 7 days of upgrade</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Not Eligible for Refund</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Subscription cancellations after the 30-day guarantee period</li>
                <li>Changes of mind after using the service extensively</li>
                <li>Account termination due to Terms of Service violations</li>
                <li>Unused minutes or features (no partial usage refunds)</li>
                <li>Third-party service integrations or add-ons</li>
                <li>Refund requests submitted more than 60 days after charge</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Refund Process</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 How to Request a Refund</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Contact our billing support team at <a href="mailto:billing@vidlisync.com" className="text-blue-600 hover:text-blue-500">billing@vidlisync.com</a></li>
                  <li>Include your account email and reason for refund request</li>
                  <li>Provide any relevant screenshots or documentation</li>
                  <li>Our team will review your request within 2 business days</li>
                  <li>If approved, refund will be processed within 5-10 business days</li>
                </ol>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Refund Method</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Refunds are issued to the original payment method</li>
                <li>Credit card refunds: 5-10 business days</li>
                <li>Bank transfers: 3-7 business days</li>
                <li>Digital wallets: 1-3 business days</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 What Happens After Refund</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your account is immediately downgraded to the free tier</li>
                <li>All premium features are disabled</li>
                <li>Your usage history and settings are preserved</li>
                <li>You can re-subscribe at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Special Circumstances</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Annual Subscription Considerations</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Annual subscriptions receive significant discounts but limited refund flexibility</li>
                <li>30-day money-back guarantee still applies for new annual subscribers</li>
                <li>After 30 days, refunds only for service failures or billing errors</li>
                <li>Mid-year cancellations do not receive partial refunds for unused months</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Enterprise and Business Plans</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Custom refund terms may apply based on contract agreement</li>
                <li>Contact your account manager for refund requests</li>
                <li>Service Level Agreement (SLA) compensation may apply</li>
                <li>Dedicated support for enterprise refund inquiries</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 Promotional and Discount Refunds</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Refunds for discounted subscriptions are calculated at the discounted rate</li>
                <li>Free months or promotional credits are not refundable</li>
                <li>Coupon codes and promotional offers cannot be reused after refund</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disputed Charges and Chargebacks</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Before Filing a Chargeback</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>Please contact us first:</strong> We can often resolve billing issues faster than 
                  the chargeback process. Chargebacks can take 30-90 days and may result in additional fees.
                </p>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Chargeback Process</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We will provide all requested documentation to your bank or card issuer</li>
                <li>Your account may be suspended during chargeback investigation</li>
                <li>If chargeback is denied, original charge remains valid</li>
                <li>Multiple chargebacks may result in payment method restrictions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Account Credits and Future Billing</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Account Credits</h3>
              <p className="text-gray-700 mb-4">
                In some cases, we may offer account credits instead of cash refunds:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Credits can be applied to future subscription payments</li>
                <li>Credits do not expire as long as your account remains active</li>
                <li>Credits cannot be transferred or converted to cash</li>
                <li>Unused credits are forfeited if account is permanently deleted</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">8.2 Billing Adjustments</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Pro-rated charges for mid-cycle plan changes</li>
                <li>Automatic credits for documented service outages</li>
                <li>Usage-based adjustments for overages or underages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Legal Rights and Consumer Protection</h2>
              <p className="text-gray-700 mb-4">
                This refund policy does not limit your legal rights under applicable consumer protection laws:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>EU Consumers:</strong> 14-day withdrawal right for distance contracts</li>
                <li><strong>UK Consumers:</strong> Consumer Rights Act protections apply</li>
                <li><strong>Australian Consumers:</strong> Australian Consumer Law guarantees</li>
                <li><strong>California Consumers:</strong> Additional CCPA rights may apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For refund requests, billing questions, or cancellations, contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Billing Support:</strong><br/>
                  Email: <a href="mailto:billing@vidlisync.com" className="text-blue-600 hover:text-blue-500">billing@vidlisync.com</a><br/>
                  Response Time: Within 24 hours<br/><br/>
                  
                  <strong>General Support:</strong><br/>
                  <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link><br/>
                  Account Dashboard: <Link href="/dashboard/billing" className="text-blue-600 hover:text-blue-500">Manage Billing</Link>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}<br/>
                This Refund Policy is part of our <Link href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link> 
                and may be updated from time to time with notice to users.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}