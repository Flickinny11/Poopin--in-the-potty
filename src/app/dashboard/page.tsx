'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VidLiSyncLogo } from '@/components/VidLiSyncLogo'
import { useAuthStore } from '@/stores/authStore'
import { 
  VideoIcon, 
  PlusIcon, 
  UsersIcon, 
  SettingsIcon, 
  LogOutIcon,
  ClockIcon,
  GlobeIcon,
  TrendingUpIcon,
  MenuIcon,
  XIcon,
  CalendarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  PresentationIcon,
  SmartphoneIcon
} from 'lucide-react'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { user, signOut, initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  const stats = [
    {
      name: 'Total Calls',
      value: '0',
      icon: VideoIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Minutes Used',
      value: '0',
      icon: ClockIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Languages',
      value: '50+',
      icon: GlobeIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Growth',
      value: 'New!',
      icon: TrendingUpIcon,
      color: 'bg-orange-500'
    }
  ]

  const quickActions = [
    {
      title: 'VS Friends',
      description: 'Tap phones together for instant multilingual conversations',
      icon: SmartphoneIcon,
      action: () => router.push('/vs-friends'),
      color: 'bg-gradient-to-r from-blue-500 to-purple-600'
    },
    {
      title: 'VS Presenter',
      description: 'Start a multi-language presentation with real-time translation',
      icon: PresentationIcon,
      action: () => router.push('/presenter'),
      color: 'bg-purple-600'
    },
    {
      title: 'Start Video Call',
      description: 'Begin an instant HD video call with professional quality',
      icon: VideoIcon,
      action: () => router.push('/call/new'),
      color: 'bg-blue-500'
    },
    {
      title: 'Join Call',
      description: 'Enter a call ID to join an existing conversation',
      icon: UsersIcon,
      action: () => router.push('/call'),
      color: 'bg-green-500'
    },
    {
      title: 'Schedule Call',
      description: 'Plan a video call and send calendar invitations',
      icon: CalendarIcon,
      action: () => router.push('/call/schedule'),
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <VidLiSyncLogo size={32} />
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon size={24} />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-6 mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.user_metadata?.full_name 
                  ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                  : user.email?.charAt(0).toUpperCase()
                }
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 px-3">
            <a href="/dashboard" className="bg-blue-50 text-blue-700 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <VideoIcon className="mr-3 h-5 w-5" />
              Dashboard
            </a>
            <a href="/vs-friends" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <SmartphoneIcon className="mr-3 h-5 w-5" />
              VS Friends
            </a>
            <a href="/presenter" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <PresentationIcon className="mr-3 h-5 w-5" />
              VS Presenter
            </a>
            <a href="/call/history" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <ClockIcon className="mr-3 h-5 w-5" />
              Call History
            </a>
            <a href="/call/schedule" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <CalendarIcon className="mr-3 h-5 w-5" />
              Schedule Call
            </a>
            <a href="/dashboard/billing" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <CreditCardIcon className="mr-3 h-5 w-5" />
              Billing
            </a>
            <a href="/dashboard/privacy" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <ShieldCheckIcon className="mr-3 h-5 w-5" />
              Privacy
            </a>
            <a href="#" className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg">
              <SettingsIcon className="mr-3 h-5 w-5" />
              Settings
            </a>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <button
              onClick={handleSignOut}
              className="w-full text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg"
            >
              <LogOutIcon className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <div className="hidden sm:block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Free Plan
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <div key={index} className="card hover:shadow-lg cursor-pointer" onClick={action.action}>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Complete your profile</h3>
                  <p className="text-sm text-gray-600">Add your information and preferences to get the best experience.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-bold">2</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Train your voice (Coming Soon)</h3>
                  <p className="text-sm text-gray-600">Upload voice samples to improve translation quality.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Start your first call</h3>
                  <p className="text-sm text-gray-600">Create an HD video call and experience professional-quality video calling.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}