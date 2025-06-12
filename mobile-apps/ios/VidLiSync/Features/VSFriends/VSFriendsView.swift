//
//  VSFriendsView.swift
//  VidLiSync
//
//  SwiftUI View for VS Friends feature
//

import SwiftUI
import AVFoundation

struct VSFriendsView: View {
    @StateObject private var manager = VSFriendsManager()
    @State private var showingInstructions = false
    @State private var showingLanguageSelector = false
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.blue, Color.purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Main content based on conversation state
            Group {
                switch manager.conversationState {
                case .idle:
                    IdleStateView(manager: manager, showingInstructions: $showingInstructions)
                    
                case .discovering, .connecting:
                    DiscoveringStateView(manager: manager)
                    
                case .active:
                    if manager.showMinimalUI {
                        MinimalActiveView(manager: manager, showingLanguageSelector: $showingLanguageSelector)
                    } else {
                        FullActiveView(manager: manager, showingLanguageSelector: $showingLanguageSelector)
                    }
                    
                case .ended:
                    EndedStateView(manager: manager)
                }
            }
        }
        .preferredColorScheme(.dark)
        .sheet(isPresented: $showingInstructions) {
            InstructionsView()
        }
        .sheet(isPresented: $showingLanguageSelector) {
            LanguageSelectorView()
        }
    }
}

// MARK: - Idle State View

struct IdleStateView: View {
    @ObservedObject var manager: VSFriendsManager
    @Binding var showingInstructions: Bool
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Title
            VStack(spacing: 16) {
                Text("VS Friends")
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                Text("Tap phones to start instant translated conversations")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            
            Spacer()
            
            // Main action button
            Button(action: {
                manager.startFriendDiscovery()
            }) {
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.2))
                            .frame(width: 200, height: 200)
                        
                        Circle()
                            .fill(.white)
                            .frame(width: 160, height: 160)
                        
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                    }
                    
                    VStack(spacing: 8) {
                        Text("Add Friends")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                        
                        Text("Tap phones together")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
            }
            .scaleEffect(1.0)
            .animation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true), value: true)
            
            Spacer()
            
            // Instructions button
            Button("How it works") {
                showingInstructions = true
            }
            .foregroundColor(.white.opacity(0.8))
            .underline()
            
            Spacer()
        }
        .padding()
    }
}

// MARK: - Discovering State View

struct DiscoveringStateView: View {
    @ObservedObject var manager: VSFriendsManager
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Scanning animation
            VStack(spacing: 30) {
                ZStack {
                    // Animated rings
                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .stroke(.white.opacity(0.3), lineWidth: 2)
                            .frame(width: 120 + CGFloat(index * 40))
                            .scaleEffect(1.0)
                            .opacity(1.0)
                            .animation(
                                .easeOut(duration: 2.0)
                                .repeatForever(autoreverses: false)
                                .delay(Double(index) * 0.5),
                                value: true
                            )
                    }
                    
                    // Phone icon
                    Image(systemName: "iphone")
                        .font(.system(size: 60))
                        .foregroundColor(.white)
                }
                
