package com.vidlisync.features.vsfriends

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/**
 * VS Friends Theme and UI Components for Android
 */

@Composable
fun VSFriendsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF3B82F6),
            secondary = Color(0xFF8B5CF6),
            background = Color.Transparent,
            surface = Color(0xFF1A1A1A),
            onPrimary = Color.White,
            onSecondary = Color.White,
            onBackground = Color.White,
            onSurface = Color.White
        ),
        content = content
    )
}

@Composable
fun VSFriendsScreen(manager: VSFriendsManager) {
    val conversationState by manager.conversationState
    val showMinimalUI by manager.showMinimalUI

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF3B82F6),
                        Color(0xFF8B5CF6)
                    )
                )
            )
    ) {
        when (conversationState) {
            ConversationState.IDLE -> IdleScreen(manager)
            ConversationState.DISCOVERING, ConversationState.CONNECTING -> DiscoveringScreen(manager)
            ConversationState.ACTIVE -> {
                if (showMinimalUI) {
                    MinimalActiveScreen(manager)
                } else {
                    FullActiveScreen(manager)
                }
            }
            ConversationState.ENDED -> EndedScreen(manager)
        }
    }
}

@Composable
fun IdleScreen(manager: VSFriendsManager) {
    var showInstructions by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Spacer(modifier = Modifier.height(80.dp))

        // Title
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(horizontal = 32.dp)
        ) {
            Text(
                text = "VS Friends",
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Tap phones to start instant translated conversations",
                fontSize = 18.sp,
                color = Color.White.copy(alpha = 0.8f),
                textAlign = TextAlign.Center
            )
        }

        // Main action button
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Animated add friends button
            val infiniteTransition = rememberInfiniteTransition()
            val scale by infiniteTransition.animateFloat(
                initialValue = 1f,
                targetValue = 1.1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2000),
                    repeatMode = RepeatMode.Reverse
                )
            )

            Box(
                modifier = Modifier
                    .size(200.dp)
                    .scale(scale)
                    .clickable { manager.startFriendDiscovery() },
                contentAlignment = Alignment.Center
            ) {
                // Outer ring
                Box(
                    modifier = Modifier
                        .size(200.dp)
                        .background(
                            Color.White.copy(alpha = 0.2f),
                            shape = CircleShape
                        )
                )

                // Inner circle
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .background(Color.White, shape = CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Group,
                        contentDescription = "Add Friends",
                        tint = Color(0xFF3B82F6),
                        modifier = Modifier.size(60.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Add Friends",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )

                Text(
                    text = "Tap phones together",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
            }
        }

        // Instructions and features
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            TextButton(
                onClick = { showInstructions = true }
            ) {
                Text(
                    text = "How it works",
                    color = Color.White.copy(alpha = 0.8f),
                    textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Feature highlights
            Row(
                horizontalArrangement = Arrangement.SpaceEvenly,
                modifier = Modifier.fillMaxWidth()
            ) {
                FeatureItem(
                    icon = Icons.Default.PhoneAndroid,
                    label = "Tap to Connect"
                )
                FeatureItem(
                    icon = Icons.Default.Headset,
                    label = "Earbuds First"
                )
                FeatureItem(
                    icon = Icons.Default.Language,
                    label = "50+ Languages"
                )
                FeatureItem(
                    icon = Icons.Default.Group,
                    label = "2-4 People"
                )
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }

    if (showInstructions) {
        InstructionsDialog(onDismiss = { showInstructions = false })
    }
}

@Composable
fun DiscoveringScreen(manager: VSFriendsManager) {
    val participants by manager.participants
    val conversationState by manager.conversationState

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Spacer(modifier = Modifier.height(80.dp))

        // Scanning animation
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Animated scanning rings
            Box(
                modifier = Modifier.size(200.dp),
                contentAlignment = Alignment.Center
            ) {
                repeat(3) { index ->
                    val infiniteTransition = rememberInfiniteTransition()
                    val scale by infiniteTransition.animateFloat(
                        initialValue = 0.5f,
                        targetValue = 1.5f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(2000),
                            repeatMode = RepeatMode.Restart,
                            initialStartOffset = StartOffset(index * 500)
                        )
                    )
                    val alpha by infiniteTransition.animateFloat(
                        initialValue = 0.8f,
                        targetValue = 0f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(2000),
                            repeatMode = RepeatMode.Restart,
                            initialStartOffset = StartOffset(index * 500)
                        )
                    )

                    Box(
                        modifier = Modifier
                            .size((120 + index * 40).dp)
                            .scale(scale)
                            .background(
                                Color.White.copy(alpha = alpha * 0.3f),
                                shape = CircleShape
                            )
                            .border(
                                2.dp,
                                Color.White.copy(alpha = alpha),
                                CircleShape
                            )
                    )
                }

                // Phone icon
                Icon(
                    imageVector = Icons.Default.PhoneAndroid,
                    contentDescription = "Scanning",
                    tint = Color.White,
                    modifier = Modifier.size(60.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = if (conversationState == ConversationState.CONNECTING) "Connecting..." else "Looking for Friends",
                fontSize = 24.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Make sure your friend opens VS Friends too",
                fontSize = 16.sp,
                color = Color.White.copy(alpha = 0.8f),
                textAlign = TextAlign.Center
            )
        }

        // Discovered participants
        if (participants.isNotEmpty()) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(
                        text = "Found Friends",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }

                items(participants) { participant ->
                    ParticipantCard(participant = participant)
                }
            }
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }

        // Cancel button
        TextButton(
            onClick = { manager.conversationState.value = ConversationState.IDLE }
        ) {
            Text(
                text = "Cancel",
                color = Color.White.copy(alpha = 0.7f)
            )
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun MinimalActiveScreen(manager: VSFriendsManager) {
    val participants by manager.participants
    var showControls by remember { mutableStateOf(false) }

    // Auto-hide controls after 3 seconds
    LaunchedEffect(showControls) {
        if (showControls) {
            delay(3000)
            showControls = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .clickable { showControls = !showControls }
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Participant dots
            Row(
                horizontalArrangement = Arrangement.spacedBy(20.dp),
                modifier = Modifier.padding(top = 80.dp)
            ) {
                participants.forEach { participant ->
                    ParticipantDot(
                        participant = participant,
                        size = DotSize.Large
                    )
                }
            }

            // Audio visualization
            Box(
                contentAlignment = Alignment.Center
            ) {
                val isSpeaking = participants.any { it.isSpeaking }
                val scale by animateFloatAsState(
                    targetValue = if (isSpeaking) 1.2f else 1f,
                    animationSpec = tween(300)
                )

                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .scale(scale)
                        .background(
                            Color.White.copy(alpha = 0.1f),
                            shape = CircleShape
                        )
                        .border(
                            4.dp,
                            Color.White.copy(alpha = if (isSpeaking) 0.8f else 0.3f),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = "Audio",
                        tint = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.size(40.dp)
                    )
                }
            }

            // End button
            IconButton(
                onClick = { manager.endConversation() },
                modifier = Modifier.padding(bottom = 100.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Cancel,
                    contentDescription = "End conversation",
                    tint = Color.Red.copy(alpha = 0.8f),
                    modifier = Modifier.size(60.dp)
                )
            }
        }

        // Controls overlay
        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White.copy(alpha = 0.1f)
                    ),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Conversation Active",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )

                        manager.currentSession.value?.let { session ->
                            Text(
                                text = "Cost: $${String.format("%.2f", manager.estimatedCost.value)}",
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        ControlButton(
                            icon = Icons.Default.Language,
                            text = "Change Language",
                            onClick = { /* TODO: Show language selector */ }
                        )

                        ControlButton(
                            icon = Icons.Default.Fullscreen,
                            text = "Show Full Interface",
                            onClick = {
                                manager.toggleMinimalUI()
                                showControls = false
                            }
                        )

                        ControlButton(
                            icon = Icons.Default.Cancel,
                            text = "End Conversation",
                            onClick = { manager.endConversation() },
                            color = Color.Red
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun FullActiveScreen(manager: VSFriendsManager) {
    val participants by manager.participants
    val estimatedCost by manager.estimatedCost

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Header
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color.Black.copy(alpha = 0.2f)
            ),
            shape = RoundedCornerShape(0.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "VS Friends",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                    Text(
                        text = "$${String.format("%.2f", estimatedCost)}",
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    IconButton(onClick = { manager.toggleMinimalUI() }) {
                        Icon(
                            imageVector = Icons.Default.Minimize,
                            contentDescription = "Minimize",
                            tint = Color.White
                        )
                    }

                    IconButton(onClick = { manager.endConversation() }) {
                        Icon(
                            imageVector = Icons.Default.Cancel,
                            contentDescription = "End",
                            tint = Color.Red
                        )
                    }
                }
            }
        }

        // Content
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Participants (${participants.size})",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }

            items(participants) { participant ->
                ParticipantCard(participant = participant, showDetails = true)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { /* TODO: Show language selector */ },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.1f)
                    )
                ) {
                    Text(
                        text = "Change Language",
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun EndedScreen(manager: VSFriendsManager) {
    val session = manager.currentSession.value
    val estimatedCost by manager.estimatedCost

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Spacer(modifier = Modifier.height(80.dp))

        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Success icon
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Success",
                tint = Color.Green,
                modifier = Modifier.size(80.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Conversation Ended",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Thanks for using VS Friends!",
                fontSize = 16.sp,
                color = Color.White.copy(alpha = 0.8f)
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Session summary
            session?.let {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White.copy(alpha = 0.1f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SummaryRow(
                            label = "Duration:",
                            value = formatDuration(it.startTime, it.endTime ?: System.currentTimeMillis())
                        )
                        SummaryRow(
                            label = "Participants:",
                            value = "${it.participants.size}"
                        )
                        SummaryRow(
                            label = "Cost:",
                            value = "$${String.format("%.2f", estimatedCost)}"
                        )
                    }
                }
            }
        }

        // Action buttons
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Button(
                onClick = { manager.conversationState.value = ConversationState.IDLE },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF3B82F6)
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Start New Conversation")
            }

            OutlinedButton(
                onClick = { /* TODO: Navigate back */ },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = Color.White
                )
            ) {
                Text("Back to Dashboard")
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

// Helper Composables

@Composable
fun FeatureItem(
    icon: ImageVector,
    label: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .background(
                    Color.White.copy(alpha = 0.1f),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = Color.White,
                modifier = Modifier.size(32.dp)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = label,
            fontSize = 12.sp,
            color = Color.White.copy(alpha = 0.8f),
            textAlign = TextAlign.Center
        )
    }
}

enum class DotSize(val dp: Int, val fontSize: Int) {
    Small(32, 12),
    Medium(48, 16),
    Large(64, 20)
}

@Composable
fun ParticipantDot(
    participant: VSFriend,
    size: DotSize
) {
    Box(
        contentAlignment = Alignment.Center
    ) {
        // Speaking animation
        if (participant.isSpeaking) {
            val infiniteTransition = rememberInfiniteTransition()
            val scale by infiniteTransition.animateFloat(
                initialValue = 1f,
                targetValue = 1.3f,
                animationSpec = infiniteRepeatable(
                    animation = tween(500),
                    repeatMode = RepeatMode.Reverse
                )
            )

            Box(
                modifier = Modifier
                    .size((size.dp + 8).dp)
                    .scale(scale)
                    .background(
                        Color.Green.copy(alpha = 0.3f),
                        shape = CircleShape
                    )
            )
        }

        // Main dot
        Box(
            modifier = Modifier
                .size(size.dp.dp)
                .background(
                    if (participant.isConnected) Color(0xFF3B82F6) else Color.Gray,
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = participant.initials,
                fontSize = size.fontSize.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        // Connection status
        Box(
            modifier = Modifier
                .size(16.dp)
                .offset(x = (size.dp / 2 - 8).dp, y = (size.dp / 2 - 8).dp)
                .background(
                    if (participant.isConnected) Color.Green else Color.Red,
                    shape = CircleShape
                )
                .border(2.dp, Color.White, CircleShape)
        )
    }
}

@Composable
fun ParticipantCard(
    participant: VSFriend,
    showDetails: Boolean = false
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.1f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            ParticipantDot(participant = participant, size = DotSize.Medium)

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = participant.name,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White
                )

                if (showDetails) {
                    Text(
                        text = "${participant.language.uppercase()} → ${participant.selectedLanguage.uppercase()}",
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                } else {
                    Text(
                        text = participant.deviceName,
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                }
            }

            if (participant.isConnected) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Connected",
                    tint = Color.Green,
                    modifier = Modifier.size(24.dp)
                )
            } else {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.White.copy(alpha = 0.7f),
                    strokeWidth = 2.dp
                )
            }
        }
    }
}

