import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | VidLiSync',
  description: 'Terms of Service for VidLiSync - Real-time video chat with AI translation',
}

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using VidLiSync (&quot;Service&quot;), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
              <p className="text-gray-700">
                VidLiSync is a real-time video communication platform with AI-powered translation services 
                that enables users to communicate across language barriers through live video calls with 
                real-time translation, voice cloning, and lip-sync technology.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync provides the following services:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Real-time video calling with AI-powered translation</li>
                <li>Voice cloning technology for translated speech</li>
                <li>Lip-sync technology for natural conversation flow</li>
                <li>Multi-language support and real-time translation</li>
                <li>Call recording and transcription services</li>
                <li>User account management and settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of the Service, you must register for an account and provide 
                accurate, current, and complete information. You are responsible for maintaining the 
                confidentiality of your account credentials and for all activities that occur under 
                your account.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Account Requirements:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You must be at least 13 years of age to use this Service</li>
                <li>You must provide a valid email address</li>
                <li>You must not impersonate any person or entity</li>
                <li>You must not create multiple accounts for abusive purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">
                You agree not to use the Service for any unlawful purpose or in any way that could damage, 
                disable, overburden, or impair the Service. Prohibited activities include:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Transmitting any content that is illegal, harmful, threatening, abusive, or harassing</li>
                <li>Impersonating any person or entity or falsely stating your affiliation</li>
                <li>Transmitting spam, chain letters, or other unsolicited communications</li>
                <li>Attempting to gain unauthorized access to other user accounts or systems</li>
                <li>Using the Service to violate any applicable local, state, national, or international law</li>
                <li>Uploading or transmitting viruses, malware, or other malicious code</li>
                <li>Interfering with or disrupting the Service or servers connected to the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription Plans and Billing</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync offers both free and paid subscription plans. Paid subscriptions are billed 
                according to your chosen billing cycle (monthly or annually).
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Payment Terms:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>All fees are charged in advance and are non-refundable except as required by law</li>
                <li>Subscription fees will automatically renew unless cancelled before the renewal date</li>
                <li>Price changes will be communicated 30 days in advance</li>
                <li>Usage limits apply to each subscription tier as detailed in our pricing page</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed 
                by our <Link href="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>, 
                which is incorporated into these Terms by reference.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Data Handling:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>We collect and process personal data as described in our Privacy Policy</li>
                <li>Call recordings are stored securely and only accessible to participants</li>
                <li>AI processing may involve temporary storage of audio and video data</li>
                <li>You have rights regarding your personal data as described in our Privacy Policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are and will remain 
                the exclusive property of VidLiSync and its licensors. The Service is protected by 
                copyright, trademark, and other laws.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-2">User Content:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>You retain ownership of content you create and upload to the Service</li>
                <li>You grant us a license to use your content to provide and improve the Service</li>
                <li>You are responsible for ensuring you have rights to any content you upload</li>
                <li>We may remove content that violates these Terms or applicable law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability and Limitations</h2>
              <p className="text-gray-700 mb-4">
                While we strive to provide reliable service, we cannot guarantee that the Service will 
                be available at all times or will be error-free.
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>The Service may be temporarily unavailable for maintenance or updates</li>
                <li>AI translation accuracy may vary depending on language pairs and content</li>
                <li>Voice cloning and lip-sync features are dependent on available technology</li>
                <li>We reserve the right to modify or discontinue features with notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIDLISYNC SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION 
                DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-700">
                Our total liability to you for any claim arising out of or relating to these Terms or 
                the Service shall not exceed the amount you paid us in the twelve months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate this agreement at any time. We may suspend or terminate your 
                access to the Service if you violate these Terms.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Effects of Termination:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your right to use the Service will cease immediately</li>
                <li>We may retain certain information as required by law or for legitimate business purposes</li>
                <li>Provisions that should survive termination will continue to apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                Any disputes arising from these Terms or the Service will be resolved through binding 
                arbitration in accordance with the rules of the American Arbitration Association.
              </p>
              <p className="text-gray-700">
                You agree to waive any right to a jury trial or to participate in a class action lawsuit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of the State 
                of Delaware, without regard to its conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. If we make material changes, 
                we will notify you by email or through the Service at least 30 days before the changes 
                take effect.
              </p>
              <p className="text-gray-700">
                Your continued use of the Service after the changes take effect constitutes acceptance 
                of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Email: <a href="mailto:legal@vidlisync.com" className="text-blue-600 hover:text-blue-500">legal@vidlisync.com</a><br/>
                  Address: VidLiSync Legal Department<br/>
                  Support: <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}<br/>
                These Terms of Service are effective as of the date above and replace all prior agreements.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}