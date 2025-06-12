//
//  VSFriendsManager.swift
//  VidLiSync
//
//  VS Friends Manager for iOS - Handles NFC detection, proximity connections, and peer-to-peer audio
//

import SwiftUI
import CoreNFC
import MultipeerConnectivity
import AVFoundation
import CoreBluetooth

@MainActor
class VSFriendsManager: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var conversationState: ConversationState = .idle
    @Published var participants: [VSFriend] = []
    @Published var isInitiator = false
    @Published var showMinimalUI = true
    @Published var estimatedCost: Double = 0.0
    @Published var currentSession: VSFriendsSession?
    
    // MARK: - Private Properties
    private var nfcSession: NFCNDEFReaderSession?
    private var multipeerSession: MCSession!
    private var peerID: MCPeerID!
    private var advertiser: MCNearbyServiceAdvertiser!
    private var browser: MCNearbyServiceBrowser!
    
    // Audio properties
    private var audioEngine: AVAudioEngine!
    private var audioInputNode: AVAudioInputNode!
    private var activeStreams: [MCPeerID: AudioStream] = [:]
    private var translationEngine = TranslationService()
    
    // Configuration
    private let serviceType = "vidlisync-vsfriends"
    private let maxParticipants = 4
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupMultipeer()
        setupAudioEngine()
    }
    
    // MARK: - Public Methods
    
    /// Start discovery for nearby friends
    func startFriendDiscovery() {
        guard canStartDiscovery() else { return }
        
        isInitiator = true
        conversationState = .discovering
        
        // Start NFC if available
        startNFCSession()
        
        // Start Multipeer Connectivity as fallback
        startMultipeerDiscovery()
        
        // Start proximity detection via iBeacon
        startProximityDetection()
    }
    
    /// Connect to a discovered friend
    func connectToFriend(_ friend: VSFriend) async {
        guard participants.count < maxParticipants else { return }
        
        conversationState = .connecting
        
        do {
            // Establish connection
            let peer = MCPeerID(displayName: friend.deviceName)
            let connectionData = try createConnectionData()
            
            browser.invitePeer(peer, to: multipeerSession, withContext: connectionData, timeout: 10)
            
            // Add participant
            participants.append(friend)
            
            // Start conversation if this is the first connection
            if participants.count == 1 {
                await startConversation()
            }
            
        } catch {
            print("Failed to connect to friend: \(error)")
            conversationState = .idle
        }
    }
    
    /// Start the conversation
    func startConversation() async {
        conversationState = .active
        
        // Create session
        currentSession = VSFriendsSession(
            id: UUID().uuidString,
            initiatorId: getUserId(),
            participants: participants,
            startTime: Date()
        )
        
        // Start audio processing
        try? startAudioCapture()
        
        // Start cost tracking
        startCostTracking()
    }
    
    /// End the conversation
    func endConversation() {
        conversationState = .ended
        
        // Stop audio
        stopAudioCapture()
        
        // Disconnect all peers
        multipeerSession.disconnect()
        
        // Stop discovery
        stopDiscovery()
        
        // Update session
        currentSession?.endTime = Date()
        
        // Calculate final cost
        calculateFinalCost()
    }
    
    /// Toggle minimal UI mode
    func toggleMinimalUI() {
        showMinimalUI.toggle()
    }
    
    /// Add participant to conversation
    func addParticipant(_ participant: VSFriend) {
        guard participants.count < maxParticipants else { return }
        guard !participants.contains(where: { $0.id == participant.id }) else { return }
        
        participants.append(participant)
    }
    
    /// Remove participant from conversation
    func removeParticipant(_ participantId: String) {
        participants.removeAll { $0.id == participantId }
        
        // End conversation if no participants left
        if participants.isEmpty && conversationState == .active {
            endConversation()
        }
    }
    
    // MARK: - Private Methods
    
    private func canStartDiscovery() -> Bool {
        // Check permissions
        guard AVAudioSession.sharedInstance().recordPermission == .granted else {
            requestMicrophonePermission()
            return false
        }
        
        return true
    }
    
    private func requestMicrophonePermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                if granted {
                    self.startFriendDiscovery()
                }
            }
        }
    }
    
    private func setupMultipeer() {
        peerID = MCPeerID(displayName: UIDevice.current.name)
        multipeerSession = MCSession(peer: peerID, securityIdentity: nil, encryptionPreference: .required)
        multipeerSession.delegate = self
        
        advertiser = MCNearbyServiceAdvertiser(peer: peerID, discoveryInfo: nil, serviceType: serviceType)
        advertiser.delegate = self
        
        browser = MCNearbyServiceBrowser(peer: peerID, serviceType: serviceType)
        browser.delegate = self
    }
    
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        audioInputNode = audioEngine.inputNode
        
        // Configure audio session for earbuds
        configureAudioSession()
    }
    
    private func configureAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        
        do {
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .allowBluetoothA2DP])
            try audioSession.setActive(true)
            
            // Prefer Bluetooth headphones
            if let bluetoothRoute = audioSession.availableInputs?.first(where: { input in
                input.portType == .bluetoothA2DP || input.portType == .bluetoothHFP
            }) {
                try audioSession.setPreferredInput(bluetoothRoute)
            }
            
        } catch {
            print("Audio session configuration failed: \(error)")
        }
    }
    
    private func startNFCSession() {
        guard NFCNDEFReaderSession.readingAvailable else { return }
        
        nfcSession = NFCNDEFReaderSession(delegate: self, queue: .main, invalidateAfterFirstRead: false)
        nfcSession?.alertMessage = "Hold your phone near another VS Friends device"
        nfcSession?.begin()
    }
    
    private func startMultipeerDiscovery() {
        advertiser.startAdvertisingPeer()
        browser.startBrowsingForPeers()
    }
    
    private func startProximityDetection() {
        // Use Core Bluetooth for proximity detection
        // This would scan for VS Friends beacons
        // Implementation would go here for production
    }
    
    private func stopDiscovery() {
        nfcSession?.invalidate()
        advertiser.stopAdvertisingPeer()
        browser.stopBrowsingForPeers()
    }
    
    private func createConnectionData() throws -> Data {
        let connectionInfo = ConnectionInfo(
            deviceName: UIDevice.current.name,
            language: getPreferredLanguage(),
            userId: getUserId(),
            sessionId: currentSession?.id ?? UUID().uuidString
        )
        
        return try JSONEncoder().encode(connectionInfo)
    }
    
    private func startAudioCapture() throws {
        let inputFormat = audioInputNode.outputFormat(forBus: 0)
        
        audioInputNode.installTap(onBus: 0, bufferSize: 512, format: inputFormat) { [weak self] buffer, time in
            self?.processOutgoingAudio(buffer)
        }
        
        try audioEngine.start()
    }
    
    private func stopAudioCapture() {
        audioEngine.stop()
        audioInputNode.removeTap(onBus: 0)
    }
    
    private func processOutgoingAudio(_ buffer: AVAudioPCMBuffer) {
        Task {
            let myLanguage = getPreferredLanguage()
            
            // Process audio for each participant
            for participant in participants {
                if participant.language != myLanguage {
                    // Translate and send
                    do {
                        let translatedAudio = try await translationEngine.translateAudio(
                            buffer.toData(),
                            from: myLanguage,
                            to: participant.language,
                            useVoiceCloning: true
                        )
                        
                        sendAudioToPeer(translatedAudio, to: participant.peerID)
                    } catch {
                        print("Translation failed: \(error)")
                    }
                } else {
                    // Send original audio if same language
                    sendAudioToPeer(buffer.toData(), to: participant.peerID)
                }
            }
        }
    }
    
    private func sendAudioToPeer(_ audioData: Data, to peerID: MCPeerID) {
        guard let peer = multipeerSession.connectedPeers.first(where: { $0.displayName == peerID.displayName }) else { return }
        
        do {
            try multipeerSession.send(audioData, toPeers: [peer], with: .reliable)
        } catch {
            print("Failed to send audio: \(error)")
        }
    }
    
    private func startCostTracking() {
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.updateCostEstimate()
        }
    }
    
    private func updateCostEstimate() {
        guard let session = currentSession else { return }
        
        let duration = Date().timeIntervalSince(session.startTime)
        let minutes = max(1, Int(ceil(duration / 60)))
        let participantMultiplier = max(1, participants.count)
        
        estimatedCost = Double(minutes) * 0.02 * Double(participantMultiplier)
    }
    
    private func calculateFinalCost() {
        updateCostEstimate()
        // In production, this would trigger billing API call
    }
    
    private func getPreferredLanguage() -> String {
        return UserDefaults.standard.string(forKey: "preferredLanguage") ?? "en"
    }
    
    private func getUserId() -> String {
        return UserDefaults.standard.string(forKey: "userId") ?? UUID().uuidString
    }
}

