import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | VidLiSync',
  description: 'Acceptable Use Policy for VidLiSync - Guidelines for appropriate use of our platform',
}

export default function AcceptableUsePolicyPage() {
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
            Acceptable Use Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Purpose and Scope</h2>
              <p className="text-gray-700 mb-4">
                This Acceptable Use Policy governs your use of VidLiSync&rsquo;s video communication platform 
                and AI translation services. By using our service, you agree to comply with this policy 
                and our <Link href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link>.
              </p>
              <p className="text-gray-700">
                This policy is designed to protect our users, maintain service quality, and ensure 
                compliance with applicable laws and regulations. Violations may result in account 
                suspension or termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Permitted Uses</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync is intended for legitimate communication purposes, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Personal Communication:</strong> Video calls with friends and family across language barriers</li>
                <li><strong>Business Meetings:</strong> Professional video conferences with international colleagues</li>
                <li><strong>Educational Activities:</strong> Language learning and educational sessions</li>
                <li><strong>Remote Work:</strong> Collaboration with global teams and remote workers</li>
                <li><strong>Content Creation:</strong> Creating multilingual content for legitimate purposes</li>
                <li><strong>Customer Support:</strong> Providing customer service across languages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Prohibited Content</h2>
              <p className="text-gray-700 mb-4">
                You may not use VidLiSync to transmit, distribute, or store any content that:
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Illegal Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Violates any applicable local, state, national, or international law</li>
                <li>Promotes or facilitates illegal activities</li>
                <li>Contains or distributes malware, viruses, or harmful code</li>
                <li>Infringes intellectual property rights of others</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Harmful Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Contains hate speech, discrimination, or promotes violence</li>
                <li>Harasses, threatens, or intimidates individuals or groups</li>
                <li>Contains graphic violence or disturbing content</li>
                <li>Promotes self-harm or suicide</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Adult and Explicit Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Pornographic or sexually explicit material</li>
                <li>Content that sexualizes minors in any way</li>
                <li>Adult services or escort advertisements</li>
                <li>Inappropriate or non-consensual intimate content</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.4 Fraudulent and Deceptive Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Scams, fraud, or deceptive practices</li>
                <li>False advertising or misleading information</li>
                <li>Identity theft or impersonation</li>
                <li>Pyramid schemes or get-rich-quick schemes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Technical Misuse</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Attempting to gain unauthorized access to our systems or other users&rsquo; accounts</li>
                <li>Reverse engineering, decompiling, or attempting to extract source code</li>
                <li>Overloading our systems with excessive requests or calls</li>
                <li>Using automated scripts or bots to interact with the service</li>
                <li>Attempting to circumvent usage limits or subscription restrictions</li>
                <li>Interfering with the proper functioning of the service</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Account Misuse</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Creating multiple accounts to circumvent restrictions</li>
                <li>Sharing account credentials with unauthorized users</li>
                <li>Using false information during registration</li>
                <li>Impersonating other individuals or organizations</li>
                <li>Selling, transferring, or sublicensing your account</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Commercial Misuse</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Using the service for unauthorized commercial purposes on free plans</li>
                <li>Reselling our services without explicit permission</li>
                <li>Using our AI technology to create competing services</li>
                <li>Mining or extracting data for commercial use without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. AI and Translation Specific Guidelines</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Voice Cloning Ethics</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Only clone your own voice or voices you have explicit permission to use</li>
                <li>Do not create voice clones for impersonation or deceptive purposes</li>
                <li>Respect intellectual property and personality rights</li>
                <li>Do not use voice cloning for deepfakes or misinformation</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Translation Guidelines</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Do not intentionally input content designed to generate harmful translations</li>
                <li>Understand that AI translations may not be perfect and verify important information</li>
                <li>Do not use the service to translate copyrighted material without permission</li>
                <li>Report translation errors or bias to help improve the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Respect Others&rsquo; Privacy</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Only record calls with explicit consent from all participants</li>
                <li>Do not share recordings without permission from all participants</li>
                <li>Respect local laws regarding call recording and consent</li>
                <li>Do not attempt to access or share others&rsquo; personal information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Child Safety</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Users under 13 are not permitted to use the service</li>
                <li>Users 13-17 must have parental consent</li>
                <li>Report any suspected child exploitation immediately</li>
                <li>Do not use the service to contact minors inappropriately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Reporting Violations</h2>
              <p className="text-gray-700 mb-4">
                If you encounter content or behavior that violates this policy, please report it immediately:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">Emergency Situations</h3>
                <p className="text-red-700">
                  If you witness content involving immediate danger, child exploitation, or credible threats 
                  of violence, contact local emergency services immediately before reporting to us.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Violations</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>Email: <a href="mailto:abuse@vidlisync.com" className="text-blue-600 hover:text-blue-500">abuse@vidlisync.com</a></li>
                  <li>In-app reporting tool (available during calls)</li>
                  <li>Support: <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link></li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Enforcement and Consequences</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Violation Response</h3>
              <p className="text-gray-700 mb-4">
                When we become aware of policy violations, we may take the following actions:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Issue warnings and require policy acknowledgment</li>
                <li>Remove or moderate violating content</li>
                <li>Temporarily suspend account access</li>
                <li>Permanently terminate accounts for serious violations</li>
                <li>Report illegal activities to appropriate authorities</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">8.2 Appeal Process</h3>
              <p className="text-gray-700 mb-4">
                If you believe your account was suspended or content removed in error, you may appeal by:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Contacting <a href="mailto:appeals@vidlisync.com" className="text-blue-600 hover:text-blue-500">appeals@vidlisync.com</a></li>
                <li>Providing detailed explanation and relevant evidence</li>
                <li>Waiting for our review team to investigate (typically 7-14 business days)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Community Standards</h2>
              <p className="text-gray-700 mb-4">
                Beyond avoiding prohibited content, we encourage users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Be Respectful:</strong> Treat all users with dignity and respect</li>
                <li><strong>Be Inclusive:</strong> Welcome users from all backgrounds and cultures</li>
                <li><strong>Be Constructive:</strong> Contribute positively to conversations</li>
                <li><strong>Be Patient:</strong> Understand that AI translation may not be perfect</li>
                <li><strong>Be Helpful:</strong> Assist other users when appropriate</li>
                <li><strong>Be Responsible:</strong> Consider the impact of your actions on others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Acceptable Use Policy to reflect changes in our service, community 
                feedback, or legal requirements. We will notify users of material changes through:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Email notifications to registered users</li>
                <li>In-app announcements</li>
                <li>Website banners and notifications</li>
                <li>30-day notice period for significant changes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Acceptable Use Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  General Questions: <a href="mailto:policy@vidlisync.com" className="text-blue-600 hover:text-blue-500">policy@vidlisync.com</a><br/>
                  Abuse Reports: <a href="mailto:abuse@vidlisync.com" className="text-blue-600 hover:text-blue-500">abuse@vidlisync.com</a><br/>
                  Appeals: <a href="mailto:appeals@vidlisync.com" className="text-blue-600 hover:text-blue-500">appeals@vidlisync.com</a><br/>
                  Support: <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}<br/>
                This Acceptable Use Policy is part of our <Link href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link> and 
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500 ml-1">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}