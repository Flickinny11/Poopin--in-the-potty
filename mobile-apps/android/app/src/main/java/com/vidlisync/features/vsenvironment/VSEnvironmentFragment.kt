package com.vidlisync.features.vsenvironment

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothHeadset
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.content.pm.PackageManager
import android.media.*
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.vidlisync.databinding.FragmentVsEnvironmentBinding
import com.vidlisync.translation.TranslationEngine
import kotlinx.coroutines.*

/**
 * VS Environment Fragment for real-time environmental translation
 * Created for issue #40 - VidLiSync VS Environment: Real-time Environmental Translation for Mobile
 */
class VSEnvironmentFragment : Fragment() {
    private var _binding: FragmentVsEnvironmentBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: VSEnvironmentViewModel
    private lateinit var audioManager: AudioManager
    private var bluetoothHeadset: BluetoothHeadset? = null
    private var bluetoothAdapter: BluetoothAdapter? = null
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN
        )
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentVsEnvironmentBinding.inflate(inflater, container, false)
        viewModel = ViewModelProvider(this)[VSEnvironmentViewModel::class.java]
        
        setupUI()
        setupAudioRouting()
        observeViewModel()
        checkPermissions()
        
        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
        bluetoothAdapter?.closeProfileProxy(BluetoothProfile.HEADSET, bluetoothHeadset)
    }

    private fun setupUI() {
        // Start Environment Button
        binding.startEnvironmentButton.setOnClickListener {
            if (!viewModel.isTranslating.value!!) {
                showSetupDialog()
            } else {
                stopEnvironment()
            }
        }
        
        // Quick Settings
        binding.audioRoutingButton.setOnClickListener {
            showAudioRoutingDialog()
        }
        
        // Recording Controls
        binding.recordButton.setOnClickListener {
            viewModel.toggleRecording()
        }
        
        // Language swap button
        binding.swapLanguagesButton.setOnClickListener {
            viewModel.swapLanguages()
        }
        
        // Settings button
        binding.settingsButton.setOnClickListener {
            // Open settings dialog or navigate to settings
            showSettingsDialog()
        }
    }

    private fun showSetupDialog() {
        VSEnvironmentSetupDialog().apply {
            onSetupComplete = { config ->
                viewModel.startEnvironment(config)
            }
        }.show(childFragmentManager, "setup")
    }

    private fun showAudioRoutingDialog() {
        AudioRoutingDialog().apply {
            onRoutingChanged = { inputDevice, outputDevice ->
                viewModel.updateAudioRouting(inputDevice, outputDevice)
            }
        }.show(childFragmentManager, "audio_routing")
    }
    
    private fun showSettingsDialog() {
        VSEnvironmentSettingsDialog().show(childFragmentManager, "settings")
    }

    private fun stopEnvironment() {
        viewModel.stopEnvironment()
    }

    private fun setupAudioRouting() {
        audioManager = requireContext().getSystemService(Context.AUDIO_SERVICE) as AudioManager
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        
        // Enable Bluetooth SCO for earbuds
        if (audioManager.isBluetoothScoAvailableOffCall) {
            audioManager.startBluetoothSco()
        }
        
        // Set up Bluetooth profile listener
        bluetoothAdapter?.getProfileProxy(
            requireContext(),
            object : BluetoothProfile.ServiceListener {
                override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
                    if (profile == BluetoothProfile.HEADSET) {
                        bluetoothHeadset = proxy as BluetoothHeadset
                        updateBluetoothDevices()
                    }
                }
                
                override fun onServiceDisconnected(profile: Int) {
                    bluetoothHeadset = null
                }
            },
            BluetoothProfile.HEADSET
        )
    }

    private fun updateBluetoothDevices() {
        bluetoothHeadset?.let { headset ->
            if (ActivityCompat.checkSelfPermission(
                    requireContext(),
                    Manifest.permission.BLUETOOTH
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                val connectedDevices = headset.connectedDevices
                viewModel.updateBluetoothDevices(connectedDevices)
            }
        }
    }

    private fun observeViewModel() {
        viewModel.isTranslating.observe(viewLifecycleOwner) { isTranslating ->
            updateUI(isTranslating)
        }
        
        viewModel.transcriptionText.observe(viewLifecycleOwner) { transcription ->
            binding.transcriptionView.updateText(
                original = transcription.original,
                translated = transcription.translated
            )
        }
        
        viewModel.audioLevel.observe(viewLifecycleOwner) { level ->
            binding.audioLevelIndicator.setLevel(level)
        }
        
        viewModel.errorMessage.observe(viewLifecycleOwner) { error ->
            error?.let {
                showErrorDialog(it)
            }
        }
        
        viewModel.detectedLanguage.observe(viewLifecycleOwner) { language ->
            binding.detectedLanguageText.text = language
        }
        
        viewModel.targetLanguage.observe(viewLifecycleOwner) { language ->
            binding.targetLanguageText.text = language
        }
        
        viewModel.isRecording.observe(viewLifecycleOwner) { isRecording ->
            updateRecordingUI(isRecording)
        }
    }

    private fun updateUI(isTranslating: Boolean) {
        binding.apply {
            if (isTranslating) {
                // Show active translation UI
                setupContainer.visibility = View.GONE
                activeTranslationContainer.visibility = View.VISIBLE
                startEnvironmentButton.text = "Stop Environment"
                startEnvironmentButton.setBackgroundColor(
                    ContextCompat.getColor(requireContext(), android.R.color.holo_red_dark)
                )
            } else {
                // Show setup UI
                setupContainer.visibility = View.VISIBLE
                activeTranslationContainer.visibility = View.GONE
                startEnvironmentButton.text = "Start Environment"
                startEnvironmentButton.setBackgroundColor(
                    ContextCompat.getColor(requireContext(), android.R.color.holo_blue_bright)
                )
            }
        }
    }

    private fun updateRecordingUI(isRecording: Boolean) {
        binding.apply {
            if (isRecording) {
                recordButton.setImageResource(android.R.drawable.ic_media_pause)
                recordingIndicator.visibility = View.VISIBLE
                recordingTimer.visibility = View.VISIBLE
            } else {
                recordButton.setImageResource(android.R.drawable.ic_btn_speak_now)
                recordingIndicator.visibility = View.GONE
                recordingTimer.visibility = View.GONE
            }
        }
    }

    private fun showErrorDialog(message: String) {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Error")
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
                viewModel.clearError()
            }
            .show()
    }

    private fun checkPermissions() {
        val missingPermissions = REQUIRED_PERMISSIONS.filter {
            ContextCompat.checkSelfPermission(requireContext(), it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (missingPermissions.isNotEmpty()) {
            requestPermissions(missingPermissions.toTypedArray(), PERMISSION_REQUEST_CODE)
        } else {
            viewModel.onPermissionsGranted()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            
            if (allGranted) {
                viewModel.onPermissionsGranted()
            } else {
                showErrorDialog("Permissions are required for VS Environment to function properly")
            }
        }
    }
}

/**
 * Data classes for VS Environment
 */
data class TranscriptionData(
    val original: String,
    val translated: String,
    val confidence: Float = 0f,
    val timestamp: Long = System.currentTimeMillis()
)

data class EnvironmentConfig(
    val targetLanguage: String,
    val sourceLanguage: String? = null,
    val useVoiceCloning: Boolean = true,
    val outputMode: OutputMode = OutputMode.AUDIO_ONLY,
    val inputDevice: AudioDevice = AudioDevice.DEVICE_MICROPHONE,
    val outputDevice: AudioDevice = AudioDevice.DEVICE_SPEAKER,
    val recordingEnabled: Boolean = false,
    val noiseReduction: Boolean = true
)

enum class OutputMode {
    AUDIO_ONLY,
    TEXT_ONLY,
    BOTH;
    
    fun includesAudio(): Boolean = this == AUDIO_ONLY || this == BOTH
    fun includesText(): Boolean = this == TEXT_ONLY || this == BOTH
}

enum class AudioDevice {
    DEVICE_MICROPHONE,
    DEVICE_SPEAKER,
    BLUETOOTH;
    
    fun getDisplayName(): String = when (this) {
        DEVICE_MICROPHONE -> "Device Microphone"
        DEVICE_SPEAKER -> "Device Speaker"
        BLUETOOTH -> "Bluetooth"
    }
    
    fun getIcon(): Int = when (this) {
        DEVICE_MICROPHONE -> android.R.drawable.ic_btn_speak_now
        DEVICE_SPEAKER -> android.R.drawable.ic_lock_silent_mode_off
        BLUETOOTH -> android.R.drawable.stat_sys_data_bluetooth
    }
}

/**
 * Setup Dialog for VS Environment configuration
 */
class VSEnvironmentSetupDialog : androidx.fragment.app.DialogFragment() {
    var onSetupComplete: ((EnvironmentConfig) -> Unit)? = null
    
    private var selectedTargetLanguage = "en"
    private var selectedSourceLanguage: String? = null
    private var useVoiceCloning = true
    private var outputMode = OutputMode.AUDIO_ONLY
    private var inputDevice = AudioDevice.DEVICE_MICROPHONE
    private var outputDevice = AudioDevice.DEVICE_SPEAKER
    private var recordingEnabled = false
    private var noiseReduction = true
    
    override fun onCreateDialog(savedInstanceState: Bundle?): android.app.Dialog {
        val builder = androidx.appcompat.app.AlertDialog.Builder(requireContext())
        val inflater = requireActivity().layoutInflater
        val view = inflater.inflate(R.layout.dialog_vs_environment_setup, null)
        
        setupDialogViews(view)
        
        builder.setView(view)
            .setTitle("VS Environment Setup")
            .setPositiveButton("Start") { _, _ ->
                val config = EnvironmentConfig(
                    targetLanguage = selectedTargetLanguage,
                    sourceLanguage = selectedSourceLanguage,
                    useVoiceCloning = useVoiceCloning,
                    outputMode = outputMode,
                    inputDevice = inputDevice,
                    outputDevice = outputDevice,
                    recordingEnabled = recordingEnabled,
                    noiseReduction = noiseReduction
                )
                onSetupComplete?.invoke(config)
            }
            .setNegativeButton("Cancel", null)
        
        return builder.create()
    }
    
    private fun setupDialogViews(view: View) {
        // Setup language spinners, toggles, and other controls
        // Implementation would include UI setup for all configuration options
    }
}

/**
 * Audio Routing Dialog
 */
class AudioRoutingDialog : androidx.fragment.app.DialogFragment() {
    var onRoutingChanged: ((AudioDevice, AudioDevice) -> Unit)? = null
    
    override fun onCreateDialog(savedInstanceState: Bundle?): android.app.Dialog {
        val builder = androidx.appcompat.app.AlertDialog.Builder(requireContext())
        val inflater = requireActivity().layoutInflater
        val view = inflater.inflate(R.layout.dialog_audio_routing, null)
        
        // Setup audio routing controls
        
        builder.setView(view)
            .setTitle("Audio Routing")
            .setPositiveButton("Apply") { _, _ ->
                // Apply routing changes
            }
            .setNegativeButton("Cancel", null)
        
        return builder.create()
    }
}

/**
 * Settings Dialog
 */
class VSEnvironmentSettingsDialog : androidx.fragment.app.DialogFragment() {
    override fun onCreateDialog(savedInstanceState: Bundle?): android.app.Dialog {
        val builder = androidx.appcompat.app.AlertDialog.Builder(requireContext())
        val inflater = requireActivity().layoutInflater
        val view = inflater.inflate(R.layout.dialog_vs_environment_settings, null)
        
        // Setup settings controls
        
        builder.setView(view)
            .setTitle("VS Environment Settings")
            .setPositiveButton("Save", null)
            .setNegativeButton("Cancel", null)
        
        return builder.create()
    }
}
