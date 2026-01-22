import { Routes, Route, Navigate } from 'react-router-dom';
import { ClaimsListPage } from '@/pages/ClaimsListPage';
import { ClaimDetailPage } from '@/pages/ClaimDetailPage';
import { DecisionWizardPage } from '@/pages/DecisionWizardPage';
import { DecisionReceiptPage } from '@/pages/DecisionReceiptPage';
import { TraceViewerPage } from '@/pages/TraceViewerPage';
import { CounterfactualPage } from '@/pages/CounterfactualPage';
import { DecisionRunsPage } from '@/pages/DecisionRunsPage';
import { QAImpactPage } from '@/pages/QAImpactPage';
import { GovernancePage } from '@/pages/GovernancePage';
import { ProposalDetailPage } from '@/pages/ProposalDetailPage';
import { NewProposalPage } from '@/pages/NewProposalPage';
import { CatalogsPage } from '@/pages/CatalogsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/claims" replace />} />

      {/* Claims */}
      <Route path="/claims" element={<ClaimsListPage />} />
      <Route path="/claims/:claimId" element={<ClaimDetailPage />} />
      <Route path="/claims/:claimId/decide" element={<DecisionWizardPage />} />

      {/* Decision Runs */}
      <Route path="/decision-runs" element={<DecisionRunsPage />} />
      <Route path="/decision-runs/:runId" element={<DecisionReceiptPage />} />
      <Route path="/decision-runs/:runId/trace" element={<TraceViewerPage />} />
      <Route path="/decision-runs/:runId/counterfactual" element={<CounterfactualPage />} />

      {/* QA Impact */}
      <Route path="/qa-impact" element={<QAImpactPage />} />

      {/* Governance */}
      <Route path="/governance" element={<GovernancePage />} />
      <Route path="/governance/new" element={<NewProposalPage />} />
      <Route path="/governance/:proposalId" element={<ProposalDetailPage />} />

      {/* Catalogs */}
      <Route path="/catalogs" element={<CatalogsPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
