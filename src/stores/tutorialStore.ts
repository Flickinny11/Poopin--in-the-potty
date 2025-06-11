/**
 * Tutorial state management with Zustand
 * Manages interactive tutorial and onboarding flow
 */
import { create } from 'zustand';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  content: React.ReactNode | string;
  action?: {
    type: 'click' | 'input' | 'wait' | 'demo';
    label: string;
    handler?: () => void | Promise<void>;
  };
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  skippable?: boolean;
  completed?: boolean;
}

export interface TutorialFlow {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  requiredForNewUsers?: boolean;
  category: 'onboarding' | 'features' | 'advanced';
}

export interface TutorialState {
  // Current tutorial state
  isActive: boolean;
  currentFlow: string | null;
  currentStep: number;
  completedFlows: string[];
  skippedFlows: string[];
  
  // User preferences
  showTooltips: boolean;
  autoStartTutorials: boolean;
  tutorialSpeed: 'slow' | 'normal' | 'fast';
  
  // Tutorial progress
  userHasCompletedOnboarding: boolean;
  firstTimeUser: boolean;
  lastTutorialDate: string | null;
  
  // Available tutorials
  availableTutorials: TutorialFlow[];
  
  // Actions
  startTutorial: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: (flowId: string) => void;
  setShowTooltips: (show: boolean) => void;
  setAutoStartTutorials: (auto: boolean) => void;
  setTutorialSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  markOnboardingComplete: () => void;
  addCustomTutorial: (tutorial: TutorialFlow) => void;
  
  // Tutorial state getters
  getCurrentTutorial: () => TutorialFlow | null;
  getCurrentStep: () => TutorialStep | null;
  getProgress: () => { current: number; total: number; percentage: number };
  shouldShowTutorial: (flowId: string) => boolean;
  
  // Persistence
  saveToPersistence: () => void;
  loadFromPersistence: () => void;
}

// Define built-in tutorial flows
const ONBOARDING_TUTORIAL: TutorialFlow = {
  id: 'onboarding',
  name: 'Welcome to VidLiSync',
  description: 'Learn the basics of video calling with real-time translation',
  category: 'onboarding',
  requiredForNewUsers: true,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to VidLiSync!',
      description: 'Break language barriers with real-time video translation',
      content: `
        <div class="text-center">
          <h2 class="text-2xl font-bold mb-4">Welcome to VidLiSync!</h2>
          <p class="text-gray-600 mb-6">
            VidLiSync combines video calling with AI-powered real-time translation, 
            voice cloning, and lip synchronization to help you communicate naturally 
            with anyone, anywhere, in any language.
          </p>
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-blue-800 font-medium">
              🎯 In just 2 minutes, you'll learn how to have your first translated conversation!
            </p>
          </div>
        </div>
      `,
      position: 'center',
      skippable: false,
    },
    {
      id: 'language-selection',
      title: 'Choose Your Languages',
      description: 'Select the languages you want to translate between',
      content: 'First, let\'s set up your preferred languages. You can always change these later during calls.',
      target: '.language-selector',
      position: 'bottom',
      action: {
        type: 'demo',
        label: 'Watch Demo',
      },
    },
    {
      id: 'voice-training',
      title: 'Train Your Voice (Optional)',
      description: 'Record a few samples to improve voice cloning quality',
      content: `
        <div>
          <p class="mb-4">
            For the best experience, we recommend training your voice profile. 
            This helps our AI clone your voice more accurately when translating.
          </p>
          <div class="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            <p class="text-yellow-800 text-sm">
              💡 <strong>Tip:</strong> You can skip this for now and train your voice later in settings.
            </p>
          </div>
        </div>
      `,
      target: '.voice-training-section',
      position: 'right',
      skippable: true,
    },
    {
      id: 'demo-call',
      title: 'Try a Demo Call',
      description: 'Experience translation with our AI assistant',
      content: 'Let\'s start a demo call where you can practice with our AI assistant. This is a safe way to test the translation features.',
      target: '.demo-call-button',
      position: 'bottom',
      action: {
        type: 'click',
        label: 'Start Demo Call',
      },
    },
    {
      id: 'translation-controls',
      title: 'Translation Controls',
      description: 'Learn how to control translation during calls',
      content: 'During video calls, you can toggle translation, change languages, and adjust settings using these controls.',
      target: '.translation-controls',
      position: 'top',
    },
    {
      id: 'overlay-features',
      title: 'Translation Overlay',
      description: 'See translations in real-time',
      content: 'The translation overlay shows both original and translated text in real-time. You can move it around and customize its appearance.',
      target: '.translation-overlay',
      position: 'top',
    },
    {
      id: 'completion',
      title: 'You\'re Ready!',
      description: 'Start making translated video calls',
      content: `
        <div class="text-center">
          <h3 class="text-xl font-bold mb-4 text-green-600">🎉 Congratulations!</h3>
          <p class="text-gray-600 mb-6">
            You've completed the VidLiSync onboarding. You're now ready to make 
            video calls with real-time translation.
          </p>
          <div class="bg-green-50 p-4 rounded-lg">
            <h4 class="font-medium text-green-800 mb-2">Quick Tips:</h4>
            <ul class="text-green-700 text-sm space-y-1 text-left">
              <li>• Press 'T' during calls to open translation settings</li>
              <li>• Check your internet connection for best quality</li>
              <li>• Use headphones to prevent echo</li>
              <li>• Train your voice for better voice cloning</li>
            </ul>
          </div>
        </div>
      `,
      position: 'center',
      action: {
        type: 'click',
        label: 'Start Using VidLiSync',
      },
    },
  ],
};

