from typing import Dict, List
import json
import logging
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self):
        # active_connections[user_id][course_id] = [websocket1, websocket2, ...]
        self.active_connections: Dict[str, Dict[int, List[WebSocket]]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, course_id: int):
        """Connect a WebSocket for a specific user and course."""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}

        if course_id not in self.active_connections[user_id]:
            self.active_connections[user_id][course_id] = []

        self.active_connections[user_id][course_id].append(websocket)
        logger.info(f"WebSocket connected for user {user_id}, course {course_id}")

    def disconnect(self, websocket: WebSocket, user_id: str, course_id: int):
        """Disconnect a WebSocket."""
        if (
            user_id in self.active_connections
            and course_id in self.active_connections[user_id]
        ):
            if websocket in self.active_connections[user_id][course_id]:
                self.active_connections[user_id][course_id].remove(websocket)
                logger.info(
                    f"WebSocket disconnected for user {user_id}, course {course_id}"
                )

            # Clean up empty lists
            if not self.active_connections[user_id][course_id]:
                del self.active_connections[user_id][course_id]

            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str, course_id: int):
        """Send a message to all WebSocket connections for a specific user and course."""
        if (
            user_id in self.active_connections
            and course_id in self.active_connections[user_id]
        ):
            disconnected = []
            for websocket in self.active_connections[user_id][course_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to WebSocket: {e}")
                    disconnected.append(websocket)

            # Remove disconnected websockets
            for websocket in disconnected:
                self.disconnect(websocket, user_id, course_id)

    async def broadcast_course_update(
        self, course_id: int, update_type: str, data: dict
    ):
        """Broadcast an update to all users connected to a specific course."""
        message = {
            "type": update_type,
            "course_id": course_id,
            "data": data,
            "timestamp": json.dumps(None),  # Will be set by frontend
        }

        # Send to all users connected to this course
        users_to_remove = []
        for user_id, courses in self.active_connections.items():
            if course_id in courses:
                await self.send_personal_message(message, user_id, course_id)
            elif not courses:  # Empty courses dict
                users_to_remove.append(user_id)

        # Clean up empty user entries
        for user_id in users_to_remove:
            del self.active_connections[user_id]

    async def send_course_creation_progress(
        self, user_id: str, course_id: int, progress: dict
    ):
        """Send course creation progress updates."""
        await self.send_personal_message(
            {
                "type": "course_creation_progress",
                "course_id": course_id,
                "data": progress,
            },
            user_id,
            course_id,
        )

    async def send_chapter_created(
        self, user_id: str, course_id: int, chapter_data: dict
    ):
        """Send notification when a chapter is created."""
        await self.send_personal_message(
            {"type": "chapter_created", "course_id": course_id, "data": chapter_data},
            user_id,
            course_id,
        )

    async def send_questions_ready(
        self, user_id: str, course_id: int, chapter_id: int, questions_data: dict
    ):
        """Send notification when questions are ready for a chapter."""
        await self.send_personal_message(
            {
                "type": "questions_ready",
                "course_id": course_id,
                "chapter_id": chapter_id,
                "data": questions_data,
            },
            user_id,
            course_id,
        )

    async def send_course_completed(
        self, user_id: str, course_id: int, course_data: dict
    ):
        """Send notification when course creation is completed."""
        await self.send_personal_message(
            {"type": "course_completed", "course_id": course_id, "data": course_data},
            user_id,
            course_id,
        )


# Global WebSocket manager instance
manager = WebSocketConnectionManager()