// MARK: - Data Models

enum ConversationState: String, CaseIterable {
    case idle, discovering, connecting, active, ended
}

struct VSFriend: Identifiable, Codable {
    let id: String
    let name: String
    let deviceName: String
    let language: String
    var selectedLanguage: String
    var isSpeaking: Bool = false
    var isConnected: Bool = false
    let joinedAt: Date
    let peerID: MCPeerID
    
    var initials: String {
        name.split(separator: " ").compactMap({ $0.first }).map(String.init).joined().uppercased()
    }
    
    enum CodingKeys: String, CodingKey {
        case id, name, deviceName, language, selectedLanguage, isSpeaking, isConnected, joinedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        deviceName = try container.decode(String.self, forKey: .deviceName)
        language = try container.decode(String.self, forKey: .language)
        selectedLanguage = try container.decode(String.self, forKey: .selectedLanguage)
        isSpeaking = try container.decode(Bool.self, forKey: .isSpeaking)
        isConnected = try container.decode(Bool.self, forKey: .isConnected)
        joinedAt = try container.decode(Date.self, forKey: .joinedAt)
        peerID = MCPeerID(displayName: deviceName)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(deviceName, forKey: .deviceName)
        try container.encode(language, forKey: .language)
        try container.encode(selectedLanguage, forKey: .selectedLanguage)
        try container.encode(isSpeaking, forKey: .isSpeaking)
        try container.encode(isConnected, forKey: .isConnected)
        try container.encode(joinedAt, forKey: .joinedAt)
    }
    
