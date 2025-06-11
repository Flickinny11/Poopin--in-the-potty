/**
 * Call Scheduling Page - Schedule video calls for future dates
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MailIcon,
  VideoIcon,
  CheckIcon,
  CopyIcon,
  ShareIcon,
  SettingsIcon,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ScheduleCallSettings {
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  duration: number; // in minutes
  maxParticipants: number;
  enableRecording: boolean;
  enableChat: boolean;
  sendReminders: boolean;
  participants: string[]; // email addresses
}

export default function ScheduleCallPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledCall, setScheduledCall] = useState<{ url: string; id: string; calendarLink: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<ScheduleCallSettings>({
    title: '',
    description: '',
    scheduledDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    scheduledTime: '14:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    duration: 60,
    maxParticipants: 10,
    enableRecording: false,
    enableChat: true,
    sendReminders: true,
    participants: [],
  });

  const [newParticipant, setNewParticipant] = useState('');

  const handleAddParticipant = () => {
    const email = newParticipant.trim();
    if (email && !settings.participants.includes(email)) {
      setSettings({
        ...settings,
        participants: [...settings.participants, email],
      });
      setNewParticipant('');
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setSettings({
      ...settings,
      participants: settings.participants.filter(p => p !== email),
    });
  };

  const handleScheduleCall = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsScheduling(true);
    
    try {
      const scheduledDateTime = new Date(`${settings.scheduledDate}T${settings.scheduledTime}`);
      
      const response = await fetch('/api/calls/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: settings.title || `${user.user_metadata?.full_name || user.email}'s Scheduled Call`,
          description: settings.description,
          scheduledTime: scheduledDateTime.toISOString(),
          timezone: settings.timezone,
          duration: settings.duration,
          maxParticipants: settings.maxParticipants,
          enableRecording: settings.enableRecording,
          enableChat: settings.enableChat,
          sendReminders: settings.sendReminders,
          participants: settings.participants,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule call');
      }

      const data = await response.json();
      setScheduledCall({ 
        url: data.url, 
        id: data.name,
        calendarLink: data.calendarLink,
      });
      
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert('Failed to schedule call. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCopyLink = async () => {
    if (scheduledCall) {
      await navigator.clipboard.writeText(scheduledCall.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateCalendarLink = () => {
    const startTime = new Date(`${settings.scheduledDate}T${settings.scheduledTime}`);
    const endTime = new Date(startTime.getTime() + settings.duration * 60000);
    
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', settings.title || 'VidLiSync Video Call');
    calendarUrl.searchParams.set('dates', `${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    calendarUrl.searchParams.set('details', `${settings.description}\n\nJoin the video call: ${scheduledCall?.url || 'Call link will be provided'}`);
    calendarUrl.searchParams.set('location', 'VidLiSync Video Call');
    
    return calendarUrl.toString();
  };

  // Show success state after scheduling
  if (scheduledCall) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Call Scheduled!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your video call has been scheduled and invitations sent
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={scheduledCall.url}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    title="Copy link"
                  >
                    {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Time
                </label>
                <p className="text-sm text-gray-900">
                  {format(new Date(`${settings.scheduledDate}T${settings.scheduledTime}`), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                </p>
                <p className="text-xs text-gray-500">{settings.timezone}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={generateCalendarLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CalendarIcon className="-ml-1 mr-3 h-5 w-5" />
              Add to Google Calendar
            </a>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={() => {
                  navigator.share({
                    title: settings.title || 'Join my scheduled video call',
                    text: `Join me for a video call on ${format(new Date(`${settings.scheduledDate}T${settings.scheduledTime}`), 'EEEE, MMMM d \'at\' h:mm a')}`,
                    url: scheduledCall.url,
                  });
                }}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ShareIcon className="-ml-1 mr-3 h-5 w-5" />
                Share Call
              </button>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show scheduling form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Schedule Video Call
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Plan your video call and send calendar invitations to participants
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Call Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Call Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={settings.title}
                    onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter a title for your call"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add agenda, notes, or other details about the call"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                When
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={settings.scheduledDate}
                    onChange={(e) => setSettings({ ...settings, scheduledDate: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Time *
                  </label>
                  <input
                    type="time"
                    id="time"
                    required
                    value={settings.scheduledTime}
                    onChange={(e) => setSettings({ ...settings, scheduledTime: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                    Duration (minutes)
                  </label>
                  <select
                    id="duration"
                    value={settings.duration}
                    onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Timezone: {settings.timezone}
                </p>
              </div>
            </div>

            {/* Participants */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Participants
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter participant email address"
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                </div>

                {settings.participants.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Invited Participants ({settings.participants.length})
                    </h4>
                    <div className="space-y-1">
                      {settings.participants.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                          <div className="flex items-center">
                            <MailIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{email}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveParticipant(email)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Call Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                    Maximum Participants
                  </label>
                  <select
                    id="maxParticipants"
                    value={settings.maxParticipants}
                    onChange={(e) => setSettings({ ...settings, maxParticipants: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={2}>2 participants</option>
                    <option value={5}>5 participants</option>
                    <option value={10}>10 participants</option>
                    <option value={25}>25 participants</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.enableChat}
                      onChange={(e) => setSettings({ ...settings, enableChat: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Enable chat during call</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.enableRecording}
                      onChange={(e) => setSettings({ ...settings, enableRecording: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Allow call recording</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.sendReminders}
                      onChange={(e) => setSettings({ ...settings, sendReminders: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Send email reminders to participants</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleScheduleCall}
              disabled={isScheduling || !settings.title.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScheduling ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Scheduling Call...
                </>
              ) : (
                <>
                  <CalendarIcon className="-ml-1 mr-3 h-5 w-5" />
                  Schedule Call
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}