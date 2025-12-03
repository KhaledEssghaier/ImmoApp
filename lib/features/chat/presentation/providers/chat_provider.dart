import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../data/datasources/chat_local_datasource.dart';
import '../../data/datasources/chat_remote_datasource.dart';
import '../../data/models/message_model.dart';
import '../../data/models/conversation_model.dart';
import 'socket_provider.dart';

// Current conversation ID
final currentConversationProvider = StateProvider<String?>((ref) => null);

// Current user ID (get from auth)
final currentUserIdProvider = StateProvider<String?>((ref) => null);

// Local datasource provider
final localDataSourceProvider = Provider((ref) => ChatLocalDataSource());

// Remote datasource provider
final remoteDataSourceProvider = Provider((ref) => ChatRemoteDataSource());

// Messages provider for current conversation
final messagesProvider =
    StateNotifierProvider<MessagesNotifier, AsyncValue<List<MessageModel>>>((
      ref,
    ) {
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
    _messageSubscription = ref.read(messageStreamProvider.stream).listen((
      data,
    ) {
      try {
        print('📥 Received message event: $data');
        final message = MessageModel.fromJson(data);
        print('✅ Parsed message: ${message.id}');
        _addOrUpdateMessage(message);
      } catch (e, stack) {
        print('❌ Error parsing message from socket: $e');
        print('Stack: $stack');
      }
    });

    _readReceiptSubscription = ref
        .read(readReceiptStreamProvider.stream)
        .listen((data) {
          _handleReadReceipt(data);
        });
  }

  Future<void> loadMessages(String conversationId, {String? before}) async {
    state = const AsyncValue.loading();

    try {
      final localDataSource = ref.read(localDataSourceProvider);
      final cachedMessages = await localDataSource.getMessages(
        conversationId,
        before: before,
      );

      if (cachedMessages.isNotEmpty) {
        state = AsyncValue.data(cachedMessages);
      }

      final remoteDataSource = ref.read(remoteDataSourceProvider);
      final serverMessages = await remoteDataSource.getMessages(
        conversationId,
        limit: 50,
        before: before,
      );

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
    List<String> images = const [],
  }) async {
    final localId = const Uuid().v4();

    final tempMessage = MessageModel.temporary(
      localId: localId,
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      images: images,
    );

    _addOrUpdateMessage(tempMessage);

    final localDataSource = ref.read(localDataSourceProvider);
    await localDataSource.insertMessage(tempMessage);

    final socket = ref.read(socketProvider);

    if (socket.isConnected) {
      // Send only the fields the backend expects
      socket.sendMessage({
        'conversationId': conversationId,
        'text': text,
        'localId': localId,
      });
    } else {
      await localDataSource.addPendingMessage(
        localId,
        conversationId,
        text,
        images,
      );

      final failedMessage = tempMessage.copyWith(status: MessageStatus.failed);
      _addOrUpdateMessage(failedMessage);
      await localDataSource.updateMessage(failedMessage);
    }
  }

  Future<void> retryFailedMessage(MessageModel message) async {
    if (message.localId == null) return;

    final sendingMessage = message.copyWith(status: MessageStatus.sending);
    _addOrUpdateMessage(sendingMessage);

    final socket = ref.read(socketProvider);
    if (socket.isConnected) {
      socket.sendMessage({
        'conversationId': message.conversationId,
        'text': message.text,
        'localId': message.localId,
      });
    }
  }

  void sendTypingIndicator(String conversationId, bool isTyping) {
    _typingDebounce?.cancel();

    final socket = ref.read(socketProvider);
    socket.sendTyping(conversationId, isTyping);

    if (isTyping) {
      _typingDebounce = Timer(const Duration(seconds: 3), () {
        socket.sendTyping(conversationId, false);
      });
    }
  }

  Future<void> markMessagesAsRead(
    String conversationId,
    List<String> messageIds,
  ) async {
    if (messageIds.isEmpty) return;

    final socket = ref.read(socketProvider);
    socket.markMessagesRead(conversationId, messageIds);

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
      final existingIndex = messages.indexWhere(
        (m) =>
            m.id == newMessage.id ||
            (newMessage.localId != null && m.localId == newMessage.localId),
      );

      List<MessageModel> updatedMessages;
      if (existingIndex >= 0) {
        updatedMessages = List.from(messages);
        updatedMessages[existingIndex] = newMessage;
      } else {
        updatedMessages = [newMessage, ...messages];
      }

      updatedMessages.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      state = AsyncValue.data(updatedMessages);
    });
  }

  void _handleReadReceipt(Map<String, dynamic> data) {
    final messageIds = List<String>.from(data['messageIds'] ?? []);

    state.whenData((messages) {
      final updatedMessages = messages.map((msg) {
        if (messageIds.contains(msg.id)) {
          return msg.copyWith(isRead: true, status: MessageStatus.read);
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
final typingUsersProvider =
    StateNotifierProvider<TypingUsersNotifier, Set<String>>((ref) {
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
final conversationsProvider =
    StateNotifierProvider<
      ConversationsNotifier,
      AsyncValue<List<ConversationModel>>
    >((ref) {
      return ConversationsNotifier(ref);
    });

class ConversationsNotifier
    extends StateNotifier<AsyncValue<List<ConversationModel>>> {
  final Ref ref;

  ConversationsNotifier(this.ref) : super(const AsyncValue.loading());

  Future<void> loadConversations() async {
    try {
      final localDataSource = ref.read(localDataSourceProvider);
      final cached = await localDataSource.getCachedConversations();

      if (cached.isNotEmpty) {
        state = AsyncValue.data(cached);
      }

      final remoteDataSource = ref.read(remoteDataSourceProvider);
      final conversations = await remoteDataSource.getConversations();

      await localDataSource.cacheConversations(conversations);

      state = AsyncValue.data(conversations);
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }

  Future<ConversationModel> getOrCreateConversation({
    required String otherUserId,
    String? propertyId,
  }) async {
    try {
      final remoteDataSource = ref.read(remoteDataSourceProvider);
      final conversation = await remoteDataSource.getOrCreateConversation(
        otherUserId: otherUserId,
        propertyId: propertyId,
      );

      // Reload conversations to include the new/existing one
      await loadConversations();

      return conversation;
    } catch (error) {
      rethrow;
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