const TRANSLATION_FEATURES_TUTORIAL: TutorialFlow = {
  id: 'translation-features',
  name: 'Translation Features',
  description: 'Master advanced translation features',
  category: 'features',
  steps: [
    {
      id: 'language-switching',
      title: 'Mid-Call Language Switching',
      description: 'Change languages without ending the call',
      content: 'You can switch languages at any time during a call. The other participants will hear you in the new language immediately.',
      target: '.language-switcher',
      position: 'bottom',
    },
    {
      id: 'voice-profiles',
      title: 'Voice Profiles',
      description: 'Manage multiple voice profiles for different languages',
      content: 'Create different voice profiles for each language you speak. This improves translation quality and consistency.',
      target: '.voice-profiles',
      position: 'right',
    },
    {
      id: 'quality-monitoring',
      title: 'Quality Monitoring',
      description: 'Monitor translation quality and network performance',
      content: 'Keep an eye on the quality indicators to ensure optimal translation performance.',
      target: '.quality-indicators',
      position: 'left',
    },
  ],
};

const ADVANCED_FEATURES_TUTORIAL: TutorialFlow = {
  id: 'advanced-features',
  name: 'Advanced Features',
  description: 'Explore pro features and customization',
  category: 'advanced',
  steps: [
    {
      id: 'custom-models',
      title: 'Custom Voice Models',
      description: 'Train custom voice models for specific use cases',
      content: 'Advanced users can train custom voice models for specific accents, speaking styles, or professional contexts.',
      target: '.custom-models',
      position: 'bottom',
    },
    {
      id: 'api-integration',
      title: 'API Integration',
      description: 'Integrate VidLiSync into your applications',
      content: 'Use our API to integrate real-time translation into your own applications and workflows.',
      target: '.api-docs-link',
      position: 'top',
    },
  ],
};

const DEFAULT_TUTORIALS = [
  ONBOARDING_TUTORIAL,
  TRANSLATION_FEATURES_TUTORIAL,
  ADVANCED_FEATURES_TUTORIAL,
];

