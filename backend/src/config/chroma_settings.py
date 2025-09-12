"""
DEPRECATED: ChromaDB Configuration

This file is deprecated as of the TiDB Cloud migration.
ChromaDB has been replaced with TiDB Cloud's native vector search capabilities.

Migration completed:
- ChromaDB → TiDB Cloud vector storage
- sentence-transformers → Google Gemini embeddings (text-embedding-004)
- Separate vector DB → Unified database

New configuration is in src/config/settings.py:
- DATABASE_URL for TiDB Cloud connection
- GOOGLE_API_KEY for Gemini embeddings

This file will be removed in a future update.
"""

import warnings
import os

# Issue deprecation warning if this file is imported
warnings.warn(
    "chroma_settings.py is deprecated. Use settings.py for TiDB Cloud configuration.",
    DeprecationWarning,
    stacklevel=2,
)

# Legacy settings - DO NOT USE IN NEW CODE
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")  # Deprecated
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")  # Moved to settings.py
EMBEDDING_MODEL_NAME = "models/embedding-001"  # Deprecated - using text-embedding-004
