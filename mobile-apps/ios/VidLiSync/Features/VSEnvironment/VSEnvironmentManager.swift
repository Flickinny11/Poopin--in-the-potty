//
//  VSEnvironmentManager.swift
//  VidLiSync
//
//  Audio routing and translation management for VS Environment
//  Created for issue #40 - VidLiSync VS Environment: Real-time Environmental Translation for Mobile
//

import Foundation
import AVFoundation
import CoreBluetooth
import Combine
import Network

enum AudioDevice: String, CaseIterable {
    case deviceMicrophone = "device_mic"
    case deviceSpeaker = "device_speaker"
    case bluetooth = "bluetooth"
    
    var displayName: String {
        switch self {
        case .deviceMicrophone: return "Device Microphone"
        case .deviceSpeaker: return "Device Speaker"
        case .bluetooth: return "Bluetooth"
        }
    }
    
    var icon: String {
        switch self {
        case .deviceMicrophone: return "mic.fill"
        case .deviceSpeaker: return "speaker.fill"
        case .bluetooth: return "bluetooth"
        }
    }
}

struct VSEnvironmentConfig {
    let profileLanguage: String
    let useVoiceCloning: Bool
    let inputDevice: AudioDevice
    let outputDevice: AudioDevice
    let transcriptionMode: VSEnvironmentView.TranscriptionMode
    let recordingEnabled: Bool
    let noiseReduction: Bool
    let autoLanguageDetection: Bool
}

struct TranslationResult {
    let originalText: String
    let translatedText: String
    let translatedAudio: Data?
    let confidence: Float
    let processingTime: TimeInterval
}

