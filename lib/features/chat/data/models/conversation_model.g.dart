// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
  id: json['id'] as String,
  name: json['name'] as String,
  avatarUrl: json['avatarUrl'] as String?,
  isOnline: json['isOnline'] as bool?,
);

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'avatarUrl': instance.avatarUrl,
  'isOnline': instance.isOnline,
};

LastMessagePreview _$LastMessagePreviewFromJson(Map<String, dynamic> json) =>
    LastMessagePreview(
      id: json['id'] as String?,
      conversationId: json['conversationId'] as String?,
      senderId: json['senderId'] as String?,
      text: json['text'] as String,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$LastMessagePreviewToJson(LastMessagePreview instance) =>
    <String, dynamic>{
      'id': instance.id,
      'conversationId': instance.conversationId,
      'senderId': instance.senderId,
      'text': instance.text,
      'createdAt': instance.createdAt?.toIso8601String(),
    };

ConversationModel _$ConversationModelFromJson(Map<String, dynamic> json) =>
    ConversationModel(
      id: json['id'] as String,
      otherUser: UserModel.fromJson(json['otherUser'] as Map<String, dynamic>),
      lastMessage: json['lastMessage'] == null
          ? null
          : LastMessagePreview.fromJson(
              json['lastMessage'] as Map<String, dynamic>,
            ),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$ConversationModelToJson(ConversationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'otherUser': instance.otherUser,
      'lastMessage': instance.lastMessage,
      'unreadCount': instance.unreadCount,
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
