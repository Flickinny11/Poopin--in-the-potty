/**
 * API endpoint for scheduling video calls
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { dailyService } from '@/lib/daily';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      scheduledTime,
      timezone,
      duration,
      maxParticipants = 10,
      enableRecording = false,
      enableChat = true,
      sendReminders = true,
      participants = [],
    } = body;

    // Create Daily.co room
    const room = await dailyService.createRoom({
      name: title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || undefined,
      privacy: 'private',
      max_participants: maxParticipants,
      enable_recording: enableRecording,
      enable_chat: enableChat,
    });

    // Save scheduled call to database
    const { data: call, error: dbError } = await supabase
      .from('calls')
      .insert({
        caller_id: user.id,
        room_id: room.name,
        status: 'scheduled',
        scheduled_at: new Date(scheduledTime).toISOString(),
        participants_data: {
          title,
          description,
          timezone,
          duration,
          participants: participants.map((email: string) => ({ email })),
          room_config: {
            max_participants: maxParticipants,
            enable_recording: enableRecording,
            enable_chat: enableChat,
          }
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Still return success since Daily.co room was created
    }

    // Generate calendar link
    const startTime = new Date(scheduledTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', title || 'VidLiSync Video Call');
    calendarUrl.searchParams.set('dates', `${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    calendarUrl.searchParams.set('details', `${description || ''}\n\nJoin the video call: ${room.url}`);
    calendarUrl.searchParams.set('location', 'VidLiSync Video Call');

    // TODO: Send email invitations to participants
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    if (sendReminders && participants.length > 0) {
      // Email sending logic would go here
      console.log('Would send invitations to:', participants);
    }

    return NextResponse.json({
      id: call?.id,
      name: room.name,
      url: room.url,
      roomId: room.name,
      scheduledTime,
      calendarLink: calendarUrl.toString(),
      created_at: room.created_at,
      config: room.config,
    });

  } catch (error) {
    console.error('Error scheduling call:', error);
    return NextResponse.json(
      { error: 'Failed to schedule call' },
      { status: 500 }
    );
  }
}