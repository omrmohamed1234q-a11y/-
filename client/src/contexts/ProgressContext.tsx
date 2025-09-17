import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 🎯 PROGRESS TYPES: Define different types of progress we track
export type ProgressType = 'pdf_analysis' | 'file_upload' | 'cart_addition' | 'file_processing';

export interface ProgressStep {
  id: string;
  type: ProgressType;
  fileName?: string;
  message: string;
  progress: number; // 0-100
  isActive: boolean;
  isCompleted: boolean;
  hasError: boolean;
  errorMessage?: string;
  estimatedTime?: number; // seconds
  startTime?: number;
}

export interface ProgressState {
  isActive: boolean;
  currentStep?: ProgressStep;
  allSteps: ProgressStep[];
  totalProgress: number; // Overall progress 0-100
}

interface ProgressContextType {
  progress: ProgressState;
  
  // Actions
  startProgress: (steps: Omit<ProgressStep, 'id' | 'isActive' | 'isCompleted' | 'hasError' | 'startTime'>[]) => void;
  updateStep: (stepId: string, updates: Partial<ProgressStep>) => void;
  completeStep: (stepId: string) => void;
  errorStep: (stepId: string, errorMessage: string) => void;
  finishProgress: () => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const initialState: ProgressState = {
  isActive: false,
  allSteps: [],
  totalProgress: 0,
};

// 🎯 MESSAGES: Arabic messages for different progress types
const getProgressMessage = (type: ProgressType, fileName?: string): string => {
  switch (type) {
    case 'pdf_analysis':
      return `تحليل ${fileName || 'الملف'}...`;
    case 'file_upload':
      return `رفع ${fileName || 'الملف'}...`;
    case 'cart_addition':
      return 'إضافة للسلة...';
    case 'file_processing':
      return `معالجة ${fileName || 'الملف'}...`;
    default:
      return 'جاري المعالجة...';
  }
};

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(initialState);

  const startProgress = useCallback((stepConfigs: Omit<ProgressStep, 'id' | 'isActive' | 'isCompleted' | 'hasError' | 'startTime'>[]) => {
    const now = Date.now();
    const steps: ProgressStep[] = stepConfigs.map((config, index) => ({
      ...config,
      id: `step_${now}_${index}`,
      isActive: index === 0, // First step is active
      isCompleted: false,
      hasError: false,
      startTime: index === 0 ? now : undefined,
      message: config.message || getProgressMessage(config.type, config.fileName),
    }));

    setProgress({
      isActive: true,
      currentStep: steps[0],
      allSteps: steps,
      totalProgress: 0,
    });
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<ProgressStep>) => {
    setProgress(prev => {
      const newSteps = prev.allSteps.map(step => 
        step.id === stepId 
          ? { ...step, ...updates }
          : step
      );
      
      const currentStep = newSteps.find(step => step.isActive);
      const completedSteps = newSteps.filter(step => step.isCompleted).length;
      const totalProgress = (completedSteps / newSteps.length) * 100;
      
      return {
        ...prev,
        allSteps: newSteps,
        currentStep,
        totalProgress,
      };
    });
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setProgress(prev => {
      const stepIndex = prev.allSteps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) return prev;

      const newSteps = [...prev.allSteps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        isActive: false,
        isCompleted: true,
        progress: 100,
      };

      // Activate next step if exists
      if (stepIndex + 1 < newSteps.length) {
        newSteps[stepIndex + 1] = {
          ...newSteps[stepIndex + 1],
          isActive: true,
          startTime: Date.now(),
        };
      }

      const currentStep = newSteps.find(step => step.isActive);
      const completedSteps = newSteps.filter(step => step.isCompleted).length;
      const totalProgress = (completedSteps / newSteps.length) * 100;

      return {
        ...prev,
        allSteps: newSteps,
        currentStep,
        totalProgress,
      };
    });
  }, []);

  const errorStep = useCallback((stepId: string, errorMessage: string) => {
    setProgress(prev => {
      const newSteps = prev.allSteps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              isActive: false, 
              hasError: true, 
              errorMessage,
            }
          : step
      );
      
      return {
        ...prev,
        allSteps: newSteps,
        currentStep: undefined,
        isActive: false, // Stop progress on error
      };
    });
  }, []);

  const finishProgress = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isActive: false,
      currentStep: undefined,
      totalProgress: 100,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(initialState);
  }, []);

  const value: ProgressContextType = {
    progress,
    startProgress,
    updateStep,
    completeStep,
    errorStep,
    finishProgress,
    resetProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}

// 🎯 HOOKS: Convenience hooks for common progress patterns

export function useFileUploadProgress() {
  const { startProgress, updateStep, completeStep, errorStep, finishProgress, resetProgress } = useProgress();

  const startFileUpload = useCallback((fileName: string) => {
    startProgress([
      {
        type: 'pdf_analysis',
        fileName,
        message: `تحليل ${fileName}...`,
        progress: 0,
      },
      {
        type: 'file_upload',
        fileName,
        message: `رفع ${fileName}...`,
        progress: 0,
      },
      {
        type: 'cart_addition',
        message: 'إضافة للسلة...',
        progress: 0,
      },
    ]);
  }, [startProgress]);

  return {
    startFileUpload,
    updateStep,
    completeStep,
    errorStep,
    finishProgress,
    resetProgress,
  };
}