import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/message_model.dart';
import '../models/conversation_model.dart';

class ChatLocalDataSource {
  static Database? _database;

  Future<Database?> get database async {
    // Skip database on web platform
    if (kIsWeb) return null;

    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  Future<Database> _initDB() async {
    final path = join(await getDatabasesPath(), 'chat.db');
    return await openDatabase(path, version: 1, onCreate: _createDB);
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        localId TEXT,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        text TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        status TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE pending_messages (
        localId TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        text TEXT NOT NULL,
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE conversations_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_messages_conversation ON messages(conversationId)
    ''');
  }

  // Messages
  Future<void> insertMessage(MessageModel message) async {
    final db = await database;
    if (db == null) return; // Skip on web

    await db.insert('messages', {
      'id': message.id,
      'localId': message.localId,
      'conversationId': message.conversationId,
      'senderId': message.senderId,
      'text': message.text,
      'createdAt': message.createdAt.toIso8601String(),
      'status': message.status.name,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updateMessage(MessageModel message) async {
    final db = await database;
    if (db == null) return; // Skip on web

    await db.update(
      'messages',
      {'id': message.id, 'status': message.status.name},
      where: 'localId = ? OR id = ?',
      whereArgs: [message.localId, message.id],
    );
  }

  Future<List<MessageModel>> getMessages(
    String conversationId, {
    String? before,
    int limit = 50,
  }) async {
    final db = await database;
    if (db == null) return []; // Skip on web

    String whereClause = 'conversationId = ?';
    List<dynamic> whereArgs = [conversationId];

    if (before != null) {
      whereClause +=
          ' AND createdAt < (SELECT createdAt FROM messages WHERE id = ?)';
      whereArgs.add(before);
    }

    final maps = await db.query(
      'messages',
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: 'createdAt DESC',
      limit: limit,
    );

    return maps.map((map) {
      return MessageModel(
        id: map['id'] as String?,
        localId: map['localId'] as String?,
        conversationId: map['conversationId'] as String,
        senderId: map['senderId'] as String,
        text: map['text'] as String,
        createdAt: DateTime.parse(map['createdAt'] as String),
        status: MessageStatus.values.firstWhere(
          (e) => e.name == map['status'],
          orElse: () => MessageStatus.sent,
        ),
      );
    }).toList();
  }

  // Pending messages (offline queue)
  Future<void> addPendingMessage(
    String localId,
    String conversationId,
    String text,
    List<String> images,
  ) async {
    final db = await database;
    if (db == null) return; // Skip on web

    await db.insert('pending_messages', {
      'localId': localId,
      'conversationId': conversationId,
      'text': text,
      'createdAt': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getPendingMessages() async {
    final db = await database;
    if (db == null) return []; // Skip on web

    return await db.query('pending_messages', orderBy: 'createdAt ASC');
  }

  Future<void> deletePendingMessage(String localId) async {
    final db = await database;
    if (db == null) return; // Skip on web

    await db.delete(
      'pending_messages',
      where: 'localId = ?',
      whereArgs: [localId],
    );
  }

  Future<void> incrementRetryCount(String localId) async {
    final db = await database;
    if (db == null) return; // Skip on web

    await db.rawUpdate(
      'UPDATE pending_messages SET retryCount = retryCount + 1 WHERE localId = ?',
      [localId],
    );
  }

  // Conversations cache
  Future<void> cacheConversations(List<ConversationModel> conversations) async {
    final db = await database;
    if (db == null) return; // Skip on web

    final batch = db.batch();

    for (final conv in conversations) {
      batch.insert('conversations_cache', {
        'id': conv.id,
        'data': conv.toJson().toString(),
        'updatedAt': DateTime.now().toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }

    await batch.commit();
  }

  Future<List<ConversationModel>> getCachedConversations() async {
    final db = await database;
    if (db == null) return []; // Skip on web
    return [];
  }
}
