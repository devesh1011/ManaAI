import os
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
import google.generativeai as genai
from tidb_vector.integrations import TiDBVectorClient
from ..config import settings
from ..db.database import get_db_context


class VectorService:
    def __init__(self):
        # Configure Google Gemini API for embeddings
        genai.configure(api_key=settings.GOOGLE_API_KEY)

        # Initialize TiDB Vector Client
        self.vector_client = TiDBVectorClient(
            # Use the same DATABASE_URL as the main application
            connection_string=settings.SQLALCHEMY_DATABASE_URL,
            # Table name for storing embeddings - we'll use course-specific tables
            table_name="vector_embeddings",
            # Google's text-embedding model produces 768-dimensional vectors
            vector_dimension=768,
            # Don't drop existing table to preserve data
            drop_existing_table=False,
        )

        # Embedding model configuration
        self.embedding_model_name = (
            "models/text-embedding-004"  # Latest Google embedding model
        )

    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using Google Gemini API"""
        try:
            result = genai.embed_content(
                model=self.embedding_model_name,
                content=text,
                task_type="retrieval_document",  # Optimized for document retrieval
            )
            return result["embedding"]
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise

    def create_collection(self, collection_id: str):
        """Create a new collection in TiDB vector store"""
        try:
            # In TiDB, we don't need separate collections - we use the table_name field
            # Create table if it doesn't exist for this collection
            table_name = f"vector_collection_{collection_id}"

            # Initialize a new vector client for this specific collection
            TiDBVectorClient(
                connection_string=settings.SQLALCHEMY_DATABASE_URL,
                table_name=table_name,
                vector_dimension=768,
                drop_existing_table=False,
            )
            print(f"Collection {collection_id} initialized in TiDB")
        except Exception as e:
            print(f"Error creating collection {collection_id}: {e}")

    def create_collection_by_course_id(self, course_id: int):
        """Create a collection for a specific course"""
        collection_id = f"course_{course_id}"
        self.create_collection(collection_id)

    def add_content_by_course_id(
        self, course_id: int, content_id: str, text: str, metadata: Dict
    ):
        """Add content to vector store using TiDB"""
        try:
            # Generate embedding using Google Gemini
            embedding = self._generate_embedding(text)

            # Get or create TiDB vector client for this course
            table_name = f"vector_collection_course_{course_id}"
            course_vector_client = TiDBVectorClient(
                connection_string=settings.SQLALCHEMY_DATABASE_URL,
                table_name=table_name,
                vector_dimension=768,
                drop_existing_table=False,
            )

            # Insert document with embedding
            course_vector_client.insert(
                ids=[content_id],
                texts=[text],
                embeddings=[embedding],
                metadatas=[metadata],
            )
            print(f"Added content {content_id} to course {course_id}")

        except Exception as e:
            print(f"Error adding content {content_id} for course {course_id}: {e}")

    def search_by_course_id(
        self,
        course_id: int,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict] = None,
    ):
        """Search for similar content using TiDB vector search"""
        try:
            # Generate query embedding
            query_embedding = self._generate_embedding(query)

            # Get TiDB vector client for this course
            table_name = f"vector_collection_course_{course_id}"
            course_vector_client = TiDBVectorClient(
                connection_string=settings.SQLALCHEMY_DATABASE_URL,
                table_name=table_name,
                vector_dimension=768,
                drop_existing_table=False,
            )

            # Perform vector search
            results = course_vector_client.query(
                query_embedding,
                k=n_results,
                # TiDB vector search supports filtering but syntax may differ
                # For now, we'll do post-filtering if needed
            )

            # Apply metadata filtering if specified
            if filter_metadata and results:
                filtered_results = []
                for result in results:
                    # Check if result metadata matches filter criteria
                    if all(
                        result.metadata.get(k) == v for k, v in filter_metadata.items()
                    ):
                        filtered_results.append(result)
                results = filtered_results[:n_results]

            return results

        except Exception as e:
            print(f"Error searching course {course_id}: {e}")
            return []

    def delete_content_by_course_id(self, course_id: int, content_id: str):
        """Delete content from vector store"""
        try:
            table_name = f"vector_collection_course_{course_id}"
            course_vector_client = TiDBVectorClient(
                connection_string=settings.SQLALCHEMY_DATABASE_URL,
                table_name=table_name,
                vector_dimension=768,
                drop_existing_table=False,
            )

            # Delete document by ID
            course_vector_client.delete(ids=[content_id])
            print(f"Deleted content {content_id} from course {course_id}")

        except Exception as e:
            print(f"Error deleting content {content_id} from course {course_id}: {e}")

    def update_content_by_course_id(
        self, course_id: int, content_id: str, text: str, metadata: Dict
    ):
        """Update existing content by deleting and re-adding"""
        # TiDB vector client handles updates via delete + insert
        self.delete_content_by_course_id(course_id, content_id)
        self.add_content_by_course_id(course_id, content_id, text, metadata)

    def get_collection_by_course_id(self, course_id: int):
        """Get collection information by course ID"""
        try:
            table_name = f"vector_collection_course_{course_id}"
            course_vector_client = TiDBVectorClient(
                connection_string=settings.SQLALCHEMY_DATABASE_URL,
                table_name=table_name,
                vector_dimension=768,
                drop_existing_table=False,
            )
            return course_vector_client
        except Exception as e:
            print(f"Error getting collection for course {course_id}: {e}")
            return None

    def health_check(self) -> bool:
        """Check if TiDB connection and Google Gemini API are working"""
        try:
            # Test TiDB connection
            with get_db_context() as db:
                db.execute(text("SELECT 1"))

            # Test Google Gemini API
            test_embedding = self._generate_embedding("test")

            return len(test_embedding) == 768  # Verify embedding dimension
        except Exception as e:
            print(f"Health check failed: {e}")
            return False
