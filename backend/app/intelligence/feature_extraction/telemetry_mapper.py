"""
Telemetry Mapper.
Maps CI/CD telemetry metadata and raw metrics into ML feature vectors.
"""

from typing import Dict, Union
from app.ingestion.models import TelemetryPayload
from app.models.workflow_run import WorkflowRun

def map_telemetry_to_features(source: Union[TelemetryPayload, WorkflowRun]) -> Dict[str, float]:
    """
    Transforms telemetry data into a feature vector.
    Applies heuristics based on run status and existing metrics.
    """
    if isinstance(source, TelemetryPayload):
        metrics = source.metrics.copy()
        status = source.status
    else:
        # It's a WorkflowRun ORM model
        # For now, if it's a model, we might not have raw metrics stored 
        # unless we join with ExtractedFeature. 
        # For the mock logic, we'll generate metrics based on the run metadata.
        status = source.conclusion.value if source.conclusion else "success"
        duration = source.duration_seconds or 60
        
        # Heuristic: Longer duration → Higher complexity
        complexity = min(1.0, duration / 300.0)
        metrics = {
            "LOC": complexity,
            "CYCLO": min(1.0, complexity * 1.1),
            "LENGTH": complexity,
            "VOLUME": complexity,
            "DIFFICULTY": 0.5,
            "INT_FAN_IN": 0.2,
            "INT_FAN_OUT": 0.3,
            "NUM_OPERATORS": 0.5,
            "NUM_OPERANDS": 0.5,
            "BRANCH_COUNT": complexity * 0.8
        }
    
    # Heuristic: If the run failed, increase risk signals
    if status in ["failure", "failed", "error"]:
        metrics["DIFFICULTY"] = min(1.0, metrics.get("DIFFICULTY", 0.5) * 1.2)
        metrics["CYCLO"] = min(1.0, metrics.get("CYCLO", 0.5) * 1.1)
        
    return metrics