export const useTutorialStore = create<TutorialState>((set, get) => ({
  // Initial state
  isActive: false,
  currentFlow: null,
  currentStep: 0,
  completedFlows: [],
  skippedFlows: [],
  showTooltips: true,
  autoStartTutorials: true,
  tutorialSpeed: 'normal',
  userHasCompletedOnboarding: false,
  firstTimeUser: true,
  lastTutorialDate: null,
  availableTutorials: DEFAULT_TUTORIALS,

  // Start tutorial
  startTutorial: (flowId: string) => {
    const tutorial = get().availableTutorials.find(t => t.id === flowId);
    if (!tutorial) return;

    set({
      isActive: true,
      currentFlow: flowId,
      currentStep: 0,
      lastTutorialDate: new Date().toISOString(),
    });
    
    get().saveToPersistence();
  },

  // Next step
  nextStep: () => {
    const { currentFlow, currentStep, availableTutorials } = get();
    if (!currentFlow) return;

    const tutorial = availableTutorials.find(t => t.id === currentFlow);
    if (!tutorial) return;

    if (currentStep < tutorial.steps.length - 1) {
      set({ currentStep: currentStep + 1 });
      get().saveToPersistence();
    } else {
      // Tutorial completed
      get().completeTutorial();
    }
  },

  // Previous step
  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
      get().saveToPersistence();
    }
  },

  // Skip step
  skipStep: () => {
    get().nextStep();
  },

  // Skip tutorial
  skipTutorial: () => {
    const { currentFlow, skippedFlows } = get();
    if (!currentFlow) return;

    set({
      isActive: false,
      currentFlow: null,
      currentStep: 0,
      skippedFlows: [...skippedFlows, currentFlow],
    });
    
    get().saveToPersistence();
  },

  // Complete tutorial
  completeTutorial: () => {
    const { currentFlow, completedFlows } = get();
    if (!currentFlow) return;

    const newCompletedFlows = [...completedFlows, currentFlow];
    const updates: Partial<TutorialState> = {
      isActive: false,
      currentFlow: null,
      currentStep: 0,
      completedFlows: newCompletedFlows,
    };

    // Mark onboarding as complete if this was the onboarding tutorial
    if (currentFlow === 'onboarding') {
      updates.userHasCompletedOnboarding = true;
      updates.firstTimeUser = false;
    }

    set(updates);
    get().saveToPersistence();
  },

  // Reset tutorial
  resetTutorial: (flowId: string) => {
    const { completedFlows, skippedFlows } = get();
    set({
      completedFlows: completedFlows.filter(id => id !== flowId),
      skippedFlows: skippedFlows.filter(id => id !== flowId),
    });
    get().saveToPersistence();
  },

  // Setters
  setShowTooltips: (show: boolean) => {
    set({ showTooltips: show });
    get().saveToPersistence();
  },
  setAutoStartTutorials: (auto: boolean) => {
    set({ autoStartTutorials: auto });
    get().saveToPersistence();
  },
  setTutorialSpeed: (speed: 'slow' | 'normal' | 'fast') => {
    set({ tutorialSpeed: speed });
    get().saveToPersistence();
  },
  markOnboardingComplete: () => {
    set({ userHasCompletedOnboarding: true, firstTimeUser: false });
    get().saveToPersistence();
  },

  // Add custom tutorial
  addCustomTutorial: (tutorial: TutorialFlow) => {
    const { availableTutorials } = get();
    set({
      availableTutorials: [...availableTutorials, tutorial],
    });
  },

  // Getters
  getCurrentTutorial: () => {
    const { currentFlow, availableTutorials } = get();
    if (!currentFlow) return null;
    return availableTutorials.find(t => t.id === currentFlow) || null;
  },

  getCurrentStep: () => {
    const { currentStep } = get();
    const tutorial = get().getCurrentTutorial();
    if (!tutorial || currentStep >= tutorial.steps.length) return null;
    return tutorial.steps[currentStep];
  },

  getProgress: () => {
    const tutorial = get().getCurrentTutorial();
    const { currentStep } = get();
    if (!tutorial) return { current: 0, total: 0, percentage: 0 };
    
    const current = currentStep + 1;
    const total = tutorial.steps.length;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  },

  shouldShowTutorial: (flowId: string) => {
    const { completedFlows, skippedFlows, autoStartTutorials, firstTimeUser } = get();
    
    // Don't show if already completed or skipped
    if (completedFlows.includes(flowId) || skippedFlows.includes(flowId)) {
      return false;
    }
    
    // Always show onboarding for first-time users
    if (flowId === 'onboarding' && firstTimeUser) {
      return true;
    }
    
    // Show other tutorials only if auto-start is enabled
    return autoStartTutorials;
  },

  // Persistence methods
  saveToPersistence: () => {
    if (typeof window === 'undefined') return;
    
    const state = get();
    const persistedData = {
      completedFlows: state.completedFlows,
      skippedFlows: state.skippedFlows,
      showTooltips: state.showTooltips,
      autoStartTutorials: state.autoStartTutorials,
      tutorialSpeed: state.tutorialSpeed,
      userHasCompletedOnboarding: state.userHasCompletedOnboarding,
      firstTimeUser: state.firstTimeUser,
      lastTutorialDate: state.lastTutorialDate,
    };
    
    localStorage.setItem('vidlisync-tutorial-store', JSON.stringify(persistedData));
  },

  loadFromPersistence: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('vidlisync-tutorial-store');
      if (stored) {
        const persistedData = JSON.parse(stored);
        set({
          completedFlows: persistedData.completedFlows || [],
          skippedFlows: persistedData.skippedFlows || [],
          showTooltips: persistedData.showTooltips ?? true,
          autoStartTutorials: persistedData.autoStartTutorials ?? true,
          tutorialSpeed: persistedData.tutorialSpeed || 'normal',
          userHasCompletedOnboarding: persistedData.userHasCompletedOnboarding || false,
          firstTimeUser: persistedData.firstTimeUser ?? true,
          lastTutorialDate: persistedData.lastTutorialDate || null,
        });
      }
    } catch (error) {
      console.error('Failed to load tutorial data from localStorage:', error);
    }
  },
}));

// Initialize persistence on browser load
if (typeof window !== 'undefined') {
  const store = useTutorialStore.getState();
  store.loadFromPersistence();
}