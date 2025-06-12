package com.vidlisync.features.vsfriends

import android.app.Activity
import android.content.Intent
import android.nfc.NfcAdapter
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.os.*
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.AudioFormat
import android.media.MediaRecorder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import kotlinx.coroutines.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.util.*

/**
 * VS Friends Activity for Android - Main entry point for tap-to-connect conversations
 */
class VSFriendsActivity : ComponentActivity() {
    private lateinit var connectionsClient: ConnectionsClient
    private lateinit var vsFriendsManager: VSFriendsManager
    private val nfcAdapter: NfcAdapter? by lazy {
        NfcAdapter.getDefaultAdapter(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        vsFriendsManager = VSFriendsManager(this)
        connectionsClient = Nearby.getConnectionsClient(this)

        // Check if launched from NFC tap
        if (NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action) {
            handleNfcIntent(intent)
        }

        setContent {
            VSFriendsTheme {
                VSFriendsScreen(manager = vsFriendsManager)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (NfcAdapter.ACTION_NDEF_DISCOVERED == intent.action) {
            handleNfcIntent(intent)
        }
    }

    private fun handleNfcIntent(intent: Intent) {
        // Extract peer info from NFC tag
        val messages = intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
        messages?.let {
            val ndefMessage = it[0] as NdefMessage
            val peerInfo = parsePeerInfo(ndefMessage.records[0])

            // Vibrate to confirm
            vibrate()

            // Auto-connect
            lifecycleScope.launch {
                vsFriendsManager.connectToPeer(peerInfo)
            }
        }
    }

    private fun parsePeerInfo(record: NdefRecord): VSFriend {
        val payload = String(record.payload)
        // In production, parse JSON connection data
        return VSFriend(
            id = UUID.randomUUID().toString(),
            name = "Friend's Phone",
            deviceName = "Android Device",
            language = "en",
            selectedLanguage = "en",
            joinedAt = System.currentTimeMillis(),
            peerID = payload
        )
    }

    private fun vibrate() {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as Vibrator
        }

        vibrator.vibrate(
            VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE)
        )
    }
}

/**
 * VS Friends Manager - Core logic for connection and audio processing
 */
class VSFriendsManager(private val activity: Activity) {
    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private val translationEngine = TranslationEngine.getInstance()

    val conversationState = mutableStateOf(ConversationState.IDLE)
    val participants = mutableStateListOf<VSFriend>()
    val estimatedCost = mutableStateOf(0.0)
    val showMinimalUI = mutableStateOf(true)
    val isInitiator = mutableStateOf(false)
    val currentSession = mutableStateOf<VSFriendsSession?>(null)

    private val connectionsClient = Nearby.getConnectionsClient(activity)
    private val audioManager = AudioManager(activity)
    private var sessionStartTime: Long = 0

    companion object {
        private const val SERVICE_ID = "vidlisync_vsfriends"
        private const val STRATEGY = Strategy.P2P_CLUSTER
    }

    // Connection lifecycle callback
    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
            // Auto-accept all connections for VS Friends
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            when (result.status.statusCode) {
                ConnectionsStatusCodes.STATUS_OK -> {
                    // Connection successful
                    scope.launch {
                        handleConnectionEstablished(endpointId)
                    }
                }
                ConnectionsStatusCodes.STATUS_CONNECTION_REJECTED -> {
                    // Connection rejected
                    scope.launch {
                        conversationState.value = ConversationState.IDLE
                    }
                }
                else -> {
                    // Connection failed
                    scope.launch {
                        conversationState.value = ConversationState.IDLE
                    }
                }
            }
        }

