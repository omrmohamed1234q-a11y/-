import { useProgress } from '@/contexts/ProgressContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DetailedProgressProps {
  className?: string;
  showSteps?: boolean;
  showTimeEstimate?: boolean;
}

export function DetailedProgress({ 
  className = "", 
  showSteps = true, 
  showTimeEstimate = true 
}: DetailedProgressProps) {
  const { progress } = useProgress();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time for current step
  useEffect(() => {
    if (!progress.currentStep?.startTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (progress.currentStep?.startTime || 0)) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.currentStep?.startTime]);

  if (!progress.isActive && progress.allSteps.length === 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}ث`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}د ${remainingSeconds}ث`;
  };

  const hasError = progress.allSteps.some(step => step.hasError);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {progress.currentStep?.message || 'جاري المعالجة...'}
          </span>
          {showTimeEstimate && elapsedTime > 0 && (
            <span className="text-gray-500 text-xs">
              {formatTime(elapsedTime)}
            </span>
          )}
        </div>
        
        <Progress 
          value={progress.currentStep?.progress || progress.totalProgress} 
          className="h-2"
          data-testid="progress-main-bar"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {Math.round(progress.currentStep?.progress || progress.totalProgress)}%
          </span>
          <span>
            {progress.allSteps.filter(s => s.isCompleted).length} / {progress.allSteps.length} مكتمل
          </span>
        </div>
      </div>

      {/* Step Details */}
      {showSteps && progress.allSteps.length > 1 && (
        <div className="space-y-2">
          {progress.allSteps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                step.hasError 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : step.isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : step.isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500'
              }`}
              data-testid={`progress-step-${index}`}
            >
              {/* Step Icon */}
              <div className="flex-shrink-0">
                {step.hasError ? (
                  <AlertCircle className="h-4 w-4" />
                ) : step.isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : step.isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
              </div>

              {/* Step Text */}
              <div className="flex-1 min-w-0">
                <div className="truncate">
                  {step.message}
                </div>
                {step.hasError && step.errorMessage && (
                  <div className="text-xs mt-1 text-red-600 dark:text-red-400">
                    {step.errorMessage}
                  </div>
                )}
              </div>

              {/* Step Progress */}
              {step.isActive && step.progress > 0 && (
                <div className="text-xs font-medium">
                  {Math.round(step.progress)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Summary */}
      {hasError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">حدث خطأ أثناء المعالجة</span>
          </div>
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            يرجى المحاولة مرة أخرى أو اختيار ملف مختلف
          </div>
        </div>
      )}
    </div>
  );
}

// 🎯 COMPACT VERSION: For use in buttons and smaller spaces
export function CompactProgress({ className = "" }: { className?: string }) {
  const { progress } = useProgress();

  if (!progress.isActive) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">
        {progress.currentStep?.message || 'جاري المعالجة...'}
      </span>
      {progress.currentStep?.progress && progress.currentStep.progress > 0 && (
        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
          {Math.round(progress.currentStep.progress)}%
        </span>
      )}
    </div>
  );
}

// 🎯 MINIMAL VERSION: Just a spinner with message
export function MinimalProgress({ message }: { message?: string }) {
  const { progress } = useProgress();

  if (!progress.isActive) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      <span>
        {message || progress.currentStep?.message || 'جاري المعالجة...'}
      </span>
    </div>
  );
}