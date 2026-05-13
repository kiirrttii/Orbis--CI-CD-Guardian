from typing import Any, Dict
from app.models.orchestration_event import OrchestrationEvent

class BaseNormalizer:
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

class JenkinsNormalizer(BaseNormalizer):
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        # Example Jenkins webhook payload normalization
        # Expects keys like 'job_name', 'build_number', 'status', 'timestamp'
        return {
            "pipeline_name": raw_data.get("job_name"),
            "build_id": raw_data.get("build_number"),
            "result": raw_data.get("status"),
            "duration": raw_data.get("duration"),
            "url": raw_data.get("url")
        }

class AnsibleNormalizer(BaseNormalizer):
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        # Example Ansible event normalization
        return {
            "playbook_name": raw_data.get("playbook"),
            "task_name": raw_data.get("task"),
            "changed_hosts": raw_data.get("changed", []),
            "failed_hosts": raw_data.get("failed", []),
            "duration": raw_data.get("duration")
        }
