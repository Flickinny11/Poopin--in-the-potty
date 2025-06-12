'use client'

import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  Trash2,
  RefreshCw,
  HardDrive,
  Wifi,
  WifiOff,
  Play,
  Pause,
  X,
  Settings,
  Info
} from 'lucide-react';
import { useModelManagerStore, ModelInfo } from '@/stores/modelManagerStore';

interface ModelManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelManager({ isOpen, onClose }: ModelManagerProps) {
  const {
    availableModels,
    modelStatus,
    isDownloading,
    currentDownload,
    autoDownloadRequired,
    verifyOnStartup,
    maxCacheSize,
    downloadModel,
    downloadAllRequired,
    downloadAll,
    cancelDownload,
    verifyModel,
    deleteModel,
    getTotalDownloadSize,
    getRequiredDownloadSize,
    getDownloadedSize,
    isModelAvailable,
    areRequiredModelsReady,
    setAutoDownloadRequired,
    setVerifyOnStartup,
    setMaxCacheSize,
  } = useModelManagerStore();

  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'required' | 'downloaded' | 'missing'>('all');

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get status display for a model
  const getModelStatusDisplay = (model: ModelInfo) => {
    const status = modelStatus[model.id];
    
    if (!status) {
      return { text: 'Unknown', color: 'text-gray-500', icon: AlertCircle };
    }
    
    if (status.downloading) {
      return { 
        text: `Downloading ${status.progress}%`, 
        color: 'text-blue-600', 
        icon: Loader,
        progress: status.progress 
      };
    }
    
    if (status.error) {
      return { text: 'Error', color: 'text-red-600', icon: AlertCircle };
    }
    
    if (status.downloaded && status.verified) {
      return { text: 'Ready', color: 'text-green-600', icon: CheckCircle };
    }
    
    if (status.downloaded && !status.verified) {
      return { text: 'Needs Verification', color: 'text-yellow-600', icon: AlertCircle };
    }
    
    return { text: 'Not Downloaded', color: 'text-gray-500', icon: Download };
  };

  // Filter models based on current filter
  const filteredModels = availableModels.filter(model => {
    switch (filter) {
      case 'required':
        return model.required;
      case 'downloaded':
        return isModelAvailable(model.id);
      case 'missing':
        return !isModelAvailable(model.id);
      default:
        return true;
    }
  });

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'translation': return '🌐';
      case 'voice': return '🎤';
      case 'speech': return '🗣️';
      case 'vision': return '👁️';
      default: return '🤖';
    }
  };

  // Handle download action
  const handleDownload = async (modelId: string) => {
    try {
      await downloadModel(modelId);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle verify action
  const handleVerify = async (modelId: string) => {
    try {
      await verifyModel(modelId);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Model Manager
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Download and manage AI models for offline translation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(getDownloadedSize())}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Downloaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatBytes(getRequiredDownloadSize())}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {formatBytes(getTotalDownloadSize())}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Available</div>
            </div>
          </div>

          {/* Overall Status */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            {areRequiredModelsReady() ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">All required models ready</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Some required models missing</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Auto-download Required Models
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically download required models on startup
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDownloadRequired}
                    onChange={(e) => setAutoDownloadRequired(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Verify on Startup
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Check model integrity when app starts
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifyOnStartup}
                    onChange={(e) => setVerifyOnStartup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Models' },
                { key: 'required', label: 'Required' },
                { key: 'downloaded', label: 'Downloaded' },
                { key: 'missing', label: 'Missing' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadAllRequired}
                disabled={isDownloading || areRequiredModelsReady()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Required</span>
              </button>
              
              <button
                onClick={downloadAll}
                disabled={isDownloading}
                className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Models List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredModels.map(model => {
              const statusDisplay = getModelStatusDisplay(model);
              const status = modelStatus[model.id];
              const StatusIcon = statusDisplay.icon;

              return (
                <div
                  key={model.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(model.category)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {model.name}
                            {model.required && (
                              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full">
                                Required
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {model.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Size: {formatBytes(model.size)}</span>
                        <span>Version: {model.version}</span>
                        <span>Category: {model.category}</span>
                      </div>

                      {/* Progress Bar for Downloading */}
                      {status?.downloading && statusDisplay.progress !== undefined && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${statusDisplay.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {status?.error && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                          {status.error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Status Display */}
                      <div className={`flex items-center space-x-2 ${statusDisplay.color}`}>
                        {status?.downloading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <StatusIcon className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{statusDisplay.text}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 ml-4">
                        {status?.downloading ? (
                          <button
                            onClick={() => cancelDownload(model.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Cancel Download"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : !isModelAvailable(model.id) ? (
                          <button
                            onClick={() => handleDownload(model.id)}
                            disabled={isDownloading}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Download Model"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVerify(model.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Verify Model"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteModel(model.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete Model"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No models found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try changing the filter to see different models
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <HardDrive className="w-4 h-4" />
                <span>Storage: {formatBytes(getDownloadedSize())} / {formatBytes(maxCacheSize * 1024 * 1024)}</span>
              </div>
              <div className="flex items-center space-x-1">
                {navigator.onLine ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-xs">
              VidLiSync AI Model Manager v1.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}