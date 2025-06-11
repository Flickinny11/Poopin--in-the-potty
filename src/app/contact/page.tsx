'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  MailIcon, 
  PhoneIcon, 
  MessageCircleIcon, 
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon 
} from 'lucide-react'

interface ContactForm {
  name: string
  email: string
  subject: string
  category: string
  priority: string
  message: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<ContactForm>>({})

  const categories = [
    { value: 'general', label: 'General Question' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Subscriptions' },
    { value: 'account', label: 'Account Issues' },
    { value: 'privacy', label: 'Privacy & Security' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'partnership', label: 'Business Partnership' }
  ]

  const priorities = [
    { value: 'low', label: 'Low Priority', description: '3-5 business days' },
    { value: 'medium', label: 'Medium Priority', description: '1-2 business days' },
    { value: 'high', label: 'High Priority', description: 'Within 24 hours' },
    { value: 'urgent', label: 'Urgent', description: 'Within 4 hours' }
  ]

  const contactMethods = [
    {
      icon: <MailIcon className="w-6 h-6" />,
      title: 'Email Support',
      description: 'Send us an email and we&rsquo;ll respond within 24 hours',
      contact: 'support@vidlisync.com',
      responseTime: '24 hours'
    },
    {
      icon: <MessageCircleIcon className="w-6 h-6" />,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available 9 AM - 6 PM PST',
      responseTime: 'Immediate'
    },
    {
      icon: <BookOpenIcon className="w-6 h-6" />,
      title: 'Help Center',
      description: 'Browse our comprehensive documentation and guides',
      contact: 'Self-service support',
      responseTime: 'Instant'
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, you would send the form data to your backend:
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
      // Handle error (show error message to user)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
              ← Back to VidLiSync
            </Link>
          </div>
        </header>

        {/* Success Message */}
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Message Sent Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for contacting us. We&rsquo;ve received your message and will respond within{' '}
              {priorities.find(p => p.value === formData.priority)?.description || '24 hours'}.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="font-semibold text-blue-900 mb-2">What happens next?</h2>
              <ul className="text-blue-800 text-left space-y-2">
                <li>• You&rsquo;ll receive an email confirmation shortly</li>
                <li>• Our support team will review your message</li>
                <li>• We&rsquo;ll respond with a solution or next steps</li>
                <li>• You can track your ticket status in your account</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/help"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Help Center
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    category: 'general',
                    priority: 'medium',
                    message: ''
                  })
                }}
                className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

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
              <Link href="/help" className="text-gray-600 hover:text-gray-900">
                Help Center
              </Link>
              <Link href="/faq" className="text-gray-600 hover:text-gray-900">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Contact Support
          </h1>
          <p className="text-xl text-blue-100">
            Get help with VidLiSync or share your feedback with our team
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Methods */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                      <p className="text-blue-600 font-medium">{method.contact}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {method.responseTime}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Business Hours */}
            <div className="mt-8 bg-gray-100 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Support Hours</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Emergency support available 24/7 for critical issues
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Brief description of your inquiry"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                {/* Category and Priority */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label} ({priority.description})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Please provide as much detail as possible about your inquiry..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Minimum 10 characters. Include relevant details like error messages, steps to reproduce issues, etc.
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    We typically respond within{' '}
                    {priorities.find(p => p.value === formData.priority)?.description || '24 hours'}
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Before contacting support, try these resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              href="/help"
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <BookOpenIcon className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Help Center</h3>
              <p className="text-gray-600 text-sm">
                Browse our comprehensive documentation and step-by-step guides
              </p>
            </Link>

            <Link 
              href="/faq"
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <MessageCircleIcon className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600 text-sm">
                Quick answers to the most commonly asked questions
              </p>
            </Link>

            <a 
              href="https://status.vidlisync.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <ClockIcon className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Service Status</h3>
              <p className="text-gray-600 text-sm">
                Check if there are any known issues or maintenance activities
              </p>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}