        override fun onDisconnected(endpointId: String) {
            // Remove participant
            scope.launch {
                participants.removeAll { it.peerID == endpointId }
                if (participants.isEmpty() && conversationState.value == ConversationState.ACTIVE) {
                    endConversation()
                }
            }
        }
    }

    // Payload callback for receiving data
    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            when (payload.type) {
                Payload.Type.BYTES -> {
                    payload.asBytes()?.let { audioData ->
                        scope.launch {
                            processIncomingAudio(audioData, endpointId)
                        }
                    }
                }
                else -> {
                    // Handle other payload types if needed
                }
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
            // Handle transfer updates if needed
        }
    }

    // Endpoint discovery callback
    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            scope.launch {
                val friend = VSFriend(
                    id = endpointId,
                    name = info.endpointName,
                    deviceName = info.endpointName,
                    language = "en", // Would be parsed from service info
                    selectedLanguage = "en",
                    joinedAt = System.currentTimeMillis(),
                    peerID = endpointId
                )
                
                // Auto-connect if initiator
                if (isInitiator.value) {
                    connectToPeer(friend)
                }
            }
        }

        override fun onEndpointLost(endpointId: String) {
            scope.launch {
                participants.removeAll { it.peerID == endpointId }
            }
        }
    }

    /**
     * Start friend discovery
     */
    fun startFriendDiscovery() {
        isInitiator.value = true
        conversationState.value = ConversationState.DISCOVERING

        // Enable NFC for tap
        enableNfcForegroundDispatch()

        // Start Nearby Connections
        startNearbyAdvertising()
        startNearbyDiscovery()
    }

    /**
     * Connect to a discovered peer
     */
    suspend fun connectToPeer(friend: VSFriend) {
        if (participants.size >= 4) return // Max 4 participants

        conversationState.value = ConversationState.CONNECTING

        try {
            val connectionData = createConnectionData()
            connectionsClient.requestConnection(
                getUserName(),
                friend.peerID,
                connectionLifecycleCallback
            )

            // Add participant optimistically
            participants.add(friend.copy(isConnected = false))

        } catch (e: Exception) {
            conversationState.value = ConversationState.IDLE
        }
    }

    /**
     * Start the conversation
     */
    suspend fun startConversation() {
        conversationState.value = ConversationState.ACTIVE
        sessionStartTime = System.currentTimeMillis()

        currentSession.value = VSFriendsSession(
            id = UUID.randomUUID().toString(),
            initiatorId = getUserId(),
            participants = participants.toList(),
            startTime = sessionStartTime
        )

        // Start audio processing
        audioManager.startCapture { audioData ->
            scope.launch {
                processOutgoingAudio(audioData)
            }
        }

        // Start cost tracking
        startCostTracking()
    }

    /**
     * End the conversation
     */
    fun endConversation() {
        conversationState.value = ConversationState.ENDED

        // Stop audio
        audioManager.stopCapture()

        // Disconnect all peers
        connectionsClient.stopAllEndpoints()

        // Update session
        currentSession.value = currentSession.value?.copy(
            endTime = System.currentTimeMillis()
        )

        // Calculate final cost
        calculateFinalCost()
    }

    /**
     * Toggle minimal UI mode
     */
    fun toggleMinimalUI() {
        showMinimalUI.value = !showMinimalUI.value
    }

    // Private helper methods

    private fun enableNfcForegroundDispatch() {
        val nfcAdapter = NfcAdapter.getDefaultAdapter(activity) ?: return

        val intent = Intent(activity, VSFriendsActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }

        val pendingIntent = PendingIntent.getActivity(
            activity, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        // Create NFC message with peer info
        val message = createNfcMessage()

        nfcAdapter.setNdefPushMessage(message, activity)
        nfcAdapter.enableForegroundDispatch(
            activity as ComponentActivity, pendingIntent, null, null
        )
    }

    private fun createNfcMessage(): NdefMessage {
        val connectionData = Json.encodeToString(
            ConnectionInfo.serializer(),
            ConnectionInfo(
                deviceName = getDeviceName(),
                language = getPreferredLanguage(),
                userId = getUserId(),
                sessionId = currentSession.value?.id ?: UUID.randomUUID().toString()
            )
        )

        val record = NdefRecord.createTextRecord("en", connectionData)
        return NdefMessage(arrayOf(record))
    }

    private fun startNearbyAdvertising() {
        val advertisingOptions = AdvertisingOptions.Builder()
            .setStrategy(STRATEGY)
            .build()

        connectionsClient.startAdvertising(
            getUserName(),
            SERVICE_ID,
            connectionLifecycleCallback,
            advertisingOptions
        )
    }

    private fun startNearbyDiscovery() {
        val discoveryOptions = DiscoveryOptions.Builder()
            .setStrategy(STRATEGY)
            .build()

        connectionsClient.startDiscovery(
            SERVICE_ID,
            endpointDiscoveryCallback,
            discoveryOptions
        )
    }

    private suspend fun handleConnectionEstablished(endpointId: String) {
        // Update participant status
        val index = participants.indexOfFirst { it.peerID == endpointId }
        if (index >= 0) {
            participants[index] = participants[index].copy(isConnected = true)
        }

        // Start conversation if this is the first connection
        if (participants.count { it.isConnected } == 1) {
            startConversation()
        }
    }

    private suspend fun processOutgoingAudio(audioData: ByteArray) {
        val myLanguage = getPreferredLanguage()

        participants.filter { it.isConnected }.forEach { participant ->
            if (participant.language != myLanguage) {
                try {
                    val translatedAudio = translationEngine.translateAudio(
                        audioData,
                        sourceLanguage = myLanguage,
                        targetLanguage = participant.language,
                        useVoiceClone = true
                    )

                    sendAudioToParticipant(translatedAudio, participant)
                } catch (e: Exception) {
                    // Send original audio if translation fails
                    sendAudioToParticipant(audioData, participant)
                }
            } else {
                // Send original audio if same language
                sendAudioToParticipant(audioData, participant)
            }
        }
    }

    private suspend fun processIncomingAudio(audioData: ByteArray, fromEndpointId: String) {
        // Play audio through earbuds
        audioManager.playAudio(audioData)

        // Update speaking indicator
        val index = participants.indexOfFirst { it.peerID == fromEndpointId }
        if (index >= 0) {
            participants[index] = participants[index].copy(isSpeaking = true)

            // Clear speaking indicator after delay
            delay(1000)
            if (index < participants.size) {
                participants[index] = participants[index].copy(isSpeaking = false)
            }
        }
    }

    private fun sendAudioToParticipant(audioData: ByteArray, participant: VSFriend) {
        val payload = Payload.fromBytes(audioData)
        connectionsClient.sendPayload(participant.peerID, payload)
    }

    private fun startCostTracking() {
        scope.launch {
            while (conversationState.value == ConversationState.ACTIVE) {
                delay(5000) // Update every 5 seconds
                updateCostEstimate()
            }
        }
    }

    private fun updateCostEstimate() {
        val duration = System.currentTimeMillis() - sessionStartTime
        val minutes = kotlin.math.max(1, (duration / 60000).toInt())
        val participantMultiplier = kotlin.math.max(1, participants.count { it.isConnected })

        estimatedCost.value = minutes * 0.02 * participantMultiplier
    }

    private fun calculateFinalCost() {
        updateCostEstimate()
        // In production, trigger billing API call here
    }

    private fun createConnectionData(): ByteArray {
        val connectionInfo = ConnectionInfo(
            deviceName = getDeviceName(),
            language = getPreferredLanguage(),
            userId = getUserId(),
            sessionId = currentSession.value?.id ?: UUID.randomUUID().toString()
        )

        return Json.encodeToString(ConnectionInfo.serializer(), connectionInfo).toByteArray()
    }

    private fun getUserName(): String {
        return android.os.Build.MODEL
    }

    private fun getDeviceName(): String {
        return "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
    }

    private fun getPreferredLanguage(): String {
        return "en" // Would get from user preferences
    }

    private fun getUserId(): String {
        return UUID.randomUUID().toString() // Would get from authentication
    }
}