    init(id: String, name: String, deviceName: String, language: String, selectedLanguage: String, joinedAt: Date, peerID: MCPeerID) {
        self.id = id
        self.name = name
        self.deviceName = deviceName
        self.language = language
        self.selectedLanguage = selectedLanguage
        self.joinedAt = joinedAt
        self.peerID = peerID
    }
}

struct VSFriendsSession: Identifiable {
    let id: String
    let initiatorId: String
    var participants: [VSFriend]
    let startTime: Date
    var endTime: Date?
    var isActive: Bool { endTime == nil }
}

struct ConnectionInfo: Codable {
    let deviceName: String
    let language: String
    let userId: String
    let sessionId: String
}

struct AudioStream {
    let participantId: String
    let audioData: Data
    let timestamp: Date
    let language: String
}

// MARK: - Extensions

extension AVAudioPCMBuffer {
    func toData() -> Data {
        let audioBuffer = audioBufferList.pointee.mBuffers
        return Data(bytes: audioBuffer.mData!, count: Int(audioBuffer.mDataByteSize))
    }
}

// MARK: - MultipeerConnectivity Delegates

extension VSFriendsManager: MCSessionDelegate {
    func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        DispatchQueue.main.async {
            switch state {
            case .connected:
                print("Connected to \(peerID.displayName)")
                // Update participant status
                if let index = self.participants.firstIndex(where: { $0.peerID.displayName == peerID.displayName }) {
                    self.participants[index].isConnected = true
                }
                
            case .connecting:
                print("Connecting to \(peerID.displayName)")
                
            case .notConnected:
                print("Disconnected from \(peerID.displayName)")
                // Remove participant
                self.removeParticipant(peerID.displayName)
                
            @unknown default:
                break
            }
        }
    }
    
    func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        // Handle received audio data
        DispatchQueue.main.async {
            self.processIncomingAudio(data, from: peerID)
        }
    }
    
    func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {
        // Handle incoming streams if needed
    }
    
    func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {
        // Handle resource transfer if needed
    }
    
    func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {
        // Handle resource transfer completion if needed
    }
    
    private func processIncomingAudio(_ data: Data, from peerID: MCPeerID) {
        // Play received audio through earbuds
        playAudioData(data)
        
        // Update speaking indicator
        if let index = participants.firstIndex(where: { $0.peerID.displayName == peerID.displayName }) {
            participants[index].isSpeaking = true
            
            // Clear speaking indicator after delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                if index < self.participants.count {
                    self.participants[index].isSpeaking = false
                }
            }
        }
    }
    
    private func playAudioData(_ data: Data) {
        // Convert data to audio and play through earbuds
        // Implementation would use AVAudioPlayer or AVAudioEngine
    }
}

