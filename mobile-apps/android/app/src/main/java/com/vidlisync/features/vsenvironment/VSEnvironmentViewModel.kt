package com.vidlisync.features.vsenvironment

import android.bluetooth.BluetoothDevice
import android.media.*
import android.util.Log
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vidlisync.translation.TranslationEngine
import kotlinx.coroutines.*
import okhttp3.*
import okio.ByteString
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

/**
 * ViewModel for VS Environment feature
 * Handles business logic, audio processing, and translation coordination
 * Created for issue #40 - VidLiSync VS Environment: Real-time Environmental Translation for Mobile
 */
class VSEnvironmentViewModel : ViewModel() {
    companion object {
        private const val TAG = "VSEnvironmentViewModel"
        private const val SAMPLE_RATE = 44100
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val WEBSOCKET_URL = "wss://api.vidlisync.com/ws/vs-environment"
        private const val BUFFER_SIZE_MULTIPLIER = 4
    }
    
    // LiveData for UI observation
    val isTranslating = MutableLiveData(false)
    val transcriptionText = MutableLiveData<TranscriptionData>()
    val audioLevel = MutableLiveData(0f)
    val errorMessage = MutableLiveData<String?>()
    val detectedLanguage = MutableLiveData("Detecting...")
    val targetLanguage = MutableLiveData("EN")
    val isRecording = MutableLiveData(false)
    val recordingTime = MutableLiveData(0)
    val bluetoothDevices = MutableLiveData<List<BluetoothDevice>>()
    
    // Private properties
    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private var webSocket: WebSocket? = null
    private var currentConfig: EnvironmentConfig? = null
    private var recordingFile: File? = null
    private var recordingJob: Job? = null
    private var translationJob: Job? = null
    private var recordingTimer: Job? = null
    
    // Audio processing
    private val translationEngine = TranslationEngine.getInstance()
    private var audioBufferSize: Int = 0
    private val audioBuffer = mutableListOf<ByteArray>()
    private val maxBufferSize = 10 // Process every 10 chunks for real-time performance
    
    // Performance metrics
    private val latencyMeasurements = mutableListOf<Long>()
    private val maxLatencyMeasurements = 100
    
    init {
        calculateAudioBufferSize()
    }
    
    override fun onCleared() {
        super.onCleared()
        cleanup()
    }
    
    // MARK: - Public Methods
    
    fun onPermissionsGranted() {
        // Initialize audio components after permissions are granted
        initializeAudioComponents()
    }
    
    fun startEnvironment(config: EnvironmentConfig) {
        currentConfig = config
        targetLanguage.value = config.targetLanguage.uppercase()
        
        viewModelScope.launch {
            try {
                // Initialize audio recording
                initializeAudioRecord()
                
                // Connect to translation service
                connectToTranslationService(config)
                
                // Start translation loop
                startTranslationLoop()
                
                isTranslating.value = true
                
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start environment", e)
                errorMessage.value = "Failed to start VS Environment: ${e.message}"
            }
        }
    }
    
    fun stopEnvironment() {
        isTranslating.value = false
        stopRecording()
        cleanup()
    }
    
