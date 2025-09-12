from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ...db.database import Base


class VectorEmbedding(Base):
    """
    Vector embeddings table for TiDB Cloud vector search.
    This table stores document embeddings with their metadata for semantic search.
    """

    __tablename__ = "vector_embeddings"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key relationships
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True, index=True)

    # Content identifiers
    content_id = Column(
        String(255), nullable=False, index=True
    )  # Unique identifier for the content
    content_type = Column(
        String(50), nullable=False
    )  # Type: 'chapter', 'document', 'note', etc.

    # Original text content
    text_content = Column(LONGTEXT, nullable=False)

    # Vector embedding - TiDB Cloud supports VECTOR data type
    # We'll store as JSON for now and migrate to VECTOR type when creating indexes
    embedding_vector = Column(
        JSON, nullable=False
    )  # Will contain the 768-dimensional vector

    # Metadata for filtering and searching
    embedding_metadata = Column(
        JSON, nullable=True
    )  # Additional metadata for filtering

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    course = relationship("Course", foreign_keys=[course_id])
    chapter = relationship("Chapter", foreign_keys=[chapter_id])

    # Indexes for performance
    __table_args__ = (
        # Index for course-based searches
        {"mysql_charset": "utf8mb4"},
    )


class VectorIndex(Base):
    """
    Table to track vector indexes created in TiDB Cloud.
    This helps manage HNSW indexes for different course collections.
    """

    __tablename__ = "vector_indexes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Index identification
    index_name = Column(String(255), nullable=False, unique=True)
    table_name = Column(String(255), nullable=False)
    column_name = Column(String(255), nullable=False, default="embedding_vector")

    # Index configuration
    distance_function = Column(
        String(50), nullable=False, default="VEC_COSINE_DISTANCE"
    )  # or VEC_L2_DISTANCE
    vector_dimension = Column(Integer, nullable=False, default=768)

    # Status tracking
    status = Column(
        String(50), nullable=False, default="creating"
    )  # creating, ready, failed
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    course = relationship("Course", foreign_keys=[course_id])
