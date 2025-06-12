// VSPresenterViewController.swift
// iOS implementation of VS Presenter feature
// Extends existing VidLiSync mobile infrastructure

import UIKit
import AVFoundation
import WebKit

class VSPresenterViewController: UIViewController {
    
    // MARK: - Properties
    private let translationEngine = VidLiSyncEngine.shared
    private var presenterSession: VSPresenterSession?
    private var audioEngine: AVAudioEngine!
    private var participants: [VSParticipant] = []
    private var webSocketTask: URLSessionWebSocketTask?
    
    // MARK: - UI Components
    @IBOutlet weak var participantCollectionView: UICollectionView!
    @IBOutlet weak var controlsStackView: UIStackView!
    @IBOutlet weak var languageDistributionView: LanguageDistributionView!
    @IBOutlet weak var statusLabel: UILabel!
    @IBOutlet weak var muteAllButton: UIButton!
    @IBOutlet weak var recordingButton: UIButton!
    @IBOutlet weak var endPresentationButton: UIButton!
    
    // MARK: - Configuration
    private var presenterConfig: VSPresenterConfig!
    
    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupAudioEngine()
        
        if isScheduledPresentation {
            loadScheduledPresentation()
        } else {
            showSetupFlow()
        }
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        stopAudioProcessing()
        webSocketTask?.cancel()
    }
    
    // MARK: - Setup Flow
    private func showSetupFlow() {
        let setupVC = VSPresenterSetupViewController()
        setupVC.delegate = self
        present(setupVC, animated: true)
    }
    
    private func setupUI() {
        title = "VS Presenter"
        view.backgroundColor = UIColor.systemBackground
        
        // Configure collection view
        participantCollectionView.delegate = self
        participantCollectionView.dataSource = self
        participantCollectionView.register(
            VSParticipantCell.self, 
            forCellWithReuseIdentifier: "ParticipantCell"
        )
        
        // Configure buttons
        muteAllButton.addTarget(self, action: #selector(muteAllParticipants), for: .touchUpInside)
        recordingButton.addTarget(self, action: #selector(toggleRecording), for: .touchUpInside)
        endPresentationButton.addTarget(self, action: #selector(endPresentation), for: .touchUpInside)
        
        updateUIForPresentationState()
    }
    
    // MARK: - Audio Setup
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        
        // Configure audio session for presentation
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.allowBluetooth, .defaultToSpeaker, .allowBluetoothA2DP]
            )
            try session.setActive(true)
            
            // Set preferred input/output based on configuration
            configureAudioRouting()
        } catch {
            showError("Audio setup failed: \(error)")
        }
    }
    
    private func configureAudioRouting() {
        let session = AVAudioSession.sharedInstance()
        
        guard let config = presenterConfig else { return }
        
        // Configure input based on mode
        switch config.audioRouting.presenter.microphone {
        case .bluetooth:
            if let bluetoothInput = session.availableInputs?.first(where: { 
                $0.portType == .bluetoothHFP 
            }) {
                try? session.setPreferredInput(bluetoothInput)
            }
        case .usb:
            if let usbInput = session.availableInputs?.first(where: { 
                $0.portType == .usbAudio 
            }) {
                try? session.setPreferredInput(usbInput)
            }
        default:
            // Use device default
            break
        }
        
        // Configure output based on presentation mode
        switch config.mode {
        case .inPerson:
            // Route to venue speakers for audience
            try? session.overrideOutputAudioPort(.speaker)
        case .hybrid, .multiUserHub:
            // Use individual device audio routing
            break
        }
    }
    
    // MARK: - Presentation Management
    func startPresentation(with config: VSPresenterConfig) {
        self.presenterConfig = config
        
        // Create presentation room
        Task {
            do {
                let room = try await VSPresenterAPI.createRoom(config: config)
                
                presenterSession = VSPresenterSession(
                    id: room.id,
                    roomCode: room.code,
                    config: config,
                    participants: [],
                    audioRouting: config.audioRouting,
                    startTime: Date(),
                    isRecording: config.recordingEnabled,
                    analytics: VSPresentationAnalytics(),
                    costEstimate: VSCostEstimate()
                )
                
                // Start audio processing
                startAudioProcessing()
                
                // Connect to WebSocket
                connectWebSocket(roomId: room.id)
                
                // Update UI
                DispatchQueue.main.async {
                    self.updateUIForActivePresentation()
                }
                
            } catch {
                DispatchQueue.main.async {
                    self.showError("Failed to start presentation: \(error)")
                }
            }
        }
    }
    
    private func startAudioProcessing() {
        // Input node for presenter's voice
        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)
        
        // Install tap to capture audio
        inputNode.installTap(
            onBus: 0,
            bufferSize: 1024,
            format: inputFormat
        ) { [weak self] buffer, time in
            self?.processPresenterAudio(buffer)
        }
        
        // Start engine
        do {
            try audioEngine.start()
        } catch {
            showError("Audio engine failed: \(error)")
        }
    }
    
    private func stopAudioProcessing() {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
    }
    
    private func processPresenterAudio(_ buffer: AVAudioPCMBuffer) {
        // Convert buffer to data
        guard let audioData = bufferToData(buffer) else { return }
        
        // Send to WebSocket for real-time translation
        sendPresenterAudio(audioData)
    }
    
    private func bufferToData(_ buffer: AVAudioPCMBuffer) -> Data? {
        guard let channelData = buffer.floatChannelData?[0] else { return nil }
        
        let channelDataArray = Array(UnsafeBufferPointer(start: channelData, count: Int(buffer.frameLength)))
        return Data(bytes: channelDataArray, count: channelDataArray.count * MemoryLayout<Float>.size)
    }
    
    // MARK: - WebSocket Communication
    private func connectWebSocket(roomId: String) {
        guard let url = URL(string: "\(Configuration.websocketBaseURL)/presenter") else { return }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(UserSession.shared.authToken)", forHTTPHeaderField: "Authorization")
        
        webSocketTask = URLSession.shared.webSocketTask(with: request)
        webSocketTask?.resume()
        
        // Send initial join message
        sendWebSocketMessage([
            "type": "join_presentation",
            "room_code": presenterSession?.roomCode ?? "",
            "participant_name": "Presenter",
            "selected_language": presenterConfig.presenterLanguage,
            "is_presenter": true
        ])
        
        // Start listening for messages
        listenForWebSocketMessages()
    }
    
    private func sendWebSocketMessage(_ message: [String: Any]) {
        guard let webSocketTask = webSocketTask,
              let data = try? JSONSerialization.data(withJSONObject: message),
              let string = String(data: data, encoding: .utf8) else { return }
        
        let message = URLSessionWebSocketTask.Message.string(string)
        webSocketTask.send(message) { error in
            if let error = error {
                print("WebSocket send error: \(error)")
            }
        }
    }
    
    private func sendPresenterAudio(_ audioData: Data) {
        let base64Audio = audioData.base64EncodedString()
        sendWebSocketMessage([
            "type": "presenter_audio",
            "audio_data": base64Audio,
            "timestamp": Date().timeIntervalSince1970
        ])
    }
    
    private func listenForWebSocketMessages() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        self?.handleWebSocketMessage(json)
                    }
                case .data(let data):
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        self?.handleWebSocketMessage(json)
                    }
                @unknown default:
                    break
                }
                self?.listenForWebSocketMessages()
            case .failure(let error):
                print("WebSocket receive error: \(error)")
            }
        }
    }
    
    private func handleWebSocketMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }
        
        DispatchQueue.main.async {
            switch type {
            case "participant_joined":
                self.handleParticipantJoined(message)
            case "participant_left":
                self.handleParticipantLeft(message)
            case "hand_raised":
                self.handleHandRaised(message)
            case "participant_language_updated":
                self.handleLanguageUpdated(message)
            case "presentation_ended":
                self.handlePresentationEnded(message)
            default:
                break
            }
        }
    }
    
    // MARK: - Participant Management
    @objc private func muteAllParticipants() {
        sendWebSocketMessage([
            "type": "mute_all_participants"
        ])
        
        // Update UI
        muteAllButton.setTitle("Unmute All", for: .normal)
    }
    
    private func muteParticipant(_ participantId: String) {
        sendWebSocketMessage([
            "type": "participant_mute",
            "participant_id": participantId
        ])
    }
    
    private func unmuteParticipant(_ participantId: String) {
        sendWebSocketMessage([
            "type": "participant_unmute",
            "participant_id": participantId
        ])
    }
    
    private func allowParticipantToSpeak(_ participantId: String) {
        sendWebSocketMessage([
            "type": "allow_speak",
            "participant_id": participantId
        ])
    }
    
    func handleParticipantRequest(_ participant: VSParticipant) {
        let alert = UIAlertController(
            title: "\(participant.name) wants to speak",
            message: "Allow this participant to ask a question?",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Allow", style: .default) { _ in
            self.allowParticipantToSpeak(participant.id)
        })
        
        alert.addAction(UIAlertAction(title: "Deny", style: .cancel))
        
        present(alert, animated: true)
    }
    
    // MARK: - Recording
    @objc private func toggleRecording() {
        guard let session = presenterSession else { return }
        
        if session.isRecording {
            // Stop recording
            presenterSession?.isRecording = false
            recordingButton.setTitle("Start Recording", for: .normal)
            recordingButton.backgroundColor = UIColor.systemGreen
        } else {
            // Start recording
            presenterSession?.isRecording = true
            recordingButton.setTitle("Stop Recording", for: .normal)
            recordingButton.backgroundColor = UIColor.systemRed
        }
        
        sendWebSocketMessage([
            "type": "toggle_recording",
            "recording": session.isRecording
        ])
    }
    
    // MARK: - Presentation Control
    @objc private func endPresentation() {
        let alert = UIAlertController(
            title: "End Presentation",
            message: "Are you sure you want to end this presentation?",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "End", style: .destructive) { _ in
            self.performEndPresentation()
        })
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        present(alert, animated: true)
    }
    
    private func performEndPresentation() {
        sendWebSocketMessage([
            "type": "end_presentation"
        ])
        
        stopAudioProcessing()
        webSocketTask?.cancel()
        
        // Navigate back to dashboard
        navigationController?.popViewController(animated: true)
    }
    
    // MARK: - UI Updates
    private func updateUIForPresentationState() {
        // Update based on current state
        if presenterSession != nil {
            updateUIForActivePresentation()
        } else {
            updateUIForSetup()
        }
    }
    
    private func updateUIForActivePresentation() {
        statusLabel.text = "Live Presentation"
        statusLabel.textColor = UIColor.systemRed
        
        // Enable controls
        muteAllButton.isEnabled = true
        recordingButton.isEnabled = true
        endPresentationButton.isEnabled = true
        
        // Update participant count
        if let session = presenterSession {
            title = "Presentation - \(participants.count) participants"
        }
    }
    
    private func updateUIForSetup() {
        statusLabel.text = "Setting up..."
        statusLabel.textColor = UIColor.systemGray
        
        // Disable controls
        muteAllButton.isEnabled = false
        recordingButton.isEnabled = false
        endPresentationButton.isEnabled = false
    }
    
    // MARK: - Message Handlers
    private func handleParticipantJoined(_ message: [String: Any]) {
        // Update participant list
        participantCollectionView.reloadData()
    }
    
    private func handleParticipantLeft(_ message: [String: Any]) {
        // Update participant list
        participantCollectionView.reloadData()
    }
    
    private func handleHandRaised(_ message: [String: Any]) {
        guard let participantId = message["participant_id"] as? String,
              let participantName = message["participant_name"] as? String else { return }
        
        let participant = VSParticipant(
            id: participantId,
            name: participantName,
            selectedLanguage: "en",
            isPresenter: false,
            isSpeaking: false,
            isMuted: false,
            hasRaisedHand: true,
            joinedAt: Date(),
            audio: true,
            video: false
        )
        
        handleParticipantRequest(participant)
    }
    
    private func handleLanguageUpdated(_ message: [String: Any]) {
        // Update language distribution view
        languageDistributionView.updateDistribution()
    }
    
    private func handlePresentationEnded(_ message: [String: Any]) {
        let alert = UIAlertController(
            title: "Presentation Ended",
            message: "The presentation has been ended.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            self.navigationController?.popViewController(animated: true)
        })
        
        present(alert, animated: true)
    }
    
    // MARK: - Error Handling
    private func showError(_ message: String) {
        let alert = UIAlertController(
            title: "Error",
            message: message,
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// MARK: - Collection View Data Source
extension VSPresenterViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return participants.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ParticipantCell", for: indexPath) as! VSParticipantCell
        
        let participant = participants[indexPath.item]
        cell.configure(with: participant)
        cell.delegate = self
        
        return cell
    }
}

