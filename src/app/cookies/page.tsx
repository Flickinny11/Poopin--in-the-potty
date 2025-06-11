import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | VidLiSync',
  description: 'Cookie Policy for VidLiSync - How we use cookies and tracking technologies',
}

export default function CookiePolicyPage() {
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
            Cookie Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are stored on your device when you visit VidLiSync. 
                They help us provide you with a better experience by remembering your preferences, 
                keeping you signed in, and helping us understand how you use our service.
              </p>
              <p className="text-gray-700">
                This Cookie Policy explains what cookies are, how we use them, the types of cookies 
                we use, and how you can control cookie preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync uses cookies for several purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Essential Functionality:</strong> Enable core features like user authentication and session management</li>
                <li><strong>User Preferences:</strong> Remember your language, theme, and other personal settings</li>
                <li><strong>Performance Monitoring:</strong> Track service performance and identify areas for improvement</li>
                <li><strong>Analytics:</strong> Understand how users interact with our platform to enhance user experience</li>
                <li><strong>Security:</strong> Protect against fraud and ensure secure access to your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Essential Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies are necessary for the basic functionality of VidLiSync and cannot be disabled.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium">Cookie Name</th>
                      <th className="text-left py-2 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">auth_token</td>
                      <td className="py-2">User authentication and session management</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">csrf_token</td>
                      <td className="py-2">Cross-site request forgery protection</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">session_id</td>
                      <td className="py-2">Maintain user session across pages</td>
                      <td className="py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Functional Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies remember your preferences and settings to provide a personalized experience.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium">Cookie Name</th>
                      <th className="text-left py-2 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">user_preferences</td>
                      <td className="py-2">Remember language, theme, and UI settings</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">cookie_consent</td>
                      <td className="py-2">Remember your cookie preferences</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">call_settings</td>
                      <td className="py-2">Remember call quality and translation preferences</td>
                      <td className="py-2">6 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Analytics Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies help us understand how you use VidLiSync so we can improve our service.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium">Cookie Name</th>
                      <th className="text-left py-2 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">_ga</td>
                      <td className="py-2">Google Analytics - distinguish users</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">_ga_*</td>
                      <td className="py-2">Google Analytics - session data</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">usage_analytics</td>
                      <td className="py-2">Track feature usage and performance</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.4 Performance Cookies</h3>
              <p className="text-gray-700 mb-2">
                These cookies monitor the performance of our service and help us identify issues.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium">Cookie Name</th>
                      <th className="text-left py-2 font-medium">Purpose</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">performance_metrics</td>
                      <td className="py-2">Monitor page load times and errors</td>
                      <td className="py-2">30 days</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 font-mono">call_quality</td>
                      <td className="py-2">Track call quality and connection issues</td>
                      <td className="py-2">7 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                We also use cookies from trusted third-party service providers:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Google Analytics</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Helps us understand user behavior and improve our service</li>
                <li>Data is anonymized and aggregated</li>
                <li>You can opt-out using Google&rsquo;s opt-out tool</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Stripe</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Processes payments securely</li>
                <li>Prevents fraud and ensures transaction security</li>
                <li>Required for payment processing functionality</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Customer Support Tools</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Enable live chat and support ticket functionality</li>
                <li>Improve response times and support quality</li>
                <li>Remember previous support interactions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Cookie Consent Manager</h3>
              <p className="text-gray-700 mb-4">
                When you first visit VidLiSync, you&rsquo;ll see a cookie consent banner that allows you to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Accept all cookies for the full experience</li>
                <li>Reject non-essential cookies</li>
                <li>Customize your cookie preferences by category</li>
                <li>Change your preferences at any time</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                You can also control cookies through your browser settings:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Privacy Settings Dashboard</h3>
              <p className="text-gray-700 mb-4">
                Logged-in users can manage their privacy preferences through the account dashboard:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800">
                  <strong>Access Your Privacy Settings:</strong><br/>
                  Dashboard → Settings → Privacy & Cookies
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-700 mb-4">
                While you can disable cookies, doing so may affect your VidLiSync experience:
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Essential Cookies</h3>
              <p className="text-gray-700 mb-2">
                Disabling essential cookies will prevent you from:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Logging into your account</li>
                <li>Accessing personalized features</li>
                <li>Making secure payments</li>
                <li>Saving preferences and settings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Functional Cookies</h3>
              <p className="text-gray-700 mb-2">
                Disabling functional cookies will result in:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Loss of personalized settings</li>
                <li>Need to re-enter preferences each visit</li>
                <li>Reduced user experience quality</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 Analytics & Performance Cookies</h3>
              <p className="text-gray-700 mb-2">
                Disabling these cookies will:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Prevent us from improving the service based on usage data</li>
                <li>Limit our ability to identify and fix performance issues</li>
                <li>Not affect your day-to-day use of VidLiSync</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Cookie Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or applicable laws. When we make significant changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Update the &quot;Last updated&quot; date at the top of this policy</li>
                <li>Notify you through email or in-app notifications</li>
                <li>Request renewed consent for new cookie types</li>
                <li>Provide a 30-day notice period for material changes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Cookie Policy or our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Email: <a href="mailto:privacy@vidlisync.com" className="text-blue-600 hover:text-blue-500">privacy@vidlisync.com</a><br/>
                  Privacy Policy: <Link href="/privacy" className="text-blue-600 hover:text-blue-500">Read our Privacy Policy</Link><br/>
                  Support: <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}<br/>
                This Cookie Policy is part of our Privacy Policy and Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}