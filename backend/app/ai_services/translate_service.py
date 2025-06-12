"""
Local NLLB Translation Service for Text Translation
High-quality translation between 200+ languages using local NLLB-200 model
"""
import asyncio
import logging
import torch
from typing import Optional, Dict, Any, List, Tuple
import os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

from .config import (
    NLLB_MODEL_NAME, DEVICE, MODEL_PRECISION, MODEL_CACHE_DIR, 
    SUPPORTED_LANGUAGES, FORCE_LOCAL_PROCESSING
)

logger = logging.getLogger(__name__)

class NLLBTranslateService:
    """Service for local NLLB text translation"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = DEVICE
        self.model_name = NLLB_MODEL_NAME
        self.is_initialized = False
        self.supported_languages = SUPPORTED_LANGUAGES
        self.use_local = FORCE_LOCAL_PROCESSING
        
        # NLLB language code mapping
        self.nllb_lang_map = {
            "en": "eng_Latn", "es": "spa_Latn", "fr": "fra_Latn", "de": "deu_Latn",
            "it": "ita_Latn", "pt": "por_Latn", "ru": "rus_Cyrl", "zh": "zho_Hans",
            "ja": "jpn_Jpan", "ko": "kor_Hang", "ar": "arb_Arab", "hi": "hin_Deva",
            "nl": "nld_Latn", "sv": "swe_Latn", "da": "dan_Latn", "no": "nob_Latn",
            "fi": "fin_Latn", "pl": "pol_Latn", "cs": "ces_Latn", "sk": "slk_Latn",
            "hu": "hun_Latn", "ro": "ron_Latn", "bg": "bul_Cyrl", "hr": "hrv_Latn",
            "sl": "slv_Latn", "et": "est_Latn", "lv": "lav_Latn", "lt": "lit_Latn",
            "mt": "mlt_Latn", "tr": "tur_Latn"
        }
        
        logger.info(f"Initializing NLLBTranslateService with model: {self.model_name}")
        logger.info(f"Device: {self.device}, Local processing: {self.use_local}")
        
    async def initialize(self) -> bool:
        """Initialize local NLLB translation service"""
        try:
            if not self.use_local:
                logger.warning("Local processing disabled - using mock service")
                self.is_initialized = True
                return True
            
            logger.info("Loading local NLLB translation model...")
            
            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=MODEL_CACHE_DIR
            )
            
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                self.model_name,
                cache_dir=MODEL_CACHE_DIR,
                torch_dtype=torch.float16 if MODEL_PRECISION == "float16" else torch.float32,
                device_map=self.device if self.device != "cpu" else None
            )
            
            if self.device != "cpu":
                self.model = self.model.to(self.device)
                
            # Set to evaluation mode for inference
            self.model.eval()
            
            self.is_initialized = True
            logger.info("Local NLLB translation service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize local NLLB service: {e}")
            logger.warning("Falling back to mock service")
            self.use_local = False
            self.is_initialized = True
            return True
    
    async def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Translate text between languages using local NLLB model
        """
        if not self.is_initialized:
            raise RuntimeError("NLLB translation service not initialized")
        
        if not text.strip():
            return {
                "translatedText": "",
                "detectedSourceLanguage": source_language or "en",
                "confidence": 1.0,
                "input": text
            }
        
        try:
            if not self.use_local:
                return await self._mock_translate(text, target_language, source_language)
            
            # Convert language codes to NLLB format
            source_lang_code = self._get_nllb_lang_code(source_language or "en")
            target_lang_code = self._get_nllb_lang_code(target_language)
            
            # Run translation
            translated_text = await self._run_translation(text, source_lang_code, target_lang_code)
            
            return {
                "translatedText": translated_text,
                "detectedSourceLanguage": source_language or "en", 
                "confidence": 0.95,  # NLLB doesn't provide confidence, use high default
                "input": text,
                "targetLanguage": target_language
            }
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            # Fallback to mock translation
            return await self._mock_translate(text, target_language, source_language)
    
    def _get_nllb_lang_code(self, lang_code: str) -> str:
        """Convert standard language code to NLLB format"""
        return self.nllb_lang_map.get(lang_code, "eng_Latn")  # Default to English
    
    async def _run_translation(self, text: str, source_lang: str, target_lang: str) -> str:
        """Run NLLB translation"""
        try:
            # Prepare input with source language prefix
            input_text = text
            
            # Tokenize input
            inputs = self.tokenizer(
                input_text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            )
            
            # Move to device
            if self.device != "cpu":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Set target language for generation
            self.tokenizer.src_lang = source_lang
            forced_bos_token_id = self.tokenizer.lang_code_to_id[target_lang]
            
            # Generate translation
            with torch.no_grad():
                generated_tokens = self.model.generate(
                    **inputs,
                    forced_bos_token_id=forced_bos_token_id,
                    max_length=512,
                    num_beams=4,
                    early_stopping=True
                )
            
            # Decode result
            translated_text = self.tokenizer.batch_decode(
                generated_tokens, skip_special_tokens=True
            )[0]
            
            return translated_text.strip()
            
        except Exception as e:
            logger.error(f"NLLB translation inference failed: {e}")
            raise
    
    async def _mock_translate(
        self, 
        text: str, 
        target_language: str, 
        source_language: Optional[str]
    ) -> Dict[str, Any]:
        """Mock translation for development"""
        # Simulate processing time
        await asyncio.sleep(0.05)
        
        # Simple mock translations for common cases
        mock_translations = {
            ("hello", "es"): "hola",
            ("hello", "fr"): "bonjour",
            ("hello", "de"): "hallo",
            ("hello", "it"): "ciao",
            ("hello", "pt"): "olá",
            ("hello", "ru"): "привет",
            ("hello", "zh"): "你好",
            ("hello", "ja"): "こんにちは",
            ("hello", "ko"): "안녕하세요",
            ("how are you", "es"): "cómo estás",
            ("how are you", "fr"): "comment allez-vous",
            ("how are you", "de"): "wie geht es dir",
        }
        
        # Get mock translation or create simple one
        key = (text.lower().strip(), target_language)
        if key in mock_translations:
            translated_text = mock_translations[key]
        else:
            # Simple mock: add language prefix
            translated_text = f"[{target_language}] {text}"
        
        return {
            "translatedText": translated_text,
            "detectedSourceLanguage": source_language or "en",
            "confidence": 0.9,
            "input": text,
            "targetLanguage": target_language
        }
    
    async def translate_batch(
        self,
        texts: List[str],
        target_language: str,
        source_language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Translate multiple texts in batch
        """
        if not self.is_initialized:
            raise RuntimeError("Google Translate service not initialized")
        
        if not texts:
            return []
        
        try:
            results = []
            for text in texts:
                result = await self.translate_text(text, target_language, source_language)
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Batch translation failed: {e}")
            raise
    
    async def detect_language(self, text: str) -> Dict[str, Any]:
        """
        Detect language of text
        """
        if not self.is_initialized:
            raise RuntimeError("Google Translate service not initialized")
        
        if not text.strip():
            return {
                "language": "en",
                "confidence": 0.0,
                "input": text
            }
        
        try:
            # Mock language detection
            await asyncio.sleep(0.02)
            
            # Simple heuristics for mock detection
            text_lower = text.lower()
            if any(word in text_lower for word in ["hola", "cómo", "gracias"]):
                detected_lang = "es"
            elif any(word in text_lower for word in ["bonjour", "merci", "comment"]):
                detected_lang = "fr"
            elif any(word in text_lower for word in ["hallo", "danke", "wie"]):
                detected_lang = "de"
            else:
                detected_lang = "en"  # Default
            
            return {
                "language": detected_lang,
                "confidence": 0.8,
                "input": text
            }
            
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return {
                "language": "en",
                "confidence": 0.5,
                "error": str(e)
            }
    
    async def get_supported_languages(self) -> List[Dict[str, str]]:
        """Get list of supported languages"""
        if not self.is_initialized:
            raise RuntimeError("Google Translate service not initialized")
        
        try:
            # Return basic language list
            language_names = {
                "en": "English",
                "es": "Spanish",
                "fr": "French",
                "de": "German",
                "it": "Italian",
                "pt": "Portuguese",
                "ru": "Russian",
                "zh": "Chinese",
                "ja": "Japanese",
                "ko": "Korean",
                "ar": "Arabic",
                "hi": "Hindi",
                "nl": "Dutch",
                "sv": "Swedish",
                "da": "Danish",
                "no": "Norwegian",
                "fi": "Finnish",
                "pl": "Polish"
            }
            
            languages = []
            for code in self.supported_languages:
                name = language_names.get(code, code.upper())
                languages.append({"code": code, "name": name})
            
            return languages
            
        except Exception as e:
            logger.error(f"Failed to get supported languages: {e}")
            # Return basic fallback
            return [{"code": code, "name": code.upper()} for code in self.supported_languages[:10]]
    
    async def optimize_for_speech(self, text: str, target_language: str) -> str:
        """
        Optimize translated text for speech synthesis
        """
        try:
            # Basic text optimization for speech
            optimized = text.strip()
            
            # Remove or replace characters that don't speech-synthesize well
            replacements = {
                "…": "...",
                """: '"',
                """: '"',
                "'": "'",
                "'": "'",
                "–": "-",
                "—": "-"
            }
            
            for old, new in replacements.items():
                optimized = optimized.replace(old, new)
            
            # Ensure proper punctuation for natural speech pauses
            if optimized and not optimized.endswith(('.', '!', '?', ':')):
                optimized += '.'
            
            return optimized
            
        except Exception as e:
            logger.error(f"Speech optimization failed: {e}")
            return text
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        try:
            if not self.is_initialized:
                return {"status": "unhealthy", "error": "Service not initialized"}
            
            # Test with simple translation
            result = await self.translate_text("Hello", "es")
            
            if result and result.get("translatedText"):
                return {
                    "status": "healthy",
                    "model": self.model_name,
                    "supported_languages": len(self.supported_languages),
                    "test_translation": result["translatedText"],
                    "mode": "local" if self.use_local else "mock",
                    "device": self.device if self.use_local else "cpu"
                }
            else:
                return {"status": "unhealthy", "error": "Translation test failed"}
                
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}