import 'package:json_annotation/json_annotation.dart';

part 'message_model.g.dart';

enum MessageStatus { sending, sent, delivered, read, failed }

@JsonSerializable()
class MessageModel {
  @JsonKey(name: '_id')
  final String? id;
  final String? localId;
  @JsonKey(name: 'chatId')
  final String conversationId;
  final String senderId;
  final String text;
  @JsonKey(name: 'images', defaultValue: [])
  final List<String> images;
  final bool? isRead;
  final bool? edited;
  final DateTime? editedAt;
  final DateTime createdAt;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final MessageStatus status;

  MessageModel({
    this.id,
    this.localId,
    required this.conversationId,
    required this.senderId,
    required this.text,
    this.images = const [],
    this.isRead,
    this.edited,
    this.editedAt,
    DateTime? createdAt,
    this.status = MessageStatus.sent,
  }) : createdAt = createdAt ?? DateTime.now();

  factory MessageModel.temporary({
    required String localId,
    required String conversationId,
    required String senderId,
    required String text,
    List<String> images = const [],
  }) {
    return MessageModel(
      localId: localId,
      conversationId: conversationId,
      senderId: senderId,
      text: text,
      images: images,
      createdAt: DateTime.now(),
      status: MessageStatus.sending,
    );
  }

  factory MessageModel.fromJson(Map<String, dynamic> json) =>
      _$MessageModelFromJson(json);

  Map<String, dynamic> toJson() => _$MessageModelToJson(this);

  MessageModel copyWith({
    String? id,
    String? localId,
    String? conversationId,
    String? senderId,
    String? text,
    List<String>? images,
    DateTime? createdAt,
    bool? isRead,
    bool? edited,
    DateTime? editedAt,
    MessageStatus? status,
  }) {
    return MessageModel(
      id: id ?? this.id,
      localId: localId ?? this.localId,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      text: text ?? this.text,
      images: images ?? this.images,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      edited: edited ?? this.edited,
      editedAt: editedAt ?? this.editedAt,
      status: status ?? this.status,
    );
  }
}
