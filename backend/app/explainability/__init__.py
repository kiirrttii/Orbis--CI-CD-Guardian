"""
Explainability package — SHAP integration scaffold (Phase 3).

This module will provide:
  - SHAP TreeExplainer wrappers for XGBoost models
  - Per-feature contribution computation
  - Contribution ranking and direction tagging
  - Integration with the Prediction → FeatureContribution ORM pipeline

Current state: scaffold only.
The predictor.py SHAP hook (feature_contributions field) is already reserved
in PredictionResponse and awaits this module's implementation.
"""

# Phase 3 implementation plan:
#
# from app.explainability.shap_explainer import SHAPExplainer
#
# explainer = SHAPExplainer(model)
# shap_values = explainer.explain(feature_vector)
# contributions = explainer.rank_contributions(shap_values, feature_names)
