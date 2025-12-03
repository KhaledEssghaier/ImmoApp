# Flutter Chat Client - Complete Implementation Guide

## 📦 Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  
  # Socket.IO
  socket_io_client: ^2.0.3
  
  # Storage
  flutter_secure_storage: ^9.0.0
  sqflite: ^2.3.0
  path_provider: ^2.1.1
  
  # Network
  dio: ^5.4.0
  connectivity_plus: ^5.0.2
  
  # Utilities
  uuid: ^4.2.1
  intl: ^0.18.1
  
  # UI
  cached_network_image: ^3.3.1
  image_picker: ^1.0.5
```

Run: `flutter pub get`

---

## 🏗️ Project Structure

```
lib/
├── features/
│   └── chat/
│       ├── data/
│       │   ├── datasources/
│       │   │   ├── chat_local_datasource.dart
│       │   │   ├── chat_remote_datasource.dart
│       │   │   └── chat_socket_datasource.dart
│       │   ├── models/
│       │   │   ├── message_model.dart
│       │   │   ├── conversation_model.dart
│       │   │   └── attachment_model.dart
│       │   └── repositories/
│       │       └── chat_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── message.dart
│       │   │   └── conversation.dart
│       │   └── repositories/
│       │       └── chat_repository.dart
│       └── presentation/
│           ├── providers/
│           │   ├── socket_provider.dart
│           │   ├── chat_provider.dart
│           │   └── connectivity_provider.dart
│           ├── screens/
│           │   ├── conversations_screen.dart
│           │   └── chat_screen.dart
│           └── widgets/
│               ├── message_bubble.dart
│               ├── typing_indicator.dart
│               └── chat_input.dart
└── core/
    ├── constants/
    │   └── api_constants.dart
    ├── database/
    │   └── app_database.dart
    └── utils/
        └── connection_manager.dart
```

---

## 1️⃣ API Constants

**File: `lib/core/constants/api_constants.dart`**

```dart
class ApiConstants {
  static const String baseUrl = 'http://localhost:3000/api/v1';
  static const String socketUrl = 'http://localhost:3005';
  static const String socketNamespace = '/chat';
  
  // Endpoints
  static const String conversations = '/conversations';
  static String conversationMessages(String id) => '/conversations/$id/messages';
  static String markRead(String id) => '/conversations/$id/messages/mark-read';
  