// MARK: - Collection View Delegate
extension VSPresenterViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        collectionView.deselectItem(at: indexPath, animated: true)
        
        let participant = participants[indexPath.item]
        if !participant.isPresenter {
            showParticipantOptions(for: participant)
        }
    }
    
    private func showParticipantOptions(for participant: VSParticipant) {
        let alert = UIAlertController(
            title: participant.name,
            message: "Participant actions",
            preferredStyle: .actionSheet
        )
        
        if participant.isMuted {
            alert.addAction(UIAlertAction(title: "Unmute", style: .default) { _ in
                self.unmuteParticipant(participant.id)
            })
        } else {
            alert.addAction(UIAlertAction(title: "Mute", style: .default) { _ in
                self.muteParticipant(participant.id)
            })
        }
        
        if participant.hasRaisedHand {
            alert.addAction(UIAlertAction(title: "Allow to Speak", style: .default) { _ in
                self.allowParticipantToSpeak(participant.id)
            })
        }
        
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        present(alert, animated: true)
    }
}

// MARK: - Participant Cell Delegate
extension VSPresenterViewController: VSParticipantCellDelegate {
    func participantCellDidTapMute(_ cell: VSParticipantCell) {
        guard let indexPath = participantCollectionView.indexPath(for: cell) else { return }
        let participant = participants[indexPath.item]
        
        if participant.isMuted {
            unmuteParticipant(participant.id)
        } else {
            muteParticipant(participant.id)
        }
    }
    
    func participantCellDidTapAllow(_ cell: VSParticipantCell) {
        guard let indexPath = participantCollectionView.indexPath(for: cell) else { return }
        let participant = participants[indexPath.item]
        allowParticipantToSpeak(participant.id)
    }
}

// MARK: - Presenter Setup Delegate
extension VSPresenterViewController: VSPresenterSetupDelegate {
    func presenterSetup(_ setup: VSPresenterSetupViewController, didConfigureWith config: VSPresenterConfig) {
        startPresentation(with: config)
    }
}