@Composable
fun ControlButton(
    icon: ImageVector,
    text: String,
    onClick: () -> Unit,
    color: Color = Color.White
) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            color = color
        )
    }
}

@Composable
fun SummaryRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.8f)
        )
        Text(
            text = value,
            color = Color.White,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun InstructionsDialog(onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("How VS Friends Works")
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                InstructionStep(
                    step = "1",
                    title = "Put on Earbuds",
                    description = "VS Friends works best with earbuds for clear, private conversations."
                )
                InstructionStep(
                    step = "2",
                    title = "Tap Phones Together",
                    description = "Bring phones close together and tap when you see their device."
                )
                InstructionStep(
                    step = "3",
                    title = "Start Talking",
                    description = "Speak naturally. Friends hear you translated with your voice."
                )
                InstructionStep(
                    step = "4",
                    title = "Enjoy the Magic",
                    description = "No delays, natural conversations across languages."
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Got it!")
            }
        }
    )
}

@Composable
fun InstructionStep(
    step: String,
    title: String,
    description: String
) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(
                    Color(0xFF3B82F6),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = step,
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Column {
            Text(
                text = title,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = description,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

// Helper functions

fun formatDuration(startTime: Long, endTime: Long): String {
    val duration = (endTime - startTime) / 1000
    val minutes = duration / 60
    val seconds = duration % 60
    return String.format("%d:%02d", minutes, seconds)
}