    fun toggleRecording() {
        if (isRecording.value == true) {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    fun startRecording() {
        if (isRecording.value == true) return
        
        try {
            // Create recording file
            val timestamp = System.currentTimeMillis()
            recordingFile = File.createTempFile("vs_environment_$timestamp", ".wav")
            
            isRecording.value = true
            recordingTime.value = 0
            
            // Start recording timer
            recordingTimer = viewModelScope.launch {
                while (isRecording.value == true) {
                    delay(1000)
                    recordingTime.value = (recordingTime.value ?: 0) + 1
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            errorMessage.value = "Failed to start recording: ${e.message}"
        }
    }
    
    fun stopRecording() {
        if (isRecording.value != true) return
        
        isRecording.value = false
        recordingTimer?.cancel()
        recordingTime.value = 0
        
        // Save recording file
        recordingFile?.let { file ->
            Log.d(TAG, "Recording saved: ${file.absolutePath}")
            // Here you would typically upload or process the recording
        }
    }
    
    fun swapLanguages() {
        val current = detectedLanguage.value
        val target = targetLanguage.value
        
        detectedLanguage.value = target
        targetLanguage.value = current
        
        // Update configuration and restart if needed
        currentConfig?.let { config ->
            val newConfig = config.copy(
                targetLanguage = current ?: "en",
                sourceLanguage = target?.lowercase()
            )
            currentConfig = newConfig
            
            // Send updated config to translation service
            sendConfigurationUpdate(newConfig)
        }
    }
    
    fun updateAudioRouting(inputDevice: AudioDevice, outputDevice: AudioDevice) {
        currentConfig?.let { config ->
            val newConfig = config.copy(
                inputDevice = inputDevice,
                outputDevice = outputDevice
            )
            currentConfig = newConfig
            
            // Restart audio with new routing
            if (isTranslating.value == true) {
                viewModelScope.launch {
                    stopAudioProcessing()
                    delay(100) // Brief pause
                    initializeAudioRecord()
                    startTranslationLoop()
                }
            }
        }
    }
    
    fun updateBluetoothDevices(devices: List<BluetoothDevice>) {
        bluetoothDevices.value = devices
    }
    
    fun clearError() {
        errorMessage.value = null
    }
    
    // MARK: - Private Methods
    
    private fun calculateAudioBufferSize() {
        audioBufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            CHANNEL_CONFIG,
            AUDIO_FORMAT
        ) * BUFFER_SIZE_MULTIPLIER
    }
    
    private fun initializeAudioComponents() {
        try {
            // Initialize AudioTrack for playback
            val playbackBufferSize = AudioTrack.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_OUT_MONO,
                AUDIO_FORMAT
            )
            
            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AUDIO_FORMAT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(playbackBufferSize)
                .build()
                
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize audio components", e)
            errorMessage.value = "Failed to initialize audio: ${e.message}"
        }
    }
    
    private fun initializeAudioRecord() {
        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                audioBufferSize
            )
            
            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                throw IllegalStateException("AudioRecord initialization failed")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize AudioRecord", e)
            errorMessage.value = "Failed to initialize microphone: ${e.message}"
            throw e
        }
    }
    
