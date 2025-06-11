/**
 * Daily.co WebRTC service utilities
 */

export interface DailyRoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  max_participants?: number;
  enable_recording?: boolean;
  enable_chat?: boolean;
  start_audio_off?: boolean;
  start_video_off?: boolean;
  exp?: number; // expiration timestamp
}

export interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    max_participants: number;
    enable_recording: boolean;
    enable_chat: boolean;
  };
}

export interface CallQualityStats {
  videoRecvPacketLoss: number;
  videoSendPacketLoss: number;
  audioRecvPacketLoss: number;
  audioSendPacketLoss: number;
  videoRecvBitsPerSecond: number;
  videoSendBitsPerSecond: number;
  timestamp: number;
}

class DailyService {
  private apiKey: string;
  private domain: string;
  private baseUrl = 'https://api.daily.co/v1';

  constructor() {
    this.apiKey = process.env.DAILY_API_KEY || '';
    this.domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN || '';
  }

  /**
   * Create a new Daily.co room
   */
  async createRoom(config: DailyRoomConfig = {}): Promise<DailyRoom> {
    const roomConfig = {
      privacy: 'private',
      max_participants: 10,
      enable_recording: false,
      enable_chat: true,
      start_audio_off: false,
      start_video_off: false,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      ...config,
    };

    const response = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(roomConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create room: ${error}`);
    }

    return response.json();
  }

  /**
   * Get room details
   */
  async getRoom(roomName: string): Promise<DailyRoom> {
    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get room: ${error}`);
    }

    return response.json();
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete room: ${error}`);
    }
  }

  /**
   * Generate room URL for client
   */
  getRoomUrl(roomName: string): string {
    return `https://${this.domain}.daily.co/${roomName}`;
  }

  /**
   * Create a meeting token for authenticated access
   */
  async createMeetingToken(roomName: string, userId: string, userName: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: userId,
          user_name: userName,
          is_owner: false,
          start_audio_off: false,
          start_video_off: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create meeting token: ${error}`);
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Get recording info for a room
   */
  async getRecordings(roomName: string) {
    const response = await fetch(`${this.baseUrl}/recordings?room_name=${roomName}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get recordings: ${error}`);
    }

    return response.json();
  }

  /**
   * Start recording for a room
   */
  async startRecording(roomName: string) {
    const response = await fetch(`${this.baseUrl}/recordings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        room_name: roomName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start recording: ${error}`);
    }

    return response.json();
  }

  /**
   * Stop recording for a room
   */
  async stopRecording(recordingId: string) {
    const response = await fetch(`${this.baseUrl}/recordings/${recordingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        status: 'finished',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to stop recording: ${error}`);
    }

    return response.json();
  }
}

export const dailyService = new DailyService();