  // Socket Events
  static const String eventConnect = 'connect';
  static const String eventDisconnect = 'disconnect';
  static const String eventJoinConversation = 'join_conversation';
  static const String eventLeaveConversation = 'leave_conversation';
  static const String eventMessageSend = 'message_send';
  static const String eventMessageNew = 'message_new';
  static const String eventMessageEdit = 'message_edit';
  static const String eventMessageUpdated = 'message_updated';
  static const String eventMessageDelete = 'message_delete';
  static const String eventMessageDeleted = 'message_deleted';
  static const String eventMessageRead = 'message_read';
  static const String eventMessageReadUpdate = 'message_read_update';
  static const String eventTyping = 'typing';
  static const String eventPresenceSubscribe = 'presence_subscribe';
  static const String eventPresenceUpdate = 'presence_update';
  static const String eventError = 'error';
}
```

---

## 2️⃣ Local Database Setup

**File: `lib/core/database/app_database.dart`**

```dart
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class AppDatabase {
  static final AppDatabase instance = AppDatabase._init();
  static Database? _database;

  AppDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('chat.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Messages table
    await db.execute('''
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        text TEXT NOT NULL,
        localId TEXT,
        status TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        isEdited INTEGER DEFAULT 0,
        editedAt INTEGER,
        readBy TEXT,
        attachments TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversations (id)
      )
    ''');

    // Pending messages queue
    await db.execute('''
      CREATE TABLE pending_messages (
        localId TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        text TEXT NOT NULL,
        attachments TEXT,
        retryCount INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL
      )
    ''');

    // Conversations cache
    await db.execute('''
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        participantIds TEXT NOT NULL,
        lastMessage TEXT,
        unreadCount INTEGER DEFAULT 0,
        updatedAt INTEGER NOT NULL
      )
    ''');

    // Typing indicators
    await db.execute('''
      CREATE TABLE typing_indicators (
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (conversationId, userId)
      )
    ''');

    // Create indexes
    await db.execute('CREATE INDEX idx_messages_conversation ON messages(conversationId, createdAt DESC)');
    await db.execute('CREATE INDEX idx_messages_status ON messages(status)');
    await db.execute('CREATE INDEX idx_pending_created ON pending_messages(createdAt ASC)');
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
```

---

## 3️⃣ Data Models

**File: `lib/features/chat/data/models/message_model.dart`**

```dart
import 'dart:convert';

enum MessageStatus {
  sending,   // Optimistic UI - being sent
  sent,      // Delivered to server
  failed,    // Send failed
  delivered, // Delivered to recipient
  read,      // Read by recipient
}

class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String text;
  final String? localId;
  final MessageStatus status;
  final DateTime createdAt;
  final bool isEdited;
  final DateTime? editedAt;
  final List<String> readBy;
  final List<AttachmentModel> attachments;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.text,
    this.localId,
    required this.status,
    required this.createdAt,
    this.isEdited = false,
    this.editedAt,
    this.readBy = const [],
    this.attachments = const [],
  });

  // Create temporary message for optimistic UI
  factory MessageModel.temporary({
    required String localId,
    required String conversationId,
    required String senderId,
    required String text,
    List<AttachmentModel> attachments = const [],
  }) {
    return MessageModel(
      id: localId, // Use localId as temp ID
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      localId: localId,
      status: MessageStatus.sending,
      createdAt: DateTime.now(),
      attachments: attachments,
    );
  }

  // From JSON (server response)
  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'] ?? json['id'],
      conversationId: json['conversationId'],
      senderId: json['senderId'],
      text: json['text'],
      localId: json['localId'],
      status: _parseStatus(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      isEdited: json['meta']?['edited'] ?? false,
      editedAt: json['meta']?['editedAt'] != null
          ? DateTime.parse(json['meta']['editedAt'])
          : null,
      readBy: List<String>.from(json['readBy'] ?? []),
      attachments: (json['attachments'] as List?)
              ?.map((a) => AttachmentModel.fromJson(a))
              .toList() ??
          [],
    );
  }

  // To JSON (for sending)
  Map<String, dynamic> toJson() {
    return {
      'conversationId': conversationId,
      'text': text,
      'localId': localId,
      'attachments': attachments.map((a) => a.toJson()).toList(),
    };
  }

  // To SQLite
  Map<String, dynamic> toDb() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'text': text,
      'localId': localId,
      'status': status.name,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'isEdited': isEdited ? 1 : 0,
      'editedAt': editedAt?.millisecondsSinceEpoch,
      'readBy': jsonEncode(readBy),
      'attachments': jsonEncode(attachments.map((a) => a.toJson()).toList()),
    };
  }

  // From SQLite
  factory MessageModel.fromDb(Map<String, dynamic> map) {
    return MessageModel(
      id: map['id'],
      conversationId: map['conversationId'],
      senderId: map['senderId'],
      text: map['text'],
      localId: map['localId'],
      status: MessageStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => MessageStatus.sent,
      ),
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt']),
      isEdited: map['isEdited'] == 1,
      editedAt: map['editedAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['editedAt'])
          : null,
      readBy: List<String>.from(jsonDecode(map['readBy'] ?? '[]')),
      attachments: (jsonDecode(map['attachments'] ?? '[]') as List)
          .map((a) => AttachmentModel.fromJson(a))
          .toList(),
    );
  }

  static MessageStatus _parseStatus(String? status) {
    switch (status) {
      case 'sending':
        return MessageStatus.sending;
      case 'sent':
        return MessageStatus.sent;
      case 'failed':
        return MessageStatus.failed;
      case 'delivered':
        return MessageStatus.delivered;
      case 'read':
        return MessageStatus.read;
      default:
        return MessageStatus.sent;
    }
  }

  MessageModel copyWith({
    String? id,
    MessageStatus? status,
    List<String>? readBy,
    bool? isEdited,
    DateTime? editedAt,
  }) {
    return MessageModel(
      id: id ?? this.id,
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      localId: localId,
      status: status ?? this.status,
      createdAt: createdAt,
      isEdited: isEdited ?? this.isEdited,
      editedAt: editedAt ?? this.editedAt,
      readBy: readBy ?? this.readBy,
      attachments: attachments,
    );
  }
}

class AttachmentModel {
  final String mediaId;
  final String url;
  final String? filename;
  final String? mimeType;
  final int? size;

  AttachmentModel({
    required this.mediaId,
    required this.url,
    this.filename,
    this.mimeType,
    this.size,
  });

