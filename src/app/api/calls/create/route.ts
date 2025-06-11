/**
 * API endpoint for creating Daily.co rooms
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
      name,
      maxParticipants = 10,
      enableRecording = false,
      enableChat = true,
      startAudioOff = false,
      startVideoOff = false,
      scheduledTime,
    } = body;

    // Create Daily.co room
    const room = await dailyService.createRoom({
      name: name || undefined,
      privacy: 'private',
      max_participants: maxParticipants,
      enable_recording: enableRecording,
      enable_chat: enableChat,
      start_audio_off: startAudioOff,
      start_video_off: startVideoOff,
    });

    // Save call to database
    const { data: call, error: dbError } = await supabase
      .from('calls')
      .insert({
        caller_id: user.id,
        room_id: room.name,
        status: scheduledTime ? 'scheduled' : 'active',
        started_at: scheduledTime ? null : new Date().toISOString(),
        participants_data: {
          room_config: {
            max_participants: maxParticipants,
            enable_recording: enableRecording,
            enable_chat: enableChat,
            start_audio_off: startAudioOff,
            start_video_off: startVideoOff,
          }
        },
        scheduled_at: scheduledTime ? new Date(scheduledTime).toISOString() : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Still return success since Daily.co room was created
    }

    return NextResponse.json({
      id: call?.id,
      name: room.name,
      url: room.url,
      roomId: room.name,
      created_at: room.created_at,
      config: room.config,
    });

  } catch (error) {
    console.error('Error creating call:', error);
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    );
  }
}