                Text("Looking for Friends")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                Text("Make sure your friend opens VS Friends too")
                    .font(.body)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
            }
            
            // Discovered devices
            if !manager.participants.isEmpty {
                VStack(spacing: 16) {
                    Text("Found Friends")
                        .font(.headline)
                        .foregroundColor(.white)
                    
                    ForEach(manager.participants) { participant in
                        HStack {
                            Circle()
                                .fill(.green)
                                .frame(width: 12, height: 12)
                            
                            Text(participant.name)
                                .foregroundColor(.white)
                            
                            Spacer()
                            
                            if participant.isConnected {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                            } else {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            }
                        }
                        .padding()
                        .background(.white.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            
            Spacer()
            
            // Cancel button
            Button("Cancel") {
                manager.conversationState = .idle
            }
            .foregroundColor(.white.opacity(0.7))
        }
        .padding()
    }
}

// MARK: - Minimal Active View

struct MinimalActiveView: View {
    @ObservedObject var manager: VSFriendsManager
    @Binding var showingLanguageSelector: Bool
    @State private var showingControls = false
    
    var body: some View {
        VStack {
            Spacer()
            
            // Participant dots
            HStack(spacing: 20) {
                ForEach(manager.participants) { participant in
                    ParticipantDotView(participant: participant, size: .large)
                }
            }
            .padding(.top, 60)
            
            Spacer()
            
            // Audio visualization
            ZStack {
                Circle()
                    .stroke(.white.opacity(0.3), lineWidth: 4)
                    .frame(width: 120, height: 120)
                
                Image(systemName: "waveform")
                    .font(.system(size: 40))
                    .foregroundColor(.white.opacity(0.6))
            }
            .scaleEffect(manager.participants.contains(where: { $0.isSpeaking }) ? 1.2 : 1.0)
            .animation(.easeInOut(duration: 0.3), value: manager.participants.contains(where: { $0.isSpeaking }))
            
            Spacer()
            
            // End button
            Button(action: {
                manager.endConversation()
            }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.red.opacity(0.8))
            }
            .padding(.bottom, 100)
        }
        .contentShape(Rectangle())
        .onTapGesture {
            withAnimation {
                showingControls.toggle()
            }
        }
        .overlay(
            // Controls overlay
            Group {
                if showingControls {
                    VStack(spacing: 20) {
                        Spacer()
                        
                        VStack(spacing: 16) {
                            Button("Change Language") {
                                showingLanguageSelector = true
                                showingControls = false
                            }
                            .padding()
                            .background(.white.opacity(0.1))
                            .cornerRadius(12)
                            
                            Button("Show Full Interface") {
                                manager.toggleMinimalUI()
                                showingControls = false
                            }
                            .padding()
                            .background(.white.opacity(0.1))
                            .cornerRadius(12)
                            
                            Button("End Conversation") {
                                manager.endConversation()
                            }
                            .padding()
                            .background(.red.opacity(0.2))
                            .cornerRadius(12)
                        }
                        .foregroundColor(.white)
                        .padding()
                        .background(.black.opacity(0.7))
                        .cornerRadius(20)
                        .padding()
                        
                        Spacer()
                    }
                    .background(.black.opacity(0.3))
                    .transition(.opacity)
                }
            }
        )
        .onAppear {
            // Hide controls after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                withAnimation {
                    showingControls = false
                }
            }
        }
    }
}

// MARK: - Full Active View

struct FullActiveView: View {
    @ObservedObject var manager: VSFriendsManager
    @Binding var showingLanguageSelector: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text("VS Friends")
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("$\(manager.estimatedCost, specifier: "%.2f")")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.7))
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    Button(action: {
                        manager.toggleMinimalUI()
                    }) {
                        Image(systemName: "minus.circle")
                            .font(.title2)
                    }
                    
                    Button(action: {
                        manager.endConversation()
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.red)
                    }
                }
            }
            .foregroundColor(.white)
            .padding()
            .background(.black.opacity(0.2))
            
            ScrollView {
                VStack(spacing: 20) {
                    // Participants section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Participants (\(manager.participants.count))")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            ForEach(manager.participants) { participant in
                                ParticipantCardView(participant: participant)
                            }
                        }
                    }
                    .padding()
                    
                    // Controls section
                    VStack(spacing: 16) {
                        Button("Change Language") {
                            showingLanguageSelector = true
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.white.opacity(0.1))
                        .cornerRadius(12)
                        .foregroundColor(.white)
                    }
                    .padding()
                }
            }
        }
        .background(Color.clear)
    }
}

// MARK: - Ended State View

