/**
 * Translation Error Boundary Component
 * Handles errors in translation components with graceful fallbacks
 */
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshCwIcon, VolumeXIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMode?: 'original-audio' | 'video-only' | 'minimal';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  fallbackMode: 'original-audio' | 'video-only' | 'minimal';
  retryCount: number;
}

export class TranslationErrorBoundary extends Component<Props, State> {
  private errorReportTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      fallbackMode: props.fallbackMode || 'original-audio',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine fallback mode based on error type
    let fallbackMode: 'original-audio' | 'video-only' | 'minimal' = 'original-audio';
    
    if (error.message.includes('TRANSLATION_SERVICE_DOWN')) {
      fallbackMode = 'original-audio';
    } else if (error.message.includes('WEBSOCKET_CONNECTION_FAILED')) {
      fallbackMode = 'original-audio';
    } else if (error.message.includes('AUDIO_PROCESSING_FAILED')) {
      fallbackMode = 'video-only';
    } else if (error.message.includes('CRITICAL_SYSTEM_ERROR')) {
      fallbackMode = 'minimal';
    }

    return {
      hasError: true,
      error,
      fallbackMode,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update translation store to handle fallback
    this.handleTranslationFallback(error);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    // Debounce error reporting to prevent spam
    if (this.errorReportTimeout) {
      clearTimeout(this.errorReportTimeout);
    }

    this.errorReportTimeout = setTimeout(() => {
      // In a real implementation, send to error monitoring service
      console.error('Translation Error Boundary caught an error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        fallbackMode: this.state.fallbackMode,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Update error metrics in translation store
      if (typeof window !== 'undefined') {
        const translationStore = (window as any).__TRANSLATION_STORE__;
        if (translationStore) {
          translationStore.setState({
            lastError: error.message,
            fallbackMode: this.state.fallbackMode,
          });
        }
      }
    }, 1000);
  };

  private handleTranslationFallback = (error: Error) => {
    // Automatically switch to fallback mode in translation store
    try {
      import('@/stores/translationStore').then(({ useTranslationStore }) => {
        useTranslationStore.getState().setFallbackMode(this.state.fallbackMode);
        
        // If translation was active, stop it
        if (useTranslationStore.getState().isTranslationActive) {
          useTranslationStore.getState().stopTranslation();
        }
      });
    } catch (storeError) {
      console.error('Failed to update translation store:', storeError);
    }
  };

  private handleRetry = () => {
    const maxRetries = 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Too many retries, switch to more conservative fallback
      this.setState({
        fallbackMode: 'minimal',
      });
    }
  };

  private handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  private getFallbackMessage = (): { title: string; description: string; actionText: string } => {
    switch (this.state.fallbackMode) {
      case 'original-audio':
        return {
          title: 'Translation temporarily unavailable',
          description: 'Continuing with original audio. Translation will resume automatically when service is restored.',
          actionText: 'Continue with original audio',
        };
      case 'video-only':
        return {
          title: 'Audio processing issue',
          description: 'Continuing with video only. Audio features are temporarily disabled.',
          actionText: 'Continue with video only',
        };
      case 'minimal':
        return {
          title: 'Service degraded',
          description: 'Running in minimal mode. Some features may be unavailable.',
          actionText: 'Continue in minimal mode',
        };
      default:
        return {
          title: 'Unexpected error',
          description: 'An error occurred. Please try refreshing the page.',
          actionText: 'Continue',
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const { title, description, actionText } = this.getFallbackMessage();
      const canRetry = this.state.retryCount < 3;

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {title}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{description}</p>
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      Technical details
                    </summary>
                    <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="mt-4 flex space-x-2">
                {canRetry && (
                  <button
                    type="button"
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Retry ({3 - this.state.retryCount} left)
                  </button>
                )}
                <button
                  type="button"
                  onClick={this.handleDismiss}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {this.state.fallbackMode === 'original-audio' && <VolumeXIcon className="h-4 w-4 mr-2" />}
                  {actionText}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with translation error boundary
 */
export function withTranslationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackMode?: 'original-audio' | 'video-only' | 'minimal'
) {
  return function WrappedComponent(props: P) {
    return (
      <TranslationErrorBoundary fallbackMode={fallbackMode}>
        <Component {...props} />
      </TranslationErrorBoundary>
    );
  };
}

/**
 * Hook for manually triggering error boundary
 */
export function useTranslationErrorHandler() {
  const throwError = (error: Error) => {
    // This will be caught by the nearest error boundary
    throw error;
  };

  const reportError = (error: Error, context?: string) => {
    console.error(`Translation error${context ? ` in ${context}` : ''}:`, error);
    
    // Update translation store with error
    try {
      import('@/stores/translationStore').then(({ useTranslationStore }) => {
        useTranslationStore.getState().lastError = error.message;
      });
    } catch (storeError) {
      console.error('Failed to update translation store with error:', storeError);
    }
  };

  return { throwError, reportError };
}