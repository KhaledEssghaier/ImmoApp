import 'package:json_annotation/json_annotation.dart';

part 'conversation_model.g.dart';

@JsonSerializable()
class UserModel {
  final String id;
  final String name;
  final String? avatarUrl;
  final bool? isOnline;

  UserModel({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.isOnline,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    try {
      // Handle null values gracefully with fallbacks
      final id = json['id'] as String? ?? 'unknown';
      final name = json['name'] as String? ?? 'Unknown User';

      return UserModel(
        id: id,
        name: name,
        avatarUrl: json['avatarUrl'] as String?,
        isOnline: json['isOnline'] as bool?,
      );
    } catch (e) {
      print('⚠️ Error parsing UserModel: $e, json: $json');
      // Return a safe fallback user
      return UserModel(
        id: json['id']?.toString() ?? 'unknown',
        name: json['name']?.toString() ?? 'Unknown User',
        avatarUrl: null,
        isOnline: false,
      );
    }
  }

  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}

@JsonSerializable()
class LastMessagePreview {
  final String? id;
  final String? conversationId;
  final String? senderId;
  final String text;
  final DateTime? createdAt;

  LastMessagePreview({
    this.id,
    this.conversationId,
    this.senderId,
    required this.text,
    this.createdAt,
  });

  factory LastMessagePreview.fromJson(Map<String, dynamic> json) {
    try {
      return LastMessagePreview(
        id: json['id'] as String?,
        conversationId: json['conversationId'] as String?,
        senderId: json['senderId'] as String?,
        text: json['text'] as String? ?? '',
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'] as String)
            : null,
      );
    } catch (e) {
      print('⚠️ Error parsing LastMessagePreview: $e, json: $json');
      return LastMessagePreview(
        id: json['id']?.toString(),
        conversationId: json['conversationId']?.toString(),
        senderId: json['senderId']?.toString(),
        text: json['text']?.toString() ?? '',
        createdAt: null,
      );
    }
  }

  Map<String, dynamic> toJson() => _$LastMessagePreviewToJson(this);
}

@JsonSerializable()
class ConversationModel {
  final String id;
  final UserModel otherUser;
  final LastMessagePreview? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    required this.otherUser,
    this.lastMessage,
    this.unreadCount = 0,
    DateTime? updatedAt,
  }) : updatedAt = updatedAt ?? DateTime.now();

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    try {
      return ConversationModel(
        id: json['id'] as String? ?? 'unknown',
        otherUser: UserModel.fromJson(
          json['otherUser'] as Map<String, dynamic>? ?? {},
        ),
        lastMessage: json['lastMessage'] != null
            ? LastMessagePreview.fromJson(
                json['lastMessage'] as Map<String, dynamic>,
              )
            : null,
        unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'] as String)
            : DateTime.now(),
      );
    } catch (e) {
      print('⚠️ Error parsing ConversationModel: $e, json: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() => _$ConversationModelToJson(this);

  ConversationModel copyWith({
    String? id,
    UserModel? otherUser,
    LastMessagePreview? lastMessage,
    int? unreadCount,
    DateTime? updatedAt,
  }) {
    return ConversationModel(
      id: id ?? this.id,
      otherUser: otherUser ?? this.otherUser,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
