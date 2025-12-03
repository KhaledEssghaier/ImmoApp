# Flutter Chat Client - Part 2: Providers & UI

## 6️⃣ Riverpod Providers

**File: `lib/features/chat/presentation/providers/socket_provider.dart`**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/chat_socket_datasource.dart';

final socketProvider = Provider<ChatSocketDataSource>((ref) {
  final socket = ChatSocketDataSource();
  ref.onDispose(() => socket.dispose());
  return socket;
});

final connectionStateProvider = StreamProvider<ConnectionState>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.connectionStream;
});

final messageStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.messageStream;
});

final typingStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.typingStream;
});

final readReceiptStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.readReceiptStream;
});

final presenceStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.presenceStream;
});
```

**File: `lib/features/chat/presentation/providers/chat_provider.dart`**

```dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../data/datasources/chat_local_datasource.dart';
import '../../data/datasources/chat_socket_datasource.dart';
import '../../data/datasources/chat_remote_datasource.dart';
import '../../data/models/message_model.dart';
import '../../data/models/conversation_model.dart';
import 'socket_provider.dart';

// Current conversation ID
final currentConversationProvider = StateProvider<String?>((ref) => null);

// Local datasource provider
final localDataSourceProvider = Provider((ref) => ChatLocalDataSource());

// Remote datasource provider
final remoteDataSourceProvider = Provider((ref) => ChatRemoteDataSource());

// Messages provider for current conversation
final messagesProvider = StateNotifierProvider<MessagesNotifier, AsyncValue<List<MessageModel>>>((ref) {
  return MessagesNotifier(ref);
});

class MessagesNotifier extends StateNotifier<AsyncValue<List<MessageModel>>> {
  final Ref ref;
  Timer? _typingDebounce;
  StreamSubscription? _messageSubscription;
  StreamSubscription? _readReceiptSubscription;

  MessagesNotifier(this.ref) : super(const AsyncValue.loading()) {
    _listenToSocketEvents();
  }

  void _listenToSocketEvents() {
    // Listen for new messages from socket
    _messageSubscription = ref.read(messageStreamProvider.stream).listen((data) {
      final message = MessageModel.fromJson(data);
      _addOrUpdateMessage(message);
    });

    // Listen for read receipts
    _readReceiptSubscription = ref.read(readReceiptStreamProvider.stream).listen((data) {
      _handleReadReceipt(data);
    });
  }

