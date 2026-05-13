"""
Risk Dimensions Serialization & Deserialization Utility.

Provides safe conversion between persisted JSON and RiskDimensionsPayload schema.
Maintains backward compatibility with old records lacking risk_dimensions.
"""

from typing import Optional, Dict, Any
from app.schemas.intelligence import RiskDimensionsPayload, RiskDimensionResult
from app.core.logging import get_logger

logger = get_logger(__name__)


def deserialize_risk_dimensions(raw_output: Optional[Dict[str, Any]]) -> Optional[RiskDimensionsPayload]:
    """
    Safely deserialize risk_dimensions from raw_output JSON.
    
    BACKWARD COMPATIBLE:
    - Returns None if raw_output is None (old records without risk_dimensions)
    - Returns None if 'risk_dimensions' key is missing
    - Gracefully handles deserialization errors
    
    Args:
        raw_output: JSON dict potentially containing 'risk_dimensions' key
        
    Returns:
        RiskDimensionsPayload if deserialization succeeds, None otherwise
    """
    if raw_output is None:
        return None
    
    if not isinstance(raw_output, dict):
        logger.warning("raw_output_is_not_dict", raw_output_type=type(raw_output).__name__)
        return None
    
    dims_data = raw_output.get('risk_dimensions')
    if dims_data is None:
        return None
    
    try:
        # Validate and construct RiskDimensionsPayload from deserialized dict
        payload = RiskDimensionsPayload(
            maintainability=RiskDimensionResult(
                score=dims_data['maintainability']['score'],
                grade=dims_data['maintainability']['grade'],
                summary=dims_data['maintainability']['summary']
            ),
            deployment_stability=RiskDimensionResult(
                score=dims_data['deployment_stability']['score'],
                grade=dims_data['deployment_stability']['grade'],
                summary=dims_data['deployment_stability']['summary']
            ),
            security_exposure=RiskDimensionResult(
                score=dims_data['security_exposure']['score'],
                grade=dims_data['security_exposure']['grade'],
                summary=dims_data['security_exposure']['summary']
            ),
            interpretation_summary=dims_data.get('interpretation_summary', 'No interpretation available'),
            confidence=dims_data.get('confidence', 'MEDIUM')
        )
        logger.info("risk_dimensions_deserialized_successfully")
        return payload
    except (KeyError, TypeError, ValueError) as e:
        logger.warning(
            "failed_to_deserialize_risk_dimensions",
            error=str(e),
            dims_data_keys=list(dims_data.keys()) if isinstance(dims_data, dict) else "not_a_dict"
        )
        return None
    except Exception as e:
        logger.warning(
            "unexpected_error_deserializing_risk_dimensions",
            error=str(e)
        )
        return None
