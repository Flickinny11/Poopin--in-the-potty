'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ShieldCheckIcon, 
  DownloadIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeOffIcon,
  Settings2Icon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ExternalLinkIcon
} from 'lucide-react'

interface PrivacySettings {
  dataProcessing: {
    analytics: boolean
    marketing: boolean
    improvement: boolean
    personalization: boolean
  }
  dataRetention: {
    callRecordings: string
    chatHistory: string
    usageData: string
  }
  visibility: {
    profileVisibility: string
    activityStatus: boolean
    callHistory: boolean
  }
  communications: {
    emailNotifications: boolean
    productUpdates: boolean
    marketingEmails: boolean
    securityAlerts: boolean
  }
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataProcessing: {
      analytics: true,
      marketing: false,
      improvement: true,
      personalization: true
    },
    dataRetention: {
      callRecordings: '90',
      chatHistory: '365',
      usageData: '730'
    },
    visibility: {
      profileVisibility: 'contacts',
      activityStatus: true,
      callHistory: false
    },
    communications: {
      emailNotifications: true,
      productUpdates: true,
      marketingEmails: false,
      securityAlerts: true
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleSettingChange = (
    category: keyof PrivacySettings,
    key: string,
    value: boolean | string
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleSaveSettings = async () => {
    setSaveStatus('saving')
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In a real implementation:
      // await fetch('/api/user/privacy-settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // })

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      console.error('Error saving privacy settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)

    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation:
      // const response = await fetch('/api/user/export-data', { method: 'POST' })
      // const blob = await response.blob()
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = 'vidlisync-data-export.zip'
      // a.click()

      // Simulate file download
      alert('Data export has been initiated. You will receive an email with download instructions within 24 hours.')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error initiating data export. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      // In a real implementation:
      // await fetch('/api/user/delete-account', { method: 'DELETE' })
      // Redirect to account deletion confirmation page
      alert('Account deletion request submitted. You will receive a confirmation email.')
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error processing account deletion. Please contact support.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Privacy Settings</h1>
              <p className="text-gray-600">Manage your data, privacy preferences, and account settings</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
              {saveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Processing Preferences */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <Settings2Icon className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Processing Preferences</h2>
              <p className="text-gray-600 text-sm">Control how we process your data for different purposes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Analytics and Performance</h3>
                <p className="text-sm text-gray-600">Help us improve VidLiSync by analyzing usage patterns</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataProcessing.analytics}
                  onChange={(e) => handleSettingChange('dataProcessing', 'analytics', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Marketing and Communications</h3>
                <p className="text-sm text-gray-600">Use your data for personalized marketing and recommendations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataProcessing.marketing}
                  onChange={(e) => handleSettingChange('dataProcessing', 'marketing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Product Improvement</h3>
                <p className="text-sm text-gray-600">Help improve AI translation and voice cloning features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataProcessing.improvement}
                  onChange={(e) => handleSettingChange('dataProcessing', 'improvement', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Personalization</h3>
                <p className="text-sm text-gray-600">Customize your experience based on preferences and usage</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataProcessing.personalization}
                  onChange={(e) => handleSettingChange('dataProcessing', 'personalization', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Data Retention Settings */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <ShieldCheckIcon className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Retention</h2>
              <p className="text-gray-600 text-sm">Control how long we keep different types of your data</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Call Recordings</h3>
                <p className="text-sm text-gray-600">Automatically delete call recordings after specified period</p>
              </div>
              <select
                value={settings.dataRetention.callRecordings}
                onChange={(e) => handleSettingChange('dataRetention', 'callRecordings', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
                <option value="never">Never delete</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Chat History</h3>
                <p className="text-sm text-gray-600">Messages and translation history from calls</p>
              </div>
              <select
                value={settings.dataRetention.chatHistory}
                onChange={(e) => handleSettingChange('dataRetention', 'chatHistory', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
                <option value="730">2 years</option>
                <option value="never">Never delete</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Usage Data</h3>
                <p className="text-sm text-gray-600">Analytics and performance data</p>
              </div>
              <select
                value={settings.dataRetention.usageData}
                onChange={(e) => handleSettingChange('dataRetention', 'usageData', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="365">1 year</option>
                <option value="730">2 years</option>
                <option value="1095">3 years</option>
                <option value="never">Never delete</option>
              </select>
            </div>
          </div>
        </section>

        {/* Visibility and Privacy */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <EyeIcon className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Visibility and Privacy</h2>
              <p className="text-gray-600 text-sm">Control who can see your information and activity</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Profile Visibility</h3>
                <p className="text-sm text-gray-600">Who can see your profile information</p>
              </div>
              <select
                value={settings.visibility.profileVisibility}
                onChange={(e) => handleSettingChange('visibility', 'profileVisibility', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Everyone</option>
                <option value="contacts">My contacts only</option>
                <option value="private">Nobody</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Activity Status</h3>
                <p className="text-sm text-gray-600">Show when you&rsquo;re online or last active</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.visibility.activityStatus}
                  onChange={(e) => handleSettingChange('visibility', 'activityStatus', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Call History Visibility</h3>
                <p className="text-sm text-gray-600">Allow contacts to see your call history</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.visibility.callHistory}
                  onChange={(e) => handleSettingChange('visibility', 'callHistory', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Data Export and Deletion */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center mb-6">
            <DownloadIcon className="w-6 h-6 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Export and Deletion</h2>
              <p className="text-gray-600 text-sm">Export your data or permanently delete your account</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Data Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">Export Your Data</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Download a copy of all your personal data including call recordings, settings, and account information.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Account information and settings</li>
                    <li>• Call recordings and transcripts</li>
                    <li>• Chat history and translations</li>
                    <li>• Usage analytics and preferences</li>
                  </ul>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="ml-4 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>

            {/* Account Deletion */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-2 flex items-center">
                    <AlertTriangleIcon className="w-4 h-4 mr-2" />
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete your VidLiSync account and all associated data. This action cannot be undone.
                  </p>
                  {showDeleteConfirm && (
                    <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                      <p className="text-sm text-red-800 font-medium mb-2">
                        Are you absolutely sure?
                      </p>
                      <p className="text-xs text-red-700 mb-3">
                        This will permanently delete your account, all call recordings, settings, and cannot be recovered.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Yes, Delete Everything
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {!showDeleteConfirm && (
                  <button
                    onClick={handleDeleteAccount}
                    className="ml-4 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Legal Information */}
        <section className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Privacy Rights</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">GDPR Rights (EU Users)</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Right to access your data</li>
                <li>• Right to rectify inaccurate data</li>
                <li>• Right to erase your data</li>
                <li>• Right to data portability</li>
                <li>• Right to restrict processing</li>
                <li>• Right to object to processing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">CCPA Rights (California Users)</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Right to know about data collection</li>
                <li>• Right to delete personal information</li>
                <li>• Right to opt-out of sale (we don&rsquo;t sell data)</li>
                <li>• Right to non-discrimination</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-600 mb-2">
              For questions about your privacy rights or to exercise these rights, contact us:
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 flex items-center">
                Privacy Policy <ExternalLinkIcon className="w-3 h-3 ml-1" />
              </Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-500 flex items-center">
                Contact Support <ExternalLinkIcon className="w-3 h-3 ml-1" />
              </Link>
              <a href="mailto:privacy@vidlisync.com" className="text-blue-600 hover:text-blue-500">
                privacy@vidlisync.com
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}