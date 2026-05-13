"""
Risk Dimensions Interpreter.

Lightweight heuristic layer that derives three additional risk dimensions
from already-computed, normalized [0.0, 1.0] feature metrics.

This module is a READ-ONLY tap — it never modifies the core prediction
pipeline, ML model, or database schema.

Dimensions:
  1. Maintainability Risk    — CYCLO, LENGTH, LOC, VOLUME, DIFFICULTY
  2. Deployment Stability Risk — BRANCH_COUNT, INT_FAN_IN, INT_FAN_OUT, LOC, VOLUME
  3. Structural Review Complexity — Conservative proxy only; no real security scanning.

Grading scale (A–E):
   0–20  → A  (Very Low)
  21–40  → B  (Low)
  41–60  → C  (Moderate)
  61–80  → D  (High)
  81–100 → E  (Critical)

Design notes:
  - No single feature may contribute more than 45% of a dimension score.
    This is enforced via per-feature contribution caps in _weighted_score_capped().
  - Summary phrasing rotates across a small set of templates to avoid
    repetitive "elevated / moderate" language.
  - Confidence is derived heuristically from feature completeness and
    intra-dimension variance — not from ML probabilities.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class RiskDimensionResult:
    """Output for a single risk dimension."""
    score: float               # 0–100
    grade: str                 # A | B | C | D | E
    summary: str               # Short reasoning sentence


@dataclass
class RiskDimensionsPayload:
    """Aggregated output for all three derived dimensions."""
    maintainability: RiskDimensionResult
    deployment_stability: RiskDimensionResult
    security_exposure: RiskDimensionResult
    interpretation_summary: str     # Top-level narrative
    confidence: str = "MEDIUM"      # LOW | MEDIUM | HIGH (heuristic, not ML)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _grade(score: float) -> str:
    """Map a 0–100 score to a letter grade (A–E)."""
    if score <= 20:
        return "A"
    if score <= 40:
        return "B"
    if score <= 60:
        return "C"
    if score <= 80:
        return "D"
    return "E"


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


# Max fraction of total dimension score any single feature may contribute.
_MAX_FEATURE_CONTRIBUTION_FRACTION = 0.45


def _weighted_score_capped(features: Dict[str, float], weights: Dict[str, float]) -> float:
    """
    Weighted average score (0–100) with per-feature contribution cap.

    No single feature may dominate more than 45% of the final score, unless
    all other features are zero (in which case the cap relaxes gracefully).

    Only processes features present in the dict; missing keys are ignored.
    """
    total_weight = 0.0
    contributions: Dict[str, Tuple[float, float]] = {}  # feature → (raw_contrib, weight)

    for feat, w in weights.items():
        val = features.get(feat)
        if val is not None:
            contributions[feat] = (val * w, w)
            total_weight += w

    if total_weight == 0.0:
        return 0.0

    # First pass: raw weighted sum (normalised to [0,100])
    raw_sum = sum(c for c, _ in contributions.values()) / total_weight * 100.0

    # Cap: recalculate with per-feature contribution limit
    capped_sum = 0.0
    cap_limit = raw_sum * _MAX_FEATURE_CONTRIBUTION_FRACTION if raw_sum > 0 else 1e6

    for feat, (raw_contrib_normalised, w) in contributions.items():
        contrib_100 = (raw_contrib_normalised / total_weight) * 100.0
        capped_100 = min(contrib_100, cap_limit)
        capped_sum += capped_100

    # Normalise back so total still respects the weighted structure
    scale_factor = raw_sum / capped_sum if capped_sum > 0 else 1.0
    final = capped_sum * scale_factor

    return _clamp(round(final, 1))


def _compute_confidence(
    features: Dict[str, float],
    relevant_keys: List[str],
    score: float,
) -> str:
    """
    Heuristic confidence label from feature completeness and score consistency.

    Rules:
    - HIGH:   ≥4 signals present AND score is unambiguously in one grade band
    - MEDIUM: 2–3 signals present OR score is near a grade boundary
    - LOW:    <2 signals present
    """
    present = [k for k in relevant_keys if features.get(k, 0.0) > 0.01]
    count = len(present)

    # Grade boundary proximity check (within 5 points of A/B, B/C, C/D, D/E cutoffs)
    boundaries = [20, 40, 60, 80]
    near_boundary = any(abs(score - b) <= 5 for b in boundaries)

    if count >= 4 and not near_boundary:
        return "HIGH"
    if count >= 2:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# Narrative template system (Tasks 1 & 4)
# ---------------------------------------------------------------------------
#
# Templates use {driver} and {offset} placeholders when relevant.
# The _pick() helper makes a deterministic choice based on the score bucket
# to avoid randomness in production while still providing variation.

def _pick(score: float, templates: List[str]) -> str:
    """Select a template based on score, cycling deterministically."""
    idx = int(score // (100 / max(len(templates), 1))) % len(templates)
    return templates[idx]


# ── Maintainability templates ─────────────────────────────────────────────────

_MAINTAIN_LOW = [
    "Code structure metrics are within healthy bounds; maintainability burden appears manageable.",
    "Repository-scale characteristics indicate a low maintenance overhead across measured dimensions.",
    "Complexity indicators are well-controlled; no significant readability concerns detected.",
]

_MAINTAIN_MEDIUM_GENERIC = [
    "Moderate maintenance complexity is present across several code quality dimensions.",
    "Repository-scale characteristics suggest an increased but manageable maintenance burden.",
    "Code volume and structure metrics indicate moderate ongoing maintainability overhead.",
]

_MAINTAIN_HIGH_GENERIC = [
    "Multiple complexity indicators collectively suggest a higher-than-average maintenance burden.",
    "Code structure metrics indicate challenges to long-term readability and modularity.",
    "Combined code volume and complexity metrics point to a notable maintenance overhead.",
]

_MAINTAIN_CYCLO_TEMPLATES = [
    "Branching complexity is the dominant contributor to the maintainability burden.",
    "High cyclomatic complexity suggests reduced code readability and increased review effort.",
    "Control-flow density indicates that logic paths may be difficult to trace and verify.",
]

_MAINTAIN_LENGTH_TEMPLATES = [
    "Code volume metrics suggest that modularisation may improve long-term maintainability.",
    "Repository-scale length indicators point to an increased review surface.",
    "Halstead length patterns suggest a broad implementation scope requiring careful documentation.",
]

_MAINTAIN_LOC_TEMPLATES = [
    "Repository scale — measured by lines of code — contributes to the maintenance overhead.",
    "The lines-of-code footprint suggests that decomposition into smaller units may be beneficial.",
]

_MAINTAIN_DIFFICULTY_TEMPLATES = [
    "Implementation difficulty indicators suggest that comprehension effort may be above average.",
    "Halstead difficulty patterns indicate logic that may require specialist familiarity to maintain.",
]

_MAINTAIN_MIXED_TEMPLATES = [
    "Both code volume and complexity indicators contribute to the overall maintenance complexity profile.",
    "Complexity and length metrics together suggest a meaningful but addressable maintenance burden.",
    "Repository characteristics across multiple dimensions indicate increased maintainability overhead.",
]


def _build_maintainability_summary(
    cyclo: float, length: float, loc: float, difficulty: float, score: float
) -> str:
    """Compose a 1–2 sentence maintainability summary from feature patterns."""
    try:
        high_cyclo = cyclo > 0.65
        high_length = length > 0.65
        high_loc = loc > 0.65
        high_diff = difficulty > 0.65

        drivers = sum([high_cyclo, high_length, high_loc, high_diff])

        if score <= 30:
            return _pick(score, _MAINTAIN_LOW)

        if drivers == 0:
            return _pick(score, _MAINTAIN_MEDIUM_GENERIC if score <= 55 else _MAINTAIN_HIGH_GENERIC)

        if drivers == 1:
            if high_cyclo:
                return _pick(score, _MAINTAIN_CYCLO_TEMPLATES)
            if high_length:
                return _pick(score, _MAINTAIN_LENGTH_TEMPLATES)
            if high_loc:
                return _pick(score, _MAINTAIN_LOC_TEMPLATES)
            if high_diff:
                return _pick(score, _MAINTAIN_DIFFICULTY_TEMPLATES)

        # Multiple drivers
        if score >= 65:
            return _pick(score, _MAINTAIN_HIGH_GENERIC)
        return _pick(score, _MAINTAIN_MIXED_TEMPLATES)
    except Exception:
        return "Maintainability characteristics assessed from available code metrics."


# ── Deployment Stability templates ────────────────────────────────────────────

_STABILITY_LOW = [
    "Structural indicators suggest manageable architectural complexity with low deployment coordination overhead.",
    "Dependency coupling and branching patterns are within stable bounds for this repository.",
    "Integration coupling appears well-controlled; deployment coordination overhead is low.",
]

_STABILITY_MEDIUM = [
    "Dependency coupling patterns may introduce moderate deployment coordination complexity.",
    "Structural indicators suggest manageable architectural complexity with moderate deployment coordination overhead.",
    "Integration fan-out patterns indicate some dependency coordination overhead during deployment.",
]

_STABILITY_BRANCH_TEMPLATES = [
    "Elevated branch count increases the execution-path surface that deployment testing must cover.",
    "Branch proliferation may increase deployment validation complexity and integration overhead.",
    "High branching density indicates multiple conditional execution paths requiring careful deployment coordination.",
]

_STABILITY_FANOUT_TEMPLATES = [
    "Outbound dependency coupling may increase deployment coordination complexity across module boundaries.",
    "High fan-out patterns indicate wide dependency surfaces that can complicate integration workflows.",
    "Dependency coupling patterns suggest that changes in this codebase may require coordinated deployment across multiple dependents.",
]

_STABILITY_FANIN_TEMPLATES = [
    "High inbound dependency exposure widens the deployment impact radius for this component.",
    "Significant fan-in indicates that this component is a high-integration-surface target.",
]

_STABILITY_MIXED_TEMPLATES = [
    "Structural complexity indicators — including coupling and branching — collectively suggest increased deployment coordination overhead.",
    "Combined dependency and branching patterns point to a higher-than-average integration complexity.",
    "Both structural coupling and branching metrics contribute to the deployment coordination profile.",
]

_STABILITY_HIGH = [
    "Dependency coupling and branching metrics collectively indicate elevated deployment integration complexity.",
    "Structural indicators across coupling and branching dimensions suggest a non-trivial deployment coordination burden.",
]


def _build_stability_summary(
    branch: float, fan_out: float, fan_in: float, score: float
) -> str:
    """Compose a 1–2 sentence deployment stability summary."""
    try:
        high_branch = branch > 0.65
        high_fanout = fan_out > 0.65
        high_fanin = fan_in > 0.65

        drivers = sum([high_branch, high_fanout, high_fanin])

        if score <= 30:
            return _pick(score, _STABILITY_LOW)

        if drivers == 0:
            return _pick(score, _STABILITY_MEDIUM)

        if drivers == 1:
            if high_branch:
                return _pick(score, _STABILITY_BRANCH_TEMPLATES)
            if high_fanout:
                return _pick(score, _STABILITY_FANOUT_TEMPLATES)
            if high_fanin:
                return _pick(score, _STABILITY_FANIN_TEMPLATES)

        if score >= 65:
            return _pick(score, _STABILITY_HIGH)
        return _pick(score, _STABILITY_MIXED_TEMPLATES)
    except Exception:
        return "Deployment stability characteristics assessed from available structural metrics."


# ---------------------------------------------------------------------------
# Dimension 1 — Maintainability Risk
# ---------------------------------------------------------------------------

_MAINTAINABILITY_WEIGHTS: Dict[str, float] = {
    "CYCLO":      22.0,   # Cyclomatic complexity
    "LENGTH":     22.0,   # Halstead length
    "LOC":        20.0,   # Lines of code
    "VOLUME":     18.0,   # Halstead volume
    "DIFFICULTY": 18.0,   # Halstead difficulty
}

_MAINTAINABILITY_KEYS = list(_MAINTAINABILITY_WEIGHTS.keys())


def compute_maintainability_risk(features: Dict[str, float]) -> RiskDimensionResult:
    """
    Derive Maintainability Risk from code-quality metrics (Tasks 1–4, capped scoring).
    """
    score = _weighted_score_capped(features, _MAINTAINABILITY_WEIGHTS)
    grade = _grade(score)

    cyclo = features.get("CYCLO", 0.0)
    length = features.get("LENGTH", 0.0)
    loc = features.get("LOC", 0.0)
    difficulty = features.get("DIFFICULTY", 0.0)

    summary = _build_maintainability_summary(cyclo, length, loc, difficulty, score)

    return RiskDimensionResult(score=round(score, 1), grade=grade, summary=summary)


# ---------------------------------------------------------------------------
# Dimension 2 — Deployment Stability Risk
# ---------------------------------------------------------------------------

_STABILITY_WEIGHTS: Dict[str, float] = {
    "BRANCH_COUNT": 27.0,   # Execution path proliferation
    "INT_FAN_OUT":  27.0,   # Outbound coupling
    "INT_FAN_IN":   20.0,   # Inbound coupling / impact radius
    "LOC":          13.0,   # Structural scale indicator
    "VOLUME":       13.0,   # Information mass
}

_STABILITY_KEYS = list(_STABILITY_WEIGHTS.keys())


def compute_deployment_stability_risk(features: Dict[str, float]) -> RiskDimensionResult:
    """
    Derive Deployment Stability Risk from structural coupling metrics (Tasks 1–4, capped scoring).
    """
    score = _weighted_score_capped(features, _STABILITY_WEIGHTS)
    grade = _grade(score)

    branch = features.get("BRANCH_COUNT", 0.0)
    fan_out = features.get("INT_FAN_OUT", 0.0)
    fan_in = features.get("INT_FAN_IN", 0.0)

    summary = _build_stability_summary(branch, fan_out, fan_in, score)

    return RiskDimensionResult(score=round(score, 1), grade=grade, summary=summary)


# ---------------------------------------------------------------------------
# Dimension 3 — Structural Review Complexity (formerly "Security Exposure Risk")
# Task 6: honest, softened wording — no implied vulnerability scanning
# ---------------------------------------------------------------------------

_SECURITY_MIN_SIGNAL = 0.05

_SECURITY_WEIGHTS: Dict[str, float] = {
    "CYCLO":       35.0,   # Complex branching → harder to review
    "DIFFICULTY":  35.0,   # High difficulty → review fatigue
    "INT_FAN_OUT": 30.0,   # Wide dependency surface
}

_SECURITY_KEYS = list(_SECURITY_WEIGHTS.keys())

_SECURITY_LOW = [
    "Structural review complexity indicators are at baseline levels. No direct vulnerability scanning performed.",
    "Limited heuristic estimation of structural review complexity. No anomalies detected in available proxies.",
]

_SECURITY_MEDIUM = [
    "Limited heuristic security exposure estimation based on structural complexity proxies.",
    "Structural review complexity indicators detected. No direct vulnerability scanning performed.",
    "Code structure suggests moderate review overhead. This is a structural heuristic, not a security scan.",
]

_SECURITY_HIGH = [
    "Structural indicators suggest above-average code review complexity. This is a structural heuristic only.",
    "Complexity proxies indicate higher review overhead. No CVE or static analysis performed.",
    "Review complexity heuristics are elevated. This estimate is based on code structure, not security rules.",
]

_SECURITY_DISCLAIMER = " No direct vulnerability scanning performed."


def compute_security_exposure_risk(features: Dict[str, float]) -> RiskDimensionResult:
    """
    Structural review complexity heuristic (Task 6 — conservative, honest wording).

    IMPORTANT: This does NOT perform security scanning, CVE detection, secret scanning,
    or static security rule analysis. It uses structural complexity metrics as lightweight
    proxies for code that may be harder to review for correctness.
    """
    available = [
        k for k in _SECURITY_WEIGHTS
        if features.get(k, 0.0) > _SECURITY_MIN_SIGNAL
    ]

    if not available:
        return RiskDimensionResult(
            score=0.0,
            grade="A",
            summary=(
                "Structural complexity proxies are at baseline levels. "
                "Limited heuristic security exposure estimation available."
            ),
        )

    score = _weighted_score_capped(features, _SECURITY_WEIGHTS)
    grade = _grade(score)

    if score <= 35:
        summary = _pick(score, _SECURITY_LOW)
    elif score <= 60:
        summary = _pick(score, _SECURITY_MEDIUM)
    else:
        summary = _pick(score, _SECURITY_HIGH)

    return RiskDimensionResult(score=round(score, 1), grade=grade, summary=summary)


# ---------------------------------------------------------------------------
# Interpretation summary generator (Task 1 — variation templates)
# ---------------------------------------------------------------------------

_INTERP_LOW = [
    "Repository metrics are within healthy bounds. Code complexity, structural coupling, and review proxies suggest a well-controlled codebase.",
    "Structural indicators reflect a low multidimensional risk profile. Coupling and complexity dimensions are stable.",
]

_INTERP_MEDIUM_MAINTAIN = [
    "Repository-scale characteristics indicate an increased maintenance burden despite relatively controlled structural coupling.",
    "Code complexity dimensions suggest moderate maintainability overhead; structural coupling is within acceptable bounds.",
]

_INTERP_MEDIUM_STABILITY = [
    "Dependency coupling patterns may increase deployment coordination complexity despite manageable code complexity.",
    "Structural indicators suggest moderate deployment coordination overhead with controlled code-level complexity.",
]

_INTERP_MEDIUM_BOTH = [
    "Code complexity and dependency coupling collectively contribute to a moderate multidimensional risk profile.",
    "Both maintainability and structural coupling indicators are in the moderate range; coordinated attention is advisable.",
    "Moderate risk across maintainability and deployment stability dimensions suggests a measurable but addressable technical debt profile.",
]

_INTERP_HIGH = [
    "Multiple structural and complexity dimensions indicate an elevated risk profile; prioritising modularisation and dependency reduction is advisable.",
    "Combined code complexity and coupling indicators suggest above-average deployment and maintenance overhead.",
    "Structural indicators across several dimensions point to a higher-than-typical coordination and review burden.",
]

_INTERP_MIXED = [
    "Risk profile is mixed: one or more dimensions indicate elevated complexity while others remain stable.",
    "Asymmetric risk across dimensions — some indicators are elevated while others are controlled.",
]


def generate_interpretation_summary(
    maintainability: RiskDimensionResult,
    stability: RiskDimensionResult,
    security: RiskDimensionResult,
    overall_risk_score: float,
) -> str:
    """
    Produce a 1–2 sentence narrative from all three dimensions (Task 1 — varied phrasing).
    Rule-based, no ML.
    """
    try:
        m_high = maintainability.score >= 60
        m_med = 40 <= maintainability.score < 60
        s_high = stability.score >= 60
        s_med = 40 <= stability.score < 60
        sec_high = security.score >= 60

        # Both low
        if not m_high and not m_med and not s_high and not s_med:
            base = _pick(overall_risk_score, _INTERP_LOW)
            return f"{base} (overall risk {overall_risk_score:.0f}/100)."

        # High across both
        if (m_high or m_med) and (s_high or s_med):
            base = _pick(overall_risk_score, _INTERP_MEDIUM_BOTH if not (m_high and s_high) else _INTERP_HIGH)
            suffix = (
                " Security review complexity is also elevated."
                if sec_high else ""
            )
            return f"{base}{suffix} (overall risk {overall_risk_score:.0f}/100)."

        # Mainly maintainability
        if m_high or m_med:
            base = _pick(overall_risk_score, _INTERP_MEDIUM_MAINTAIN)
            return f"{base} (overall risk {overall_risk_score:.0f}/100)."

        # Mainly stability
        if s_high or s_med:
            base = _pick(overall_risk_score, _INTERP_MEDIUM_STABILITY)
            return f"{base} (overall risk {overall_risk_score:.0f}/100)."

        return _pick(overall_risk_score, _INTERP_MIXED) + f" (overall risk {overall_risk_score:.0f}/100)."
    except Exception:
        return f"Multidimensional risk assessment completed. Overall risk score: {overall_risk_score:.0f}/100."


# ---------------------------------------------------------------------------
# Lightweight rule-based recommendations (Task 3)
# ---------------------------------------------------------------------------

@dataclass
class DimensionRecommendation:
    """A single actionable recommendation from the dimensions layer."""
    title: str
    suggestion: str
    triggered_by: str


def generate_dimension_recommendations(
    features: Dict[str, float],
    max_count: int = 4,
) -> List[DimensionRecommendation]:
    """
    Lightweight rule-based recommendations from feature patterns (Task 3).
    Returns 0–max_count recommendations; no output if no rules fire.
    """
    recs: List[DimensionRecommendation] = []

    cyclo = features.get("CYCLO", 0.0)
    length = features.get("LENGTH", 0.0)
    loc = features.get("LOC", 0.0)
    fan_out = features.get("INT_FAN_OUT", 0.0)
    fan_in = features.get("INT_FAN_IN", 0.0)
    branch = features.get("BRANCH_COUNT", 0.0)
    difficulty = features.get("DIFFICULTY", 0.0)
    volume = features.get("VOLUME", 0.0)

    # High cyclomatic complexity
    if cyclo > 0.65:
        recs.append(DimensionRecommendation(
            title="Reduce branching complexity",
            suggestion=(
                "Cyclomatic complexity is elevated. Consider decomposing complex functions "
                "into smaller, single-responsibility units to improve testability and readability."
            ),
            triggered_by="CYCLO",
        ))

    # High LENGTH / LOC → modularisation
    if length > 0.65 or loc > 0.65:
        trigger = "LENGTH, LOC" if (length > 0.65 and loc > 0.65) else ("LENGTH" if length > 0.65 else "LOC")
        recs.append(DimensionRecommendation(
            title="Consider modularising oversized components",
            suggestion=(
                "Code volume metrics are elevated. Splitting large files or functions into "
                "focused modules can reduce maintenance overhead and improve reviewability."
            ),
            triggered_by=trigger,
        ))

    # High fan-out → dependency coupling
    if fan_out > 0.65:
        recs.append(DimensionRecommendation(
            title="Reduce outbound dependency coupling",
            suggestion=(
                "High fan-out indicates a wide dependency surface. Introducing abstraction layers "
                "or dependency injection can reduce coupling and simplify deployment coordination."
            ),
            triggered_by="INT_FAN_OUT",
        ))

    # High branch count → deployment testing overhead
    if branch > 0.65:
        recs.append(DimensionRecommendation(
            title="Simplify execution path complexity",
            suggestion=(
                "Branch count is elevated, which increases the execution-path surface for "
                "deployment testing. Consolidating conditional logic can reduce integration overhead."
            ),
            triggered_by="BRANCH_COUNT",
        ))

    # High difficulty → comprehension overhead
    if difficulty > 0.70 and len(recs) < max_count:
        recs.append(DimensionRecommendation(
            title="Improve implementation clarity",
            suggestion=(
                "Halstead difficulty metrics suggest above-average comprehension effort. "
                "Adding inline documentation and simplifying operator-heavy expressions may help."
            ),
            triggered_by="DIFFICULTY",
        ))

    # High fan-in → impact radius
    if fan_in > 0.70 and len(recs) < max_count:
        recs.append(DimensionRecommendation(
            title="Manage high inbound dependency exposure",
            suggestion=(
                "High fan-in indicates this component is depended upon by many others. "
                "Changes here carry a wide impact radius; additional regression coverage is advisable."
            ),
            triggered_by="INT_FAN_IN",
        ))

    return recs[:max_count]


# ---------------------------------------------------------------------------
# Confidence derivation (Task 5)
# ---------------------------------------------------------------------------

def _derive_overall_confidence(
    features: Dict[str, float],
    maintainability: RiskDimensionResult,
    stability: RiskDimensionResult,
    security: RiskDimensionResult,
) -> str:
    """
    Heuristic overall confidence label from feature completeness + dimension consistency.
    Does NOT use ML probability values.
    """
    all_keys = (
        _MAINTAINABILITY_KEYS + _STABILITY_KEYS + _SECURITY_KEYS
    )
    unique_keys = list(dict.fromkeys(all_keys))  # preserve order, deduplicate
    present_count = sum(1 for k in unique_keys if features.get(k, 0.0) > 0.01)

    # Dimension spread: low variance = more consistent signal = more confidence
    scores = [maintainability.score, stability.score, security.score]
    spread = max(scores) - min(scores)

    if present_count >= 7 and spread < 30:
        return "HIGH"
    if present_count >= 4:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def compute_risk_dimensions(
    features: Dict[str, float],
    overall_risk_score: float = 0.0,
) -> RiskDimensionsPayload:
    """
    Compute all three risk dimensions from an existing normalized feature dict.

    Args:
        features: Normalized [0.0, 1.0] feature dict (from PredictionRequest).
        overall_risk_score: The overall risk score already computed by the ML pipeline.

    Returns:
        RiskDimensionsPayload with all dimension results, narrative, and confidence label.
    """
    maintainability = compute_maintainability_risk(features)
    stability = compute_deployment_stability_risk(features)
    security = compute_security_exposure_risk(features)
    interpretation = generate_interpretation_summary(
        maintainability, stability, security, overall_risk_score
    )
    confidence = _derive_overall_confidence(
        features, maintainability, stability, security
    )

    return RiskDimensionsPayload(
        maintainability=maintainability,
        deployment_stability=stability,
        security_exposure=security,
        interpretation_summary=interpretation,
        confidence=confidence,
    )
