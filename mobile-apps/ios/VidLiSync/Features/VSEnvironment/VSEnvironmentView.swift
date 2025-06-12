//
//  VSEnvironmentView.swift
//  VidLiSync
//
//  SwiftUI view for VS Environment feature
//  Created for issue #40 - VidLiSync VS Environment: Real-time Environmental Translation for Mobile
//

import SwiftUI
import AVFoundation

struct VSEnvironmentView: View {
    @StateObject private var manager = VSEnvironmentManager()
    @State private var showingSetup = false
    @State private var selectedLanguage = "English"
    @State private var useVoiceCloning = true
    @State private var transcriptionMode: TranscriptionMode = .audioOnly
    
    enum TranscriptionMode: String, CaseIterable {
        case audioOnly = "Audio Only"
        case textOnly = "Text Only"
        case both = "Both"
        
        func includesAudio() -> Bool {
            return self == .audioOnly || self == .both
        }
        
        func includesText() -> Bool {
            return self == .textOnly || self == .both
        }
    }
    
    let languages = [
        "English", "Spanish", "French", "German", "Italian", 
        "Portuguese", "Russian", "Chinese", "Japanese", "Korean"
    ]
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.6)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                headerView
                
                if manager.isTranslating {
                    // Active translation view
                    activeTranslationView
                } else {
                    // Setup view
                    setupView
                }
                
                // Bottom controls
                bottomControlsView
            }
        }
        .sheet(isPresented: $showingSetup) {
            VSEnvironmentSetupView(
                selectedLanguage: $selectedLanguage,
                useVoiceCloning: $useVoiceCloning,
                transcriptionMode: $transcriptionMode,
                onStart: startEnvironment
            )
        }
        .alert("Error", isPresented: .constant(manager.errorMessage != nil)) {
            Button("OK") {
                manager.clearError()
            }
        } message: {
            Text(manager.errorMessage ?? "")
        }
    }
    
    private var headerView: some View {
        HStack {
            Text("VS Environment")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Spacer()
            
            Button(action: {
                // Show settings
            }) {
                Image(systemName: "gearshape.fill")
                    .font(.title2)
                    .foregroundColor(.white)
            }
        }
        .padding()
    }
    
    private var setupView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Welcome message
                VStack(spacing: 12) {
                    Image(systemName: "globe.americas.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                    
                    Text("Real-time Environmental Translation")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    Text("Translate conversations around you in real-time with voice cloning")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 40)
                
                // Quick setup options
                VStack(spacing: 16) {
                    setupOptionCard(
                        icon: "person.2.fill",
                        title: "Language",
                        subtitle: selectedLanguage,
                        action: { showingSetup = true }
                    )
                    
                    setupOptionCard(
                        icon: "waveform",
                        title: "Voice Cloning",
                        subtitle: useVoiceCloning ? "Enabled" : "Disabled",
                        action: { showingSetup = true }
                    )
                    
                    setupOptionCard(
                        icon: "speaker.wave.3.fill",
                        title: "Output Mode",
                        subtitle: transcriptionMode.rawValue,
                        action: { showingSetup = true }
                    )
                }
                
                Spacer(minLength: 100)
            }
            .padding(.horizontal)
        }
    }
    
    private var activeTranslationView: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Audio level indicator
            AudioLevelIndicatorView(level: manager.audioLevel)
                .frame(width: 200, height: 200)
            
            // Language display
            HStack(spacing: 16) {
                Text(manager.detectedLanguage)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.2))
                    .cornerRadius(20)
                
                Image(systemName: "arrow.right")
                    .font(.title2)
                    .foregroundColor(.white)
                
                Text(manager.targetLanguage)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.2))
                    .cornerRadius(20)
            }
            
            // Transcription display
            TranscriptionDisplayView(
                originalText: manager.originalText,
                translatedText: manager.translatedText
            )
            
            Spacer()
        }
        .padding()
    }
    
    private var bottomControlsView: some View {
        VStack(spacing: 16) {
            if manager.isTranslating {
                // Active controls
                HStack(spacing: 40) {
                    // Record button
                    VStack(spacing: 8) {
                        Button(action: {
                            if manager.isRecording {
                                manager.stopRecording()
                            } else {
                                manager.startRecording()
                            }
                        }) {
                            Image(systemName: manager.isRecording ? "stop.circle.fill" : "record.circle")
                                .font(.system(size: 50))
                                .foregroundColor(manager.isRecording ? .red : .white)
                        }
                        
                        Text("Record")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                    
                    // Swap languages button
                    VStack(spacing: 8) {
                        Button(action: {
                            manager.swapLanguages()
                        }) {
                            Image(systemName: "arrow.left.arrow.right")
                                .font(.system(size: 30))
                                .foregroundColor(.white)
                                .padding()
                                .background(Color.white.opacity(0.2))
                                .clipShape(Circle())
                        }
                        
                        Text("Swap")
                            .font(.caption)
                            .foregroundColor(.white)
                    }
                }
                .padding(.bottom, 8)
            }
            
            // Main action button
            Button(action: {
                if manager.isTranslating {
                    manager.stop()
                } else {
                    showingSetup = true
                }
            }) {
                Text(manager.isTranslating ? "Stop Environment" : "Start Environment")
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(manager.isTranslating ? Color.red : Color.blue)
                    .cornerRadius(12)
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
    }
    
    private func setupOptionCard(icon: String, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 30)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color.white)
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func startEnvironment() {
        manager.configure(
            language: selectedLanguage.lowercased().prefix(2).description,
            useVoiceCloning: useVoiceCloning,
            mode: transcriptionMode
        )
        
        Task {
            let success = await manager.start()
            if !success {
                // Handle error - already shown via alert
            }
        }
    }
}

// MARK: - Setup View

struct VSEnvironmentSetupView: View {
    @Binding var selectedLanguage: String
    @Binding var useVoiceCloning: Bool
    @Binding var transcriptionMode: VSEnvironmentView.TranscriptionMode
    let onStart: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    let languages = [
        "English", "Spanish", "French", "German", "Italian",
        "Portuguese", "Russian", "Chinese", "Japanese", "Korean"
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Language Settings") {
                    Picker("Your Language", selection: $selectedLanguage) {
                        ForEach(languages, id: \.self) { language in
                            Text(language).tag(language)
                        }
                    }
                }
                
                Section("Voice Settings") {
                    Toggle("Clone Voices", isOn: $useVoiceCloning)
                    
                    if useVoiceCloning {
                        Text("Translated speech will match the original speaker's voice")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Output Mode") {
                    Picker("Translation Output", selection: $transcriptionMode) {
                        ForEach(VSEnvironmentView.TranscriptionMode.allCases, id: \.self) { mode in
                            Text(mode.rawValue).tag(mode)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                Section("Audio Routing") {
                    HStack {
                        Label("Input Device", systemImage: "mic.fill")
                        Spacer()
                        Text("Device Microphone")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Label("Output Device", systemImage: "speaker.fill")
                        Spacer()
                        Text("Device Speaker")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("VS Environment Setup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Start") {
                        onStart()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

// MARK: - Audio Level Indicator

struct AudioLevelIndicatorView: View {
    let level: CGFloat
    
    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(Color.white.opacity(0.3), lineWidth: 4)
            
            // Audio level circle
            Circle()
                .trim(from: 0, to: level)
                .stroke(
                    LinearGradient(
                        colors: [.green, .yellow, .red],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.1), value: level)
            
            // Center microphone icon
            Image(systemName: "mic.fill")
                .font(.system(size: 40))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Transcription Display

struct TranscriptionDisplayView: View {
    let originalText: String
    let translatedText: String
    
    var body: some View {
        VStack(spacing: 16) {
            if !originalText.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Original")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    
                    Text(originalText)
                        .font(.body)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(12)
                }
            }
            
            if !translatedText.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Translation")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                    
                    Text(translatedText)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue.opacity(0.3))
                        .cornerRadius(12)
                }
            }
        }
    }
}

// MARK: - Preview

struct VSEnvironmentView_Previews: PreviewProvider {
    static var previews: some View {
        VSEnvironmentView()
    }
}
