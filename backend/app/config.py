import os
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

class Config:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "digital_queue")
    SERVICE_TIMEZONE = os.getenv("SERVICE_TIMEZONE", "Asia/Kolkata")
    PORT = int(os.getenv("PORT", "5050"))
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # Restrict CORS to authorized origins
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    
    # Allowed queue services
    ALLOWED_SERVICES = [
        "Admissions",
        "Billing",
        "General Enquiry",
        "Document Verification"
    ]
    
    ALLOWED_STATUSES = ["waiting", "serving", "completed", "cancelled"]