/**
 * Audio Manager for Android
 */
class AudioManager(private val context: Activity) {
    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private val sampleRate = 16000
    private val bufferSize = AudioRecord.getMinBufferSize(
        sampleRate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    )

    init {
        setupBluetoothPreference()
    }

    private fun setupBluetoothPreference() {
        val audioManager = context.getSystemService(android.content.Context.AUDIO_SERVICE) as android.media.AudioManager

        // Prefer Bluetooth headset
        audioManager.mode = android.media.AudioManager.MODE_IN_COMMUNICATION
        audioManager.isBluetoothScoOn = true
        audioManager.startBluetoothSco()
    }

    suspend fun startCapture(onAudioCaptured: (ByteArray) -> Unit) {
        withContext(Dispatchers.IO) {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )

            audioRecord?.startRecording()

            val buffer = ByteArray(bufferSize)
            while (isActive) {
                val bytesRead = audioRecord?.read(buffer, 0, bufferSize) ?: 0
                if (bytesRead > 0) {
                    onAudioCaptured(buffer.copyOf(bytesRead))
                }
            }
        }
    }

    fun stopCapture() {
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
    }

    fun playAudio(audioData: ByteArray) {
        // Implementation to play audio through earbuds
        // Would use AudioTrack or MediaPlayer
    }
}

/**
 * Translation Engine - Integrates with VidLiSync AI pipeline
 */
class TranslationEngine private constructor() {
    companion object {
        @Volatile
        private var INSTANCE: TranslationEngine? = null

        fun getInstance(): TranslationEngine {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: TranslationEngine().also { INSTANCE = it }
            }
        }
    }

    suspend fun translateAudio(
        audioData: ByteArray,
        sourceLanguage: String,
        targetLanguage: String,
        useVoiceClone: Boolean
    ): ByteArray {
        // In production, integrate with VidLiSync AI translation pipeline
        // For now, simulate translation
        delay(200) // Simulate processing time

        // Return mock translated audio
        return audioData
    }
}

// Data Models

enum class ConversationState {
    IDLE, DISCOVERING, CONNECTING, ACTIVE, ENDED
}

@Serializable
data class VSFriend(
    val id: String,
    val name: String,
    val deviceName: String,
    val language: String,
    val selectedLanguage: String,
    val joinedAt: Long,
    val peerID: String,
    val isSpeaking: Boolean = false,
    val isConnected: Boolean = false
) {
    val initials: String
        get() = name.split(" ").mapNotNull { it.firstOrNull() }.joinToString("").uppercase()
}

@Serializable
data class VSFriendsSession(
    val id: String,
    val initiatorId: String,
    val participants: List<VSFriend>,
    val startTime: Long,
    val endTime: Long? = null
) {
    val isActive: Boolean get() = endTime == null
}

@Serializable
data class ConnectionInfo(
    val deviceName: String,
    val language: String,
    val userId: String,
    val sessionId: String
)