#!/usr/bin/env python3
"""
Test script for LOCAL AI model loading capabilities
Tests the complete local AI pipeline when models are available
"""
import asyncio
import logging
import sys
import os

# Add the backend app to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai_services.whisper_service import WhisperService
from app.ai_services.translate_service import NLLBTranslateService
from app.ai_services.wunjo_service import WunjoCEService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_local_whisper():
    """Test local Whisper model loading"""
    logger.info("Testing local Whisper service...")
    
    # Force local processing
    os.environ["FORCE_LOCAL_PROCESSING"] = "true"
    
    try:
        whisper = WhisperService()
        success = await whisper.initialize()
        
        if success and whisper.use_local and whisper.model is not None:
            logger.info("✅ Local Whisper model loaded successfully")
            
            # Test transcription
            test_audio = b'\x00\x01' * 8000  # 1 second of minimal audio
            result = await whisper.transcribe_audio(test_audio, language="en")
            logger.info(f"Local transcription result: {result['text']}")
            return True
        else:
            logger.warning("⚠️ Local Whisper model not available - using fallback")
            return False
            
    except Exception as e:
        logger.error(f"❌ Local Whisper test failed: {e}")
        return False

async def test_local_translation():
    """Test local NLLB translation model loading"""
    logger.info("Testing local NLLB translation service...")
    
    try:
        translator = NLLBTranslateService()
        success = await translator.initialize()
        
        if success and translator.use_local and translator.model is not None:
            logger.info("✅ Local NLLB model loaded successfully")
            
            # Test translation
            result = await translator.translate_text("Hello world", "es")
            logger.info(f"Local translation result: {result['translatedText']}")
            return True
        else:
            logger.warning("⚠️ Local NLLB model not available - using fallback")
            return False
            
    except Exception as e:
        logger.error(f"❌ Local NLLB test failed: {e}")
        return False

async def test_wunjo_ce():
    """Test Wunjo CE voice cloning service"""
    logger.info("Testing Wunjo CE service...")
    
    try:
        wunjo = WunjoCEService()
        success = await wunjo.initialize()
        
        if success:
            logger.info("✅ Wunjo CE service initialized successfully")
            
            # Test voice cloning
            voice_profile = {
                "features": {
                    "fundamental_frequency": 150.0,
                    "formants": [800, 1200, 2500]
                }
            }
            
            audio = await wunjo.clone_voice("Hello world", voice_profile, "en")
            logger.info(f"Voice cloning result: {len(audio)} bytes of audio")
            
            # Test lip sync
            face_image = b"fake_image_data" * 100
            video = await wunjo.generate_lip_sync(audio, face_image)
            logger.info(f"Lip sync result: {len(video)} bytes of video")
            
            return True
        else:
            logger.error("❌ Wunjo CE service failed to initialize")
            return False
            
    except Exception as e:
        logger.error(f"❌ Wunjo CE test failed: {e}")
        return False

async def test_performance_benchmark():
    """Test performance with local models"""
    logger.info("Running performance benchmark...")
    
    try:
        from app.ai_services.translation_pipeline import TranslationPipeline
        
        pipeline = TranslationPipeline()
        await pipeline.initialize()
        
        # Create test data
        import struct
        sample_rate = 16000
        duration = 2.0  # 2 seconds
        samples = int(sample_rate * duration)
        
        audio_data = []
        for i in range(samples):
            value = int(1000 * (i % 1000) / 1000)
            audio_data.append(struct.pack('<h', value))
        
        test_audio = b''.join(audio_data)
        
        voice_profile = {
            "id": "test_profile",
            "features": {
                "fundamental_frequency": 150.0,
                "formants": [800, 1200, 2500]
            }
        }
        
        # Run performance test
        import time
        start_time = time.time()
        
        result = await pipeline.process_speech_to_speech(
            audio_data=test_audio,
            target_language="es",
            voice_profile_data=voice_profile,
            source_language="en",
            include_lip_sync=False
        )
        
        end_time = time.time()
        processing_time = (end_time - start_time) * 1000
        
        logger.info(f"Performance test results:")
        logger.info(f"  Processing time: {processing_time:.1f}ms")
        logger.info(f"  Meets latency target: {processing_time < 400}")
        logger.info(f"  Source text: {result.get('source_text', 'N/A')}")
        logger.info(f"  Translated text: {result.get('translated_text', 'N/A')}")
        
        return processing_time < 400
        
    except Exception as e:
        logger.error(f"❌ Performance benchmark failed: {e}")
        return False

async def main():
    """Main test function"""
    logger.info("🚀 Starting LOCAL AI Pipeline Tests")
    
    # Test individual services
    whisper_local = await test_local_whisper()
    nllb_local = await test_local_translation()
    wunjo_success = await test_wunjo_ce()
    
    # Performance benchmark
    performance_ok = await test_performance_benchmark()
    
    # Summary
    logger.info("\n📊 LOCAL AI Test Summary:")
    logger.info(f"  Local Whisper: {'✅ Available' if whisper_local else '⚠️ Fallback'}")
    logger.info(f"  Local NLLB: {'✅ Available' if nllb_local else '⚠️ Fallback'}")
    logger.info(f"  Wunjo CE: {'✅ Working' if wunjo_success else '❌ Failed'}")
    logger.info(f"  Performance: {'✅ <400ms' if performance_ok else '❌ >400ms'}")
    
    if whisper_local and nllb_local:
        logger.info("🎉 Full LOCAL AI pipeline is functional!")
        return 0
    elif wunjo_success and performance_ok:
        logger.info("✅ LOCAL AI pipeline working with fallbacks")
        return 0
    else:
        logger.error("❌ LOCAL AI pipeline has issues")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)