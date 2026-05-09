"""
Repository Mapper.
Generates deterministic mock features based on repository metadata.
"""

import hashlib
from typing import Dict

def map_repository_to_features(repo_url: str, branch: str) -> Dict[str, float]:
    """
    Simulates static analysis of a repository.
    Returns a deterministic feature vector based on the repo identity.
    """
    # Create a seed from the repo identity
    seed = f"{repo_url}:{branch}".lower()
    h = hashlib.md5(seed.encode()).hexdigest()
    
    # Extract chunks of the hash to create "metrics" between 0.0 and 1.0
    def _val(start, end):
        return int(h[start:end], 16) / (16**(end-start) - 1)

    return {
        "LOC": _val(0, 2),
        "CYCLO": _val(2, 4),
        "LENGTH": _val(4, 6),
        "VOLUME": _val(6, 8),
        "DIFFICULTY": _val(8, 10),
        "INT_FAN_IN": _val(10, 12),
        "INT_FAN_OUT": _val(12, 14),
        "NUM_OPERATORS": _val(14, 16),
        "NUM_OPERANDS": _val(16, 18),
        "BRANCH_COUNT": _val(18, 20)
    }
