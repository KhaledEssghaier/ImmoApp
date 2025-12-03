# Chat Feature - Flutter Frontend

## 📁 Structure

```
lib/features/chat/
├── data/
│   ├── datasources/
│   │   ├── chat_socket_datasource.dart    # Socket.IO connection & events
│   │   ├── chat_remote_datasource.dart    # REST API calls
│   │   └── chat_local_datasource.dart     # SQLite offline storage
│   └── models/
│       ├── message_model.dart             # Message model with status
│       └── conversation_model.dart        # Conversation & User models
└── presentation/
    ├── providers/
    │   ├── socket_provider.dart           # Socket state providers
    │   └── chat_provider.dart             # Messages & conversations state
    ├── screens/
    │   ├── conversation_list_screen.dart  # List of conversations
    │   └── chat_screen.dart               # Chat room with messages
    └── widgets/
        ├── message_bubble.dart            # Message UI with status icons
        ├── typing_indicator.dart          # Animated typing dots
        └── chat_input.dart                # Text input with typing detection
```

## 🚀 Setup

### 1. Install Dependencies

```bash
flutter pub get
```

### 2. Generate JSON Serialization Code

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Configure Backend URLs

Edit `lib/core/constants/api_constants.dart`:

```dart
static const String baseUrl = 'http://YOUR_IP:3000/api/v1';
static const String socketUrl = 'http://YOUR_IP:3005';
```

**Important for Android Emulator:**
- Use `http://10.0.2.2:3005` instead of `localhost`

**Important for iOS Simulator:**
- Use `http://localhost:3005` or your computer's IP

**For Real Devices:**
- Use your computer's local IP (e.g., `http://192.168.1.100:3005`)

### 4. Set Current User ID

In `lib/features/chat/presentation/screens/chat_screen.dart`, update line with TODO:

```dart
// Get from your auth provider
final currentUserId = ref.watch(currentUserIdProvider);
```

Set the current user ID when user logs in:

```dart
ref.read(currentUserIdProvider.notifier).state = 'user-id-from-auth';
```

## ✨ Features Implemented

### ✅ Core Features
- **Socket.IO Connection** with automatic reconnection (exponential backoff: 1s → 30s)
- **JWT Authentication** with automatic token refresh on 401
- **Room Management** (join/leave conversation)
- **Optimistic UI** with localId and status tracking (sending/sent/delivered/read/failed)
- **Read Receipts** triggered by scroll position
- **Typing Indicators** with 3-second debounce
- **Message History** with infinite scroll pagination
- **Presence** (online/offline status)
- **Local Caching** with SQLite for offline support
- **Offline Queue** for failed messages with retry

### ✅ UX Features
- Connection status banner (connecting/disconnected)
- Unread message badges in conversation list
- Message delivery status icons (sending/sent/delivered/read)
- Loading states and error handling
- Pull-to-refresh conversations
- Retry button for failed messages

## 🎯 Usage

### Navigate to Conversations List

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const ConversationListScreen(),
  ),
);
```

### Direct to Chat Screen

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ChatScreen(
      conversationId: 'conversation-id',
      otherUserName: 'John Doe',
      otherUserId: 'user-id', // optional for presence
    ),
  ),
);
```

## 🔌 Backend Integration

Ensure your backend chat service is running on port 3005:

```bash
cd backend/chat-service
npm run start:dev
```

## 🧪 Testing

### Test Socket Connection

1. Open app and navigate to conversation list
2. Check connection indicator (green dot = connected)
3. Send a message
4. Verify message appears with "sending" → "sent" status

### Test Optimistic UI

1. Turn off WiFi/mobile data
2. Send a message
3. See message with "failed" status and error icon
4. Turn on network
5. Tap error icon to retry

### Test Typing Indicators

1. Open chat with another user
2. Start typing
3. Other user should see "User is typing..."
4. Stop typing for 3 seconds
5. Typing indicator disappears

### Test Read Receipts

1. Receive a message
2. Scroll message into view
3. Message status changes to "read" (blue double-check)

## 📱 Screenshots

**Conversation List:**
- List of conversations with unread badges
- Last message preview
- Timestamp (Today, Yesterday, or date)
- Connection indicator

**Chat Screen:**
- Message bubbles (blue for sent, gray for received)
- Status icons (clock, check, double-check)
- Typing indicator at bottom
- Connection status banner
- Text input with send button

## 🐛 Troubleshooting

### Socket Won't Connect

**Check backend is running:**
```bash
curl http://localhost:3005/socket.io/?EIO=4&transport=polling
```

**Check firewall/network:**
- Ensure port 3005 is accessible
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Messages Not Sending

**Check authentication:**
- Verify JWT token is stored in secure storage
- Check token hasn't expired
- Look for 401 errors in console

### Typing Indicators Not Working

**Check socket events:**
- Ensure `typing` event is emitted
- Verify you're in the same conversation room
- Check debounce timer (3 seconds)

## 📚 Next Steps

1. **Add Attachments Support**
   - Implement file picker
   - Upload to Media Service
   - Display images/files in messages

2. **Add Push Notifications**
   - Integrate Firebase Cloud Messaging
   - Handle background notifications
   - Deep link to conversations

3. **Add Group Chat**
   - Update models for group conversations
   - Handle multiple participants
   - Group-specific UI

4. **Add Message Reactions**
   - Emoji picker
   - Reaction UI
   - Socket events for reactions

5. **Add Voice Messages**
   - Audio recording
   - Waveform display
   - Audio player

## 🔐 Security Notes

- JWT tokens stored in secure storage (encrypted on device)
- Automatic token refresh prevents session expiration
- Socket.IO validates JWT on connection
- All HTTP requests include Authorization header

## 📄 License

Part of AppImmo real estate application.
