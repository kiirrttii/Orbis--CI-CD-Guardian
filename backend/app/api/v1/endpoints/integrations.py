from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.integration import Integration
from app.models.orchestration_event import OrchestrationEvent
from app.orchestration.event_engine import EventEngine
import uuid
import httpx
import hmac
import hashlib
import time

router = APIRouter()

@router.post("/jenkins/connect")
async def connect_jenkins(
    config: dict, # url, username, api_token
    db: AsyncSession = Depends(get_db)
):
    """
    Validate Jenkins connectivity and store configuration.
    """
    jenkins_url = config.get("url")
    username = config.get("username")
    api_token = config.get("api_token")
    
    if not all([jenkins_url, username, api_token]):
        raise HTTPException(status_code=400, detail="Missing required configuration fields")

    # Verify connectivity (Basic Auth)
    try:
        async with httpx.AsyncClient() as client:
            # We'll call the Jenkins API to verify
            response = await client.get(
                f"{jenkins_url.rstrip('/')}/api/json",
                auth=(username, api_token),
                timeout=10.0
            )
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to connect to Jenkins: {response.text}")
            
            jenkins_data = response.json()
            
            # Find or create Jenkins integration
            result = await db.execute(select(Integration).filter(Integration.tool_name == "Jenkins"))
            integration = result.scalars().first()
            
            if not integration:
                integration = Integration(
                    tool_name="Jenkins",
                    category="CI/CD & Automation"
                )
                db.add(integration)
            
            integration.base_url = jenkins_url
            integration.status = "connected"
            integration.auth_config = {
                "username": username,
                "api_token": api_token,
                "jenkins_version": response.headers.get("X-Jenkins"),
                "last_validated": time.time()
            }
            
            await db.commit()
            await db.refresh(integration)
            
            return {
                "status": "connected",
                "jenkins_version": integration.auth_config["jenkins_version"],
                "integration_id": str(integration.id)
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

@router.post("/jenkins/webhook")
async def jenkins_webhook(
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest real Jenkins webhook events.
    In a real scenario, we would also validate a webhook secret.
    """
    # For now, we'll map the Jenkins payload to Orbis format
    # Jenkins 'Generic Webhook Trigger' or 'HTTP Request Plugin' can send custom JSON
    # Or we can support the standard 'Build InfluxDB' or other common plugins
    
    # Let's assume a semi-standard structure for this vertical slice:
    # { "job_name": "...", "build_number": ..., "status": "...", "duration": ..., "url": "..." }
    
    engine = EventEngine(db)
    # Find Jenkins integration ID
    result = await db.execute(select(Integration).filter(Integration.tool_name == "Jenkins"))
    integration = result.scalars().first()
    
    event = await engine.process_event(
        source="Jenkins",
        raw_data=payload,
        integration_id=integration.id if integration else None
    )
    
    return {"status": "success", "event_id": str(event.id)}

@router.get("/")
async def get_integrations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Integration))
    return result.scalars().all()

@router.patch("/{integration_id}")
async def update_integration(
    integration_id: uuid.UUID,
    updates: dict,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Integration).filter(Integration.id == integration_id))
    integration = result.scalars().first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    for key, value in updates.items():
        if hasattr(integration, key):
            setattr(integration, key, value)
    
    await db.commit()
    await db.refresh(integration)
    return integration

@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Integration).filter(Integration.id == integration_id))
    integration = result.scalars().first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    await db.delete(integration)
    await db.commit()
    return {"status": "deleted"}

@router.post("/{tool_name}/webhook")
async def tool_webhook(
    tool_name: str,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Map tool name to source
    source_map = {
        "jenkins": "Jenkins",
        "ansible": "Ansible"
    }
    source = source_map.get(tool_name.lower())
    if not source:
        raise HTTPException(status_code=400, detail="Unsupported tool")

    engine = EventEngine(db)
    event = await engine.process_event(source, payload)
    
    return {"status": "event_processed", "event_id": str(event.id)}


@router.get("/events/recent")
async def get_recent_events(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OrchestrationEvent).order_by(OrchestrationEvent.created_at.desc()).limit(limit)
    )
    return result.scalars().all()

@router.post("/simulate-event")
async def simulate_event(
    event_type: str,
    db: AsyncSession = Depends(get_db)
):
    engine = EventEngine(db)
    
    scenarios = {
        "jenkins_failure": {
            "source": "Jenkins",
            "payload": {
                "job_name": "payment-service-deploy",
                "build_number": 182,
                "status": "FAILURE",
                "duration": 450,
                "url": "https://jenkins.orbis.dev/job/payment-service-deploy/182"
            }
        },
        "jenkins_success": {
            "source": "Jenkins",
            "payload": {
                "job_name": "payment-service-deploy",
                "build_number": 183,
                "status": "SUCCESS",
                "duration": 420,
                "url": "https://jenkins.orbis.dev/job/payment-service-deploy/183"
            }
        },
        "ansible_failure": {
            "source": "Ansible",
            "payload": {
                "playbook": "nginx-config-update",
                "task": "Update nginx configuration",
                "status": "failed",
                "failed": ["web-node-01"],
                "changed": [],
                "duration": 15
            }
        },
        "ansible_success": {
            "source": "Ansible",
            "payload": {
                "playbook": "nginx-config-update",
                "task": "Update nginx configuration",
                "status": "success",
                "failed": [],
                "changed": ["web-node-01", "web-node-02"],
                "duration": 12
            }
        }
    }
    
    scenario = scenarios.get(event_type)
    if not scenario:
        raise HTTPException(status_code=400, detail="Invalid event type")
        
    event = await engine.process_event(scenario["source"], scenario["payload"])
    return {"status": "event_simulated", "event_id": str(event.id)}
