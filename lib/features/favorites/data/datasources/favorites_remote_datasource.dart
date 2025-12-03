import 'package:dio/dio.dart';

class FavoritesRemoteDataSource {
  final Dio _dio;

  FavoritesRemoteDataSource(this._dio);

  /// Add a favorite
  Future<void> addFavorite(
    String propertyId, {
    String source = 'mobile',
  }) async {
    try {
      await _dio.post(
        '/favorites',
        data: {'propertyId': propertyId, 'source': source},
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Remove a favorite
  Future<void> removeFavorite(String propertyId) async {
    try {
      await _dio.delete('/favorites/$propertyId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get user favorite IDs (fast sync)
  Future<List<String>> getFavoriteIds() async {
    try {
      final response = await _dio.get('/favorites/ids');
      final data = response.data['data'] as List;
      return data.cast<String>();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get paginated favorites
  Future<Map<String, dynamic>> getFavorites({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/favorites',
        queryParameters: {'page': page, 'limit': limit},
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Sync favorites
  Future<Map<String, dynamic>> syncFavorites(
    List<String> propertyIds, {
    String source = 'mobile',
  }) async {
    try {
      final response = await _dio.post(
        '/favorites/sync',
        data: {'propertyIds': propertyIds, 'source': source},
      );
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Check if property is favorited
  Future<bool> isFavorited(String propertyId) async {
    try {
      final response = await _dio.get('/favorites/check/$propertyId');
      return response.data['data']['isFavorited'] as bool;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get property favorites count
  Future<int> getPropertyFavoritesCount(String propertyId) async {
    try {
      final response = await _dio.get(
        '/properties/$propertyId/favorites/count',
      );
      return response.data['data']['favoritesCount'] as int;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    if (e.response != null) {
      final statusCode = e.response!.statusCode;
      final message = e.response!.data?['message'] ?? 'Unknown error';

      // More specific error messages
      if (statusCode == 401) {
        return Exception('Unauthorized: Please log in to access favorites');
      } else if (statusCode == 404) {
        return Exception('Favorites API Error (404): $message');
      } else {
        return Exception('Favorites API Error ($statusCode): $message');
      }
    }
    return Exception('Network error: ${e.message}');
  }
}