extension VSFriendsManager: MCNearbyServiceAdvertiserDelegate {
    func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        
        // Auto-accept invitations for VS Friends
        invitationHandler(true, multipeerSession)
        
        // Create friend object from peer
        DispatchQueue.main.async {
            let friend = VSFriend(
                id: peerID.displayName,
                name: peerID.displayName,
                deviceName: peerID.displayName,
                language: "en", // Would be parsed from context
                selectedLanguage: "en",
                joinedAt: Date(),
                peerID: peerID
            )
            
            self.addParticipant(friend)
        }
    }
}

extension VSFriendsManager: MCNearbyServiceBrowserDelegate {
    func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String : String]?) {
        print("Found peer: \(peerID.displayName)")
        
        // Create friend object for discovered peer
        DispatchQueue.main.async {
            let friend = VSFriend(
                id: peerID.displayName,
                name: peerID.displayName,
                deviceName: peerID.displayName,
                language: info?["language"] ?? "en",
                selectedLanguage: info?["language"] ?? "en",
                joinedAt: Date(),
                peerID: peerID
            )
            
            // Auto-connect if initiator
            if self.isInitiator {
                Task {
                    await self.connectToFriend(friend)
                }
            }
        }
    }
    
    func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        print("Lost peer: \(peerID.displayName)")
        DispatchQueue.main.async {
            self.removeParticipant(peerID.displayName)
        }
    }
}

// MARK: - NFC Delegate

extension VSFriendsManager: NFCNDEFReaderSessionDelegate {
    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        print("NFC session invalidated: \(error)")
    }
    
    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        // Handle NFC detection
        for message in messages {
            for record in message.records {
                if let payload = String(data: record.payload, encoding: .utf8) {
                    handleNFCPayload(payload)
                }
            }
        }
    }
    
    private func handleNFCPayload(_ payload: String) {
        // Parse VS Friends connection data from NFC
        // In production, this would extract peer information
        DispatchQueue.main.async {
            // Provide haptic feedback
            let impact = UIImpactFeedbackGenerator(style: .medium)
            impact.impactOccurred()
            
            // Play connection sound
            AudioServicesPlaySystemSound(1016)
            
            print("NFC tap detected: \(payload)")
        }
    }
}

// MARK: - Translation Service

class TranslationService {
    func translateAudio(_ audioData: Data, from sourceLanguage: String, to targetLanguage: String, useVoiceCloning: Bool) async throws -> Data {
        // In production, this would integrate with the VidLiSync AI pipeline
        // For now, return mock translated audio
        
        // Simulate processing delay
        try await Task.sleep(nanoseconds: 200_000_000) // 200ms
        
        // Return mock audio data
        return audioData
    }
}