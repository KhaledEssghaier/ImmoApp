import 'package:dio/dio.dart';
import '../models/search_result.dart';
import '../../../../core/models/property_model.dart';

abstract class SearchRemoteDataSource {
  Future<SearchResult> search({
    String? query,
    SearchFilters? filters,
    GeoSearch? geo,
    String? sort,
    int page = 1,
    int limit = 20,
  });

  Future<List<String>> getSuggestions(String query, {int limit = 10});

  Future<Property> getPropertyById(String id);

  Future<SearchResult> searchWithinPolygon({
    required List<Map<String, double>> polygon,
    SearchFilters? filters,
    String? sort,
    int page = 1,
    int limit = 20,
  });
}

class SearchRemoteDataSourceImpl implements SearchRemoteDataSource {
  final Dio dio;
  final String baseUrl;

  SearchRemoteDataSourceImpl({
    required this.dio,
    this.baseUrl = 'http://localhost:3007/api/v1',
  });

  @override
  Future<SearchResult> search({
    String? query,
    SearchFilters? filters,
    GeoSearch? geo,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      // Build request data, removing null values from filters
      final Map<String, dynamic> requestData = {
        if (sort != null) 'sort': sort,
        'page': page,
        'limit': limit,
      };

      if (query != null && query.isNotEmpty) {
        requestData['query'] = query;
      }

      if (filters != null) {
        final filterJson = filters.toJson();
        // Remove null values
        filterJson.removeWhere((key, value) => value == null);
        if (filterJson.isNotEmpty) {
          requestData['filters'] = filterJson;
        }
      }

      if (geo != null) {
        requestData['geo'] = geo.toJson();
      }

      final response = await dio.post('$baseUrl/search', data: requestData);

      return SearchResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<List<String>> getSuggestions(String query, {int limit = 10}) async {
    try {
      final response = await dio.get(
        '$baseUrl/search/suggest',
        queryParameters: {'q': query, 'limit': limit},
      );

      return List<String>.from(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<Property> getPropertyById(String id) async {
    try {
      final response = await dio.get('$baseUrl/search/$id');
      return Property.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  @override
  Future<SearchResult> searchWithinPolygon({
    required List<Map<String, double>> polygon,
    SearchFilters? filters,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await dio.post(
        '$baseUrl/search/polygon',
        data: {
          'polygon': polygon,
          if (filters != null) 'filters': filters.toJson(),
          if (sort != null) 'sort': sort,
          'page': page,
          'limit': limit,
        },
      );

      return SearchResult.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      final message = data is Map
          ? data['message'] ?? 'Unknown error'
          : 'Unknown error';
      return Exception('Search error: $message');
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return Exception('Search timeout. Please try again.');
    } else if (e.type == DioExceptionType.connectionError) {
      return Exception('No internet connection');
    }
    return Exception('Search failed: ${e.message}');
  }
}