  Future<void> loadMessages(String conversationId, {String? before}) async {
    state = const AsyncValue.loading();
    
    try {
      // Try local cache first
      final localDataSource = ref.read(localDataSourceProvider);
      final cachedMessages = await localDataSource.getMessages(
        conversationId,
        before: before,
      );

      if (cachedMessages.isNotEmpty) {
        state = AsyncValue.data(cachedMessages);
      }

      // Then fetch from server
      final remoteDataSource = ref.read(remoteDataSourceProvider);
      final serverMessages = await remoteDataSource.getMessages(
        conversationId,
        limit: 50,
        before: before,
      );

      // Cache server messages
      for (final message in serverMessages) {
        await localDataSource.insertMessage(message);
      }

      state = AsyncValue.data(serverMessages);
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }

  Future<void> sendMessage({
    required String conversationId,
    required String text,
    required String senderId,
    List<AttachmentModel> attachments = const [],
  }) async {
    final localId = const Uuid().v4();
    
    // Create optimistic message
    final tempMessage = MessageModel.temporary(
      localId: localId,
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      attachments: attachments,
    );

    // Add to UI immediately
    _addOrUpdateMessage(tempMessage);

    // Save to local DB
    final localDataSource = ref.read(localDataSourceProvider);
    await localDataSource.insertMessage(tempMessage);

    // Check if socket is connected
    final socket = ref.read(socketProvider);
    
    if (socket.isConnected) {
      // Send via socket
      socket.sendMessage(tempMessage.toJson());
    } else {
      // Queue for later if offline
      await localDataSource.addPendingMessage(
        localId,
        conversationId,
        text,
        attachments,
      );
      
      // Mark as failed
      final failedMessage = tempMessage.copyWith(status: MessageStatus.failed);
      _addOrUpdateMessage(failedMessage);
      await localDataSource.updateMessage(failedMessage);
    }
  }

  Future<void> retryFailedMessage(MessageModel message) async {
    if (message.localId == null) return;

    // Update status to sending
    final sendingMessage = message.copyWith(status: MessageStatus.sending);
    _addOrUpdateMessage(sendingMessage);

    final socket = ref.read(socketProvider);
    if (socket.isConnected) {
      socket.sendMessage(sendingMessage.toJson());
    }
  }

  void sendTypingIndicator(String conversationId, bool isTyping) {
    _typingDebounce?.cancel();

    final socket = ref.read(socketProvider);
    socket.sendTyping(conversationId, isTyping);

    if (isTyping) {
      // Auto-stop after 3 seconds
      _typingDebounce = Timer(const Duration(seconds: 3), () {
        socket.sendTyping(conversationId, false);
      });
    }
  }

  Future<void> markMessagesAsRead(String conversationId, List<String> messageIds) async {
    if (messageIds.isEmpty) return;

    final socket = ref.read(socketProvider);
    socket.markMessagesRead(conversationId, messageIds);

    // Update local messages
    state.whenData((messages) {
      final updatedMessages = messages.map((msg) {
        if (messageIds.contains(msg.id)) {
          return msg.copyWith(status: MessageStatus.read);
        }
        return msg;
      }).toList();
      state = AsyncValue.data(updatedMessages);
    });
  }

  void _addOrUpdateMessage(MessageModel newMessage) {
    state.whenData((messages) {
      final existingIndex = messages.indexWhere((m) =>
          m.id == newMessage.id ||
          (newMessage.localId != null && m.localId == newMessage.localId));

      List<MessageModel> updatedMessages;
      if (existingIndex >= 0) {
        // Update existing
        updatedMessages = List.from(messages);
        updatedMessages[existingIndex] = newMessage;
      } else {
        // Add new
        updatedMessages = [newMessage, ...messages];
      }

      // Sort by timestamp
      updatedMessages.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      state = AsyncValue.data(updatedMessages);
    });
  }

  void _handleReadReceipt(Map<String, dynamic> data) {
    final messageIds = List<String>.from(data['messageIds'] ?? []);
    final userId = data['userId'] as String;

    state.whenData((messages) {
      final updatedMessages = messages.map((msg) {
        if (messageIds.contains(msg.id) && !msg.readBy.contains(userId)) {
          return msg.copyWith(
            readBy: [...msg.readBy, userId],
            status: MessageStatus.read,
          );
        }
        return msg;
      }).toList();
      state = AsyncValue.data(updatedMessages);
    });
  }

  @override
  void dispose() {
    _typingDebounce?.cancel();
    _messageSubscription?.cancel();
    _readReceiptSubscription?.cancel();
    super.dispose();
  }
}

// Typing users provider
final typingUsersProvider = StateNotifierProvider<TypingUsersNotifier, Set<String>>((ref) {
  return TypingUsersNotifier(ref);
});

class TypingUsersNotifier extends StateNotifier<Set<String>> {
  final Ref ref;
  final Map<String, Timer> _typingTimers = {};
  StreamSubscription? _subscription;

  TypingUsersNotifier(this.ref) : super({}) {
    _listenToTyping();
  }

  void _listenToTyping() {
    _subscription = ref.read(typingStreamProvider.stream).listen((data) {
      final userId = data['userId'] as String;
      final isTyping = data['isTyping'] as bool;
      final currentConvId = ref.read(currentConversationProvider);
      final dataConvId = data['conversationId'] as String;

      // Only update if it's the current conversation
      if (currentConvId == dataConvId) {
        if (isTyping) {
          _addTypingUser(userId);
        } else {
          _removeTypingUser(userId);
        }
      }
    });
  }

  void _addTypingUser(String userId) {
    state = {...state, userId};

    // Auto-remove after 5 seconds
    _typingTimers[userId]?.cancel();
    _typingTimers[userId] = Timer(const Duration(seconds: 5), () {
      _removeTypingUser(userId);
    });
  }

  void _removeTypingUser(String userId) {
    _typingTimers[userId]?.cancel();
    _typingTimers.remove(userId);
    state = state.where((id) => id != userId).toSet();
  }

  @override
  void dispose() {
    for (final timer in _typingTimers.values) {
      timer.cancel();
    }
    _subscription?.cancel();
    super.dispose();
  }
}

// Conversations provider
final conversationsProvider = StateNotifierProvider<ConversationsNotifier, AsyncValue<List<ConversationModel>>>((ref) {
  return ConversationsNotifier(ref);
});

class ConversationsNotifier extends StateNotifier<AsyncValue<List<ConversationModel>>> {
  final Ref ref;

  ConversationsNotifier(this.ref) : super(const AsyncValue.loading());

