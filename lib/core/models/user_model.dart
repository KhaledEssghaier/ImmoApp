import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String? profileImage;
  final String? bio;
  final String? address;
  final String role;
  final bool isDeleted;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    this.profileImage,
    this.bio,
    this.address,
    required this.role,
    required this.isDeleted,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}
