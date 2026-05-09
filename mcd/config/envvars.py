import os

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE = os.environ.get("WHATSAPP_PHONE", "")
WHATSAPP_WEBHOOK_SECRET = os.environ.get("WHATSAPP_WEBHOOK_SECRET", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "prod")
