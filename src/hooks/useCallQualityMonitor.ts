/**
 * Call Quality Monitoring Hook
 */
import { useEffect, useRef } from 'react';
import { useCallStore } from '@/stores/callStore';

export function useCallQualityMonitor() {
  const { callObject, updateQualityStats, isInCall } = useCallStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInCall && callObject) {
      // Monitor call quality every 5 seconds
      intervalRef.current = setInterval(async () => {
        try {
          const stats = await callObject.getNetworkStats();
          
          if (stats && stats.stats && stats.stats.latest) {
            const latest = stats.stats.latest;
            
            updateQualityStats({
              videoRecvPacketLoss: latest.videoRecvPacketLoss || 0,
              videoSendPacketLoss: latest.videoSendPacketLoss || 0,
              audioRecvPacketLoss: latest.audioRecvPacketLoss || 0,
              audioSendPacketLoss: latest.audioSendPacketLoss || 0,
              videoRecvBitsPerSecond: latest.videoRecvBitsPerSecond || 0,
              videoSendBitsPerSecond: latest.videoSendBitsPerSecond || 0,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.warn('Error getting network stats:', error);
        }
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isInCall, callObject, updateQualityStats]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}