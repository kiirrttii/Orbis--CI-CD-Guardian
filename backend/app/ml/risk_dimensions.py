"""
Risk Dimensions Interpreter.

Lightweight heuristic layer that derives three additional risk dimensions
from already-computed, normalized [0.0, 1.0] feature metrics.

This module is a READ-ONLY tap — it never modifies the core prediction
pipeline, ML model, or database schema.

Dimensions:
  1. Maintainability Risk    — CYCLO, LENGTH, LOC, VOLUME, DIFFICULTY
  2. Deployment Stability Risk — BRANCH_COUNT, INT_FAN_IN, INT_FAN_OUT, LOC, VOLUME
  3. Security Exposure Risk  — Conservative lightweight heuristic; returns
                               a "not enough signals" message when indicators
                               are insufficient rather than fabricating results.

Grading scale (A–E):
   0–20  → A  (Very Low)
  21–40  → B  (Low)
  41–60  → C  (Moderate)
  61–80  → D  (High)
  81–100 → E  (Critical)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional


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


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_UNAVAILABLE_SCORE = -1.0   # sentinel — means "could not compute"

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


def _weighted_score(features: Dict[str, float], weights: Dict[str, float]) -> float:
    """
    Compute a weighted average score (0–100) from normalized [0,1] features.

    Only uses features that are present in the features dict; missing keys
    contribute 0 to the numerator but also reduce the effective denominator
    (so sparse data doesn't artificially inflate or deflate the result).
    """
    numerator = 0.0
    denominator = 0.0
    for feature, weight in weights.items():
        val = features.get(feature)
        if val is not None:
            numerator += val * weight
            denominator += weight

    if denominator == 0.0:
        return 0.0

    return _clamp((numerator / denominator) * 100.0)


# ---------------------------------------------------------------------------
# Dimension 1 — Maintainability Risk
# ---------------------------------------------------------------------------

_MAINTAINABILITY_WEIGHTS: Dict[str, float] = {
    "CYCLO":      25.0,   # Cyclomatic complexity — main driver
    "LENGTH":     25.0,   # Halstead length — code volume proxy
    "LOC":        20.0,   # Lines of code — raw size
    "VOLUME":     15.0,   # Halstead volume — information content
    "DIFFICULTY": 15.0,   # Halstead difficulty — comprehension effort
}


def compute_maintainability_risk(features: Dict[str, float]) -> RiskDimensionResult:
    """
    Derive a Maintainability Risk score from code-quality metrics.
    Higher CYCLO, LENGTH, LOC, VOLUME, and DIFFICULTY → harder to maintain.
    """
    score = _weighted_score(features, _MAINTAINABILITY_WEIGHTS)
    grade = _grade(score)

    # ── Build a reasoning summary ──────────────────────────────────────────
    cyclo = features.get("CYCLO", 0.0)
    length = features.get("LENGTH", 0.0)
    loc = features.get("LOC", 0.0)
    difficulty = features.get("DIFFICULTY", 0.0)

    reasons: list[str] = []
    if cyclo > 0.65:
        reasons.append("high cyclomatic complexity")
    if length > 0.65:
        reasons.append("elevated code length")
    if loc > 0.65:
        reasons.append("large lines-of-code footprint")
    if difficulty > 0.65:
        reasons.append("elevated implementation difficulty")

    if not reasons:
        if score <= 30:
            summary = "Code metrics indicate healthy maintainability characteristics."
        elif score <= 55:
            summary = "Moderate maintainability concerns present across code quality dimensions."
        else:
            summary = "Multiple code quality indicators suggest maintainability challenges."
    else:
        driver = " and ".join(reasons[:2])
        if score >= 60:
            summary = f"Significant maintainability risk driven by {driver}."
        else:
            summary = f"Moderate maintainability concerns due to {driver}."

    return RiskDimensionResult(score=round(score, 1), grade=grade, summary=summary)


# ---------------------------------------------------------------------------
# Dimension 2 — Deployment Stability Risk
# ---------------------------------------------------------------------------

_STABILITY_WEIGHTS: Dict[str, float] = {
    "BRANCH_COUNT":  30.0,   # Execution path proliferation
    "INT_FAN_OUT":   30.0,   # Outbound coupling — fragility from dependencies
    "INT_FAN_IN":    20.0,   # Inbound coupling — impact radius if changed
    "LOC":           10.0,   # Size as a structural scale indicator
    "VOLUME":        10.0,   # Information mass
}


def compute_deployment_stability_risk(features: Dict[str, float]) -> RiskDimensionResult:
    """
    Derive a Deployment Stability Risk score from structural coupling metrics.
    High branch counts and fan-out indicate brittle, hard-to-predict deployment behavior.
    """
    score = _weighted_score(features, _STABILITY_WEIGHTS)
    grade = _grade(score)

    # ── Build a reasoning summary ──────────────────────────────────────────
    branch = features.get("BRANCH_COUNT", 0.0)
    fan_out = features.get("INT_FAN_OUT", 0.0)
    fan_in = features.get("INT_FAN_IN", 0.0)

    reasons: list[str] = []
    if branch > 0.65:
        reasons.append("elevated branch count")
    if fan_out > 0.65:
        reasons.append("high outbound dependency coupling")
    if fan_in > 0.65:
        reasons.append("high inbound dependency exposure")

    if not reasons:
        if score <= 30:
            summary = "Structural indicators suggest stable deployment characteristics."
        elif score <= 55:
            summary = "Moderate structural complexity may introduce occasional deployment variability."
        else:
            summary = "Structural dependency indicators suggest moderate deployment instability potential."
    else:
        driver = " and ".join(reasons[:2])
        if score >= 60:
            summary = f"Elevated deployment instability risk inferred from {driver}."
        else:
            summary = f"Moderate deployment instability potential due to {driver}."

    return RiskDimensionResult(score=round(score, 1), grade=grade, summary=summary)


# ---------------------------------------------------------------------------
# Dimension 3 — Security Exposure Risk (conservative / lightweight)
# ---------------------------------------------------------------------------

# Minimum threshold: at least one signal must be meaningfully non-zero
_SECURITY_MIN_SIGNAL = 0.05

_SECURITY_WEIGHTS: Dict[str, float] = {
    "CYCLO":       35.0,   # Complex branching → harder to audit for security flaws
    "DIFFICULTY":  35.0,   # High difficulty → obscure logic, review fatigue
    "INT_FAN_OUT": 30.0,   # Many external dependencies → wider attack surface
}


def compute_security_exposure_risk(features: Dict[str, float]) -> RiskDimensionResult:
    """
    Conservative, lightweight Security Exposure Risk heuristic.

    IMPORTANT: This does NOT perform real security scanning.
    It uses structural complexity proxies (cyclomatic complexity, difficulty,
    and fan-out) as indicators of code that is harder to audit for security issues.

    Returns a 'Not enough security indicators' message when signals are insufficient
    rather than fabricating a false-positive score.
    """
    # Check if we have meaningful signal
    available = [
        features.get(k, 0.0)
        for k in _SECURITY_WEIGHTS
        if features.get(k, 0.0) > _SECURITY_MIN_SIGNAL
    ]

    if not available:
        return RiskDimensionResult(
            score=0.0,
            grade="A",
            summary=(
                "Not enough security indicators available. "
                "Structural complexity proxies are at baseline levels."
            ),
        )

    score = _weighted_score(features, _SECURITY_WEIGHTS)
    grade = _grade(score)

    cyclo = features.get("CYCLO", 0.0)
    difficulty = features.get("DIFFICULTY", 0.0)
    fan_out = features.get("INT_FAN_OUT", 0.0)

    reasons: list[str] = []
    if cyclo > 0.65:
        reasons.append("complex branching logic that may be harder to audit")
    if difficulty > 0.65:
        reasons.append("high implementation difficulty increasing review burden")
    if fan_out > 0.65:
        reasons.append("wide external dependency surface")

    if not reasons:
        summary = "No major security-related structural anomalies detected based on available proxy signals."
    elif score >= 60:
        summary = (
            f"Structural proxies indicate elevated security review burden due to "
            f"{' and '.join(reasons[:2])}. "
            "Note: this is a heuristic estimate, not a security scan."
        )
    else:
        summary = (
            f"Mild security review complexity suggested by {reasons[0]}. "
            "No critical structural anomalies detected."
        )

    return RiskDimensionResult(score=round(score, 1), grade=grade, summary=summary)


# ---------------------------------------------------------------------------
# Interpretation summary generator
# ---------------------------------------------------------------------------

def generate_interpretation_summary(
    maintainability: RiskDimensionResult,
    stability: RiskDimensionResult,
    security: RiskDimensionResult,
    overall_risk_score: float,
) -> str:
    """
    Produce a single narrative sentence summarising all three dimensions
    relative to the overall risk score. Rule-based, no ML.
    """
    dominant: list[str] = []
    offsets: list[str] = []

    if maintainability.score >= 60:
        dominant.append("elevated code maintainability complexity")
    elif maintainability.score >= 40:
        dominant.append("moderate code complexity")

    if stability.score >= 60:
        dominant.append("architectural scale and dependency coupling")
    elif stability.score >= 40:
        dominant.append("moderate structural dependency indicators")

    if security.score >= 60:
        dominant.append("high code audit complexity")

    if maintainability.score < 40:
        offsets.append("controlled code complexity")
    if stability.score < 40:
        offsets.append("stable dependency structure")

    if not dominant:
        return (
            f"Low multidimensional risk profile detected. "
            f"Code complexity, structural coupling, and security proxies "
            f"are within healthy bounds (overall risk {overall_risk_score:.0f}/100)."
        )

    driver_text = ", ".join(dominant)
    summary = f"Moderate-to-elevated deployment risk inferred due to {driver_text}"

    if offsets:
        offset_text = " and ".join(offsets)
        summary += f", partially offset by {offset_text}"

    summary += f" (overall risk score {overall_risk_score:.0f}/100)."
    return summary


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
        RiskDimensionsPayload with all three dimension results + interpretation summary.
    """
    maintainability = compute_maintainability_risk(features)
    stability = compute_deployment_stability_risk(features)
    security = compute_security_exposure_risk(features)
    interpretation = generate_interpretation_summary(
        maintainability, stability, security, overall_risk_score
    )

    return RiskDimensionsPayload(
        maintainability=maintainability,
        deployment_stability=stability,
        security_exposure=security,
        interpretation_summary=interpretation,
    )
