/**
 * API endpoint for fetching call history
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch calls where user is either caller or participant
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select(`
        id,
        caller_id,
        callee_id,
        room_id,
        status,
        started_at,
        ended_at,
        duration,
        quality_rating,
        translation_enabled,
        recording_enabled,
        participants_data,
        created_at,
        updated_at
      `)
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (callsError) {
      console.error('Database error:', callsError);
      return NextResponse.json(
        { error: 'Failed to fetch call history' },
        { status: 500 }
      );
    }

    // Transform the data to include computed fields
    const transformedCalls = calls?.map(call => ({
      ...call,
      participants_data: {
        participant_count: call.participants_data?.participant_count || 0,
        participants: call.participants_data?.participants || [],
        ...call.participants_data,
      },
      recording_url: call.recording_enabled && call.status === 'completed' 
        ? `/api/calls/${call.id}/recording` 
        : null,
    })) || [];

    return NextResponse.json({
      calls: transformedCalls,
      total: calls?.length || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error fetching call history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call history' },
      { status: 500 }
    );
  }
}