@MainActor
class VSEnvironmentManager: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var audioLevel: CGFloat = 1.0
    @Published var detectedLanguage = "Detecting..."
    @Published var targetLanguage = "EN"
    @Published var originalText = ""
    @Published var translatedText = ""
    @Published var inputDevice: AudioDevice = .deviceMicrophone
    @Published var outputDevice: AudioDevice = .deviceSpeaker
    @Published var isReady = false
    @Published var isTranslating = false
    @Published var errorMessage: String?
    
    // MARK: - Private Properties
    private var audioSession: AVAudioSession!
    private var audioEngine: AVAudioEngine!
    private var inputNode: AVAudioInputNode!
    private var audioPlayer: AVAudioPlayer?
    private var bluetoothManager: CBCentralManager?
    private var webSocketTask: URLSessionWebSocketTask?
    private var recordingURL: URL?
    private var isRecording = false
    
    // Translation pipeline
    private let translationService = TranslationService()
    private var currentConfig: VSEnvironmentConfig?
    
    // Performance monitoring
    private var latencyMeasurements: [TimeInterval] = []
    private let maxLatencyMeasurements = 100
    
    // Network monitoring
    private let networkMonitor = NWPathMonitor()
    private let networkQueue = DispatchQueue(label: "NetworkMonitor")
    
    override init() {
        super.init()
        setupAudioSession()
        setupNetworkMonitoring()
        requestPermissions()
    }
    
    deinit {
        cleanup()
    }
    
    // MARK: - Public Methods
    
    func requestPermissions() {
        Task {
            // Request microphone permission
            let micPermission = await AVAudioSession.sharedInstance().requestRecordPermission()
            
            if micPermission {
                await MainActor.run {
                    self.isReady = true
                }
            } else {
                await MainActor.run {
                    self.errorMessage = "Microphone permission is required for VS Environment"
                }
            }
        }
    }
    
    func configure(
        language: String,
        useVoiceCloning: Bool,
        mode: VSEnvironmentView.TranscriptionMode
    ) {
        currentConfig = VSEnvironmentConfig(
            profileLanguage: language,
            useVoiceCloning: useVoiceCloning,
            inputDevice: inputDevice,
            outputDevice: outputDevice,
            transcriptionMode: mode,
            recordingEnabled: true,
            noiseReduction: true,
            autoLanguageDetection: true
        )
        
        targetLanguage = language.uppercased()
    }
    
    func start() async -> Bool {
        guard let config = currentConfig else {
            errorMessage = "Configuration required before starting"
            return false
        }
        
        do {
            // Setup audio routing
            try setupAudioRouting()
            
            // Connect to translation service
            try await connectToTranslationService()
            
            // Start audio processing
            try startAudioProcessing()
            
            isTranslating = true
            return true
            
        } catch {
            errorMessage = "Failed to start VS Environment: \(error.localizedDescription)"
            return false
        }
    }
    
    func stop() {
        isTranslating = false
        stopAudioProcessing()
        disconnectFromTranslationService()
        stopRecording()
    }
    
    func startRecording() {
        guard !isRecording else { return }
        
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let timestamp = DateFormatter().string(from: Date())
        recordingURL = documentsPath.appendingPathComponent("vs_environment_\(timestamp).m4a")
        
        // Recording implementation would go here
        isRecording = true
    }
    
    func stopRecording() {
        guard isRecording else { return }
        isRecording = false
        
        // Stop recording and save file
        if let url = recordingURL {
            // Save recording metadata and file
            print("Recording saved to: \(url)")
        }
    }
    
    func swapLanguages() {
        // Implement language swapping logic
        let temp = detectedLanguage
        detectedLanguage = targetLanguage
        targetLanguage = temp
    }
    
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Private Methods
    
    private func setupAudioSession() {
        audioSession = AVAudioSession.sharedInstance()
        
        do {
            // Configure for simultaneous play and record
            try audioSession.setCategory(
                .playAndRecord,
                mode: .default,
                options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
            )
            
            // Set preferred sample rate and buffer size for low latency
            try audioSession.setPreferredSampleRate(44100)
            try audioSession.setPreferredIOBufferDuration(0.005) // 5ms for low latency
            
            try audioSession.setActive(true)
            
        } catch {
            print("Audio session setup error: \(error)")
        }
    }
    
    private func setupAudioRouting() throws {
        // Configure input routing
        if inputDevice == .bluetooth {
            // Find and select Bluetooth microphone
            for input in audioSession.availableInputs ?? [] {
                if input.portType == .bluetoothHFP {
                    try audioSession.setPreferredInput(input)
                    break
                }
            }
        }
        
        // Configure output routing
        let routeOptions: AVAudioSession.CategoryOptions
        switch outputDevice {
        case .bluetooth:
            routeOptions = [.allowBluetooth, .allowBluetoothA2DP]
        case .deviceSpeaker:
            routeOptions = [.defaultToSpeaker]
        default:
            routeOptions = []
        }
        
        try audioSession.setCategory(
            .playAndRecord,
            mode: .default,
            options: routeOptions
        )
    }
    
    private func setupNetworkMonitoring() {
        networkMonitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                if path.status != .satisfied {
                    self?.errorMessage = "Network connection required for translation"
                }
            }
        }
        networkMonitor.start(queue: networkQueue)
    }
    
    private func connectToTranslationService() async throws {
        // Connect to VidLiSync backend WebSocket
        guard let url = URL(string: "wss://api.vidlisync.com/ws/vs-environment") else {
            throw NSError(domain: "VSEnvironment", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid WebSocket URL"])
        }
        
        let session = URLSession.shared
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        
        // Send configuration
        if let config = currentConfig {
            let configData = try JSONEncoder().encode(config)
            let message = URLSessionWebSocketTask.Message.data(configData)
            try await webSocketTask?.send(message)
        }
        
        // Start listening for messages
        startListeningForMessages()
    }
    
    private func disconnectFromTranslationService() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
    }
    
    private func startListeningForMessages() {
        guard let webSocketTask = webSocketTask else { return }
        
        webSocketTask.receive { [weak self] result in
            switch result {
            case .success(let message):
                self?.handleWebSocketMessage(message)
                self?.startListeningForMessages() // Continue listening
            case .failure(let error):
                print("WebSocket receive error: \(error)")
            }
        }
    }
    
    private func handleWebSocketMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .data(let data):
            handleTranslationResult(data)
        case .string(let text):
            print("Received text message: \(text)")
        @unknown default:
            break
        }
    }
    
    private func handleTranslationResult(_ data: Data) {
        do {
            let result = try JSONDecoder().decode(TranslationResult.self, data: data)
            
            DispatchQueue.main.async {
                self.originalText = result.originalText
                self.translatedText = result.translatedText
                
                // Update performance metrics
                self.latencyMeasurements.append(result.processingTime)
                if self.latencyMeasurements.count > self.maxLatencyMeasurements {
                    self.latencyMeasurements.removeFirst()
                }
                
                // Play translated audio if available
                if let audioData = result.translatedAudio,
                   self.currentConfig?.transcriptionMode.includesAudio() == true {
                    self.playTranslatedAudio(audioData)
                }
            }
            
        } catch {
            print("Failed to decode translation result: \(error)")
        }
    }
    
    private func startAudioProcessing() throws {
        audioEngine = AVAudioEngine()
        inputNode = audioEngine.inputNode
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, time in
            self?.processAudioBuffer(buffer)
        }
        
        try audioEngine.start()
    }
    
    private func stopAudioProcessing() {
        audioEngine?.stop()
        inputNode?.removeTap(onBus: 0)
        audioEngine = nil
        inputNode = nil
    }
    
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        // Calculate audio level for visual feedback
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let channelDataArray = Array(UnsafeBufferPointer(start: channelData, count: Int(buffer.frameLength)))
        
        let rms = sqrt(channelDataArray.map { $0 * $0 }.reduce(0, +) / Float(channelDataArray.count))
        let level = CGFloat(min(max(rms * 10, 0.1), 2.0))
        
        DispatchQueue.main.async {
            self.audioLevel = level
        }
        
        // Convert buffer to data and send to translation service
        guard let audioData = bufferToData(buffer) else { return }
        sendAudioToTranslationService(audioData)
    }
    
    private func bufferToData(_ buffer: AVAudioPCMBuffer) -> Data? {
        guard let channelData = buffer.floatChannelData?[0] else { return nil }
        
        let channelDataArray = Array(UnsafeBufferPointer(start: channelData, count: Int(buffer.frameLength)))
        return Data(bytes: channelDataArray, count: channelDataArray.count * MemoryLayout<Float>.size)
    }
    
    private func sendAudioToTranslationService(_ audioData: Data) {
        guard let webSocketTask = webSocketTask else { return }
        
        let message = URLSessionWebSocketTask.Message.data(audioData)
        webSocketTask.send(message) { error in
            if let error = error {
                print("Failed to send audio data: \(error)")
            }
        }
    }
    
    private func playTranslatedAudio(_ audioData: Data) {
        do {
            audioPlayer = try AVAudioPlayer(data: audioData)
            audioPlayer?.play()
        } catch {
            print("Failed to play translated audio: \(error)")
        }
    }
    
    private func cleanup() {
        stop()
        networkMonitor.cancel()
    }
}

// MARK: - Translation Service

class TranslationService {
    private let baseURL = "https://api.vidlisync.com"
    
    func processAudio(_ audioData: Data, config: VSEnvironmentConfig) async throws -> TranslationResult {
        // This would integrate with the existing VidLiSync translation pipeline
        // For now, return a mock result
        return TranslationResult(
            originalText: "Sample original text",
            translatedText: "Sample translated text",
            translatedAudio: nil,
            confidence: 0.95,
            processingTime: 0.3
        )
    }
}

// MARK: - Extensions for Codable

extension VSEnvironmentConfig: Codable {}
extension TranslationResult: Codable {}
extension AudioDevice: Codable {}
