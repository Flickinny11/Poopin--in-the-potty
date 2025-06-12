"""
VS Presenter WebSocket Handler
Extends the existing translation WebSocket handler for presenter features
"""

import json
import logging
import asyncio
from typing import Dict, Any, Set, Optional
from datetime import datetime, timezone
from .websocket_handler import TranslationWebSocketHandler

logger = logging.getLogger(__name__)

class VSPresenterWebSocketHandler(TranslationWebSocketHandler):
    """Extended WebSocket handler for VS Presenter features"""
    
    def __init__(self):
        super().__init__()
        # Presenter-specific state
        self.presentation_rooms: Dict[str, Dict[str, Any]] = {}
        self.room_participants: Dict[str, Set[str]] = {}
        self.participant_languages: Dict[str, str] = {}
        self.muted_participants: Dict[str, Set[str]] = {}
        self.raised_hands: Dict[str, Set[str]] = {}
        self.presenter_connections: Dict[str, str] = {}  # room_code -> connection_id
        
    async def handle_message(self, connection_id: str, message: Dict[str, Any]):
        """Handle presenter-specific WebSocket messages"""
        message_type = message.get("type")
        
        if message_type == "join_presentation":
            await self._handle_join_presentation(connection_id, message)
        elif message_type == "presenter_audio":
            await self._handle_presenter_audio(connection_id, message)
        elif message_type == "participant_mute":
            await self._handle_participant_mute(connection_id, message)
        elif message_type == "participant_unmute":
            await self._handle_participant_unmute(connection_id, message)
        elif message_type == "raise_hand":
            await self._handle_raise_hand(connection_id, message)
        elif message_type == "allow_speak":
            await self._handle_allow_speak(connection_id, message)
        elif message_type == "update_language":
            await self._handle_update_language(connection_id, message)
        elif message_type == "end_presentation":
            await self._handle_end_presentation(connection_id, message)
        else:
            # Fall back to base translation handler
            await super().handle_message(connection_id, message)
    
    async def _handle_join_presentation(self, connection_id: str, data: Dict[str, Any]):
        """Handle participant joining a presentation"""
        try:
            room_code = data.get("room_code")
            participant_name = data.get("participant_name")
            selected_language = data.get("selected_language", "en")
            is_presenter = data.get("is_presenter", False)
            
            if not room_code or not participant_name:
                await self._send_error(
                    self.active_connections[connection_id]["websocket"],
                    "Missing room_code or participant_name"
                )
                return
            
            # Initialize room if it doesn't exist
            if room_code not in self.presentation_rooms:
                self.presentation_rooms[room_code] = {
                    "created_at": datetime.now(timezone.utc),
                    "is_active": True,
                    "config": {}
                }
                self.room_participants[room_code] = set()
                self.muted_participants[room_code] = set()
                self.raised_hands[room_code] = set()
            
            # Add participant to room
            self.room_participants[room_code].add(connection_id)
            self.participant_languages[connection_id] = selected_language
            
            # Track presenter
            if is_presenter:
                self.presenter_connections[room_code] = connection_id
            
            # Update connection metadata
            self.active_connections[connection_id].update({
                "room_code": room_code,
                "participant_name": participant_name,
                "selected_language": selected_language,
                "is_presenter": is_presenter,
                "joined_at": datetime.now(timezone.utc)
            })
            
            # Notify all participants in the room
            await self._broadcast_to_room(room_code, {
                "type": "participant_joined",
                "participant": {
                    "connection_id": connection_id,
                    "name": participant_name,
                    "language": selected_language,
                    "is_presenter": is_presenter
                },
                "participant_count": len(self.room_participants[room_code])
            })
            
            # Send room state to new participant
            await self._send_message(
                self.active_connections[connection_id]["websocket"],
                {
                    "type": "joined_presentation",
                    "room_code": room_code,
                    "participant_count": len(self.room_participants[room_code]),
                    "participants": await self._get_room_participants(room_code)
                }
            )
            
        except Exception as e:
            logger.error(f"Error joining presentation: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"],
                f"Failed to join presentation: {str(e)}"
            )
    
    async def _handle_presenter_audio(self, connection_id: str, data: Dict[str, Any]):
        """Handle presenter audio for multi-language distribution"""
        try:
            connection = self.active_connections[connection_id]
            room_code = connection.get("room_code")
            
            if not room_code or not connection.get("is_presenter"):
                await self._send_error(
                    connection["websocket"],
                    "Only presenters can send presenter audio"
                )
                return
            
            # Get room configuration
            room_config = self.presentation_rooms[room_code].get("config", {})
            presenter_language = connection.get("selected_language", "en")
            
            # Get target languages for translation
            target_languages = []
            for participant_id in self.room_participants[room_code]:
                if participant_id != connection_id:  # Don't translate for presenter
                    participant_lang = self.participant_languages.get(participant_id, "en")
                    if participant_lang not in target_languages:
                        target_languages.append(participant_lang)
            
            # Process audio through translation pipeline
            audio_data = data.get("audio_data")
            if audio_data:
                # Use existing translation pipeline
                session_id = f"presenter_{room_code}"
                result = await self.pipeline.process_stream_chunk(
                    session_id, 
                    audio_data,
                    source_language=presenter_language,
                    target_languages=target_languages
                )
                
                # Distribute translated audio to participants
                if result.get("success") and not result.get("buffering"):
                    await self._distribute_translated_audio(room_code, result, connection_id)
            
        except Exception as e:
            logger.error(f"Error processing presenter audio: {e}")
            await self._send_error(
                self.active_connections[connection_id]["websocket"],
                f"Audio processing failed: {str(e)}"
            )
    
    async def _distribute_translated_audio(self, room_code: str, translation_result: Dict[str, Any], presenter_id: str):
        """Distribute translated audio to participants based on their language preferences"""
        try:
            # Get translations for each language
            translations = translation_result.get("translations", {})
            
            for participant_id in self.room_participants[room_code]:
                if participant_id == presenter_id:
                    continue  # Skip presenter
                
                participant_lang = self.participant_languages.get(participant_id, "en")
                translation_data = translations.get(participant_lang)
                
                if translation_data and participant_id in self.active_connections:
                    # Check if participant is muted
                    if participant_id not in self.muted_participants[room_code]:
                        await self._send_message(
                            self.active_connections[participant_id]["websocket"],
                            {
                                "type": "translated_audio",
                                "audio_data": translation_data.get("synthesized_audio"),
                                "source_text": translation_result.get("source_text"),
                                "translated_text": translation_data.get("translated_text"),
                                "language": participant_lang,
                                "timestamp": translation_result.get("timestamp")
                            }
                        )
        
        except Exception as e:
            logger.error(f"Error distributing translated audio: {e}")
    
    async def _handle_participant_mute(self, connection_id: str, data: Dict[str, Any]):
        """Handle muting a participant"""
        try:
            connection = self.active_connections[connection_id]
            room_code = connection.get("room_code")
            
            if not connection.get("is_presenter"):
                await self._send_error(
                    connection["websocket"],
                    "Only presenters can mute participants"
                )
                return
            
            participant_id = data.get("participant_id")
            if participant_id and room_code:
                self.muted_participants[room_code].add(participant_id)
                
                # Notify the muted participant
                if participant_id in self.active_connections:
                    await self._send_message(
                        self.active_connections[participant_id]["websocket"],
                        {
                            "type": "muted",
                            "by_presenter": True
                        }
                    )
                
                # Notify presenter
                await self._send_message(
                    connection["websocket"],
                    {
                        "type": "participant_muted",
                        "participant_id": participant_id
                    }
                )
        
        except Exception as e:
            logger.error(f"Error muting participant: {e}")
    
    async def _handle_participant_unmute(self, connection_id: str, data: Dict[str, Any]):
        """Handle unmuting a participant"""
        try:
            connection = self.active_connections[connection_id]
            room_code = connection.get("room_code")
            
            if not connection.get("is_presenter"):
                await self._send_error(
                    connection["websocket"],
                    "Only presenters can unmute participants"
                )
                return
            
            participant_id = data.get("participant_id")
            if participant_id and room_code:
                self.muted_participants[room_code].discard(participant_id)
                
                # Notify the unmuted participant
                if participant_id in self.active_connections:
                    await self._send_message(
                        self.active_connections[participant_id]["websocket"],
                        {
                            "type": "unmuted",
                            "by_presenter": True
                        }
                    )
                
                # Notify presenter
                await self._send_message(
                    connection["websocket"],
                    {
                        "type": "participant_unmuted",
                        "participant_id": participant_id
                    }
                )
        
        except Exception as e:
            logger.error(f"Error unmuting participant: {e}")
    
    async def _handle_raise_hand(self, connection_id: str, data: Dict[str, Any]):
        """Handle participant raising hand"""
        try:
            connection = self.active_connections[connection_id]
            room_code = connection.get("room_code")
            raised = data.get("raised", True)
            
            if room_code:
                if raised:
                    self.raised_hands[room_code].add(connection_id)
                else:
                    self.raised_hands[room_code].discard(connection_id)
                
                # Notify presenter
                presenter_id = self.presenter_connections.get(room_code)
                if presenter_id and presenter_id in self.active_connections:
                    await self._send_message(
                        self.active_connections[presenter_id]["websocket"],
                        {
                            "type": "hand_raised" if raised else "hand_lowered",
                            "participant_id": connection_id,
                            "participant_name": connection.get("participant_name")
                        }
                    )
        
        except Exception as e:
            logger.error(f"Error handling raise hand: {e}")
    
    async def _handle_allow_speak(self, connection_id: str, data: Dict[str, Any]):
        """Handle allowing participant to speak"""
        try:
            connection = self.active_connections[connection_id]
            room_code = connection.get("room_code")
            
            if not connection.get("is_presenter"):
                await self._send_error(
                    connection["websocket"],
                    "Only presenters can allow participants to speak"
                )
                return
            
            participant_id = data.get("participant_id")
            if participant_id and room_code:
                # Unmute and lower hand
                self.muted_participants[room_code].discard(participant_id)
                self.raised_hands[room_code].discard(participant_id)
                
                # Notify participant
                if participant_id in self.active_connections:
                    await self._send_message(
                        self.active_connections[participant_id]["websocket"],
                        {
                            "type": "allowed_to_speak",
                            "by_presenter": True
                        }
                    )
        
        except Exception as e:
            logger.error(f"Error allowing participant to speak: {e}")
    
    async def _handle_update_language(self, connection_id: str, data: Dict[str, Any]):
        """Handle participant language change"""
        try:
            new_language = data.get("language")
            if new_language:
                self.participant_languages[connection_id] = new_language
                self.active_connections[connection_id]["selected_language"] = new_language
                
                # Notify room about language change
                connection = self.active_connections[connection_id]
                room_code = connection.get("room_code")
                if room_code:
                    await self._broadcast_to_room(room_code, {
                        "type": "participant_language_updated",
                        "participant_id": connection_id,
                        "language": new_language
                    })
        
        except Exception as e:
            logger.error(f"Error updating language: {e}")
    
    async def _handle_end_presentation(self, connection_id: str, data: Dict[str, Any]):
        """Handle ending a presentation"""
        try:
            connection = self.active_connections[connection_id]
            room_code = connection.get("room_code")
            
            if not connection.get("is_presenter"):
                await self._send_error(
                    connection["websocket"],
                    "Only presenters can end presentations"
                )
                return
            
            if room_code and room_code in self.presentation_rooms:
                # Mark room as inactive
                self.presentation_rooms[room_code]["is_active"] = False
                self.presentation_rooms[room_code]["ended_at"] = datetime.now(timezone.utc)
                
                # Notify all participants
                await self._broadcast_to_room(room_code, {
                    "type": "presentation_ended",
                    "ended_by": "presenter"
                })
                
                # Clean up room data
                self._cleanup_room(room_code)
        
        except Exception as e:
            logger.error(f"Error ending presentation: {e}")
    
    async def _broadcast_to_room(self, room_code: str, message: Dict[str, Any]):
        """Broadcast message to all participants in a room"""
        if room_code in self.room_participants:
            for participant_id in self.room_participants[room_code]:
                if participant_id in self.active_connections:
                    try:
                        await self._send_message(
                            self.active_connections[participant_id]["websocket"],
                            message
                        )
                    except Exception as e:
                        logger.error(f"Error broadcasting to participant {participant_id}: {e}")
    
    async def _get_room_participants(self, room_code: str) -> list:
        """Get list of participants in a room"""
        participants = []
        if room_code in self.room_participants:
            for participant_id in self.room_participants[room_code]:
                if participant_id in self.active_connections:
                    connection = self.active_connections[participant_id]
                    participants.append({
                        "connection_id": participant_id,
                        "name": connection.get("participant_name"),
                        "language": connection.get("selected_language"),
                        "is_presenter": connection.get("is_presenter", False),
                        "is_muted": participant_id in self.muted_participants.get(room_code, set()),
                        "has_raised_hand": participant_id in self.raised_hands.get(room_code, set())
                    })
        return participants
    
    def _cleanup_room(self, room_code: str):
        """Clean up room data when presentation ends"""
        if room_code in self.presentation_rooms:
            del self.presentation_rooms[room_code]
        if room_code in self.room_participants:
            del self.room_participants[room_code]
        if room_code in self.muted_participants:
            del self.muted_participants[room_code]
        if room_code in self.raised_hands:
            del self.raised_hands[room_code]
        if room_code in self.presenter_connections:
            del self.presenter_connections[room_code]
    
    async def disconnect(self, connection_id: str):
        """Handle participant disconnection"""
        try:
            connection = self.active_connections.get(connection_id)
            if connection:
                room_code = connection.get("room_code")
                if room_code:
                    # Remove from room
                    if room_code in self.room_participants:
                        self.room_participants[room_code].discard(connection_id)
                    
                    # Clean up participant-specific data
                    if connection_id in self.participant_languages:
                        del self.participant_languages[connection_id]
                    
                    if room_code in self.muted_participants:
                        self.muted_participants[room_code].discard(connection_id)
                    
                    if room_code in self.raised_hands:
                        self.raised_hands[room_code].discard(connection_id)
                    
                    # If presenter left, end the presentation
                    if connection.get("is_presenter"):
                        await self._broadcast_to_room(room_code, {
                            "type": "presentation_ended",
                            "ended_by": "presenter_disconnect"
                        })
                        self._cleanup_room(room_code)
                    else:
                        # Notify remaining participants
                        await self._broadcast_to_room(room_code, {
                            "type": "participant_left",
                            "participant_id": connection_id,
                            "participant_count": len(self.room_participants[room_code])
                        })
            
            # Call parent disconnect
            await super().disconnect(connection_id)
        
        except Exception as e:
            logger.error(f"Error handling presenter disconnect: {e}")

# Initialize global presenter handler
presenter_handler = VSPresenterWebSocketHandler()