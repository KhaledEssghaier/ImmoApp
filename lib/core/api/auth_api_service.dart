import 'package:dio/dio.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';
import 'dio_client.dart';

class AuthApiService {
  final DioClient _dioClient;

  AuthApiService(this._dioClient);

  // Signup
  Future<AuthResponse> signup({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        '/auth/signup',
        data: {
          'email': email,
          'password': password,
          'fullName': fullName,
          if (phone != null) 'phone': phone,
        },
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Login
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dioClient.dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Get current user profile
  Future<UserModel> getMe() async {
    try {
      final response = await _dioClient.dio.get('/users/me');
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Refresh token
  Future<AuthResponse> refreshToken(String refreshToken) async {
    try {
      final response = await _dioClient.dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      return AuthResponse.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Logout
  Future<void> logout(String refreshToken) async {
    try {
      await _dioClient.dio.post(
        '/auth/logout',
        data: {'refreshToken': refreshToken},
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Error handler
  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map && data.containsKey('message')) {
        return data['message'];
      }
      return 'Request failed with status: ${error.response!.statusCode}';
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return 'Connection timeout. Please try again.';
    }

    if (error.type == DioExceptionType.connectionError) {
      return 'No internet connection. Please check your network.';
    }

    return 'An unexpected error occurred';
  }
}
