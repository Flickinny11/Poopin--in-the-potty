'use client'

import Link from 'next/link'
import { Metadata } from 'next'
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from 'lucide-react'

// Note: Metadata export needs to be in a server component, but we need client for interactivity
// Will handle this by making the main component client and adding metadata in a wrapper if needed

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-vidlisync',
    category: 'Getting Started',
    question: 'What is VidLiSync and how does it work?',
    answer: 'VidLiSync is a revolutionary video communication platform that uses AI technology to provide real-time translation, voice cloning, and lip-sync during video calls. This allows people who speak different languages to communicate naturally as if they were speaking the same language.'
  },
  {
    id: 'account-signup',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Creating an account is simple! Click the "Sign Up" button on our homepage, enter your email address and create a password, or sign up with Google. You can start using VidLiSync immediately with our free tier.'
  },
  {
    id: 'supported-languages',
    category: 'Getting Started',
    question: 'What languages does VidLiSync support?',
    answer: 'VidLiSync supports over 50 languages including English, Spanish, French, German, Italian, Portuguese, Chinese (Mandarin), Japanese, Korean, Arabic, Hindi, Russian, and many more. We continuously add new languages based on user demand.'
  },
  {
    id: 'system-requirements',
    category: 'Getting Started',
    question: 'What are the system requirements?',
    answer: 'VidLiSync works on any modern web browser (Chrome, Firefox, Safari, Edge) with a webcam and microphone. No software installation required! For the best experience, we recommend a stable internet connection and a computer with at least 4GB RAM.'
  },

  // Translation & AI Features
  {
    id: 'translation-accuracy',
    category: 'Translation & AI',
    question: 'How accurate is the AI translation?',
    answer: 'Our AI translation achieves 95%+ accuracy for common language pairs and everyday conversation. Accuracy may vary with technical terms, regional dialects, or very fast speech. The system continuously learns and improves with use.'
  },
  {
    id: 'voice-cloning-safety',
    category: 'Translation & AI',
    question: 'Is voice cloning safe and ethical?',
    answer: 'Yes, VidLiSync takes voice cloning ethics seriously. You can only clone your own voice or voices you have explicit permission to use. We have built-in safeguards to prevent misuse and require consent for all voice cloning activities.'
  },
  {
    id: 'lip-sync-technology',
    category: 'Translation & AI',
    question: 'How does the lip-sync technology work?',
    answer: 'Our advanced AI analyzes your facial movements and synchronizes them with the translated speech to create natural-looking conversations. This makes it appear as if you are actually speaking the target language, enhancing the communication experience.'
  },
  {
    id: 'offline-translation',
    category: 'Translation & AI',
    question: 'Does translation work offline?',
    answer: 'Currently, VidLiSync requires an internet connection for real-time AI translation and voice processing. We are working on offline capabilities for basic translation features in future updates.'
  },

  // Video Calls & Features
  {
    id: 'call-participants',
    category: 'Video Calls',
    question: 'How many people can join a video call?',
    answer: 'The number of participants depends on your subscription plan: Free tier supports up to 2 participants, Basic plan up to 5, Pro plan up to 15, and Business plan up to 50 participants in a single call.'
  },
  {
    id: 'call-recording',
    category: 'Video Calls',
    question: 'Can I record video calls?',
    answer: 'Yes, you can record calls with proper consent from all participants. Recordings include both original and translated audio tracks. All participants are notified when recording starts, and you can download recordings from your dashboard.'
  },
  {
    id: 'screen-sharing',
    category: 'Video Calls',
    question: 'Is screen sharing available?',
    answer: 'Yes, VidLiSync supports screen sharing with real-time translation of any text or speech on your screen. This is perfect for presentations, demos, or collaborative work across language barriers.'
  },
  {
    id: 'call-quality',
    category: 'Video Calls',
    question: 'What if I experience poor call quality?',
    answer: 'Poor call quality can be caused by slow internet, network congestion, or device limitations. Try closing other applications, checking your internet speed, or switching to a wired connection. Contact support if issues persist.'
  },

  // Billing & Subscriptions
  {
    id: 'pricing-plans',
    category: 'Billing',
    question: 'What subscription plans are available?',
    answer: 'We offer four plans: Free (limited features), Basic ($9.99/month), Pro ($19.99/month), and Business ($39.99/month). Annual subscriptions receive a 17% discount. Each plan includes different usage limits and features.'
  },
  {
    id: 'free-trial',
    category: 'Billing',
    question: 'Is there a free trial?',
    answer: 'Yes! Our free tier allows you to try VidLiSync with limited monthly translation minutes. All new paid subscribers also get a 30-day money-back guarantee if you&rsquo;re not completely satisfied.'
  },
  {
    id: 'cancel-subscription',
    category: 'Billing',
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel anytime from your account dashboard under "Billing & Subscription" or by contacting support. Your subscription remains active until the end of your billing period, then automatically downgrades to the free tier.'
  },
  {
    id: 'usage-limits',
    category: 'Billing',
    question: 'What happens if I exceed my usage limits?',
    answer: 'If you approach your monthly limits, you&rsquo;ll receive notifications. Once exceeded, translation features will be temporarily disabled until the next billing cycle, or you can upgrade your plan for immediate access.'
  },

  // Privacy & Security
  {
    id: 'data-privacy',
    category: 'Privacy & Security',
    question: 'How is my data protected?',
    answer: 'VidLiSync uses enterprise-grade encryption for all data transmission and storage. We are GDPR and CCPA compliant, never sell your data, and give you full control over your information including export and deletion rights.'
  },
  {
    id: 'call-privacy',
    category: 'Privacy & Security',
    question: 'Are my video calls private?',
    answer: 'Absolutely. All calls are encrypted end-to-end, and we do not store call content unless you explicitly choose to record. AI processing happens in real-time without permanent storage of your conversations.'
  },
  {
    id: 'data-deletion',
    category: 'Privacy & Security',
    question: 'Can I delete my account and data?',
    answer: 'Yes, you have the right to delete your account and all associated data at any time. Go to your account settings and select "Delete Account," or contact support. This action is permanent and cannot be undone.'
  },
  {
    id: 'gdpr-compliance',
    category: 'Privacy & Security',
    question: 'Is VidLiSync GDPR compliant?',
    answer: 'Yes, we are fully GDPR compliant. You have rights to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data. Contact our privacy team for any GDPR-related requests.'
  },

  // Technical Support
  {
    id: 'browser-compatibility',
    category: 'Technical',
    question: 'Which browsers are supported?',
    answer: 'VidLiSync works best on Chrome, Firefox, Safari, and Edge. We recommend using the latest browser version for optimal performance. Internet Explorer is not supported.'
  },
  {
    id: 'mobile-app',
    category: 'Technical',
    question: 'Is there a mobile app?',
    answer: 'Currently, VidLiSync works through your mobile browser. Native iOS and Android apps are in development and will be available in Q2 2024 with enhanced mobile features.'
  },
  {
    id: 'connection-issues',
    category: 'Technical',
    question: 'What if I can&rsquo;t connect to a call?',
    answer: 'Connection issues can be caused by firewalls, network restrictions, or browser permissions. Try refreshing the page, clearing browser cache, enabling camera/microphone permissions, or using a different network.'
  },
  {
    id: 'api-integration',
    category: 'Technical',
    question: 'Do you offer API integration?',
    answer: 'Yes, we provide REST APIs and WebSocket connections for developers who want to integrate VidLiSync&rsquo;s translation capabilities into their own applications. Contact our developer support for API documentation.'
  }
]

