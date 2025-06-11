import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Copyright Policy | VidLiSync',
  description: 'DMCA Copyright Policy and intellectual property protections for VidLiSync',
}

export default function CopyrightPolicyPage() {
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
            Copyright Policy
          </h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 mb-4">
                VidLiSync respects the intellectual property rights of others and expects our users to do the same. 
                This Copyright Policy outlines our procedures for responding to alleged copyright infringement 
                in accordance with the Digital Millennium Copyright Act (DMCA) and other applicable copyright laws.
              </p>
              <p className="text-gray-700">
                This policy applies to all content shared through VidLiSync, including but not limited to video calls, 
                recordings, translations, voice clones, and any other user-generated content on our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. DMCA Compliance</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Safe Harbor Provisions</h3>
              <p className="text-gray-700 mb-4">
                VidLiSync qualifies for safe harbor protections under the DMCA as a service provider. We:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Do not have actual knowledge of infringing material</li>
                <li>Do not receive financial benefit directly attributable to infringing activity</li>
                <li>Respond expeditiously to remove or disable access to infringing material</li>
                <li>Have designated a DMCA agent to receive infringement notifications</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Designated DMCA Agent</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">
                  <strong>DMCA Agent Contact Information:</strong><br/>
                  Name: VidLiSync Legal Department<br/>
                  Email: <a href="mailto:dmca@vidlisync.com" className="text-blue-600 hover:text-blue-500">dmca@vidlisync.com</a><br/>
                  Address: VidLiSync DMCA Agent<br/>
                  1234 Technology Way<br/>
                  San Francisco, CA 94105<br/>
                  United States
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Filing a DMCA Takedown Notice</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Required Information</h3>
              <p className="text-gray-700 mb-4">
                To file a valid DMCA takedown notice, you must include the following information:
              </p>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Identification of the copyrighted work:</strong> Describe the work you claim has been infringed, including registration number if applicable</li>
                <li><strong>Identification of the infringing material:</strong> Provide specific information about where the infringing content is located on VidLiSync</li>
                <li><strong>Contact information:</strong> Your name, address, telephone number, and email address</li>
                <li><strong>Good faith statement:</strong> A statement that you have a good faith belief that the use is not authorized</li>
                <li><strong>Accuracy statement:</strong> A statement that the information is accurate and you are authorized to act on behalf of the copyright owner</li>
                <li><strong>Physical or electronic signature:</strong> Your physical or electronic signature</li>
              </ol>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 DMCA Notice Template</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-sm">
                <p className="text-gray-700">
                  To: dmca@vidlisync.com<br/><br/>
                  
                  I am writing to notify you of copyright infringement on your platform.<br/><br/>
                  
                  1. The copyrighted work being infringed is: [Describe your work]<br/>
                  2. The infringing material is located at: [Provide specific URL or description]<br/>
                  3. My contact information:<br/>
                     Name: [Your name]<br/>
                     Address: [Your address]<br/>
                     Phone: [Your phone]<br/>
                     Email: [Your email]<br/><br/>
                  
                  I have a good faith belief that the use of the material described above is not authorized by the copyright owner, its agent, or the law.<br/><br/>
                  
                  I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or am authorized to act on behalf of the copyright owner.<br/><br/>
                  
                  Electronic Signature: [Your name]<br/>
                  Date: [Current date]
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Our Response to DMCA Notices</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Processing Timeline</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Initial Review:</strong> Within 24 hours of receiving a valid notice</li>
                <li><strong>Content Removal:</strong> Within 1-3 business days if notice is complete</li>
                <li><strong>User Notification:</strong> Immediate notification to the alleged infringer</li>
                <li><strong>Counter-Notice Period:</strong> 10-14 business days for counter-notification</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Actions Taken</h3>
              <p className="text-gray-700 mb-4">
                Upon receiving a valid DMCA notice, we may:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Remove or disable access to the allegedly infringing content</li>
                <li>Notify the user who posted the content</li>
                <li>Provide a copy of the DMCA notice to the user</li>
                <li>Document the infringement claim for repeat infringer policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. DMCA Counter-Notifications</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Filing a Counter-Notice</h3>
              <p className="text-gray-700 mb-4">
                If you believe your content was removed by mistake or misidentification, you may file a counter-notice containing:
              </p>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Your contact information:</strong> Name, address, phone number, and email</li>
                <li><strong>Identification of the removed content:</strong> Description and location before removal</li>
                <li><strong>Good faith statement:</strong> Statement that you believe the content was removed by mistake</li>
                <li><strong>Consent to jurisdiction:</strong> Agreement to federal court jurisdiction in your district</li>
                <li><strong>Physical or electronic signature:</strong> Your signature on the counter-notice</li>
              </ol>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Counter-Notice Process</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We forward your counter-notice to the original complainant</li>
                <li>If no legal action is filed within 10-14 business days, we may restore the content</li>
                <li>The complainant may file a court action to keep the content disabled</li>
                <li>We are not liable for restoring content pursuant to a valid counter-notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Repeat Infringer Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Three-Strike Policy</h3>
              <p className="text-gray-700 mb-4">
                VidLiSync maintains a strict repeat infringer policy:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>First Violation:</strong> Warning and content removal</li>
                <li><strong>Second Violation:</strong> Temporary account suspension (7-30 days)</li>
                <li><strong>Third Violation:</strong> Permanent account termination</li>
                <li><strong>Severe Cases:</strong> Immediate termination for egregious violations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Account Restoration</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Terminated accounts are not eligible for restoration</li>
                <li>Users may appeal termination decisions within 30 days</li>
                <li>Appeals must include evidence of good faith or mistake</li>
                <li>New accounts by terminated users are prohibited</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Copyright in AI-Generated Content</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Voice Cloning and Copyright</h3>
              <p className="text-gray-700 mb-4">
                Special considerations apply to AI-generated voice content:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Users must own rights to the voice being cloned or have explicit permission</li>
                <li>Voice clones of celebrities or public figures without permission are prohibited</li>
                <li>AI-generated voices may not be used to impersonate for fraudulent purposes</li>
                <li>Users are responsible for ensuring they have rights to clone any voice</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Translation and Fair Use</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Real-time translation for personal communication generally qualifies as fair use</li>
                <li>Commercial use of translated copyrighted content may require additional permissions</li>
                <li>Users should not translate copyrighted works for redistribution without permission</li>
                <li>Educational and personal use translations receive stronger fair use protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. User Responsibilities</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Content Ownership</h3>
              <p className="text-gray-700 mb-4">
                Users are responsible for ensuring they have the right to use all content they share:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Own the content or have proper licensing</li>
                <li>Respect others&rsquo; intellectual property rights</li>
                <li>Understand fair use limitations and exceptions</li>
                <li>Seek permission when in doubt about copyright status</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">8.2 Recording Consent and Copyright</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Obtain consent from all participants before recording calls</li>
                <li>Respect local laws regarding call recording and privacy</li>
                <li>Do not record content that infringes on others&rsquo; copyright</li>
                <li>Be aware that recordings may be subject to copyright claims</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. VidLiSync&rsquo;s Intellectual Property</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">9.1 Our Copyrighted Materials</h3>
              <p className="text-gray-700 mb-4">
                VidLiSync owns or licenses the following copyrighted materials:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Software code and platform functionality</li>
                <li>User interface design and graphics</li>
                <li>AI models and training data (where applicable)</li>
                <li>Documentation, help content, and tutorials</li>
                <li>Trademarks, logos, and brand materials</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">9.2 Permitted Use of Our Materials</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Personal use of the service as intended</li>
                <li>Screenshots for support or educational purposes</li>
                <li>Links to our public content with attribution</li>
                <li>Fair use for commentary, criticism, or news reporting</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Copyright Considerations</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">10.1 Global Copyright Laws</h3>
              <p className="text-gray-700 mb-4">
                VidLiSync operates globally and respects international copyright laws:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>We respond to valid takedown notices under various national laws</li>
                <li>Berne Convention and WIPO treaty obligations are respected</li>
                <li>Local copyright exceptions and limitations are considered</li>
                <li>We work with international authorities when required</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">10.2 Cross-Border Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Content may be subject to copyright laws in multiple jurisdictions</li>
                <li>Users should consider the most restrictive applicable law</li>
                <li>Fair use and fair dealing vary significantly between countries</li>
                <li>When in doubt, seek legal advice for commercial use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Educational Resources</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">11.1 Understanding Copyright</h3>
              <p className="text-gray-700 mb-4">
                We encourage users to learn about copyright law:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><a href="https://www.copyright.gov" className="text-blue-600 hover:text-blue-500" target="_blank" rel="noopener noreferrer">U.S. Copyright Office</a> - Official copyright information</li>
                <li><a href="https://www.wipo.int" className="text-blue-600 hover:text-blue-500" target="_blank" rel="noopener noreferrer">WIPO</a> - World Intellectual Property Organization</li>
                <li><a href="https://creativecommons.org" className="text-blue-600 hover:text-blue-500" target="_blank" rel="noopener noreferrer">Creative Commons</a> - Alternative licensing options</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">11.2 Best Practices</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Always give credit to original creators when possible</li>
                <li>Use public domain or Creative Commons licensed content when available</li>
                <li>Understand the difference between personal and commercial use</li>
                <li>Keep records of permissions and licenses you have obtained</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For copyright-related questions or to report infringement:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>DMCA Takedown Notices:</strong><br/>
                  <a href="mailto:dmca@vidlisync.com" className="text-blue-600 hover:text-blue-500">dmca@vidlisync.com</a><br/><br/>
                  
                  <strong>General Copyright Questions:</strong><br/>
                  <a href="mailto:legal@vidlisync.com" className="text-blue-600 hover:text-blue-500">legal@vidlisync.com</a><br/><br/>
                  
                  <strong>Support:</strong><br/>
                  <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact Support</Link>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}<br/>
                This Copyright Policy is part of our <Link href="/terms" className="text-blue-600 hover:text-blue-500">Terms of Service</Link> 
                and may be updated to reflect changes in law or our procedures.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}