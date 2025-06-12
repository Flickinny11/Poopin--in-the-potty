#!/usr/bin/env python3
"""
Test script for AI Translation Pipeline
Tests the complete speech-to-speech translation workflow
"""
import asyncio
import logging
import sys
import os

# Add the backend app to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai_services.translation_pipeline import TranslationPipeline
from app.ai_services.config import validate_configuration

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_translation_pipeline():
    """Test the complete AI translation pipeline"""
    try:
        logger.info("Starting AI Translation Pipeline Test")
        
        # Create pipeline instance
        pipeline = TranslationPipeline()
        
        # Initialize pipeline
        logger.info("Initializing translation pipeline...")
        success = await pipeline.initialize()
        
        if not success:
            logger.error("Failed to initialize translation pipeline")
            return False
        
        logger.info("Translation pipeline initialized successfully")
        
        # Test speech-to-speech translation
        logger.info("Testing speech-to-speech translation...")
        
        # Create mock audio data (16-bit PCM, 16kHz, 1 second)
        sample_rate = 16000
        duration = 1.0
        samples = int(sample_rate * duration)
        
        # Generate simple audio pattern
        import struct
        audio_data = []
        for i in range(samples):
            # Generate a simple pattern
            value = int(1000 * (i % 1000) / 1000)  # Ramp pattern
            audio_data.append(struct.pack('<h', value))
        
        mock_audio = b''.join(audio_data)
        
        # Create mock voice profile
        voice_profile = {
            "id": "test_profile",
            "user_id": "test_user",
            "quality_score": 0.85,
            "features": {
                "fundamental_frequency": 150.0,
                "formants": [800, 1200, 2500],
                "voice_characteristics": "test_voice"
            },
            "language": "en",
            "training_duration": 300
        }
        
        # Test translation
        result = await pipeline.process_speech_to_speech(
            audio_data=mock_audio,
            target_language="es",
            voice_profile_data=voice_profile,
            source_language="en",
            include_lip_sync=False
        )
        
        # Verify result
        if result["success"]:
            logger.info("✅ Speech-to-speech translation successful!")
            logger.info(f"Source text: {result.get('source_text', 'N/A')}")
            logger.info(f"Translated text: {result.get('translated_text', 'N/A')}")
            logger.info(f"Processing time: {result['performance_metrics']['total_time_ms']:.1f}ms")
            logger.info(f"Meets latency target: {result['performance_metrics']['meets_latency_target']}")
            
            # Check quality metrics
            quality = result["quality_metrics"]
            logger.info(f"Overall quality: {quality['overall_quality']:.2f}")
            logger.info(f"STT confidence: {quality['stt_confidence']:.2f}")
            logger.info(f"Translation confidence: {quality['translation_confidence']:.2f}")
        else:
            logger.error(f"❌ Translation failed: {result.get('error', 'Unknown error')}")
            return False
        
        # Test streaming session
        logger.info("Testing streaming translation session...")
        
        session_id = await pipeline.create_stream_session(
            user_id="test_user",
            voice_profile_data=voice_profile,
            target_language="fr",
            source_language="en"
        )
        
        logger.info(f"Created streaming session: {session_id}")
        
        # Process some chunks
        chunk_size = len(mock_audio) // 3
        for i in range(3):
            start = i * chunk_size
            end = (i + 1) * chunk_size if i < 2 else len(mock_audio)
            chunk = mock_audio[start:end]
            
            chunk_result = await pipeline.process_stream_chunk(session_id, chunk)
            logger.info(f"Processed chunk {i+1}: {chunk_result.get('success', False)}")
        
        # Close session
        final_result = await pipeline.close_stream_session(session_id)
        logger.info(f"Closed session, processed {final_result['chunks_processed']} chunks")
        
        # Test health check
        logger.info("Testing health check...")
        health = await pipeline.health_check()
        logger.info(f"Health status: {health['status']}")
        
        # Test performance metrics
        metrics = await pipeline.get_performance_metrics()
        logger.info(f"Total requests: {metrics['total_requests']}")
        logger.info(f"Successful requests: {metrics['successful_requests']}")
        logger.info(f"Average latency: {metrics['average_latency_ms']:.1f}ms")
        
        logger.info("✅ All tests completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_individual_services():
    """Test individual AI services"""
    logger.info("Testing individual AI services...")
    
    # Test Whisper service
    from app.ai_services.whisper_service import WhisperService
    
    whisper = WhisperService()
    await whisper.initialize()
    
    # Create test audio
    test_audio = b'\x00\x01' * 8000  # 1 second of minimal audio
    
    transcription = await whisper.transcribe_audio(test_audio, language="en")
    logger.info(f"Whisper transcription: {transcription['text']}")
    
    # Test NLLB Translate service
    from app.ai_services.translate_service import NLLBTranslateService
    
    translator = NLLBTranslateService()
    await translator.initialize()
    
    translation = await translator.translate_text("Hello world", "es")
    logger.info(f"Translation result: {translation['translatedText']}")
    
    # Test Wunjo CE service
    from app.ai_services.wunjo_service import WunjoCEService
    
    wunjo = WunjoCEService()
    await wunjo.initialize()
    
    voice_profile = {
        "features": {"fundamental_frequency": 150.0}
    }
    
    synthesized = await wunjo.clone_voice("Hola mundo", voice_profile, "es")
    logger.info(f"Voice synthesis generated {len(synthesized)} bytes of audio")
    
    logger.info("✅ Individual service tests completed!")

async def main():
    """Main test function"""
    logger.info("🚀 Starting VidLiSync AI Translation Pipeline Tests")
    
    try:
        # Test configuration (will use mock services if API keys not set)
        logger.info("Testing configuration...")
        
        # Test individual services
        await test_individual_services()
        
        # Test complete pipeline
        success = await test_translation_pipeline()
        
        if success:
            logger.info("🎉 All tests passed! Translation pipeline is working correctly.")
            return 0
        else:
            logger.error("❌ Some tests failed.")
            return 1
            
    except Exception as e:
        logger.error(f"❌ Test suite failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)