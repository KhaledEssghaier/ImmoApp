// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MessageModel _$MessageModelFromJson(Map<String, dynamic> json) => MessageModel(
  id: json['_id'] as String?,
  localId: json['localId'] as String?,
  conversationId: json['chatId'] as String,
  senderId: json['senderId'] as String,
  text: json['text'] as String,
  images:
      (json['images'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      [],
  isRead: json['isRead'] as bool?,
  edited: json['edited'] as bool?,
  editedAt: json['editedAt'] == null
      ? null
      : DateTime.parse(json['editedAt'] as String),
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$MessageModelToJson(MessageModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'localId': instance.localId,
      'chatId': instance.conversationId,
      'senderId': instance.senderId,
      'text': instance.text,
      'images': instance.images,
      'isRead': instance.isRead,
      'edited': instance.edited,
      'editedAt': instance.editedAt?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
    };
