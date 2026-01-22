const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Claims API
export const claimsApi = {
  list: (params?: { jurisdiction?: string; product_line?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.jurisdiction) searchParams.set('jurisdiction', params.jurisdiction);
    if (params?.product_line) searchParams.set('product_line', params.product_line);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchJson<import('@/types').ClaimSummary[]>(`/claims${query ? `?${query}` : ''}`);
  },

  get: (claimId: string) => {
    return fetchJson<import('@/types').Claim>(`/claims/${claimId}`);
  },
};

// Decisions API
export const decisionsApi = {
  list: (claimId?: string) => {
    const query = claimId ? `?claim_id=${claimId}` : '';
    return fetchJson<import('@/types').DecisionRun[]>(`/decisions${query}`);
  },

  get: (runId: string) => {
    return fetchJson<import('@/types').DecisionRun>(`/decisions/${runId}`);
  },

  run: (request: {
    claim_id: string;
    interpretation_set_id: string;
    assumption_set_id: string;
    resolved_assumptions: import('@/types').ResolvedAssumption[];
    selected_interpretations: import('@/types').SelectedInterpretation[];
    role: string;
  }) => {
    return fetchJson<import('@/types').DecisionRun>('/decisions/run', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  counterfactual: (request: {
    base_run_id: string;
    change_type: import('@/types').ChangeType;
    change_ref: string;
    original_value: string;
    new_value: string;
  }) => {
    return fetchJson<import('@/types').CounterfactualRun>('/decisions/counterfactual', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

// Catalogs API
export const catalogsApi = {
  listInterpretationSets: (params?: { jurisdiction?: string; product_line?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.jurisdiction) searchParams.set('jurisdiction', params.jurisdiction);
    if (params?.product_line) searchParams.set('product_line', params.product_line);
    const query = searchParams.toString();
    return fetchJson<import('@/types').InterpretationSet[]>(`/catalogs/interpretation-sets${query ? `?${query}` : ''}`);
  },

  getInterpretationSet: (setId: string) => {
    return fetchJson<import('@/types').InterpretationSet>(`/catalogs/interpretation-sets/${setId}`);
  },

  listAssumptionSets: (params?: { jurisdiction?: string; product_line?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.jurisdiction) searchParams.set('jurisdiction', params.jurisdiction);
    if (params?.product_line) searchParams.set('product_line', params.product_line);
    const query = searchParams.toString();
    return fetchJson<import('@/types').AssumptionSet[]>(`/catalogs/assumption-sets${query ? `?${query}` : ''}`);
  },

  getAssumptionSet: (setId: string) => {
    return fetchJson<import('@/types').AssumptionSet>(`/catalogs/assumption-sets/${setId}`);
  },
};

// Governance API
export const governanceApi = {
  listProposals: () => {
    return fetchJson<import('@/types').ChangeProposal[]>('/governance/proposals');
  },

  getProposal: (proposalId: string) => {
    return fetchJson<import('@/types').ChangeProposal>(`/governance/proposals/${proposalId}`);
  },

  createProposal: (request: {
    title: string;
    proposal_type: import('@/types').ProposalType;
    proposed_version: string;
    rationale: string;
    qa_impact_summary?: import('@/types').QAImpactSummary;
    created_by: string;
  }) => {
    return fetchJson<import('@/types').ChangeProposal>('/governance/proposals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  updateProposal: (proposalId: string, request: { action: string; actor_role: string }) => {
    return fetchJson<import('@/types').ChangeProposal>(`/governance/proposals/${proposalId}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },
};

// QA API
export const qaApi = {
  listCohorts: () => {
    return fetchJson<import('@/types').QACohort[]>('/qa/cohorts');
  },

  listProposedChanges: () => {
    return fetchJson<import('@/types').QAProposedChange[]>('/qa/proposed-changes');
  },

  listResults: () => {
    return fetchJson<import('@/types').QAStudyResult[]>('/qa/results');
  },

  getResult: (cohortId: string, proposalId: string) => {
    return fetchJson<import('@/types').QAStudyResult>(`/qa/results/${cohortId}/${proposalId}`);
  },
};

// Reset API
export const resetApi = {
  reset: () => {
    return fetchJson<{ status: string; message: string }>('/reset', {
      method: 'POST',
    });
  },
};