    private suspend fun connectToTranslationService(config: EnvironmentConfig) {
        return withContext(Dispatchers.IO) {
            try {
                val client = OkHttpClient.Builder()
                    .connectTimeout(10, TimeUnit.SECONDS)
                    .readTimeout(0, TimeUnit.SECONDS) // No timeout for WebSocket
                    .build()
                
                val request = Request.Builder()
                    .url(WEBSOCKET_URL)
                    .build()
                
                webSocket = client.newWebSocket(request, object : WebSocketListener() {
                    override fun onOpen(webSocket: WebSocket, response: Response) {
                        Log.d(TAG, "WebSocket connected")
                        // Send initial configuration
                        sendConfigurationUpdate(config)
                    }
                    
                    override fun onMessage(webSocket: WebSocket, text: String) {
                        handleTextMessage(text)
                    }
                    
                    override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                        handleBinaryMessage(bytes.toByteArray())
                    }
                    
                    override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                        Log.e(TAG, "WebSocket error", t)
                        viewModelScope.launch {
                            errorMessage.value = "Connection failed: ${t.message}"
                        }
                    }
                    
                    override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                        Log.d(TAG, "WebSocket closed: $code - $reason")
                    }
                })
                
            } catch (e: Exception) {
                Log.e(TAG, "Failed to connect to translation service", e)
                throw e
            }
        }
    }
    
    private fun sendConfigurationUpdate(config: EnvironmentConfig) {
        try {
            val configJson = """
                {
                    "type": "config",
                    "targetLanguage": "${config.targetLanguage}",
                    "sourceLanguage": "${config.sourceLanguage ?: "auto"}",
                    "useVoiceCloning": ${config.useVoiceCloning},
                    "outputMode": "${config.outputMode.name}",
                    "noiseReduction": ${config.noiseReduction}
                }
            """.trimIndent()
            
            webSocket?.send(configJson)
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send configuration", e)
        }
    }
    
    private fun startTranslationLoop() {
        translationJob = viewModelScope.launch(Dispatchers.IO) {
            try {
                audioRecord?.startRecording()
                val buffer = ByteArray(audioBufferSize)
                
                while (isTranslating.value == true && isActive) {
                    val bytesRead = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    
                    if (bytesRead > 0) {
                        // Calculate audio level for UI feedback
                        val audioLevel = calculateAudioLevel(buffer, bytesRead)
                        withContext(Dispatchers.Main) {
                            this@VSEnvironmentViewModel.audioLevel.value = audioLevel
                        }
                        
                        // Add to buffer for processing
                        audioBuffer.add(buffer.copyOf(bytesRead))
                        
                        // Process buffer when it reaches threshold
                        if (audioBuffer.size >= maxBufferSize) {
                            processAudioBuffer()
                        }
                        
                        // Save to recording file if recording
                        if (isRecording.value == true) {
                            saveToRecordingFile(buffer, bytesRead)
                        }
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Translation loop error", e)
                withContext(Dispatchers.Main) {
                    errorMessage.value = "Audio processing error: ${e.message}"
                }
            } finally {
                audioRecord?.stop()
            }
        }
    }
    
    private suspend fun processAudioBuffer() {
        if (audioBuffer.isEmpty()) return
        
        try {
            // Combine audio chunks
            val combinedBuffer = combineAudioChunks(audioBuffer)
            audioBuffer.clear()
            
            // Send to translation service
            webSocket?.send(ByteString.of(*combinedBuffer))
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to process audio buffer", e)
        }
    }
    
    private fun combineAudioChunks(chunks: List<ByteArray>): ByteArray {
        val totalSize = chunks.sumOf { it.size }
        val combined = ByteArray(totalSize)
        var offset = 0
        
        for (chunk in chunks) {
            System.arraycopy(chunk, 0, combined, offset, chunk.size)
            offset += chunk.size
        }
        
        return combined
    }
    
    private fun calculateAudioLevel(buffer: ByteArray, length: Int): Float {
        var sum = 0L
        for (i in 0 until length step 2) {
            val sample = ((buffer[i + 1].toInt() shl 8) or (buffer[i].toInt() and 0xFF)).toShort()
            sum += (sample * sample).toLong()
        }
        
        val rms = kotlin.math.sqrt(sum.toDouble() / (length / 2))
        return (rms / Short.MAX_VALUE).toFloat().coerceIn(0f, 1f)
    }
    
    private fun saveToRecordingFile(buffer: ByteArray, length: Int) {
        try {
            recordingFile?.let { file ->
                FileOutputStream(file, true).use { fos ->
                    fos.write(buffer, 0, length)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save recording", e)
        }
    }
    
    private fun handleTextMessage(message: String) {
        try {
            // Parse JSON response from translation service
            Log.d(TAG, "Received text message: $message")
            
            // Update UI based on message type
            viewModelScope.launch {
                // Parse and update transcription, detected language, etc.
                // This would integrate with the actual translation service response format
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle text message", e)
        }
    }
    
    private fun handleBinaryMessage(data: ByteArray) {
        try {
            // Handle translated audio data
            currentConfig?.let { config ->
                if (config.outputMode.includesAudio()) {
                    playTranslatedAudio(data)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle binary message", e)
        }
    }
    
    private fun playTranslatedAudio(audioData: ByteArray) {
        try {
            audioTrack?.let { track ->
                if (track.state == AudioTrack.STATE_INITIALIZED) {
                    track.play()
                    track.write(audioData, 0, audioData.size)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play translated audio", e)
        }
    }
    
    private fun stopAudioProcessing() {
        translationJob?.cancel()
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
    }
    
    private fun cleanup() {
        stopAudioProcessing()
        
        audioTrack?.stop()
        audioTrack?.release()
        audioTrack = null
        
        webSocket?.close(1000, "Cleanup")
        webSocket = null
        
        recordingTimer?.cancel()
        recordingJob?.cancel()
        
        audioBuffer.clear()
    }
}