  factory AttachmentModel.fromJson(Map<String, dynamic> json) {
    return AttachmentModel(
      mediaId: json['mediaId'],
      url: json['url'],
      filename: json['filename'],
      mimeType: json['mimeType'],
      size: json['size'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'mediaId': mediaId,
      'url': url,
      if (filename != null) 'filename': filename,
      if (mimeType != null) 'mimeType': mimeType,
      if (size != null) 'size': size,
    };
  }
}
```

**File: `lib/features/chat/data/models/conversation_model.dart`**

```dart
class ConversationModel {
  final String id;
  final List<String> participantIds;
  final String? propertyId;
  final LastMessageModel? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    required this.participantIds,
    this.propertyId,
    this.lastMessage,
    this.unreadCount = 0,
    required this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['_id'] ?? json['id'],
      participantIds: List<String>.from(json['participantIds']),
      propertyId: json['propertyId'],
      lastMessage: json['lastMessage'] != null
          ? LastMessageModel.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toDb() {
    return {
      'id': id,
      'participantIds': participantIds.join(','),
      'lastMessage': lastMessage != null
          ? '${lastMessage!.text}|${lastMessage!.senderId}'
          : null,
      'unreadCount': unreadCount,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
    };
  }

  factory ConversationModel.fromDb(Map<String, dynamic> map) {
    final lastMsgParts = map['lastMessage']?.split('|');
    return ConversationModel(
      id: map['id'],
      participantIds: (map['participantIds'] as String).split(','),
      unreadCount: map['unreadCount'] ?? 0,
      updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updatedAt']),
      lastMessage: lastMsgParts != null
          ? LastMessageModel(
              text: lastMsgParts[0],
              senderId: lastMsgParts[1],
              createdAt: DateTime.fromMillisecondsSinceEpoch(map['updatedAt']),
            )
          : null,
    );
  }

  ConversationModel copyWith({
    LastMessageModel? lastMessage,
    int? unreadCount,
  }) {
    return ConversationModel(
      id: id,
      participantIds: participantIds,
      propertyId: propertyId,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      updatedAt: DateTime.now(),
    );
  }
}

class LastMessageModel {
  final String text;
  final String senderId;
  final DateTime createdAt;

  LastMessageModel({
    required this.text,
    required this.senderId,
    required this.createdAt,
  });

