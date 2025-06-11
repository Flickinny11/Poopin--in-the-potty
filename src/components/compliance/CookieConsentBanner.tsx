'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Settings, CheckIcon } from 'lucide-react'

interface CookiePreferences {
  essential: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

interface CookieConsentBannerProps {
  onAcceptAll?: (preferences: CookiePreferences) => void
  onRejectAll?: () => void
  onSavePreferences?: (preferences: CookiePreferences) => void
}

const COOKIE_CONSENT_KEY = 'vidlisync_cookie_consent'
const COOKIE_PREFERENCES_KEY = 'vidlisync_cookie_preferences'

export default function CookieConsentBanner({
  onAcceptAll,
  onRejectAll,
  onSavePreferences
}: CookieConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    
    if (!consent) {
      // Show banner if no consent decision has been made
      setShowBanner(true)
    }
    
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences))
      } catch (error) {
        console.error('Error parsing cookie preferences:', error)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted))
    setPreferences(allAccepted)
    setShowBanner(false)
    setShowPreferences(false)
    
    onAcceptAll?.(allAccepted)
  }

  const handleRejectAll = () => {
    const essential: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(essential))
    setPreferences(essential)
    setShowBanner(false)
    setShowPreferences(false)
    
    onRejectAll?.()
  }

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'customized')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    setShowBanner(false)
    setShowPreferences(false)
    
    onSavePreferences?.(preferences)
  }

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return // Essential cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const cookieCategories = [
    {
      key: 'essential' as const,
      title: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function and cannot be disabled.',
      examples: 'Authentication, security, basic functionality',
      required: true
    },
    {
      key: 'functional' as const,
      title: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization.',
      examples: 'Language preferences, user settings, call quality preferences',
      required: false
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website.',
      examples: 'Google Analytics, usage statistics, performance monitoring',
      required: false
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'These cookies are used to deliver relevant advertisements and track campaign effectiveness.',
      examples: 'Ad targeting, social media integration, email marketing',
      required: false
    }
  ]

  if (!showBanner) return null

  return (
    <>
      {/* Main Banner */}
      {!showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  We use cookies to improve your experience
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  We use cookies and similar technologies to provide the best experience on our website. 
                  Some cookies are essential for functionality, while others help us improve and personalize your experience.
                </p>
                <p className="text-gray-500 text-xs">
                  By clicking &quot;Accept All&quot;, you agree to our use of cookies. 
                  Learn more in our{' '}
                  <Link href="/cookies" className="text-blue-600 hover:text-blue-500 underline">
                    Cookie Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Cookie Settings
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Cookie Preferences</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-gray-600 mb-6">
                Customize your cookie preferences below. Essential cookies are required for basic functionality and cannot be disabled.
              </p>

              <div className="space-y-6">
                {cookieCategories.map((category) => (
                  <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{category.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                        <p className="text-xs text-gray-500">
                          <strong>Examples:</strong> {category.examples}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {category.required ? (
                          <div className="flex items-center">
                            <CheckIcon className="w-4 h-4 text-green-600 mr-1" />
                            <span className="text-xs text-gray-500">Required</span>
                          </div>
                        ) : (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences[category.key]}
                              onChange={(e) => handlePreferenceChange(category.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can change these preferences at any time by clicking the cookie settings 
                  link in our footer or visiting our{' '}
                  <Link href="/cookies" className="underline hover:no-underline">
                    Cookie Policy
                  </Link>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}