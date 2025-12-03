// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
  id: json['id'] as String,
  fullName: json['fullName'] as String,
  email: json['email'] as String,
  phone: json['phone'] as String?,
  profileImage: json['profileImage'] as String?,
  bio: json['bio'] as String?,
  address: json['address'] as String?,
  role: json['role'] as String,
  isDeleted: json['isDeleted'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
  'id': instance.id,
  'fullName': instance.fullName,
  'email': instance.email,
  'phone': instance.phone,
  'profileImage': instance.profileImage,
  'bio': instance.bio,
  'address': instance.address,
  'role': instance.role,
  'isDeleted': instance.isDeleted,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
};
