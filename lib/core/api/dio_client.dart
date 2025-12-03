import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';

class DioClient {
  static const String baseUrl = 'http://localhost:3000/api/v1';

  final Dio _dio;
  final SecureStorageService _storageService;

  // Cache token to avoid repeated storage reads
  String? _cachedAccessToken;
  DateTime? _lastTokenFetch;
  static const Duration _tokenCacheDuration = Duration(seconds: 5);

  DioClient(this._storageService)
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      ) {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add access token to all requests (with caching)
          final accessToken = await _getCachedAccessToken();
          print('[DioClient] 🔐 Request to: ${options.method} ${options.uri}');
          print(
            '[DioClient] 🔑 Access token: ${accessToken != null ? "Present (${accessToken.substring(0, 20)}...)" : "MISSING"}',
          );
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 unauthorized - try to refresh token
          if (error.response?.statusCode == 401) {
            try {
              final refreshToken = await _storageService.getRefreshToken();
              if (refreshToken != null) {
                // Try to refresh the token
                final response = await _dio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                if (response.statusCode == 200) {
                  // Save new tokens and update cache
                  final newAccessToken = response.data['accessToken'];
                  final newRefreshToken = response.data['refreshToken'];
                  await _storageService.saveTokens(
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                  );
                  _cachedAccessToken = newAccessToken;
                  _lastTokenFetch = DateTime.now();

                  // Retry the original request
                  final options = error.requestOptions;
                  options.headers['Authorization'] = 'Bearer $newAccessToken';
                  final retryResponse = await _dio.fetch(options);
                  return handler.resolve(retryResponse);
                }
              }
            } catch (e) {
              // Refresh failed, clear tokens
              await _storageService.clearTokens();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Get access token with caching to avoid repeated storage reads
  Future<String?> _getCachedAccessToken() async {
    final now = DateTime.now();

    // Return cached token if still valid
    if (_cachedAccessToken != null &&
        _lastTokenFetch != null &&
        now.difference(_lastTokenFetch!) < _tokenCacheDuration) {
      return _cachedAccessToken;
    }

    // Fetch from storage and update cache
    _cachedAccessToken = await _storageService.getAccessToken();
    _lastTokenFetch = now;
    return _cachedAccessToken;
  }

  // Invalidate token cache (call this after login/logout)
  void invalidateTokenCache() {
    _cachedAccessToken = null;
    _lastTokenFetch = null;
  }

  Dio get dio => _dio;
}
