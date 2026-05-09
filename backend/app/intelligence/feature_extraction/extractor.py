"""
Feature Extraction Orchestrator.
Main entry point for converting operational entities into ML feature vectors.
"""

from typing import Dict, Optional
import uuid

from app.ingestion.models import TelemetryPayload
from app.intelligence.feature_extraction.repository_mapper import map_repository_to_features
from app.intelligence.feature_extraction.telemetry_mapper import map_telemetry_to_features
from app.intelligence.feature_extraction.upload_parser import parse_upload_to_features

class FeatureExtractionOrchestrator:
    
    @staticmethod
    def from_repository(repo_url: str, branch: str) -> Dict[str, float]:
        return map_repository_to_features(repo_url, branch)
        
    @staticmethod
    def from_telemetry(payload: TelemetryPayload) -> Dict[str, float]:
        return map_telemetry_to_features(payload)
        
    @staticmethod
    def from_upload(content: str, filename: str) -> Dict[str, float]:
        return parse_upload_to_features(content, filename)
