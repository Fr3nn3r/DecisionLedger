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
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index < currentStep;

          return (
            <li key={step.id} className="relative flex-1">
              <div className="flex items-center">
                {/* Connector line (before) */}
                {index > 0 && (
                  <div
                    className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 ${
                      isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                    }`}
                    style={{ right: '50%', left: 'calc(-50% + 1rem)' }}
                  />
                )}

                {/* Step indicator */}
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

                {/* Connector line (after) */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="mt-2">
                <span
                  className={`block text-center text-sm font-medium ${
                    isCompleted || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
