/**
 * Interactive Tutorial Component
 * Provides step-by-step onboarding and feature tutorials
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { 
  XIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SkipForwardIcon,
  PlayIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from 'lucide-react';

interface TutorialModalProps {
  className?: string;
}

export default function TutorialModal({ className = '' }: TutorialModalProps) {
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    isActive,
    currentStep,
    getCurrentTutorial,
    getCurrentStep,
    getProgress,
    nextStep,
    previousStep,
    skipStep,
    skipTutorial,
    completeTutorial,
    tutorialSpeed,
  } = useTutorialStore();

  const tutorial = getCurrentTutorial();
  const step = getCurrentStep();
  const progress = getProgress();

  // Calculate position of modal based on target element and step position
  useEffect(() => {
    if (!isActive || !step || !step.target) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(step.target!) as HTMLElement;
      if (!targetElement || !modalRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const padding = 20;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'top':
          top = targetRect.top - modalRect.height - padding;
          left = targetRect.left + (targetRect.width - modalRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + padding;
          left = targetRect.left + (targetRect.width - modalRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - modalRect.height) / 2;
          left = targetRect.left - modalRect.width - padding;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - modalRect.height) / 2;
          left = targetRect.right + padding;
          break;
        case 'center':
        default:
          top = window.innerHeight / 2 - modalRect.height / 2;
          left = window.innerWidth / 2 - modalRect.width / 2;
          break;
      }

      // Ensure modal stays within viewport
      top = Math.max(padding, Math.min(top, window.innerHeight - modalRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - modalRect.width - padding));

      setModalPosition({ top, left });
      setHighlightedElement(targetElement);
    };

    // Initial position calculation
    setTimeout(updatePosition, 100);

    // Update position on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isActive, step]);

  // Highlight target element
  useEffect(() => {
    if (!highlightedElement) return;

    const originalOutline = highlightedElement.style.outline;
    const originalZIndex = highlightedElement.style.zIndex;
    const originalPosition = highlightedElement.style.position;

    // Add highlight
    highlightedElement.style.outline = '3px solid #3B82F6';
    highlightedElement.style.zIndex = '9999';
    if (getComputedStyle(highlightedElement).position === 'static') {
      highlightedElement.style.position = 'relative';
    }

    return () => {
      // Restore original styles
      highlightedElement.style.outline = originalOutline;
      highlightedElement.style.zIndex = originalZIndex;
      highlightedElement.style.position = originalPosition;
    };
  }, [highlightedElement]);

  // Auto-advance for demo steps
  useEffect(() => {
    if (!step || step.action?.type !== 'demo') return;

    const speeds = { slow: 4000, normal: 3000, fast: 2000 };
    const delay = speeds[tutorialSpeed];

    const timeout = setTimeout(() => {
      nextStep();
    }, delay);

    return () => clearTimeout(timeout);
  }, [step, tutorialSpeed, nextStep]);

  const handleAction = async () => {
    if (!step || !step.action) {
      nextStep();
      return;
    }

    try {
      if (step.action.handler) {
        await step.action.handler();
      }
      nextStep();
    } catch (error) {
      console.error('Tutorial action failed:', error);
      // Continue anyway
      nextStep();
    }
  };

  const getPositionIcon = () => {
    if (!step?.position) return null;
    
    switch (step.position) {
      case 'top': return <ArrowUpIcon className="w-4 h-4" />;
      case 'bottom': return <ArrowDownIcon className="w-4 h-4" />;
      case 'left': return <ArrowLeftIcon className="w-4 h-4" />;
      case 'right': return <ArrowRightIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!isActive || !tutorial || !step) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Tutorial Modal */}
      <div 
        ref={modalRef}
        className={`
          fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 
          max-w-md w-full mx-4 ${className}
        `}
        style={{
          top: modalPosition.top,
          left: modalPosition.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BookOpenIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">{tutorial.name}</h3>
          </div>
          <button
            onClick={skipTutorial}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            title="Skip Tutorial"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {progress.current} of {progress.total}</span>
            <span>{Math.round(progress.percentage)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start space-x-3 mb-4">
            {getPositionIcon() && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {getPositionIcon()}
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h4>
              <p className="text-gray-600 text-sm mb-3">{step.description}</p>
              
              {/* Step Content */}
              <div className="text-sm text-gray-700">
                {typeof step.content === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: step.content }} />
                ) : (
                  step.content
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {step.action && (
            <div className="mb-4">
              {step.action.type === 'demo' ? (
                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                  <PlayIcon className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-blue-600 text-sm font-medium">Demo in progress...</span>
                </div>
              ) : (
                <button
                  onClick={handleAction}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  {step.action.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={previousStep}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {step.skippable !== false && (
              <button
                onClick={skipStep}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <SkipForwardIcon className="w-4 h-4 mr-1" />
                Skip
              </button>
            )}
            
            {!step.action && (
              <button
                onClick={nextStep}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                {progress.current === progress.total ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Tutorial trigger component for first-time users
export function TutorialTrigger() {
  const { 
    firstTimeUser, 
    userHasCompletedOnboarding, 
    shouldShowTutorial, 
    startTutorial,
    loadFromPersistence,
  } = useTutorialStore();

  useEffect(() => {
    // Load persisted data on mount
    loadFromPersistence();
  }, [loadFromPersistence]);

  useEffect(() => {
    // Auto-start onboarding for first-time users
    if (firstTimeUser && !userHasCompletedOnboarding && shouldShowTutorial('onboarding')) {
      setTimeout(() => {
        startTutorial('onboarding');
      }, 1000); // Delay to let the page load
    }
  }, [firstTimeUser, userHasCompletedOnboarding, shouldShowTutorial, startTutorial]);

  return null;
}

// Tutorial menu component for accessing tutorials manually
interface TutorialMenuProps {
  className?: string;
}

export function TutorialMenu({ className = '' }: TutorialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    availableTutorials,
    completedFlows,
    startTutorial,
    resetTutorial,
  } = useTutorialStore();

  const handleStartTutorial = (flowId: string) => {
    startTutorial(flowId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        title="Tutorials"
      >
        <BookOpenIcon className="w-4 h-4 mr-2" />
        Help & Tutorials
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Available Tutorials</h3>
          </div>
          
          <div className="p-2">
            {availableTutorials.map((tutorial) => {
              const isCompleted = completedFlows.includes(tutorial.id);
              
              return (
                <div key={tutorial.id} className="mb-2">
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        {tutorial.name}
                        {isCompleted && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500 ml-2" />
                        )}
                      </h4>
                      <p className="text-xs text-gray-600">{tutorial.description}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handleStartTutorial(tutorial.id)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
                      >
                        {isCompleted ? 'Replay' : 'Start'}
                      </button>
                      {isCompleted && (
                        <button
                          onClick={() => resetTutorial(tutorial.id)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          title="Reset tutorial"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-gray-200 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}