const categories = [...new Set(faqData.map(item => item.category))]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
              ← Back to VidLiSync
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="text-gray-600 hover:text-gray-900">
                Help Center
              </Link>
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
            Frequently Asked Questions
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Quick answers to common questions about VidLiSync
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600">
          Showing {filteredFAQs.length} of {faqData.length} questions
          {searchTerm && ` for "${searchTerm}"`}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No FAQ items found.</p>
              <p className="text-gray-400">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredFAQs.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                >
                  <div>
                    <div className="text-sm text-blue-600 font-medium mb-1">{item.category}</div>
                    <h3 className="text-lg font-medium text-gray-900">{item.question}</h3>
                  </div>
                  {expandedItems.has(item.id) ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {expandedItems.has(item.id) && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <section className="mt-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Can&rsquo;t find the answer you&rsquo;re looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contact Support
            </Link>
            <Link 
              href="/help"
              className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
            >
              Browse Help Center
            </Link>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Help Topics</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/help/getting-started" className="text-blue-600 hover:text-blue-800 hover:underline">
              Getting Started Guide
            </Link>
            <Link href="/help/translation" className="text-blue-600 hover:text-blue-800 hover:underline">
              Translation Features
            </Link>
            <Link href="/help/billing" className="text-blue-600 hover:text-blue-800 hover:underline">
              Billing & Subscriptions
            </Link>
            <Link href="/help/account" className="text-blue-600 hover:text-blue-800 hover:underline">
              Account Management
            </Link>
            <Link href="/help/privacy" className="text-blue-600 hover:text-blue-800 hover:underline">
              Privacy & Security
            </Link>
            <Link href="/help/troubleshooting" className="text-blue-600 hover:text-blue-800 hover:underline">
              Troubleshooting
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}