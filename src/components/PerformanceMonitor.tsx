/**
 * Performance Monitoring Component
 * Displays real-time translation and call quality metrics
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  ActivityIcon, 
  WifiIcon, 
  ZapIcon, 
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BarChart3Icon,
  XIcon,
} from 'lucide-react';
import { useTranslationStore } from '@/stores/translationStore';
import { useCallStore } from '@/stores/callStore';

interface PerformanceMetrics {
  translation: {
    averageLatency: number;
    quality: string;
    successRate: number;
    totalTranslations: number;
  };
  call: {
    networkQuality: string;
    audioQuality: number;
    videoQuality: number;
    packetLoss: number;
  };
  system: {
    cpuUsage?: number;
    memoryUsage?: number;
    bandwidthUsage: number;
  };
}

interface PerformanceMonitorProps {
  className?: string;
  compact?: boolean;
  onClose?: () => void;
}

export default function PerformanceMonitor({ 
  className = '', 
  compact = false, 
  onClose 
}: PerformanceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  const {
    averageLatency,
    translationQuality,
    connectionQuality,
    performanceStats,
    isTranslationActive,
  } = useTranslationStore();
  
  const {
    qualityStats,
    networkQuality,
    isInCall,
  } = useCallStore();

  // Update metrics every second
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        translation: {
          averageLatency,
          quality: translationQuality,
          successRate: performanceStats.totalTranslations > 0 
            ? (performanceStats.successfulTranslations / performanceStats.totalTranslations) * 100 
            : 0,
          totalTranslations: performanceStats.totalTranslations,
        },
        call: {
          networkQuality,
          audioQuality: qualityStats?.audioSendBitsPerSecond || 0,
          videoQuality: qualityStats?.videoSendBitsPerSecond || 0,
          packetLoss: qualityStats ? 
            (qualityStats.audioRecvPacketLoss + qualityStats.videoRecvPacketLoss) / 2 : 0,
        },
        system: {
          bandwidthUsage: qualityStats ? 
            (qualityStats.audioSendBitsPerSecond + qualityStats.videoSendBitsPerSecond) / 1000 : 0,
        },
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [
    averageLatency, 
    translationQuality, 
    performanceStats, 
    qualityStats, 
    networkQuality
  ]);

  const getQualityColor = (quality: string | number, type: 'quality' | 'latency' | 'percentage' = 'quality') => {
    if (type === 'latency') {
      const latency = quality as number;
      if (latency < 300) return 'text-green-500';
      if (latency < 500) return 'text-yellow-500';
      return 'text-red-500';
    }
    
    if (type === 'percentage') {
      const pct = quality as number;
      if (pct >= 90) return 'text-green-500';
      if (pct >= 70) return 'text-yellow-500';
      return 'text-red-500';
    }
    
    // Quality string
    switch (quality) {
      case 'excellent':
      case 'good':
      case 'stable':
        return 'text-green-500';
      case 'fair':
      case 'warning':
      case 'unstable':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
      case 'good':
      case 'stable':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'fair':
      case 'warning':
      case 'unstable':
        return <AlertTriangleIcon className="w-4 h-4" />;
      case 'poor':
        return <AlertTriangleIcon className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Translation Status */}
        {isTranslationActive && (
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getQualityColor(translationQuality)}`} />
            <span className="text-xs text-gray-400">{averageLatency}ms</span>
          </div>
        )}
        
        {/* Call Status */}
        {isInCall && (
          <div className="flex items-center space-x-1">
            <WifiIcon className={`w-3 h-3 ${getQualityColor(networkQuality)}`} />
            <span className="text-xs text-gray-400">
              {metrics?.call.packetLoss ? `${(metrics.call.packetLoss * 100).toFixed(1)}%` : 'N/A'}
            </span>
          </div>
        )}
        
        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Show Performance Details"
        >
          <BarChart3Icon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!isExpanded) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ActivityIcon className="w-5 h-5 mr-2 text-blue-500" />
          Performance Monitor
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Translation Metrics */}
          {isTranslationActive && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <ZapIcon className="w-4 h-4 mr-2" />
                Translation Performance
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Latency</span>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className={`w-3 h-3 ${getQualityColor(metrics.translation.averageLatency, 'latency')}`} />
                    <span className={`text-sm font-medium ${getQualityColor(metrics.translation.averageLatency, 'latency')}`}>
                      {metrics.translation.averageLatency}ms
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality</span>
                  <div className="flex items-center space-x-1">
                    {getQualityIcon(metrics.translation.quality)}
                    <span className={`text-sm font-medium capitalize ${getQualityColor(metrics.translation.quality)}`}>
                      {metrics.translation.quality}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className={`text-sm font-medium ${getQualityColor(metrics.translation.successRate, 'percentage')}`}>
                    {metrics.translation.successRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Translations</span>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics.translation.totalTranslations}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Call Quality Metrics */}
          {isInCall && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <WifiIcon className="w-4 h-4 mr-2" />
                Call Quality
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network</span>
                  <div className="flex items-center space-x-1">
                    {getQualityIcon(metrics.call.networkQuality)}
                    <span className={`text-sm font-medium capitalize ${getQualityColor(metrics.call.networkQuality)}`}>
                      {metrics.call.networkQuality}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Packet Loss</span>
                  <span className={`text-sm font-medium ${getQualityColor(metrics.call.packetLoss * 100, 'percentage')}`}>
                    {(metrics.call.packetLoss * 100).toFixed(2)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Audio Quality</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(metrics.call.audioQuality / 1000).toFixed(1)} kbps
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Video Quality</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(metrics.call.videoQuality / 1000).toFixed(1)} kbps
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* System Resources */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="font-medium text-gray-900 flex items-center">
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              System Resources
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bandwidth Usage</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.system.bandwidthUsage.toFixed(1)} kbps
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection</span>
                <span className={`text-sm font-medium capitalize ${getQualityColor(connectionQuality)}`}>
                  {connectionQuality}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      <div className="mt-4 space-y-2">
        {!isInCall && !isTranslationActive && (
          <div className="text-center py-4 text-gray-500">
            <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a call or translation to see performance metrics</p>
          </div>
        )}
        
        {metrics && metrics.translation.averageLatency > 500 && (
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangleIcon className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              High translation latency detected. Check your internet connection.
            </span>
          </div>
        )}
        
        {metrics && metrics.call.packetLoss > 0.05 && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangleIcon className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">
              High packet loss detected. Audio/video quality may be affected.
            </span>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {metrics && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Optimization Tips</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            {metrics.translation.averageLatency > 300 && (
              <li>• Use a wired internet connection for better translation performance</li>
            )}
            {metrics.call.packetLoss > 0.02 && (
              <li>• Close other applications using bandwidth</li>
            )}
            {metrics.translation.successRate < 90 && (
              <li>• Ensure clear audio input for better translation accuracy</li>
            )}
            <li>• Use headphones to prevent audio feedback</li>
          </ul>
        </div>
      )}
    </div>
  );
}