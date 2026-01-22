import { Check } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8 mx-auto max-w-2xl">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="flex-1 flex flex-col items-center relative">
              {/* Connector line to next step */}
              {!isLast && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-0.5 ${
                    isCompleted ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}

              {/* Step circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90'
                    : isCurrent
                      ? 'border-primary bg-background text-primary'
                      : 'border-border bg-background text-muted-foreground cursor-default'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>

              {/* Step label */}
              <span
                className={`mt-2 text-sm font-medium text-center ${
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
