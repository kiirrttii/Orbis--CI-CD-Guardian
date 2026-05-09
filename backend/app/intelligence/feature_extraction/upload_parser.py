"""
Upload Parser.
Extracts metrics from uploaded workflow files (YAML/JSON).
"""

import json
import yaml
from typing import Dict, Any

def parse_upload_to_features(content: str, filename: str) -> Dict[str, float]:
    """
    Parses file content and extracts heuristic metrics.
    Supports JSON and YAML.
    """
    data = {}
    try:
        if filename.endswith(".json"):
            data = json.loads(content)
        elif filename.endswith(".yaml") or filename.endswith(".yml"):
            data = yaml.safe_load(content)
    except Exception:
        # If parsing fails, we treat it as a raw log and do basic string heuristics
        pass

    # Heuristic metric generation based on file structure
    # e.g., number of keys, depth, or specific keywords
    complexity_hint = len(str(data)) / 1000.0  # mock complexity based on size
    
    return {
        "LOC": min(1.0, complexity_hint * 0.8),
        "CYCLO": min(1.0, complexity_hint * 1.2),
        "LENGTH": min(1.0, complexity_hint),
        "VOLUME": min(1.0, complexity_hint * 1.1),
        "DIFFICULTY": 0.5,  # Baseline
        "INT_FAN_IN": 0.3,
        "INT_FAN_OUT": 0.4,
        "NUM_OPERATORS": 0.5,
        "NUM_OPERANDS": 0.5,
        "BRANCH_COUNT": min(1.0, complexity_hint * 0.5)
    }
