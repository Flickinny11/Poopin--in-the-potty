"""
WebSocket Handler for Real-time Translation Streaming
Handles bidirectional audio streaming and real-time translation
"""
import asyncio
import json
import logging
import time
from typing import Dict, Any, Optional, Set
import websockets
from websockets.exceptions import ConnectionClosed
import base64

from .translation_pipeline import TranslationPipeline
from .config import AUDIO_CHUNK_SIZE_MS, MAX_CONCURRENT_STREAMS

logger = logging.getLogger(__name__)

class TranslationWebSocketHandler:
    """WebSocket handler for real-time translation streaming"""
    
    def __init__(self, translation_pipeline: TranslationPipeline):
        self.pipeline = translation_pipeline
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        self.user_sessions: Dict[str, str] = {}  # user_id -> connection_id
        
    async def handle_connection(self, websocket, path: str):
        """Handle new WebSocket connection"""
        connection_id = f"conn_{int(time.time())}_{id(websocket)}"
        
        try:
            logger.info(f"New WebSocket connection: {connection_id}")
            
            # Register connection
            self.active_connections[connection_id] = {
                "websocket": websocket,
                "user_id": None,
                "session_id": None,
                "connected_at": time.time(),
                "last_activity": time.time(),
                "message_count": 0
            }
            
            # Send welcome message
            await self._send_message(websocket, {
                "type": "connection_established",
                "connection_id": connection_id,
                "timestamp": time.time()
            })
            
            # Handle messages
            async for message in websocket:
                await self._handle_message(connection_id, message)
                
        except ConnectionClosed:
            logger.info(f"WebSocket connection closed: {connection_id}")
        except Exception as e:
            logger.error(f"WebSocket error for {connection_id}: {e}")
            await self._send_error(websocket, f"Connection error: {str(e)}")
        finally:
            await self._cleanup_connection(connection_id)
    
    async def _handle_message(self, connection_id: str, message: str):
        """Handle incoming WebSocket message"""
        try:
            connection = self.active_connections.get(connection_id)
            if not connection:
                return
            
            websocket = connection["websocket"]
            connection["last_activity"] = time.time()
            connection["message_count"] += 1
            
            # Parse message
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                await self._send_error(websocket, "Invalid JSON message")
                return
            
            message_type = data.get("type")
            
            if message_type == "authenticate":
                await self._handle_authenticate(connection_id, data)
            elif message_type == "start_stream":
                await self._handle_start_stream(connection_id, data)
            elif message_type == "audio_chunk":
                await self._handle_audio_chunk(connection_id, data)
            elif message_type == "end_stream":
                await self._handle_end_stream(connection_id, data)
            elif message_type == "ping":
                await self._handle_ping(connection_id, data)
            else:
                await self._send_error(websocket, f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message for {connection_id}: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"], 
                f"Message handling error: {str(e)}"
            )
    
    async def _handle_authenticate(self, connection_id: str, data: Dict[str, Any]):
        """Handle user authentication"""
        try:
            connection = self.active_connections[connection_id]
            websocket = connection["websocket"]
            
            user_id = data.get("user_id")
            token = data.get("token")  # JWT token for authentication
            
            if not user_id or not token:
                await self._send_error(websocket, "Missing user_id or token")
                return
            
            # TODO: Verify JWT token
            # For now, we'll accept any token for demonstration
            
            # Update connection
            connection["user_id"] = user_id
            self.user_sessions[user_id] = connection_id
            
            await self._send_message(websocket, {
                "type": "authenticated",
                "user_id": user_id,
                "timestamp": time.time()
            })
            
            logger.info(f"User {user_id} authenticated on connection {connection_id}")
            
        except Exception as e:
            logger.error(f"Authentication error for {connection_id}: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"],
                f"Authentication failed: {str(e)}"
            )
    
    async def _handle_start_stream(self, connection_id: str, data: Dict[str, Any]):
        """Handle stream start request"""
        try:
            connection = self.active_connections[connection_id]
            websocket = connection["websocket"]
            
            if not connection["user_id"]:
                await self._send_error(websocket, "Not authenticated")
                return
            
            # Extract stream parameters
            voice_profile_data = data.get("voice_profile")
            target_language = data.get("target_language")
            source_language = data.get("source_language")
            
            if not voice_profile_data or not target_language:
                await self._send_error(websocket, "Missing voice_profile or target_language")
                return
            
            # Create translation session
            session_id = await self.pipeline.create_stream_session(
                connection["user_id"],
                voice_profile_data,
                target_language,
                source_language
            )
            
            connection["session_id"] = session_id
            
            await self._send_message(websocket, {
                "type": "stream_started",
                "session_id": session_id,
                "target_language": target_language,
                "source_language": source_language,
                "timestamp": time.time()
            })
            
            logger.info(f"Started translation stream {session_id} for user {connection['user_id']}")
            
        except Exception as e:
            logger.error(f"Start stream error for {connection_id}: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"],
                f"Failed to start stream: {str(e)}"
            )
    
    async def _handle_audio_chunk(self, connection_id: str, data: Dict[str, Any]):
        """Handle incoming audio chunk"""
        try:
            connection = self.active_connections[connection_id]
            websocket = connection["websocket"]
            
            session_id = connection.get("session_id")
            if not session_id:
                await self._send_error(websocket, "No active stream session")
                return
            
            # Extract audio data
            audio_b64 = data.get("audio_data")
            if not audio_b64:
                await self._send_error(websocket, "Missing audio_data")
                return
            
            try:
                audio_data = base64.b64decode(audio_b64)
            except Exception:
                await self._send_error(websocket, "Invalid base64 audio data")
                return
            
            # Process audio chunk
            result = await self.pipeline.process_stream_chunk(session_id, audio_data)
            
            # Send result if translation completed
            if result.get("success") and not result.get("buffering"):
                await self._send_message(websocket, {
                    "type": "translation_result",
                    "session_id": session_id,
                    "source_text": result.get("source_text"),
                    "translated_text": result.get("translated_text"),
                    "synthesized_audio": base64.b64encode(result.get("synthesized_audio", b"")).decode(),
                    "quality_metrics": result.get("quality_metrics"),
                    "performance_metrics": result.get("performance_metrics"),
                    "timestamp": time.time()
                })
            
        except Exception as e:
            logger.error(f"Audio chunk error for {connection_id}: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"],
                f"Audio processing failed: {str(e)}"
            )
    
    async def _handle_end_stream(self, connection_id: str, data: Dict[str, Any]):
        """Handle stream end request"""
        try:
            connection = self.active_connections[connection_id]
            websocket = connection["websocket"]
            
            session_id = connection.get("session_id")
            if not session_id:
                await self._send_error(websocket, "No active stream session")
                return
            
            # Close translation session
            final_result = await self.pipeline.close_stream_session(session_id)
            connection["session_id"] = None
            
            # Send final result
            response = {
                "type": "stream_ended",
                "session_id": session_id,
                "chunks_processed": final_result.get("chunks_processed", 0),
                "timestamp": time.time()
            }
            
            if final_result.get("final_result"):
                response["final_translation"] = {
                    "source_text": final_result["final_result"].get("source_text"),
                    "translated_text": final_result["final_result"].get("translated_text"),
                    "synthesized_audio": base64.b64encode(
                        final_result["final_result"].get("synthesized_audio", b"")
                    ).decode()
                }
            
            await self._send_message(websocket, response)
            
            logger.info(f"Ended translation stream {session_id}")
            
        except Exception as e:
            logger.error(f"End stream error for {connection_id}: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"],
                f"Failed to end stream: {str(e)}"
            )
    
    async def _handle_ping(self, connection_id: str, data: Dict[str, Any]):
        """Handle ping message"""
        try:
            connection = self.active_connections[connection_id]
            websocket = connection["websocket"]
            
            await self._send_message(websocket, {
                "type": "pong",
                "timestamp": time.time(),
                "server_time": time.time()
            })
            
        except Exception as e:
            logger.error(f"Ping error for {connection_id}: {e}")
    
    async def _send_message(self, websocket, message: Dict[str, Any]):
        """Send message to WebSocket client"""
        try:
            await websocket.send(json.dumps(message))
        except ConnectionClosed:
            logger.debug("Attempted to send to closed WebSocket")
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
    
    async def _send_error(self, websocket, error_message: str):
        """Send error message to WebSocket client"""
        await self._send_message(websocket, {
            "type": "error",
            "message": error_message,
            "timestamp": time.time()
        })
    
    async def _cleanup_connection(self, connection_id: str):
        """Clean up connection resources"""
        try:
            connection = self.active_connections.get(connection_id)
            if not connection:
                return
            
            # Close any active translation session
            session_id = connection.get("session_id")
            if session_id:
                try:
                    await self.pipeline.close_stream_session(session_id)
                except Exception as e:
                    logger.error(f"Error closing session {session_id}: {e}")
            
            # Remove user session mapping
            user_id = connection.get("user_id")
            if user_id and self.user_sessions.get(user_id) == connection_id:
                del self.user_sessions[user_id]
            
            # Remove connection
            del self.active_connections[connection_id]
            
            logger.info(f"Cleaned up connection {connection_id}")
            
        except Exception as e:
            logger.error(f"Error cleaning up connection {connection_id}: {e}")
    
    async def broadcast_to_user(self, user_id: str, message: Dict[str, Any]):
        """Broadcast message to specific user"""
        connection_id = self.user_sessions.get(user_id)
        if not connection_id:
            return False
        
        connection = self.active_connections.get(connection_id)
        if not connection:
            return False
        
        try:
            await self._send_message(connection["websocket"], message)
            return True
        except Exception as e:
            logger.error(f"Error broadcasting to user {user_id}: {e}")
            return False
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        current_time = time.time()
        
        stats = {
            "total_connections": len(self.active_connections),
            "authenticated_users": len(self.user_sessions),
            "active_sessions": sum(
                1 for conn in self.active_connections.values() 
                if conn.get("session_id")
            ),
            "connections": []
        }
        
        for conn_id, conn in self.active_connections.items():
            stats["connections"].append({
                "connection_id": conn_id,
                "user_id": conn.get("user_id"),
                "session_id": conn.get("session_id"),
                "connected_duration": current_time - conn["connected_at"],
                "last_activity": current_time - conn["last_activity"],
                "message_count": conn["message_count"]
            })
        
        return stats
    
    async def cleanup_inactive_connections(self, timeout_seconds: int = 300):
        """Clean up inactive connections"""
        current_time = time.time()
        inactive_connections = []
        
        for conn_id, conn in self.active_connections.items():
            if current_time - conn["last_activity"] > timeout_seconds:
                inactive_connections.append(conn_id)
        
        for conn_id in inactive_connections:
            logger.info(f"Cleaning up inactive connection: {conn_id}")
            await self._cleanup_connection(conn_id)
        
        return len(inactive_connections)