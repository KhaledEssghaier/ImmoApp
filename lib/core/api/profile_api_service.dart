import 'dio_client.dart';

class ProfileApiService {
  final DioClient _dioClient;

  ProfileApiService(this._dioClient) {
    print('[ProfileAPI] Initialized with DioClient: $_dioClient');
  }

  Future<Map<String, dynamic>> getProfile() async {
    print('[ProfileAPI] Getting profile... DioClient: $_dioClient');
    final dio = _dioClient.dio;
    print('[ProfileAPI] Got dio instance: $dio');
    final response = await dio.get('/users/me');
    print('[ProfileAPI] Get Profile Response: ${response.statusCode}');
    return response.data;
  }

  Future<Map<String, dynamic>> updateProfile({
    String? fullName,
    String? email,
    String? phone,
    String? profileImage,
    String? bio,
    String? address,
  }) async {
    final Map<String, dynamic> body = {};
    if (fullName != null) body['fullName'] = fullName;
    if (email != null) body['email'] = email;
    if (phone != null) body['phone'] = phone;
    if (profileImage != null) body['profileImage'] = profileImage;
    if (bio != null) body['bio'] = bio;
    if (address != null) body['address'] = address;

    print('[ProfileAPI] Update Profile Request Body: $body');

    final dio = _dioClient.dio;
    final response = await dio.put(
      '/users/me',
      data: body,
    );

    print('[ProfileAPI] Update Profile Response: ${response.statusCode}');
    return response.data;
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _dioClient.dio.post(
      '/users/me/change-password',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );

    print('[ProfileAPI] Change Password Response: ${response.statusCode}');
    
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception(response.data['message'] ?? 'Failed to change password');
    }
  }
}