struct EndedStateView: View {
    @ObservedObject var manager: VSFriendsManager
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Success icon
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)
            
            Text("Conversation Ended")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text("Thanks for using VS Friends!")
                .font(.body)
                .foregroundColor(.white.opacity(0.8))
            
            // Session summary
            if let session = manager.currentSession {
                VStack(spacing: 12) {
                    HStack {
                        Text("Duration:")
                        Spacer()
                        Text(formatDuration(session.startTime, session.endTime ?? Date()))
                    }
                    
                    HStack {
                        Text("Participants:")
                        Spacer()
                        Text("\(session.participants.count)")
                    }
                    
                    HStack {
                        Text("Cost:")
                        Spacer()
                        Text("$\(manager.estimatedCost, specifier: "%.2f")")
                    }
                }
                .foregroundColor(.white)
                .padding()
                .background(.white.opacity(0.1))
                .cornerRadius(12)
            }
            
            Spacer()
            
            // Action buttons
            VStack(spacing: 16) {
                Button("Start New Conversation") {
                    manager.conversationState = .idle
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(.blue)
                .cornerRadius(12)
                .foregroundColor(.white)
                
                Button("Back to Dashboard") {
                    // Navigate back
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(.white.opacity(0.1))
                .cornerRadius(12)
                .foregroundColor(.white)
            }
            .padding()
        }
        .padding()
    }
    
    private func formatDuration(_ start: Date, _ end: Date) -> String {
        let duration = end.timeIntervalSince(start)
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Supporting Views

struct ParticipantDotView: View {
    let participant: VSFriend
    let size: DotSize
    
    enum DotSize {
        case small, medium, large
        
        var diameter: CGFloat {
            switch self {
            case .small: return 32
            case .medium: return 48
            case .large: return 64
            }
        }
        
        var fontSize: CGFloat {
            switch self {
            case .small: return 12
            case .medium: return 16
            case .large: return 20
            }
        }
    }
    
    var body: some View {
        ZStack {
            Circle()
                .fill(participant.isConnected ? .blue : .gray)
                .frame(width: size.diameter, height: size.diameter)
            
            if participant.isSpeaking {
                Circle()
                    .stroke(.white, lineWidth: 3)
                    .frame(width: size.diameter + 8, height: size.diameter + 8)
                    .scaleEffect(1.2)
                    .opacity(0.8)
                    .animation(.easeInOut(duration: 0.5).repeatForever(), value: participant.isSpeaking)
            }
            
            Text(participant.initials)
                .font(.system(size: size.fontSize, weight: .bold))
                .foregroundColor(.white)
        }
    }
}

struct ParticipantCardView: View {
    let participant: VSFriend
    
    var body: some View {
        VStack(spacing: 8) {
            ParticipantDotView(participant: participant, size: .medium)
            
            Text(participant.name)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
            
            Text("\(participant.language.uppercased()) → \(participant.selectedLanguage.uppercased())")
                .font(.caption2)
                .foregroundColor(.white.opacity(0.7))
        }
        .padding()
        .background(.white.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Modal Views

struct InstructionsView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    InstructionStepView(
                        icon: "headphones",
                        title: "Put on Earbuds",
                        description: "VS Friends works best with earbuds or headphones for clear, private conversations."
                    )
                    
                    InstructionStepView(
                        icon: "iphone",
                        title: "Tap Phones Together",
                        description: "Bring your phones close together and tap when you see their device appear."
                    )
                    
                    InstructionStepView(
                        icon: "person.2.fill",
                        title: "Start Talking",
                        description: "Speak naturally in your language. Your friends will hear you translated with your voice."
                    )
                    
                    InstructionStepView(
                        icon: "sparkles",
                        title: "Enjoy the Magic",
                        description: "No turn-taking, no delays. Have natural conversations across languages."
                    )
                }
                .padding()
            }
            .navigationTitle("How VS Friends Works")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct InstructionStepView: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct LanguageSelectorView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedLanguage = "English"
    
    let languages = [
        "English", "Spanish", "French", "German", "Italian", "Portuguese",
        "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi"
    ]
    
    var body: some View {
        NavigationView {
            List(languages, id: \.self) { language in
                HStack {
                    Text(language)
                    Spacer()
                    if language == selectedLanguage {
                        Image(systemName: "checkmark")
                            .foregroundColor(.blue)
                    }
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    selectedLanguage = language
                    // Save selection
                    UserDefaults.standard.set(language.lowercased(), forKey: "preferredLanguage")
                    dismiss()
                }
            }
            .navigationTitle("Select Language")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview

struct VSFriendsView_Previews: PreviewProvider {
    static var previews: some View {
        VSFriendsView()
    }
}