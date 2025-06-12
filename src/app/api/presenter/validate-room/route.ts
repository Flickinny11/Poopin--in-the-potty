/**
 * VS Presenter API - Validate presentation room
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Presentation code is required' },
        { status: 400 }
      );
    }

    // Get presentation room
    const { data: room, error } = await supabase
      .from('presentation_rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: 'Invalid or inactive presentation code' },
        { status: 404 }
      );
    }

    // Check if room is at capacity
    const { count: participantCount } = await supabase
      .from('presentation_participants')
      .select('*', { count: 'exact', head: true })
      .eq('presentation_room_id', room.id)
      .is('left_at', null);

    if (participantCount && participantCount >= room.max_participants) {
      return NextResponse.json(
        { error: 'Presentation is at maximum capacity' },
        { status: 403 }
      );
    }

    // Return room info (excluding sensitive data)
    return NextResponse.json({
      id: room.id,
      code: room.code,
      mode: room.mode,
      presenterLanguage: room.presenter_language,
      audienceLanguages: room.audience_languages,
      languageLock: room.language_lock,
      maxParticipants: room.max_participants,
      currentParticipants: participantCount || 0,
      isActive: room.is_active,
      createdAt: room.created_at
    });

  } catch (error) {
    console.error('Error validating presentation room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}