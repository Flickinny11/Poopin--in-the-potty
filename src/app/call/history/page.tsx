/**
 * Call History Page - View past calls, recordings, and analytics
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { 
  VideoIcon, 
  ClockIcon,
  UsersIcon,
  DownloadIcon,
  PlayIcon,
  PhoneIcon,
  CalendarIcon,
  FilterIcon,
  SearchIcon,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface CallRecord {
  id: string;
  caller_id: string;
  callee_id?: string;
  room_id: string;
  status: 'completed' | 'missed' | 'cancelled';
  started_at: string;
  ended_at?: string;
  duration?: number;
  quality_rating?: number;
  recording_enabled: boolean;
  recording_url?: string;
  participants_data: {
    participant_count: number;
    participants: Array<{
      user_id: string;
      user_name: string;
      joined_at: string;
      left_at?: string;
    }>;
  };
  created_at: string;
}

export default function CallHistoryPage() {
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'missed' | 'recordings'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchCallHistory();
    }
  }, [user]);

  const fetchCallHistory = async () => {
    try {
      const response = await fetch('/api/calls/history');
      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls || []);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter(call => {
    // Filter by status
    if (filter === 'completed' && call.status !== 'completed') return false;
    if (filter === 'missed' && call.status !== 'missed') return false;
    if (filter === 'recordings' && !call.recording_url) return false;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const participants = call.participants_data.participants || [];
      const participantNames = participants.map(p => p.user_name.toLowerCase()).join(' ');
      
      if (!participantNames.includes(searchLower) && 
          !call.room_id.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your call history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
          <p className="mt-2 text-gray-600">
            View your past video calls, recordings, and call analytics
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search calls by participant name or room ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FilterIcon size={20} className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Calls</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="recordings">With Recordings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Call List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading call history...</p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="p-8 text-center">
              <VideoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filter !== 'all' ? 'No calls found' : 'No calls yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter settings.'
                  : 'Start your first video call to see it appear here.'
                }
              </p>
              {(!searchTerm && filter === 'all') && (
                <a
                  href="/call/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <VideoIcon className="-ml-1 mr-2 h-4 w-4" />
                  Create New Call
                </a>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCalls.map((call) => (
                <div key={call.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Call Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <VideoIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>

                      {/* Call Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            Call Room: {call.room_id}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCallStatusBadge(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            {format(new Date(call.started_at), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="mr-1 h-4 w-4" />
                            {formatDuration(call.duration)}
                          </div>
                          <div className="flex items-center">
                            <UsersIcon className="mr-1 h-4 w-4" />
                            {call.participants_data.participant_count} participants
                          </div>
                        </div>

                        {/* Participants */}
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            {call.participants_data.participants?.slice(0, 3).map((participant, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                                  {participant.user_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="ml-1 text-xs text-gray-600">{participant.user_name}</span>
                              </div>
                            ))}
                            {call.participants_data.participant_count > 3 && (
                              <span className="text-xs text-gray-500">
                                +{call.participants_data.participant_count - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {call.recording_url && (
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <PlayIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Play Recording
                        </button>
                      )}
                      
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <PhoneIcon className="-ml-0.5 mr-2 h-4 w-4" />
                        Call Again
                      </button>
                    </div>
                  </div>

                  {/* Call Quality Rating */}
                  {call.quality_rating && (
                    <div className="mt-3 flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Call Quality:</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${
                              star <= call.quality_rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-600">({call.quality_rating}/5)</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!loading && calls.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <VideoIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{calls.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(calls.reduce((sum, call) => sum + (call.duration || 0), 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PlayIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recordings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calls.filter(call => call.recording_url).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Participants</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {calls.length > 0 
                      ? Math.round(calls.reduce((sum, call) => sum + call.participants_data.participant_count, 0) / calls.length) 
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}