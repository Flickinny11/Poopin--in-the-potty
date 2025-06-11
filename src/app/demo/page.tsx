/**
 * Demo Page
 * Try-before-signup functionality showcasing translation features
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import DemoMode from '@/components/DemoMode';
import { TutorialMenu } from '@/components/TutorialModal';
import { 
  PlayIcon, 
  LanguagesIcon, 
  MicIcon,
  VideoIcon,
  ArrowRightIcon,
  StarIcon,
  CheckIcon,
} from 'lucide-react';

export default function DemoPage() {
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    {
      icon: <LanguagesIcon className="w-6 h-6" />,
      title: 'Real-time Translation',
      description: 'Instant translation between 50+ languages with 95%+ accuracy',
    },
    {
      icon: <MicIcon className="w-6 h-6" />,
      title: 'Voice Cloning',
      description: 'Preserve your unique voice while speaking any language',
    },
    {
      icon: <VideoIcon className="w-6 h-6" />,
      title: 'Lip Synchronization',
      description: 'Natural mouth movements synchronized with translated speech',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'International Business Manager',
      rating: 5,
      comment: 'VidLiSync transformed our global meetings. Natural conversations across languages!',
    },
    {
      name: 'Carlos Rodriguez',
      role: 'Remote Team Lead',
      rating: 5,
      comment: 'The voice cloning is incredible - it really sounds like me speaking Spanish!',
    },
    {
      name: 'Marie Dubois',
      role: 'Language Teacher',
      rating: 5,
      comment: 'My students love practicing with VidLiSync. The lip sync makes it so natural.',
    },
  ];

  if (showDemo) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <DemoMode onClose={() => setShowDemo(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            VidLiSync
          </Link>
          <div className="flex items-center space-x-4">
            <TutorialMenu />
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Experience Real-time Translation
            <span className="block text-blue-600">Before You Sign Up</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            See how VidLiSync breaks language barriers with AI-powered video calls. 
            Try our interactive demo with pre-recorded conversations to experience 
            the magic of real-time translation.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowDemo(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 flex items-center"
            >
              <PlayIcon className="w-6 h-6 mr-2" />
              Try Interactive Demo
            </button>
            <Link
              href="/auth/signup"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 flex items-center"
            >
              Start Free Trial
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            No account required for demo • Full features available in trial
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What You&apos;ll Experience in the Demo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              See It in Action
            </h2>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setShowDemo(true)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center transition-all duration-200"
                  >
                    <PlayIcon className="w-10 h-10 text-white ml-1" />
                  </button>
                </div>
                
                {/* Mock participants */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1">
                      S
                    </div>
                    <p className="text-white text-sm">Sarah (English)</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1">
                      C
                    </div>
                    <p className="text-white text-sm">Carlos (Spanish)</p>
                  </div>
                </div>
                
                {/* Mock translation overlay */}
                <div className="absolute bottom-16 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-3">
                  <p className="text-white text-sm mb-1">
                    🇺🇸 &quot;Good morning Carlos! Thank you for joining our meeting today.&quot;
                  </p>
                  <p className="text-blue-300 font-medium text-sm">
                    🇪🇸 &quot;¡Buenos días Carlos! Gracias por unirte a nuestra reunión hoy.&quot;
                  </p>
                </div>
              </div>
              
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Business Meeting Demo
                </h3>
                <p className="text-gray-600 mb-4">
                  Watch Sarah and Carlos have a natural business conversation 
                  with real-time translation between English and Spanish.
                </p>
                <button
                  onClick={() => setShowDemo(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Start Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Our Users Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  &quot;{testimonial.comment}&quot;
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Break Language Barriers?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already having natural conversations 
            across languages with VidLiSync.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/auth/signup"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Start Free Trial
            </Link>
            <button
              onClick={() => setShowDemo(true)}
              className="border border-white hover:bg-white hover:text-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
            >
              Try Demo Again
            </button>
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-6 text-blue-100">
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 mr-2" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 VidLiSync. All rights reserved.</p>
          <div className="mt-4 flex items-center justify-center space-x-6">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">
              Terms of Service
            </Link>
            <Link href="/support" className="text-gray-400 hover:text-white transition-colors duration-200">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}