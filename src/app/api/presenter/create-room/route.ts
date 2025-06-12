/**
 * VS Presenter API - Create presentation room
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const body = await request.json();
    
    // Validate presenter config
    const { 
      mode, 
      presenterLanguage, 
      audienceLanguages, 
      voiceMode, 
      languageLock, 
      maxParticipants, 
      recordingEnabled 
    } = body;

    // Generate unique room code
    const roomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Create presentation room
    const { data, error } = await supabase
      .from('presentation_rooms')
      .insert({
        code: roomCode,
        mode,
        presenter_language: presenterLanguage,
        audience_languages: audienceLanguages,
        voice_mode: voiceMode,
        language_lock: languageLock,
        max_participants: maxParticipants,
        recording_enabled: recordingEnabled,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating presentation room:', error);
      return NextResponse.json(
        { error: 'Failed to create presentation room' },
        { status: 500 }
      );
    }

    // Generate join link
    const joinLink = `${process.env.NEXT_PUBLIC_SITE_URL}/presentation/join?code=${roomCode}`;
    
    // Generate QR code URL (placeholder)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinLink)}`;

    return NextResponse.json({
      id: data.id,
      code: roomCode,
      joinLink,
      qrCode: qrCodeUrl,
      token: null // TODO: Generate Daily.co room token if needed
    });

  } catch (error) {
    console.error('Error in presenter API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}