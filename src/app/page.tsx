'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VidLiSyncLogo } from '@/components/VidLiSyncLogo'
import { useAuthStore } from '@/stores/authStore'
import { 
  VideoIcon, 
  MicIcon, 
  GlobeIcon, 
  UserIcon,
  CheckIcon,
  MenuIcon,
  XIcon,
  PlayIcon,
  StarIcon,
  ArrowRightIcon
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const features = [
    {
      icon: VideoIcon,
      title: 'Real-Time Video Chat',
      description: 'Crystal clear HD video calls with ultra-low latency for seamless conversations.'
    },
    {
      icon: GlobeIcon,
      title: 'AI Language Translation',
      description: 'Instant translation between 50+ languages powered by advanced AI technology.'
    },
    {
      icon: MicIcon,
      title: 'Voice Cloning Technology',
      description: 'Preserve your unique voice characteristics while speaking any language.'
    },
    {
      icon: UserIcon,
      title: 'Lip Synchronization',
      description: 'Natural lip movements synchronized with translated speech for authentic conversations.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Business Executive',
      content: 'VidLiSync transformed our international meetings. Speaking Mandarin in my own voice during English calls is incredible!',
      rating: 5,
      avatar: '/avatars/sarah.jpg'
    },
    {
      name: 'Miguel Rodriguez',
      role: 'Software Engineer',
      content: 'The voice cloning is so natural, my colleagues thought I was fluent in Japanese. Game-changing technology!',
      rating: 5,
      avatar: '/avatars/miguel.jpg'
    },
    {
      name: 'Priya Patel',
      role: 'Marketing Director',
      content: 'Finally, I can present to our German clients in their language while sounding like myself. Revolutionary!',
      rating: 5,
      avatar: '/avatars/priya.jpg'
    }
  ]

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['5 minutes/month', '1-on-1 calls only', '5 languages', 'Basic quality'],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Basic',
      price: '$4.99',
      period: 'per month',
      features: ['60 minutes/month', '15 languages', 'HD quality', 'Email support'],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: 'per month',
      features: ['300 minutes/month', 'All 50+ languages', 'Group calls', 'Priority support'],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Business',
      price: '$49.99',
      period: 'per month',
      features: ['Unlimited minutes', 'Team features', 'Advanced analytics', 'Dedicated support'],
      cta: 'Contact Sales',
      popular: false
    }
  ]

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <VidLiSyncLogo size={32} />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              {user ? (
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <Link href="#features" className="block text-gray-600 hover:text-gray-900">
                Features
              </Link>
              <Link href="#pricing" className="block text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="#about" className="block text-gray-600 hover:text-gray-900">
                About
              </Link>
              {user ? (
                <Link href="/dashboard" className="block btn-primary text-center">
                  Dashboard
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/login" className="block text-center text-gray-600">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="block btn-primary text-center">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        {/* Floating language symbols */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 text-6xl opacity-10 animate-pulse">中</div>
          <div className="absolute top-32 right-16 text-4xl opacity-10 animate-pulse delay-1000">العربية</div>
          <div className="absolute bottom-32 left-20 text-5xl opacity-10 animate-pulse delay-500">한</div>
          <div className="absolute bottom-20 right-32 text-3xl opacity-10 animate-pulse delay-1500">हिन्दी</div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Speak Any Language,{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Sound Like You
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Break language barriers with AI-powered video chat. Real-time translation that preserves your voice, 
            synchronized lip movements, and crystal-clear communication in 50+ languages.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-4">
                Go to Dashboard
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4">
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <button className="btn-secondary text-lg px-8 py-4 flex items-center">
                  <PlayIcon className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </>
            )}
          </div>

          {/* Demo Video Placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl">
              <div className="aspect-video bg-gray-700 rounded-xl flex items-center justify-center">
                <div className="text-center text-white">
                  <PlayIcon size={64} className="mx-auto mb-4 opacity-80" />
                  <p className="text-lg">Live Demo: Real-time Translation</p>
                  <p className="text-sm opacity-70">See VidLiSync in action</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Communication Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of multilingual communication with cutting-edge AI that preserves 
              your identity while breaking down language barriers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
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

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how VidLiSync is transforming global communication
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free and scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`card relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={user ? "/dashboard" : "/auth/signup"}
                  className={`block text-center w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg' 
                      : 'border-2 border-gray-200 text-gray-700 hover:border-blue-500'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <VidLiSyncLogo variant="full" className="text-white mb-4" />
              <p className="text-gray-400 mb-4">
                Breaking language barriers with AI-powered communication technology.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VidLiSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}