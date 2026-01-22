Below is a **handoff-ready Product Spec** for a **Decision Ledger Demo** (front-end only) that looks professional, is easy to navigate, and clearly demonstrates value. It focuses on **functionality + clarity**, with standard enterprise UI patterns (list → detail, wizard, tabs, diff view).

---

# Decision Ledger Demo MVP Spec

## 1) Purpose and demo goals

### Purpose

Deliver a **polished, interactive demo** that shows how a Decision Ledger enables:

* **Deterministic, versioned decisions** (not “AI vibes”)
* **Explicit interventions (interpretations)** and **assumptions** when facts are unknown
* A **Decision Receipt** artifact suitable for audit/dispute handling
* **Counterfactual simulation** (“what if we used a different approved interpretation/assumption?”)
* A **QA/Leakage impact view** across a cohort of claims (“what would this policy change cost?”)

### What “MVP” means here

* **Front-end only** with static fixtures (JSON) and in-memory/local state
* Facts and evidence are **assumed ingested from an external system** (read-only)
* No complex authoring or policy parsing—only minimal “view/edit proposal” forms for credibility

---

## 2) Target users and demo roles

### Roles (demo persona switcher)

Implement a simple “Role” selector in the header:

* **Adjuster**
* **Supervisor**
* **QA Lead**
* **Policy Owner (Governance)**

Role affects:

* Which assumption alternatives can be selected
* Whether a change proposal can be “approved/published”
* Which modules are visible (optional)

---

## 3) Demo scenarios (data pack)

### Scenario A (Primary): Switzerland Motor Claim (CH)

**CH Motor / Casco** — rear-end collision, **aftermarket tow bar** damage, “declared accessory” is unknown.

Why this scenario works:

* Easy to understand
* Naturally triggers an **assumption** (unknown declared status)
* Naturally triggers an **interpretation** choice (accessory coverage rule)
* Produces clean counterfactual deltas

### Scenario B (Optional Secondary): US Auto Claim (US)

**US Auto** — rental reimbursement coverage ambiguity (e.g., “coverage applies only if rental coverage endorsement present”), and endorsement presence is unknown in the feed.

Why include it (optional):

* Demonstrates **multi-jurisdiction interpretation sets**
* Reinforces “this is a system, not a one-off rules demo”

**Recommendation:** Keep Scenario B in the claim list, but run the full flow only for Scenario A in the live demo.

---

## 4) Navigation structure (standard enterprise UI)

### Main modules (left nav)

1. **Claims**
2. **Decision Runs** (optional shortcut to receipts)
3. **QA Impact**
4. **Governance** (Change Proposals)
5. **Catalogs** (Interpretations & Assumptions, read-only + minimal proposal)

### Persistent header controls

* Role selector (Adjuster / Supervisor / QA Lead / Policy Owner)
* “Reset Demo Data” (restores fixtures + clears local state)
* “Demo Mode” indicator (clearly labeled)

---

## 5) Core objects (data model)

Implement as JSON fixtures loaded on app start.

### Claim (read-only)

* claim_id, jurisdiction, product_line, loss_date, policy_id
* facts: list of `{fact_id, label, value, status, source}`

  * status ∈ `KNOWN | UNKNOWN`
* evidence: list of `{evidence_id, label, type, url}`
* line_items: list of `{item_id, label, amount_chf, category}`

### Interpretation Set (governed interventions)

* interpretation_set_id, jurisdiction, product_line, effective_from, version, status
* decision_points: list of:

  * `{decision_point_id, label, options[], default_option, owner, status}`
* Each option can map to deterministic effects in the demo engine.

### Assumption Set (governed)

* assumption_set_id, jurisdiction, product_line, version, status
* assumptions: list of:

  * `{assumption_id, label, trigger, recommended_resolution, alternatives[], risk_tier, allowed_roles[]}`

### Decision Run (ledger event)

* run_id, claim_id, timestamp
* interpretation_set_id + version
* assumption_set_id + version
* resolved_assumptions: list of `{assumption_id, chosen_resolution, chosen_by_role, reason}`
* selected_interpretations: list of `{decision_point_id, option}`
* outcome: `{approved:boolean, payout_total, payout_breakdown[]}`
* trace_steps: list of `{step_id, label, inputs_used[], rule_refs[], evidence_refs[], output}`

### Counterfactual Run

* base_run_id
* change_type: `ASSUMPTION | INTERPRETATION`
* change_ref (which id changed)
* new_outcome + delta
* trace_diff summary

### QA Study Result

* cohort_id, cohort_label
* proposal_id (what change is simulated)
* impacted_claims_count
* total_delta_payout
* top_impacted_claims: list of `{claim_id, delta}`
* flags: e.g. `INCONSISTENCY_DETECTED` (optional)

---

## 6) Demo engine (rules for deterministic outcomes)

This is key: outcomes must be instant and reproducible.

### Required properties

* Same claim + same sets + same resolutions ⇒ same outcome
* Counterfactual allows **exactly one** change at a time
* Trace steps update accordingly

### Implementation approach

Hardcode a small “decision engine” per scenario:

* CH Motor: payout depends on:

  * base repair line item always covered (in demo)
  * tow bar coverage depends on:

    * Interpretation: `ACCESSORY_COVERAGE`
    * Assumption-resolved fact: `accessory_declared`
* Apply deductible consistently

No need to model everything—only what supports the story.

---

# 7) Screen-by-screen functional spec

## Screen 1 — Claims List

**Purpose:** entry point; standard list view.

**Must show**

* claim_id, jurisdiction, product_line, loss_date, status (e.g., “Ready”, “Decided”)
* quick filter: jurisdiction, product_line
* search by claim_id

**Actions**

* Click claim row → opens **Claim Detail**
* Optional: “Open Latest Receipt” if a decision run exists

**Acceptance criteria**

* Loads in <1s using fixtures
* At least 10 claims shown (includes CH + optional US)

---

## Screen 2 — Claim Detail (Read-only)

**Purpose:** show facts vs unknown + evidence + line items.

**Sections**

1. Claim header summary (claim_id, policy_id, jurisdiction, loss_date)
2. Facts table:

   * Label | Value | Status (KNOWN/UNKNOWN) | Source
3. Evidence list (clickable links)
4. Line items (amounts)
5. CTA: **Run Decision**

**Actions**

* Run Decision → opens **Decision Wizard** prefilled

**Acceptance criteria**

* Clearly highlights UNKNOWN facts (without user editing them)

---

## Screen 3 — Decision Wizard: Setup

**Purpose:** show governance/versioning clearly.

**Fields (display + selectable where relevant)**

* Interpretation Set (default auto-selected based on jurisdiction/product_line/loss_date)
* Assumption Set (default auto-selected)
* Read-only: version, effective dates, status = Approved

**Actions**

* Continue → Resolve Assumptions

**Acceptance criteria**

* Default selection always works for demo
* Versions displayed prominently to signal auditability

---

## Screen 4 — Decision Wizard: Resolve Assumptions

**Purpose:** the moment of value—uncertainty becomes controlled.

**List of triggered assumptions only**
For each triggered assumption:

* “What’s unknown” (e.g., Accessory declared = UNKNOWN)
* Recommended resolution (radio selected by default)
* Alternatives (radio)
* Risk tier badge (Low/Med/High)
* “Allowed roles” note
* If user selects a non-recommended resolution: require “Reason” (short text)

**Role enforcement**

* If role not permitted for an alternative:

  * disable option + tooltip “Requires Supervisor”
  * offer “Request escalation” (dummy action) that switches to Supervisor in demo, or shows a modal

**Actions**

* Generate Decision → runs engine and creates a Decision Run

**Acceptance criteria**

* At least 1 assumption triggers in CH scenario
* Non-recommended choice forces a reason
* “Generate Decision” always creates a run_id and navigates to receipt

---

## Screen 5 — Decision Receipt (Core artifact)

**Purpose:** “proof-like” output. This is the centerpiece.

**Top summary**

* Decision: Approved / Partial / Denied
* Total payout (CHF)
* Breakdown table:

  * Item | Covered amount | Notes
* Deductible applied

**Governance block**

* interpretation_set_id + version
* assumption_set_id + version
* run_id + timestamp
* role that generated it

**Resolved unknowns**

* Unknown fact → assumption applied → chosen by → reason (if any)

**Decisive steps (short)**

* Top 3 trace steps that changed coverage/payout
* Each step references:

  * rule_ref(s) (like “DP.ACCESSORY_COVERAGE option INCLUDED_IF_DECLARED”)
  * evidence_ref(s) (links)

**Actions**

* **Simulate Alternative (Counterfactual)**
* View Full Trace
* Export Receipt (PDF button can be stubbed)

**Acceptance criteria**

* Receipt is one screen; users don’t hunt for “why”
* Contains all version/run identifiers
* Provides at least one evidence link and one rule reference

---

## Screen 6 — Trace Viewer (Step-by-step)

**Purpose:** show determinism without overwhelming.

**Layout**

* Step list (vertical stepper): Step 1..N with titles
* Details panel for selected step:

  * Inputs used (facts + assumed values)
  * Decision point or assumption applied
  * Output (e.g., “Tow bar covered: No”)
  * Evidence refs and rule refs

**Acceptance criteria**

* Users can see exactly where the outcome changed
* Trace steps are stable and consistent across runs

---

## Screen 7 — Counterfactual Simulator (Single-toggle)

**Purpose:** demonstrate “what if we changed one approved lever?”

**Inputs**

* Base Run (auto-selected from receipt)
* Choose one change type:

  * **Assumption change** (swap resolution)
  * **Interpretation change** (swap option for one decision point)
* Enforce: only one change allowed at a time (hard constraint)

**Outputs**

* New payout and delta vs base (CHF)
* “What changed” summary:

  * one-liner explanation
* Trace diff (minimal):

  * highlight which step changed (e.g., Step 4 changed outcome)

**Actions**

* Save as Counterfactual Run (optional)
* Return to receipt

**Acceptance criteria**