  Future<void> loadConversations() async {
    try {
      // Load from cache first
      final localDataSource = ref.read(localDataSourceProvider);
      final cached = await localDataSource.getCachedConversations();
      
      if (cached.isNotEmpty) {
        state = AsyncValue.data(cached);
      }

      // Fetch from server
      final remoteDataSource = ref.read(remoteDataSourceProvider);
      final conversations = await remoteDataSource.getConversations();

      // Cache them
      await localDataSource.cacheConversations(conversations);
      
      state = AsyncValue.data(conversations);
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }

  void updateUnreadCount(String conversationId, int count) {
    state.whenData((conversations) {
      final updated = conversations.map((conv) {
        if (conv.id == conversationId) {
          return conv.copyWith(unreadCount: count);
        }
        return conv;
      }).toList();
      state = AsyncValue.data(updated);
    });
  }
}
```

**File: `lib/features/chat/presentation/providers/connectivity_provider.dart`**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

final connectivityProvider = StreamProvider<ConnectivityResult>((ref) {
  return Connectivity().onConnectivityChanged;
});

final isOnlineProvider = Provider<bool>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.when(
    data: (result) => result != ConnectivityResult.none,
    loading: () => true,
    error: (_, __) => false,
  );
});
```

---

## 7️⃣ Remote Data Source (REST API)

**File: `lib/features/chat/data/datasources/chat_remote_datasource.dart`**

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';

class ChatRemoteDataSource {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final _storage = const FlutterSecureStorage();

  ChatRemoteDataSource() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, try to refresh
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry original request
            return handler.resolve(await _dio.fetch(error.requestOptions));
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;

      final response = await _dio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });

      final newAccessToken = response.data['accessToken'];
      final newRefreshToken = response.data['refreshToken'];

      await _storage.write(key: 'access_token', value: newAccessToken);
      await _storage.write(key: 'refresh_token', value: newRefreshToken);

      return true;
    } catch (e) {
      return false;
    }
  }

  // Get conversations
  Future<List<ConversationModel>> getConversations() async {
    try {
      final response = await _dio.get(ApiConstants.conversations);
      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => ConversationModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load conversations: $e');
    }
  }

  // Get messages for a conversation
  Future<List<MessageModel>> getMessages(
    String conversationId, {
    int limit = 50,
    String? before,
    DateTime? since,
  }) async {
    try {
      final queryParams = {
        'limit': limit.toString(),
        if (before != null) 'before': before,
        if (since != null) 'since': since.toIso8601String(),
      };

      final response = await _dio.get(
        ApiConstants.conversationMessages(conversationId),
        queryParameters: queryParams,
      );

      final List<dynamic> data = response.data['data'] ?? response.data;
      return data.map((json) => MessageModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load messages: $e');
    }
  }

  // Mark messages as read (REST fallback)
  Future<void> markMessagesRead(
    String conversationId,
    List<String> messageIds,
  ) async {
    try {
      await _dio.post(
        ApiConstants.markRead(conversationId),
        data: {'messageIds': messageIds},
      );
    } catch (e) {
      throw Exception('Failed to mark messages as read: $e');
    }
  }

  // Upload attachment
  Future<Map<String, dynamic>> uploadAttachment(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });

      final response = await _dio.post('/media/upload', data: formData);
      return response.data;
    } catch (e) {
      throw Exception('Failed to upload attachment: $e');
    }
  }
}
```

---

## 8️⃣ Connection Manager

**File: `lib/core/utils/connection_manager.dart`**

```dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/chat/data/datasources/chat_socket_datasource.dart';
import '../../features/chat/data/datasources/chat_local_datasource.dart';
import '../../features/chat/presentation/providers/socket_provider.dart';
import '../../features/chat/presentation/providers/connectivity_provider.dart';

class ConnectionManager {
  final Ref ref;
  StreamSubscription? _connectivitySubscription;
  StreamSubscription? _connectionStateSubscription;
  bool _wasOnline = true;

  ConnectionManager(this.ref) {
    _init();
  }

  void _init() {
    // Monitor network connectivity
    _connectivitySubscription = ref.read(connectivityProvider.stream).listen((result) {
      final isOnline = result != ConnectivityResult.none;
      
      if (isOnline && !_wasOnline) {
        // Network restored
        _handleReconnection();
      }
      
      _wasOnline = isOnline;
    });

    // Monitor socket connection state
    final socket = ref.read(socketProvider);
    _connectionStateSubscription = socket.connectionStream.listen((state) {
      if (state == ConnectionState.connected) {
        _handleReconnection();
      }
    });
  }

