import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | VidLiSync',
  description: 'Privacy Policy for VidLiSync - How we handle your personal data in compliance with GDPR and privacy regulations',
}

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and ensuring 
                transparent handling of your personal data. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our real-time video communication 
                platform with AI-powered translation services.
              </p>
              <p className="text-gray-700">
                This policy complies with the General Data Protection Regulation (GDPR), California Consumer 
                Privacy Act (CCPA), and other applicable privacy laws. By using VidLiSync, you consent to 
                the data practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password, and profile details</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed by Stripe)</li>
                <li><strong>Communication Data:</strong> Messages, call recordings, and transcriptions when enabled</li>
                <li><strong>Support Communications:</strong> Messages sent through our support channels</li>
                <li><strong>User Settings:</strong> Language preferences, notification settings, and accessibility options</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Information Automatically Collected</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Technical Data:</strong> IP address, browser type, operating system, device information</li>
                <li><strong>Usage Data:</strong> How you interact with our service, features used, time spent</li>
                <li><strong>Call Metadata:</strong> Call duration, participants, timestamp, quality metrics</li>
                <li><strong>Performance Data:</strong> Error logs, crash reports, and service performance metrics</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 AI Processing Data</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Audio Data:</strong> Voice recordings for real-time translation and voice cloning</li>
                <li><strong>Video Data:</strong> Facial expressions and lip movements for lip-sync technology</li>
                <li><strong>Language Data:</strong> Speech patterns and linguistic preferences for improved translation</li>
                <li><strong>Training Data:</strong> Anonymized data used to improve AI model performance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Basis for Processing (GDPR)</h2>
              <p className="text-gray-700 mb-4">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Contract Performance:</strong> Processing necessary to provide our services</li>
                <li><strong>Legitimate Interest:</strong> Improving service quality, security, and user experience</li>
                <li><strong>Consent:</strong> For marketing communications and optional features</li>
                <li><strong>Legal Obligation:</strong> Compliance with applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Use Your Information</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Service Provision</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Enabling real-time video calls with translation features</li>
                <li>Processing AI-powered voice cloning and lip-sync technology</li>
                <li>Managing user accounts and authentication</li>
                <li>Processing payments and billing</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Service Improvement</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Training AI models to improve translation accuracy</li>
                <li>Developing new features and capabilities</li>
                <li>Monitoring and improving service performance</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Communication and Support</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Providing customer support and technical assistance</li>
                <li>Sending service updates and security notifications</li>
                <li>Marketing communications (with your consent)</li>
                <li>Legal and compliance communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following circumstances:
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Service Providers</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Payment processors (Stripe) for billing and subscription management</li>
                <li>Cloud service providers (AWS, Google Cloud) for hosting and infrastructure</li>
                <li>AI service providers for translation and voice processing</li>
                <li>Customer support platforms for help desk services</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Legal Requirements</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>To investigate potential violations of our terms</li>
                <li>In connection with mergers, acquisitions, or business transfers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal data only for as long as necessary to fulfill the purposes 
                outlined in this policy:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
                <li><strong>Call Recordings:</strong> Retained for 90 days unless explicitly saved by users</li>
                <li><strong>Payment Data:</strong> Retained for 7 years for tax and accounting purposes</li>
                <li><strong>Usage Analytics:</strong> Aggregated data retained indefinitely, personal identifiers removed after 2 years</li>
                <li><strong>AI Training Data:</strong> Anonymized data may be retained indefinitely for model improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 GDPR Rights (EU Users)</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Right of Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for voluntary processing</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 CCPA Rights (California Users)</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Right to Know:</strong> Information about data collection and use practices</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (we don&rsquo;t sell data)</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">7.3 Exercising Your Rights</h3>
              <p className="text-gray-700 mb-4">
                To exercise your privacy rights, you can:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Access your privacy settings in your account dashboard</li>
                <li>Contact us at <a href="mailto:privacy@vidlisync.com" className="text-blue-600 hover:text-blue-500">privacy@vidlisync.com</a></li>
                <li>Use our <Link href="/contact" className="text-blue-600 hover:text-blue-500">contact form</Link> for privacy requests</li>
                <li>Request data export through your account settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement comprehensive security measures to protect your personal data:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Encryption:</strong> All data transmitted and stored is encrypted using industry-standard protocols</li>
                <li><strong>Access Controls:</strong> Strict access controls and authentication for our systems</li>
                <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
                <li><strong>Data Minimization:</strong> We collect and process only necessary data</li>
                <li><strong>Incident Response:</strong> Comprehensive data breach response procedures</li>
                <li><strong>Employee Training:</strong> Regular privacy and security training for all staff</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync operates globally and may transfer your data to countries outside your residence. 
                We ensure adequate protection through:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Data Processing Agreements with adequate safeguards</li>
                <li>Regular compliance monitoring and audits</li>
                <li>Encryption and security measures during transfer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience. For detailed information 
                about our cookie practices, please see our <Link href="/cookies" className="text-blue-600 hover:text-blue-500">Cookie Policy</Link>.
              </p>
              <h3 className="text-xl font-medium text-gray-900 mb-3">Types of Cookies We Use:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Essential Cookies:</strong> Required for basic service functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Provide insights into service usage and performance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children&rsquo;s Privacy</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we become aware that we have collected 
                personal data from a child under 13, we will take steps to delete such information promptly.
              </p>
              <p className="text-gray-700">
                If you are a parent or guardian and believe your child has provided personal information 
                to us, please contact us immediately at <a href="mailto:privacy@vidlisync.com" className="text-blue-600 hover:text-blue-500">privacy@vidlisync.com</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices 
                or applicable laws. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Email notification to your registered email address</li>
                <li>Prominent notice on our website and service</li>
                <li>In-app notifications for significant changes</li>
                <li>30-day notice period before changes take effect</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Data Protection Officer:</strong><br/>
                  Email: <a href="mailto:privacy@vidlisync.com" className="text-blue-600 hover:text-blue-500">privacy@vidlisync.com</a><br/>
                  Address: VidLiSync Privacy Team<br/>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>EU Representative:</strong><br/>
                  For EU users with GDPR inquiries<br/>
                  Email: <a href="mailto:gdpr@vidlisync.com" className="text-blue-600 hover:text-blue-500">gdpr@vidlisync.com</a>
                </p>
                <p className="text-gray-700">
                  <strong>General Support:</strong><br/>
                  <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link> | 
                  <Link href="/help" className="text-blue-600 hover:text-blue-500 ml-2">Help Center</Link>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}<br/>
                This Privacy Policy is effective as of the date above and replaces all prior privacy policies.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}