* Delta updates instantly
* Only 1 lever changes; UI prevents multiple toggles

---

## Screen 8 — QA Impact (Batch simulation)

**Purpose:** sell to leadership—portfolio impact.

**Inputs**

* Cohort selector (dropdown):

  * “CH Motor – accessory damage – last 180 days”
  * (Optional) “US Auto – rental reimbursement – last 180 days”
* Proposed change selector:

  * “Set A2 as default when invoice exists”
  * “Change interpretation ACCESSORY_COVERAGE to INCLUDED_BY_DEFAULT”
* Run QA Simulation button (instant; uses fixtures)

**Outputs**

* Impact headline metrics:

  * impacted claims count
  * total delta payout (CHF)
* Top impacted claims list (with deltas)
* Optional flag box:

  * “Inconsistency detected: similar facts produced different outcomes” (based on fixture tags)

**Actions**

* Click claim in list → opens its receipt/counterfactual view
* Create Change Proposal (navigates to Governance screen)

**Acceptance criteria**

* Displays meaningful numbers immediately (no empty states)
* Clicking into examples works

---

## Screen 9 — Governance: Change Proposal (Minimal, high credibility)

**Purpose:** show controlled rollout + approvals.

**Fields**

* Proposal title
* Proposal type: Assumption change / Interpretation change
* Proposed version bump (e.g. 2025.1 → 2025.2)
* Rationale (text)
* QA impact summary (embedded from QA screen)
* Approval steps (mock):

  * Claims Ops → Legal → Policy Owner

**Actions**

* Submit for approval
* Approve (only visible to Policy Owner role)
* Publish new version (mock)
* After “publish”: re-running decision uses new default set (demo magic that impresses)

**Acceptance criteria**

* Role-gated actions work
* Publishing visibly changes default selection in future runs

---

## Screen 10 — Catalogs (Read-only + tiny proposal editor)

**Purpose:** anchor the concept of governed sets.

### Tab A: Interpretations Catalog

* list decision points and current options/default
* show owner, status, effective date, version

### Tab B: Assumptions Registry

* list assumptions with risk tier and triggers
* show recommended resolution and alternatives

**Optional action**

* “Draft proposal” (navigates to Governance prefilled)

**Acceptance criteria**

* Users can see the system is governed, not ad hoc

---

# 8) Demo flow script (what to click + what to say)

This is the recommended 8–12 minute flow.

### Flow 1: Adjuster run (2–3 min)

1. Claims → open CH claim
2. Show fact table: “Accessory declared = UNKNOWN”
3. Run Decision → Setup shows versioned sets
4. Resolve Assumption → accept recommended
5. Generate Receipt → show payout + resolved unknowns + versions

### Flow 2: Counterfactual (2 min)

6. Click “Simulate Alternative”
7. Toggle only one lever (assumption OR interpretation)
8. Show delta + trace diff (“only Step 4 changed”)

### Flow 3: QA/Leakage (2–3 min)

9. QA Impact → pick CH cohort → choose proposal → view impact totals
10. Open top impacted claim → show receipt/counterfactual linkage

### Flow 4: Governance close (1–2 min)

11. Create change proposal → show approvals → “Publish”
12. Re-run CH claim quickly → show new default applied (wow moment)

---

# 9) Non-functional requirements (demo polish)

* Every screen has a clear title + breadcrumb
* No dead ends: every page has a primary CTA
* Loading states: use skeletons/spinners even if local (makes it feel real)
* Errors are friendly (e.g., “No approved interpretation set found for this jurisdiction/date”—but fixtures should avoid this)
* “Reset Demo Data” must always restore a known-good state

---

# 10) Acceptance checklist (dev handoff)

A build is “demo-ready” when:

## Core

* [ ] CH claim can be decided end-to-end in <60 seconds
* [ ] Receipt includes run_id, versions, resolved assumptions, payout breakdown
* [ ] Counterfactual allows exactly one change and shows delta + changed step
* [ ] QA Impact shows cohort simulation with clickable examples
* [ ] Governance publish changes behavior of subsequent runs (even if mocked)

## Professional feel

* [ ] Role switch changes permissions in assumption selection and governance
* [ ] Reset demo data works reliably
* [ ] No empty screens; fixtures guarantee content

---

# 11) Deliverables to build (what you hand to the dev team)

1. Front-end app with the screens above
2. Fixture pack:

   * claims.json (≥10)
   * interpretation_sets.json
   * assumption_sets.json
   * qa_results.json (optional if you compute it client-side)
3. Demo engine module (deterministic functions)
4. Demo script (the flow above) embedded as “Demo Guide” (optional)

---

## If you want, I can also produce:

* A **complete fixture JSON pack** (CH + US) with realistic IDs, versions, trace steps, and precomputed outcomes
* The **exact field labels** for each screen (so there’s zero ambiguity for dev)
* A “golden path” + “edge case path” (e.g., insufficient evidence triggers “Request evidence” instead of decision)

Tell me whether you want the secondary US scenario included in the clickable demo flow or just present as extra data in the claim list, and I’ll lock the fixtures and write them out.
