import logging
import os
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)


load_dotenv()


# Configuration for the application
# Password policy
# These settings are used to enforce password complexity requirements
MIN_PASSWORD_LENGTH = 3
REQUIRE_UPPERCASE = False
REQUIRE_LOWERCASE = False
REQUIRE_DIGIT = False
REQUIRE_SPECIAL_CHAR = False
SPECIAL_CHARACTERS_REGEX_PATTERN = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]"

# FREE TEER SETTINGS

MAX_COURSE_CREATIONS = 10
MAX_CHAT_USAGE = 100
MAX_PRESENT_COURSES = 5


# JWT settings
ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_please_change_me")
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "fallback-key-for-dev")


######
# ALGORITHM: str = "RS256"
#### Private Key (zum Signieren)
# openssl genrsa -out private.pem 2048
#### Public Key (zum Verifizieren)
# openssl rsa -in private.pem -pubout -out public.pem
PUBLIC_KEY: str = os.getenv("PUBLIC_KEY", "")
PRIVATE_KEY: str = os.getenv("PRIVATE_KEY", "")
######


ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "20"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "360000")
)  # 100h
SECURE_COOKIE = os.getenv("SECURE_COOKIE", "true").lower() == "true"


# TiDB Cloud Database settings
# Use the DATABASE_URL environment variable which contains the full TiDB Cloud connection string
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://user:password@host:port/database"
)
# TiDB Cloud uses MySQL-compatible protocol, so we use mysql+pymysql driver

# DB Pooling Settings
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", 3600))
DB_POOL_PRE_PING = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 5))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 10))
DB_CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", 10))  # Optional


# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "https://www.mana-ai.de/api/google/callback"
)
FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL", "https://www.mana-ai.de/google/callback"
)


UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
UNSPLASH_SECRET_KEY = os.getenv("UNSPLASH_SECRET_KEY")

# Google Gemini API settings
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

AGENT_DEBUG_MODE = os.getenv("AGENT_DEBUG_MODE", "true").lower() == "true"
