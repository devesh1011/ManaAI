#!/usr/bin/env python3
"""
Migration script for TiDB Cloud vector search setup.

This script:
1. Creates vector embedding tables in TiDB Cloud
2. Sets up HNSW vector indexes for semantic search
3. Validates the TiDB Cloud connection and Google Gemini API

Usage:
    python migrate_to_tidb.py
"""

import sys
import os
from pathlib import Path

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent / "src"))

import asyncio
from sqlalchemy import text
from src.db.database import engine, Base
from src.db.models import VectorEmbedding, VectorIndex
from src.services.vector_service import VectorService
from src.config.settings import SQLALCHEMY_DATABASE_URL, GOOGLE_API_KEY
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_tidb_connection():
    """Test the TiDB Cloud database connection."""
    try:
        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to TiDB Cloud: {version}")

            # Test vector extension availability
            result = conn.execute(text("SHOW VARIABLES LIKE 'tidb_enable_vector%'"))
            vector_vars = result.fetchall()
            logger.info(f"✅ Vector variables: {vector_vars}")

        return True
    except Exception as e:
        logger.error(f"❌ TiDB Cloud connection failed: {e}")
        return False


async def test_google_gemini_api():
    """Test the Google Gemini API connection."""
    try:
        vector_service = VectorService()

        # Test embedding generation
        test_text = "This is a test sentence for embedding generation."
        embedding = vector_service._generate_embedding(test_text)

        if embedding and len(embedding) == 768:
            logger.info(
                f"✅ Google Gemini API working - generated {len(embedding)} dimensions"
            )
            return True
        else:
            logger.error(
                f"❌ Unexpected embedding format: {len(embedding) if embedding else 0} dimensions"
            )
            return False

    except Exception as e:
        logger.error(f"❌ Google Gemini API test failed: {e}")
        return False


async def create_vector_tables():
    """Create the vector embedding and index tables."""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Vector tables created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Table creation failed: {e}")
        return False


async def create_vector_indexes():
    """Create HNSW vector indexes for efficient similarity search."""
    try:
        logger.info(
            "⏭️  Skipping vector index creation - TiDBVectorClient handles this automatically"
        )
        return True
    except Exception as e:
        logger.error(f"❌ Vector index creation failed: {e}")
        return False


async def validate_vector_search():
    """Validate that vector search is working properly."""
    try:
        vector_service = VectorService()

        # Test storing and searching embeddings using the correct methods
        test_docs = [
            "Python is a programming language",
            "Machine learning is a subset of AI",
            "Databases store and organize data",
        ]

        # Store test content using the correct method
        course_id = 999  # Use a test course ID
        for i, doc in enumerate(test_docs):
            content_id = f"test_doc_{i}"
            vector_service.add_content_by_course_id(
                course_id=course_id,
                content_id=content_id,
                text=doc,
                metadata={"test": True, "doc_id": i},
            )

        # Test similarity search using the correct method
        query = "What is Python?"
        results = vector_service.search_by_course_id(
            course_id=course_id, query=query, n_results=2
        )

        if results and len(results) > 0:
            logger.info(
                f"✅ Vector search working - found {len(results)} similar documents"
            )
            logger.info(f"   - Results type: {type(results)}")
            logger.info(
                f"   - First result type: {type(results[0]) if results else 'N/A'}"
            )
            return True
        else:
            logger.error("❌ Vector search returned no results")
            return False

    except Exception as e:
        logger.error(f"❌ Vector search validation failed: {e}")
        return False


async def cleanup_test_data():
    """Clean up test data from vector stores."""
    try:
        logger.info(
            "⏭️  Skipping test data cleanup - test data will remain for verification"
        )
        return True
    except Exception as e:
        logger.error(f"❌ Test data cleanup failed: {e}")
        return False


async def main():
    """Run the complete TiDB Cloud migration and setup."""
    logger.info("🚀 Starting TiDB Cloud migration...")

    # Check prerequisites
    if not SQLALCHEMY_DATABASE_URL:
        logger.error("❌ DATABASE_URL not configured")
        return False

    if not GOOGLE_API_KEY:
        logger.error("❌ GOOGLE_API_KEY not configured")
        return False

    # Run migration steps
    steps = [
        ("Testing TiDB Cloud connection", test_tidb_connection),
        ("Testing Google Gemini API", test_google_gemini_api),
        ("Creating vector tables", create_vector_tables),
        ("Creating vector indexes", create_vector_indexes),
        ("Validating vector search", validate_vector_search),
        ("Cleaning up test data", cleanup_test_data),
    ]

    for step_name, step_func in steps:
        logger.info(f"📋 {step_name}...")
        success = await step_func()
        if not success:
            logger.error(f"❌ Migration failed at step: {step_name}")
            return False

    logger.info("🎉 TiDB Cloud migration completed successfully!")
    logger.info(
        "✅ Your application is now ready to use TiDB Cloud with Google Gemini embeddings"
    )
    return True


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Migration failed with unexpected error: {e}")
        sys.exit(1)
