# Deep Dive: Persistence & Data Model Analysis

This document provides a comprehensive breakdown of the persistence layer, data models, and orchestration flow for the DevSecOps intelligence system.

---

## 1. Intelligence Repository — save_intelligence_payload()

**File:** [backend/app/repositories/intelligence_repo.py](backend/app/repositories/intelligence_repo.py#L24-L54)

### Complete Method

```python
async def save_intelligence_payload(
    self,
    prediction: Prediction,
    feature_contributions: List[FeatureContribution],
    recommendations: List[Recommendation]
) -> Prediction:
    """
    Atomically saves the prediction and its associated explainability
    and recommendations.
    """

    # Add prediction first
    self.session.add(prediction)

    # Flush so prediction.id becomes available
    await self.session.flush()

    # Attach feature contributions
    for fc in feature_contributions:
        fc.prediction_id = prediction.id
        self.session.add(fc)

    # Attach recommendations
    for rec in recommendations:
        rec.prediction_id = prediction.id
        self.session.add(rec)

    await self.session.flush()

    return prediction
```

### What Fields Are Being Saved?

**Prediction Record:**
- `workflow_run_id` — FK to WorkflowRun
- `model_name`, `model_version` — Model provenance
- `risk_score` (0–100) — Final risk quantification
- `severity` — LOW | MEDIUM | HIGH | CRITICAL
- `analysis_type` — manual | repository | upload | metrics
- `confidence`, `confidence_level` — ML confidence metrics
- `failure_probability` (0–1) — Raw model probability
- `predicted_label` — "pass" | "fail"
- `raw_output` — JSON field for extensibility
- Plus standard BaseModel fields: `id`, `created_at`, `updated_at`

**Feature Contributions (linked via prediction_id):**
- `feature_name` — Name of the metric (LOC, CYCLO, etc.)
- `feature_value` — Original feature value from input
- `contribution_value` — SHAP value
- `impact_percent` — Normalized contribution magnitude
- `contribution_rank` — Ordinal position (1-indexed)
- `direction` — "increase_risk" or "decrease_risk"
- `interpretation` — Human-readable explanation

**Recommendations (linked via prediction_id):**
- `title`, `description` — Recommendation content
- `action_type` — Category of action (e.g., refactor, testing)
- `priority` — LOW | MEDIUM | HIGH | CRITICAL
- `status` — GENERATED | ACKNOWLEDGED | APPLIED | DISMISSED
- `confidence_score` — Optional confidence in recommendation
- `sort_order` — Display order

### Payload JSON Structure

**Currently:** No JSON payload field is used during persistence. Instead, data is **normalized into relational tables**:

```
Prediction
├── FeatureContribution[]  (one-to-many, cascade delete)
└── Recommendation[]       (one-to-many, cascade delete)
```

**The complete intelligence payload is reconstructed at API response time** by the orchestrator (see Section 5).

---

## 2. Prediction Model (ORM)

**File:** [backend/app/models/prediction.py](backend/app/models/prediction.py#L1-L70)

### Complete Model Definition

```python
class Prediction(BaseModel):
    """
    ML model prediction for a workflow run.
    Stores risk score, binary label, and raw model probabilities.
    """

    __tablename__ = "predictions"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Model Versioning ──────────────────────────────────────────────────────
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    model_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v1"
    )

    # ── Prediction Output ─────────────────────────────────────────────────────
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)          # 0.0–100.0
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="LOW")
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence_level: Mapped[str] = mapped_column(String(20), nullable=False, default="LOW")
    failure_probability: Mapped[float] = mapped_column(Float, nullable=False) # 0.0–1.0
    predicted_label: Mapped[str] = mapped_column(String(50), nullable=False)  # "pass" | "fail"

    raw_output: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    workflow_run: Mapped["WorkflowRun"] = relationship(
        "WorkflowRun", back_populates="predictions"
    )
    feature_contributions: Mapped[List["FeatureContribution"]] = relationship(
        "FeatureContribution",
        back_populates="prediction",
        cascade="all, delete-orphan",
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="prediction",
        cascade="all, delete-orphan",
    )
```

### Current Fields

✅ **Core Prediction:**
- `risk_score`, `severity`, `failure_probability`, `predicted_label`

✅ **Confidence Fields:**
- `confidence` (0–1 score)
- `confidence_level` (LOW | MEDIUM | HIGH)

✅ **Analysis Metadata:**
- `analysis_type` (manual, repository, upload, metrics)
- `model_version` (for traceability)

✅ **Extensibility:**
- `raw_output` (JSON field for any additional model outputs)

❌ **NOT stored directly in Prediction table:**
- Risk dimensions (separate computation, cached in response only)
- SHAP values (stored in `feature_contributions` table)

---

## 3. Analysis Service/Orchestration — compute_risk_dimensions()

**File:** [backend/app/ml/risk_dimensions.py](backend/app/ml/risk_dimensions.py#L1-L50)

### Complete Function Call & Integration

**Called in orchestrator:** [backend/app/intelligence/orchestrator.py](backend/app/intelligence/orchestrator.py#L97-L150)

```python
# 3.5 Risk Dimensions (additive interpretation layer — fault-tolerant)
feature_dict = request.to_feature_dict()
risk_dimensions_payload = None
try:
    dims = compute_risk_dimensions(
        features=feature_dict,
        overall_risk_score=inference_result.risk_score,
    )
    # Convert dataclasses to Pydantic-compatible dicts for schema validation
    from app.schemas.intelligence import RiskDimensionsPayload, RiskDimensionResult as RDR
    risk_dimensions_payload = RiskDimensionsPayload(
        maintainability=RDR(
            score=dims.maintainability.score,
            grade=dims.maintainability.grade,
            summary=dims.maintainability.summary,
        ),
        deployment_stability=RDR(
            score=dims.deployment_stability.score,
            grade=dims.deployment_stability.grade,
            summary=dims.deployment_stability.summary,
        ),
        security_exposure=RDR(
            score=dims.security_exposure.score,
            grade=dims.security_exposure.grade,
            summary=dims.security_exposure.summary,
        ),
        interpretation_summary=dims.interpretation_summary,
        confidence=dims.confidence,
    )
    logger.info("risk_dimensions_computed", grades={
        "maintainability": dims.maintainability.grade,
        "deployment_stability": dims.deployment_stability.grade,
        "security_exposure": dims.security_exposure.grade,
        "confidence": dims.confidence,
    })
except Exception as exc:
    logger.warning("risk_dimensions_failed", error=str(exc))
    risk_dimensions_payload = None
```

### Complete compute_risk_dimensions() Implementation

```python
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
```

### What Does It Return?

```python
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
```

### The Three Dimensions

**1. Maintainability Risk** (code quality metrics)
- Features: CYCLO (22%), LENGTH (22%), LOC (20%), VOLUME (18%), DIFFICULTY (18%)
- Grade scale: A (0–20) = Very Low, ..., E (81–100) = Critical

**2. Deployment Stability Risk** (structural coupling)
- Features: BRANCH_COUNT (27%), INT_FAN_OUT (27%), INT_FAN_IN (20%), LOC (13%), VOLUME (13%)
- Measures: execution path proliferation, dependency coupling, impact radius

**3. Structural Review Complexity** (review effort heuristic)
- Features: CYCLO (35%), DIFFICULTY (35%), INT_FAN_OUT (30%)
- **Important:** NO direct vulnerability scanning — structural complexity proxy only

### When Is It Called in the Pipeline?

**Pipeline order:**
1. **Inference** — ML model predicts risk_score
2. **SHAP Analysis** — Generate explanations
3. **Recommendations** — Generate actionable insights
4. **Risk Dimensions** (Step 3.5) — Compute at end, **fault-tolerant** (doesn't break analysis if it fails)
5. **Persistence** — Save everything to DB
6. **Assembly** — Return IntelligenceResponse

### Is It Included in Final Response?

✅ **YES** — Included in `IntelligenceResponse.risk_dimensions` (optional field)

```python
risk_dimensions: Optional[RiskDimensionsPayload] = Field(
    default=None,
    description="Derived multidimensional risk interpretation (additive, optional)",
)
```

---

## 4. History API Response Mapping

**File:** [backend/app/api/v1/endpoints/history.py](backend/app/api/v1/endpoints/history.py#L1-L150)

### History API Endpoints

**GET `/history/`** — List historical analyses (paginated, lightweight)

```python
@router.get(
    "/",
    response_model=List[IntelligenceResponse],
    summary="List historical analyses",
)
async def list_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[IntelligenceResponse]:
```

**GET `/history/{prediction_id}`** — Get full details

```python
@router.get(
    "/{prediction_id}",
    response_model=IntelligenceResponse,
    summary="Get detailed analysis report",
)
async def get_history_detail(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IntelligenceResponse:
```

### Response Schema — IntelligenceResponse

**File:** [backend/app/schemas/intelligence.py](backend/app/schemas/intelligence.py#L44-L56)

```python
class IntelligenceResponse(BaseModel):
    """
    Orchestrated intelligence output including inference, explainability, and recommendations.
    """
    workflow_run_id: uuid.UUID = Field(..., description="ID of the workflow run")
    prediction_id: uuid.UUID = Field(..., description="ID of the persisted prediction")
    target_name: str = Field(default="Unknown Target", description="Meaningful name for the analysis target")
    
    inference: PredictionResponse = Field(..., description="Raw model prediction and risk score")
    explainability: List[FeatureContributionSchema] = Field(..., description="SHAP feature contributions")
    recommendations: List[ActionableInsight] = Field(..., description="Prioritized recommendations")
    
    # Optional additive extension — never breaks existing consumers
    risk_dimensions: Optional[RiskDimensionsPayload] = Field(
        default=None,
        description="Derived multidimensional risk interpretation (additive, optional)",
    )
```

### How Predictions Are Converted to API Responses

**In list view** (lightweight):

```python
for pred in history:
    results.append(
        IntelligenceResponse(
            workflow_run_id=pred.workflow_run_id,
            prediction_id=pred.id,
            target_name=target_name,
            inference=PredictionResponse(
                prediction=int(pred.predicted_label == "fail"),
                probability=pred.failure_probability,
                risk_score=pred.risk_score,
                severity=pred.severity,
                analysis_type=pred.analysis_type,
                confidence=pred.confidence,
                confidence_level=pred.confidence_level,
                model_version=pred.model_version,
                timestamp=pred.created_at
            ),
            explainability=[], # Omit details in list view for performance
            recommendations=[] 
        )
    )
```

**In detail view** (full):

```python
return IntelligenceResponse(
    workflow_run_id=pred.workflow_run_id,
    prediction_id=pred.id,
    target_name=target_name,
    inference=PredictionResponse(
        prediction=int(pred.predicted_label == "fail"),
        probability=pred.failure_probability,
        risk_score=pred.risk_score,
        severity=pred.severity,
        analysis_type=pred.analysis_type,
        confidence=pred.confidence,
        confidence_level=pred.confidence_level,
        model_version=pred.model_version,
        timestamp=pred.created_at
    ),
    explainability=[
        # Map FeatureContribution ORM → FeatureContributionSchema
    ],
    recommendations=[
        # Map Recommendation ORM → ActionableInsight
    ],
    # Optional: risk_dimensions (if computed and cached during initial analysis)
)
```

### ORM → API Mapping Details

**Prediction ORM** → **PredictionResponse (Pydantic):**
- `pred.predicted_label` → `prediction` (int: 0 or 1)
- `pred.failure_probability` → `probability` (0–1)
- `pred.risk_score` → `risk_score` (0–100)
- `pred.severity` → `severity` (enum)
- `pred.analysis_type` → `analysis_type` (string)
- `pred.confidence` → `confidence` (0–1)
- `pred.confidence_level` → `confidence_level` (LOW|MEDIUM|HIGH)
- `pred.model_version` → `model_version` (string)
- `pred.created_at` → `timestamp` (datetime)

**FeatureContribution ORM** → **FeatureContributionSchema (Pydantic):**
- `fc.feature_name` → `feature`
- `fc.contribution_value` → `shap_value`
- `fc.impact_percent` → `impact_percent`
- `fc.interpretation` → `interpretation`
- `fc.direction` → `direction`

**Recommendation ORM** → **ActionableInsight (Pydantic):**
- `rec.title` → `title`
- `rec.description` (parsed) → `explanation`, `impact`, `suggested_action`
- `rec.priority` → `priority`
- `rec.action_type` → `action_type`

---

## 5. Current Analysis Response Format

**File:** [backend/app/schemas/intelligence.py](backend/app/schemas/intelligence.py#L1-L56)

### Complete IntelligenceResponse Structure

```python
class IntelligenceResponse(BaseModel):
    """
    Orchestrated intelligence output including inference, explainability, and recommendations.
    """
    workflow_run_id: uuid.UUID = Field(..., description="ID of the workflow run")
    prediction_id: uuid.UUID = Field(..., description="ID of the persisted prediction")
    target_name: str = Field(default="Unknown Target", description="Meaningful name for the analysis target (e.g., repository name)")
    
    # Core inference result
    inference: PredictionResponse = Field(..., description="Raw model prediction and risk score")
    
    # Explainability (SHAP-style feature contributions)
    explainability: List[FeatureContributionSchema] = Field(..., description="SHAP feature contributions")
    
    # Recommendations
    recommendations: List[ActionableInsight] = Field(..., description="Prioritized recommendations")
    
    # Optional additive extension — never breaks existing consumers
    risk_dimensions: Optional[RiskDimensionsPayload] = Field(
        default=None,
        description="Derived multidimensional risk interpretation (additive, optional)",
    )
```

### PredictionResponse Schema

**File:** [backend/app/schemas/prediction.py](backend/app/schemas/prediction.py#L120-L180)

```python
class PredictionResponse(BaseModel):
    """Structured ML inference result."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prediction": 1,
                "probability": 0.82,
                "risk_score": 82.0,
                "severity": "CRITICAL",
                "model_version": "v1",
                "timestamp": "2026-05-09T18:42:15Z"
            }
        }
    )

    prediction: int = Field(
        ...,
        description="Binary prediction: 1 = defect-risk detected, 0 = no risk",
    )
    probability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Failure probability from model.predict_proba()",
    )
    risk_score: float = Field(
        ..., ge=0.0, le=100.0,
        description="Risk score = probability × 100",
    )
    severity: RiskSeverity = Field(
        ...,
        description="Severity band: LOW | MEDIUM | HIGH | CRITICAL",
    )
    analysis_type: str = Field(
        default="manual",
        description="Type of analysis performed (e.g., repository, telemetry, metrics)",
    )
    confidence: float = Field(
        default=0.0,
        description="Prediction confidence score [0.0, 1.0]",
    )
    confidence_level: str = Field(
        default="LOW",
        description="Readable confidence band: LOW | MEDIUM | HIGH",
    )
    model_version: str = Field(
        default="v1",
        description="Model version tag for traceability",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Time when the prediction was generated"
    )
    # Reserved for future SHAP integration
    feature_contributions: Optional[dict[str, float]] = Field(
        default=None,
        description="Per-feature SHAP contributions (populated in Phase 3)",
    )
```

### FeatureContributionSchema

**File:** [backend/app/schemas/explainability.py](backend/app/schemas/explainability.py#L1-L40)

```python
class FeatureContributionSchema(BaseModel):
    """
    A single feature's contribution to the predicted risk.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "feature": "CYCLO",
                "shap_value": 0.18,
                "impact_percent": 22.4,
                "direction": "increase_risk"
            }
        }
    )

    feature: str = Field(..., description="Name of the feature")
    shap_value: float = Field(..., description="Absolute magnitude of the SHAP contribution")
    impact_percent: float = Field(..., description="Percentage of total absolute SHAP impact")
    interpretation: str = Field("", description="Human-readable interpretation of the feature's impact")
    direction: Literal["increase_risk", "decrease_risk"] = Field(
        ..., description="Direction of the contribution"
    )
```

### ActionableInsight (Recommendations)

**File:** [backend/app/schemas/recommendation.py](backend/app/schemas/recommendation.py#L1-L35)

```python
class ActionableInsight(BaseModel):
    """
    A single recommendation to mitigate deployment risk.
    """
    title: str = Field(..., description="Short, descriptive title of the recommendation")
    explanation: str = Field(..., description="Plain-English explanation of what this issue means")
    impact: str = Field(..., description="Operational consequence if ignored (Why it matters)")
    suggested_action: str = Field(..., description="Explicit, actionable steps to resolve the issue")
    triggered_by: List[str] = Field(default_factory=list, description="The operational signals that triggered this recommendation")
    priority: RecommendationPriority = Field(..., description="Priority level of the recommendation")
    action_type: str = Field(..., description="Category of action (e.g., refactor, testing, review)")
```

### RiskDimensionsPayload (New Optional Field)

**File:** [backend/app/schemas/intelligence.py](backend/app/schemas/intelligence.py#L19-L42)

```python
class RiskDimensionResult(BaseModel):
    """
    Score, grade, and reasoning for a single derived risk dimension.
    """
    score: float = Field(..., ge=0.0, le=100.0, description="Heuristic risk score (0–100)")
    grade: str = Field(..., description="Letter grade: A (best) through E (worst)")
    summary: str = Field(..., description="Short plain-English reasoning for this dimension")


class RiskDimensionsPayload(BaseModel):
    """
    Aggregated payload for all three derived risk dimensions.
    Populated as an optional extension on IntelligenceResponse.
    """
    maintainability: RiskDimensionResult = Field(..., description="Maintainability risk (CYCLO, LENGTH, LOC, VOLUME, DIFFICULTY)")
    deployment_stability: RiskDimensionResult = Field(..., description="Deployment stability risk (BRANCH_COUNT, INT_FAN_IN, INT_FAN_OUT, LOC, VOLUME)")
    security_exposure: RiskDimensionResult = Field(..., description="Structural review complexity (conservative heuristic proxy; no vulnerability scanning)")
    interpretation_summary: str = Field(..., description="Top-level narrative summarising all three dimensions")
    # Heuristic confidence — NOT derived from ML probabilities
    confidence: str = Field(
        default="MEDIUM",
        description="Heuristic confidence label: LOW | MEDIUM | HIGH (based on feature completeness)",
    )
```

### Example JSON Response

```json
{
  "workflow_run_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "target_name": "my-repo",
  "inference": {
    "prediction": 1,
    "probability": 0.82,
    "risk_score": 82.0,
    "severity": "CRITICAL",
    "analysis_type": "manual",
    "confidence": 0.78,
    "confidence_level": "HIGH",
    "model_version": "v1",
    "timestamp": "2026-05-09T18:42:15Z"
  },
  "explainability": [
    {
      "feature": "CYCLO",
      "shap_value": 0.18,
      "impact_percent": 22.4,
      "direction": "increase_risk",
      "interpretation": "High cyclomatic complexity increases test coverage requirements"
    }
  ],
  "recommendations": [
    {
      "title": "Reduce branching complexity",
      "explanation": "Cyclomatic complexity is elevated",
      "impact": "Reduced code maintainability and deployment risk",
      "suggested_action": "Refactor complex functions into smaller units",
      "triggered_by": ["CYCLO"],
      "priority": "HIGH",
      "action_type": "refactor"
    }
  ],
  "risk_dimensions": {
    "maintainability": {
      "score": 68.5,
      "grade": "D",
      "summary": "Multiple complexity indicators suggest elevated maintenance burden"
    },
    "deployment_stability": {
      "score": 55.2,
      "grade": "C",
      "summary": "Moderate structural coupling; deployment coordination complexity is manageable"
    },
    "security_exposure": {
      "score": 72.1,
      "grade": "D",
      "summary": "Structural review complexity is elevated; code review effort will be higher"
    },
    "interpretation_summary": "Repository metrics show a mixed risk profile with elevated code complexity but manageable deployment footprint",
    "confidence": "HIGH"
  }
}
```

---

## Summary Table

| Component | File | Current State |
|-----------|------|---------------|
| **Persistence** | `intelligence_repo.py` | ✅ Atomic transactions for Prediction + FeatureContribution + Recommendation |
| **Prediction Model** | `prediction.py` | ✅ Stores risk_score, severity, confidence, failure_probability, predicted_label |
| **Risk Dimensions** | `risk_dimensions.py` | ✅ Computes 3 dimensions; **NOT persisted to DB** (response-only) |
| **Analysis Response** | `intelligence.py` | ✅ Includes inference, explainability, recommendations, optional risk_dimensions |
| **History API** | `history.py` | ✅ Lists predictions; detail view reconstructs full IntelligenceResponse |
| **Feature Contributions** | `feature_contribution.py` | ✅ Stores SHAP values, direction, interpretation per prediction |
| **Recommendations** | `recommendation.py` | ✅ Stores title, description, priority, status per prediction |

---

## Key Architectural Decisions

1. **Risk Dimensions are NOT persisted** — They are computed on-demand during analysis and included in the response. Future versions could cache them.

2. **Atomic persistence** — All three entities (Prediction, FeatureContribution, Recommendation) are saved in a single flush operation to ensure consistency.

3. **Fault-tolerant enrichment** — Risk dimensions are wrapped in try-catch; if computation fails, the analysis still succeeds and returns without them.

4. **Additive API evolution** — `risk_dimensions` is an optional field in `IntelligenceResponse`, so existing clients continue to work if the field is absent.

5. **No JSON payload field** — Data is normalized across relational tables, ensuring queryability and consistency.

