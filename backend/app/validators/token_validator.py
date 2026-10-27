import re
from app.config import Config

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def validate_create_token_payload(payload):
    """
    Validates payload for creating a token.
    Returns (is_valid, error_message_or_data)
    """
    if not isinstance(payload, dict):
        return False, "Request body must be a JSON object"
    
    visitor_name = payload.get("visitor_name")
    if visitor_name is None:
        return False, "Visitor name is required"
    if not isinstance(visitor_name, str):
        return False, "Visitor name must be a string"
    
    visitor_name = visitor_name.strip()
    if len(visitor_name) < 2:
        return False, "Visitor name must be at least 2 characters"
    if len(visitor_name) > 100:
        return False, "Visitor name must not exceed 100 characters"
        
    service = payload.get("service")
    if not service or not isinstance(service, str):
        return False, "Service is required"
    
    service = service.strip()
    if service not in Config.ALLOWED_SERVICES:
        return False, f"Invalid service '{service}'. Allowed services: {', '.join(Config.ALLOWED_SERVICES)}"
        
    return True, {
        "visitor_name": visitor_name,
        "service": service
    }

def validate_status_transition(current_status, new_status):
    """
    Enforces the lifecycle state machine:
      waiting -> serving
      serving -> completed
      waiting -> cancelled
    """
    valid_transitions = {
        "waiting": ["serving", "cancelled"],
        "serving": ["completed"],
        "completed": [],
        "cancelled": []
    }
    
    if new_status not in Config.ALLOWED_STATUSES:
        return False, f"Invalid target status '{new_status}'"
        
    allowed_targets = valid_transitions.get(current_status, [])
    if new_status not in allowed_targets:
        return False, f"Illegal state transition from '{current_status}' to '{new_status}'"
        
    return True, None

def validate_date_string(date_str):
    if not date_str or not isinstance(date_str, str):
        return False
    return bool(DATE_PATTERN.match(date_str))
