import Link from 'next/link'
import { Metadata } from 'next'
import { SearchIcon, BookOpenIcon, PhoneIcon, UsersIcon, SettingsIcon, CreditCardIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Help Center | VidLiSync',
  description: 'VidLiSync Help Center - Documentation, guides, and support for video calls with AI translation',
}

export default function HelpCenterPage() {
  const helpCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of VidLiSync',
      icon: <BookOpenIcon className="w-6 h-6" />,
      articles: [
        { title: 'Creating Your First Account', href: '/help/getting-started/account-setup' },
        { title: 'Making Your First Video Call', href: '/help/getting-started/first-call' },
        { title: 'Understanding AI Translation', href: '/help/getting-started/translation-basics' },
        { title: 'Voice Cloning Setup', href: '/help/getting-started/voice-cloning' },
      ]
    },
    {
      title: 'Video Calls',
      description: 'Everything about video calling features',
      icon: <PhoneIcon className="w-6 h-6" />,
      articles: [
        { title: 'Starting and Joining Calls', href: '/help/calls/joining' },
        { title: 'Screen Sharing and Recording', href: '/help/calls/recording' },
        { title: 'Call Quality Troubleshooting', href: '/help/calls/troubleshooting' },
        { title: 'Inviting Participants', href: '/help/calls/invitations' },
      ]
    },
    {
      title: 'AI Translation',
      description: 'Learn about our translation features',
      icon: <UsersIcon className="w-6 h-6" />,
      articles: [
        { title: 'Supported Languages', href: '/help/translation/languages' },
        { title: 'Translation Accuracy Tips', href: '/help/translation/accuracy' },
        { title: 'Voice Cloning Ethics', href: '/help/translation/voice-cloning' },
        { title: 'Lip-Sync Technology', href: '/help/translation/lip-sync' },
      ]
    },
    {
      title: 'Account Settings',
      description: 'Manage your account and preferences',
      icon: <SettingsIcon className="w-6 h-6" />,
      articles: [
        { title: 'Profile and Preferences', href: '/help/account/profile' },
        { title: 'Privacy Controls', href: '/help/account/privacy' },
        { title: 'Notification Settings', href: '/help/account/notifications' },
        { title: 'Data Export and Deletion', href: '/help/account/data-management' },
      ]
    },
    {
      title: 'Billing and Subscriptions',
      description: 'Subscription plans and billing help',
      icon: <CreditCardIcon className="w-6 h-6" />,
      articles: [
        { title: 'Subscription Plans Overview', href: '/help/billing/plans' },
        { title: 'Upgrading Your Plan', href: '/help/billing/upgrading' },
        { title: 'Billing and Payment Issues', href: '/help/billing/payment' },
        { title: 'Cancellation and Refunds', href: '/help/billing/cancellation' },
      ]
    },
  ]

  const popularArticles = [
    { title: 'How does AI translation work?', href: '/help/translation/how-it-works' },
    { title: 'Troubleshooting video call issues', href: '/help/calls/troubleshooting' },
    { title: 'Setting up voice cloning safely', href: '/help/translation/voice-cloning' },
    { title: 'Understanding subscription plans', href: '/help/billing/plans' },
    { title: 'Privacy and data protection', href: '/help/account/privacy' },
    { title: 'Supported browsers and devices', href: '/help/technical/compatibility' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
              ← Back to VidLiSync
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            How can we help you?
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Find answers, learn about features, and get the most out of VidLiSync
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search help articles..."
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Popular Articles */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article, index) => (
              <Link 
                key={index}
                href={article.href}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h3 className="font-medium text-gray-900 hover:text-blue-600">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Help Categories */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-4">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link 
                        href={article.href}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href={`/help/${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View all articles →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Video Tutorials</h3>
              <p className="text-blue-700 mb-4">Watch step-by-step guides for common tasks</p>
              <Link href="/help/videos" className="text-blue-600 hover:text-blue-800 font-medium">
                Watch Tutorials →
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Community Forum</h3>
              <p className="text-green-700 mb-4">Connect with other users and share tips</p>
              <Link href="/community" className="text-green-600 hover:text-green-800 font-medium">
                Join Community →
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Developer API</h3>
              <p className="text-purple-700 mb-4">Integrate VidLiSync into your applications</p>
              <Link href="/developers" className="text-purple-600 hover:text-purple-800 font-medium">
                API Documentation →
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="mt-16 bg-gray-100 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Can&rsquo;t find what you&rsquo;re looking for?
          </h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contact Support
            </Link>
            <Link 
              href="/faq"
              className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              Browse FAQ
            </Link>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Getting Help</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/contact" className="hover:text-blue-600">Contact Support</Link></li>
                <li><Link href="/faq" className="hover:text-blue-600">FAQ</Link></li>
                <li><Link href="/help/videos" className="hover:text-blue-600">Video Tutorials</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Account</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/help/account/profile" className="hover:text-blue-600">Profile Settings</Link></li>
                <li><Link href="/help/account/privacy" className="hover:text-blue-600">Privacy Controls</Link></li>
                <li><Link href="/help/billing/plans" className="hover:text-blue-600">Subscription Plans</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/acceptable-use" className="hover:text-blue-600">Acceptable Use</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-blue-600">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-blue-600">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}