  Future<void> _handleReconnection() async {
    print('🔄 Reconnected - processing pending messages');
    
    final localDataSource = ref.read(localDataSourceProvider);
    final socket = ref.read(socketProvider);
    
    // Get pending messages
    final pendingMessages = await localDataSource.getPendingMessages();
    
    for (final pending in pendingMessages) {
      try {
        // Send pending message
        socket.sendMessage({
          'conversationId': pending['conversationId'],
          'text': pending['text'],
          'localId': pending['localId'],
        });
        
        // Remove from queue on success
        await localDataSource.deletePendingMessage(pending['localId']);
      } catch (e) {
        // Increment retry count
        await localDataSource.incrementRetryCount(pending['localId']);
        
        // Give up after 3 retries
        if (pending['retryCount'] >= 3) {
          await localDataSource.deletePendingMessage(pending['localId']);
        }
      }
    }
    
    // Sync recent messages
    await _syncRecentMessages();
  }

  Future<void> _syncRecentMessages() async {
    // Get last sync timestamp from local storage
    // Fetch messages since last sync
    // Update local cache
    print('🔄 Syncing recent messages...');
  }

  void dispose() {
    _connectivitySubscription?.cancel();
    _connectionStateSubscription?.cancel();
  }
}

final connectionManagerProvider = Provider((ref) {
  final manager = ConnectionManager(ref);
  ref.onDispose(() => manager.dispose());
  return manager;
});
```

---

## 9️⃣ UI Widgets

**File: `lib/features/chat/presentation/widgets/message_bubble.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../data/models/message_model.dart';

class MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;
  final VoidCallback? onRetry;

  const MessageBubble({
    Key? key,
    required this.message,
    required this.isMe,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: isMe ? Colors.blue : Colors.grey[300],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.text,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat.Hm().format(message.createdAt),
                  style: TextStyle(
                    color: isMe ? Colors.white70 : Colors.black54,
                    fontSize: 12,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  _buildStatusIcon(),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIcon() {
    switch (message.status) {
      case MessageStatus.sending:
        return const SizedBox(
          width: 12,
          height: 12,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white70),
          ),
        );
      case MessageStatus.failed:
        return GestureDetector(
          onTap: onRetry,
          child: const Icon(Icons.error, size: 16, color: Colors.red),
        );
      case MessageStatus.sent:
        return const Icon(Icons.check, size: 16, color: Colors.white70);
      case MessageStatus.delivered:
        return const Icon(Icons.done_all, size: 16, color: Colors.white70);
      case MessageStatus.read:
        return const Icon(Icons.done_all, size: 16, color: Colors.lightBlue);
    }
  }
}
```

**File: `lib/features/chat/presentation/widgets/typing_indicator.dart`**

```dart
import 'package:flutter/material.dart';

class TypingIndicator extends StatefulWidget {
  final List<String> userNames;

  const TypingIndicator({Key? key, required this.userNames}) : super(key: key);

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.userNames.isEmpty) return const SizedBox.shrink();

    final displayText = widget.userNames.length == 1
        ? '${widget.userNames[0]} is typing...'
        : '${widget.userNames.length} people are typing...';

    return Container(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Row(
                children: List.generate(3, (index) {
                  final delay = index * 0.3;
                  final value = (_controller.value + delay) % 1.0;
                  final opacity = (value < 0.5 ? value * 2 : (1 - value) * 2);
                  
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.grey.withOpacity(opacity),
                    ),
                  );
                }),
              );
            },
          ),
          const SizedBox(width: 8),
          Text(
            displayText,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}
```

**File: `lib/features/chat/presentation/widgets/chat_input.dart`**

```dart
import 'package:flutter/material.dart';
import 'dart:async';

class ChatInput extends StatefulWidget {
  final Function(String) onSendMessage;
  final Function(bool) onTyping;
  final VoidCallback? onAttachment;

  const ChatInput({
    Key? key,
    required this.onSendMessage,
    required this.onTyping,
    this.onAttachment,
  }) : super(key: key);

  @override
  State<ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<ChatInput> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _typingTimer;
  bool _isTyping = false;

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  void _handleTextChange(String text) {
    if (text.isNotEmpty && !_isTyping) {
      _isTyping = true;
      widget.onTyping(true);
    }

    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 3), () {
      if (_isTyping) {
        _isTyping = false;
        widget.onTyping(false);
      }
    });
  }

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    widget.onSendMessage(text);
    _controller.clear();
    
    if (_isTyping) {
      _isTyping = false;
      widget.onTyping(false);
    }
    
    _typingTimer?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          if (widget.onAttachment != null)
            IconButton(
              icon: const Icon(Icons.attach_file),
              onPressed: widget.onAttachment,
            ),
          Expanded(
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              onChanged: _handleTextChange,
              decoration: const InputDecoration(
                hintText: 'Type a message...',
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _handleSend(),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.send),
            color: Colors.blue,
            onPressed: _handleSend,
          ),
        ],
      ),
    );
  }
}
```

---

**Continue to Part 3 for complete screens and usage examples?**