  factory LastMessageModel.fromJson(Map<String, dynamic> json) {
    return LastMessageModel(
      text: json['text'],
      senderId: json['senderId'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

---

## 4️⃣ Socket Service

**File: `lib/features/chat/data/datasources/chat_socket_datasource.dart`**

```dart
import 'dart:async';
import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/constants/api_constants.dart';

class ChatSocketDataSource {
  IO.Socket? _socket;
  final _storage = const FlutterSecureStorage();
  final _connectionController = StreamController<ConnectionState>.broadcast();
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _presenceController = StreamController<Map<String, dynamic>>.broadcast();
  final _readReceiptController = StreamController<Map<String, dynamic>>.broadcast();
  
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  bool _intentionalDisconnect = false;

  Stream<ConnectionState> get connectionStream => _connectionController.stream;
  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingController.stream;
  Stream<Map<String, dynamic>> get presenceStream => _presenceController.stream;
  Stream<Map<String, dynamic>> get readReceiptStream => _readReceiptController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket?.connected == true) return;

    _intentionalDisconnect = false;
    final token = await _storage.read(key: 'access_token');
    
    if (token == null) {
      log('❌ No access token found');
      return;
    }

    final socketUrl = '${ApiConstants.socketUrl}${ApiConstants.socketNamespace}';
    
    _socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .setReconnectionAttempts(5)
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .setAuth({'token': token})
          .build(),
    );

    _setupListeners();
    _socket!.connect();
    
    log('🔌 Connecting to $socketUrl');
  }

  void _setupListeners() {
    _socket!.onConnect((_) {
      log('✅ Socket connected');
      _reconnectAttempts = 0;
      _connectionController.add(ConnectionState.connected);
    });

    _socket!.onDisconnect((_) {
      log('🔌 Socket disconnected');
      _connectionController.add(ConnectionState.disconnected);
      
      if (!_intentionalDisconnect) {
        _scheduleReconnect();
      }
    });

    _socket!.onConnectError((error) {
      log('❌ Connection error: $error');
      _connectionController.add(ConnectionState.error);
      _scheduleReconnect();
    });

    // Message events
    _socket!.on(ApiConstants.eventMessageNew, (data) {
      log('💬 New message: $data');
      _messageController.add(data as Map<String, dynamic>);
    });

    _socket!.on(ApiConstants.eventMessageUpdated, (data) {
      log('✏️ Message updated: $data');
      _messageController.add(data as Map<String, dynamic>);
    });

    _socket!.on(ApiConstants.eventMessageDeleted, (data) {
      log('🗑️ Message deleted: $data');
      _messageController.add(data as Map<String, dynamic>);
    });

    // Typing events
    _socket!.on(ApiConstants.eventTyping, (data) {
      log('⌨️ Typing: $data');
      _typingController.add(data as Map<String, dynamic>);
    });

    // Read receipts
    _socket!.on(ApiConstants.eventMessageReadUpdate, (data) {
      log('✅ Read receipt: $data');
      _readReceiptController.add(data as Map<String, dynamic>);
    });

    // Presence
    _socket!.on(ApiConstants.eventPresenceUpdate, (data) {
      log('👤 Presence: $data');
      _presenceController.add(data as Map<String, dynamic>);
    });

    // Errors
    _socket!.on(ApiConstants.eventError, (error) {
      log('❌ Socket error: $error');
    });

    // Room events
    _socket!.on('joined_conversation', (data) {
      log('📥 Joined conversation: $data');
    });
  }

  void _scheduleReconnect() {
    if (_intentionalDisconnect) return;
    
    _reconnectTimer?.cancel();
    _reconnectAttempts++;
    
    // Exponential backoff: 2^attempts seconds, max 30 seconds
    final delay = Duration(
      seconds: (2 << _reconnectAttempts).clamp(2, 30),
    );
    
    log('⏳ Reconnecting in ${delay.inSeconds}s (attempt $_reconnectAttempts)');
    _connectionController.add(ConnectionState.reconnecting);
    
    _reconnectTimer = Timer(delay, () {
      if (!_intentionalDisconnect && _socket?.connected != true) {
        connect();
      }
    });
  }

  // Join conversation room
  void joinConversation(String conversationId) {
    if (!isConnected) return;
    _socket!.emit(ApiConstants.eventJoinConversation, {
      'conversationId': conversationId,
    });
    log('📥 Joining conversation: $conversationId');
  }

  // Leave conversation room
  void leaveConversation(String conversationId) {
    if (!isConnected) return;
    _socket!.emit(ApiConstants.eventLeaveConversation, {
      'conversationId': conversationId,
    });
    log('📤 Leaving conversation: $conversationId');
  }

  // Send message
  void sendMessage(Map<String, dynamic> message) {
    if (!isConnected) {
      log('❌ Cannot send message: not connected');
      return;
    }
    _socket!.emit(ApiConstants.eventMessageSend, message);
    log('📤 Sending message: ${message['localId']}');
  }

  // Send typing indicator
  void sendTyping(String conversationId, bool isTyping) {
    if (!isConnected) return;
    _socket!.emit(ApiConstants.eventTyping, {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  // Mark messages as read
  void markMessagesRead(String conversationId, List<String> messageIds) {
    if (!isConnected) return;
    _socket!.emit(ApiConstants.eventMessageRead, {
      'conversationId': conversationId,
      'messageIds': messageIds,
    });
    log('✅ Marking ${messageIds.length} messages as read');
  }

  // Subscribe to presence
  void subscribeToPresence(String userId) {
    if (!isConnected) return;
    _socket!.emit(ApiConstants.eventPresenceSubscribe, {
      'userId': userId,
    });
  }

  void disconnect() {
    _intentionalDisconnect = true;
    _reconnectTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    log('🔌 Intentionally disconnected');
  }

  void dispose() {
    disconnect();
    _connectionController.close();
    _messageController.close();
    _typingController.close();
    _presenceController.close();
    _readReceiptController.close();
  }
}

enum ConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error,
}
```

---

## 5️⃣ Local Data Source

**File: `lib/features/chat/data/datasources/chat_local_datasource.dart`**

```dart
import 'package:sqflite/sqflite.dart';
import '../../../../core/database/app_database.dart';
import '../models/message_model.dart';
import '../models/conversation_model.dart';

class ChatLocalDataSource {
  Future<Database> get _db async => await AppDatabase.instance.database;

  // ==================== MESSAGES ====================

  Future<void> insertMessage(MessageModel message) async {
    final db = await _db;
    await db.insert(
      'messages',
      message.toDb(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> updateMessage(MessageModel message) async {
    final db = await _db;
    await db.update(
      'messages',
      message.toDb(),
      where: 'id = ? OR localId = ?',
      whereArgs: [message.id, message.localId],
    );
  }

  Future<void> deleteMessage(String messageId) async {
    final db = await _db;
    await db.delete('messages', where: 'id = ?', whereArgs: [messageId]);
  }

  Future<List<MessageModel>> getMessages(
    String conversationId, {
    int limit = 50,
    String? before,
  }) async {
    final db = await _db;
    
    String whereClause = 'conversationId = ?';
    List<dynamic> whereArgs = [conversationId];
    
    if (before != null) {
      whereClause += ' AND createdAt < (SELECT createdAt FROM messages WHERE id = ?)';
      whereArgs.add(before);
    }
    
    final List<Map<String, dynamic>> maps = await db.query(
      'messages',
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: 'createdAt DESC',
      limit: limit,
    );

    return maps.map((map) => MessageModel.fromDb(map)).toList();
  }

  Future<MessageModel?> getMessageByLocalId(String localId) async {
    final db = await _db;
    final maps = await db.query(
      'messages',
      where: 'localId = ?',
      whereArgs: [localId],
      limit: 1,
    );
    
    if (maps.isEmpty) return null;
    return MessageModel.fromDb(maps.first);
  }

  // Replace temporary message with server message
  Future<void> replaceTemporaryMessage(
    String localId,
    MessageModel serverMessage,
  ) async {
    final db = await _db;
    await db.delete('messages', where: 'localId = ?', whereArgs: [localId]);
    await insertMessage(serverMessage);
  }

  // ==================== PENDING MESSAGES ====================

  Future<void> addPendingMessage(
    String localId,
    String conversationId,
    String text,
    List<AttachmentModel> attachments,
  ) async {
    final db = await _db;
    await db.insert('pending_messages', {
      'localId': localId,
      'conversationId': conversationId,
      'text': text,
      'attachments': attachments.map((a) => a.toJson()).toString(),
      'retryCount': 0,
      'createdAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingMessages() async {
    final db = await _db;
    return await db.query(
      'pending_messages',
      orderBy: 'createdAt ASC',
    );
  }

  Future<void> deletePendingMessage(String localId) async {
    final db = await _db;
    await db.delete('pending_messages', where: 'localId = ?', whereArgs: [localId]);
  }

  Future<void> incrementRetryCount(String localId) async {
    final db = await _db;
    await db.rawUpdate(
      'UPDATE pending_messages SET retryCount = retryCount + 1 WHERE localId = ?',
      [localId],
    );
  }

  // ==================== CONVERSATIONS ====================

  Future<void> cacheConversations(List<ConversationModel> conversations) async {
    final db = await _db;
    final batch = db.batch();
    
    for (final conv in conversations) {
      batch.insert(
        'conversations',
        conv.toDb(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    
    await batch.commit(noResult: true);
  }

  Future<List<ConversationModel>> getCachedConversations() async {
    final db = await _db;
    final maps = await db.query(
      'conversations',
      orderBy: 'updatedAt DESC',
    );
    
    return maps.map((map) => ConversationModel.fromDb(map)).toList();
  }

  Future<void> updateConversationUnreadCount(
    String conversationId,
    int count,
  ) async {
    final db = await _db;
    await db.update(
      'conversations',
      {'unreadCount': count},
      where: 'id = ?',
      whereArgs: [conversationId],
    );
  }

  // ==================== TYPING INDICATORS ====================

  Future<void> setTypingIndicator(
    String conversationId,
    String userId,
  ) async {
    final db = await _db;
    await db.insert(
      'typing_indicators',
      {
        'conversationId': conversationId,
        'userId': userId,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> clearTypingIndicator(
    String conversationId,
    String userId,
  ) async {
    final db = await _db;
    await db.delete(
      'typing_indicators',
      where: 'conversationId = ? AND userId = ?',
      whereArgs: [conversationId, userId],
    );
  }

  Future<List<String>> getTypingUsers(String conversationId) async {
    final db = await _db;
    
    // Delete old typing indicators (>5 seconds)
    await db.delete(
      'typing_indicators',
      where: 'conversationId = ? AND timestamp < ?',
      whereArgs: [
        conversationId,
        DateTime.now().subtract(Duration(seconds: 5)).millisecondsSinceEpoch,
      ],
    );
    
    final maps = await db.query(
      'typing_indicators',
      where: 'conversationId = ?',
      whereArgs: [conversationId],
    );
    
    return maps.map((m) => m['userId'] as String).toList();
  }

  // ==================== CLEANUP ====================

  Future<void> clearOldMessages(int daysToKeep) async {
    final db = await _db;
    final cutoff = DateTime.now()
        .subtract(Duration(days: daysToKeep))
        .millisecondsSinceEpoch;
    
    await db.delete(
      'messages',
      where: 'createdAt < ?',
      whereArgs: [cutoff],
    );
  }
}
```

---

**(Continued in next response due to length...)**

Would you like me to continue with:
1. Remote Data Source (REST API)
2. Riverpod Providers
3. UI Screens & Widgets
4. Connection Manager & Offline Queue
5. Complete usage examples