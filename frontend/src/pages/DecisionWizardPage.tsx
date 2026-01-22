import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { WizardStepper, WizardStep } from '@/components/wizard/WizardStepper';

const WIZARD_STEPS: WizardStep[] = [
  { id: 'setup', label: 'Setup' },
  { id: 'resolve-assumptions', label: 'Resolve Assumptions' },
  { id: 'complete', label: 'Complete' },
];

export function DecisionWizardPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(`/claims/${claimId}`);
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    navigate(`/claims/${claimId}`);
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Decision Wizard</h1>
      <p className="mb-6 text-muted-foreground">
        Running decision for claim: <span className="font-medium text-foreground">{claimId}</span>
      </p>

      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Step content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {currentStep === 0 && <SetupStep claimId={claimId || ''} />}
        {currentStep === 1 && <ResolveAssumptionsStep claimId={claimId || ''} />}
        {currentStep === 2 && <CompleteStep claimId={claimId || ''} />}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFirstStep ? 'Back to Claim' : 'Back'}
        </button>

        {isLastStep ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Placeholder step components - will be implemented in S5.1, S5.2

interface StepProps {
  claimId: string;
}

function SetupStep({ claimId }: StepProps) {
  return (
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold mb-2">Setup</h2>
      <p className="text-muted-foreground">
        Review governance context for claim {claimId}. Interpretation and assumption sets will be displayed here.
      </p>
    </div>
  );
}

function ResolveAssumptionsStep({ claimId }: StepProps) {
  return (
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold mb-2">Resolve Assumptions</h2>
      <p className="text-muted-foreground">
        Resolve unknown facts for claim {claimId}. Assumption alternatives will be displayed here.
      </p>
    </div>
  );
}

function CompleteStep({ claimId }: StepProps) {
  return (
    <div className="text-center py-8">
      <h2 className="text-lg font-semibold mb-2">Decision Complete</h2>
      <p className="text-muted-foreground">
        Decision has been generated for claim {claimId}. Summary will be displayed here.
      </p>
    </div>
  );
}
