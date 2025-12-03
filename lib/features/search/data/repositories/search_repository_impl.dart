import '../datasources/search_remote_datasource.dart';
import '../models/search_result.dart';
import '../../../../core/models/property_model.dart';

abstract class SearchRepository {
  Future<SearchResult> search({
    String? query,
    SearchFilters? filters,
    GeoSearch? geo,
    String? sort,
    int page = 1,
    int limit = 20,
  });

  Future<List<String>> getSuggestions(String query);
  Future<Property> getPropertyById(String id);

  Future<SearchResult> searchWithinPolygon({
    required List<Map<String, double>> polygon,
    SearchFilters? filters,
    String? sort,
    int page = 1,
    int limit = 20,
  });
}

class SearchRepositoryImpl implements SearchRepository {
  final SearchRemoteDataSource remoteDataSource;

  SearchRepositoryImpl({required this.remoteDataSource});

  @override
  Future<SearchResult> search({
    String? query,
    SearchFilters? filters,
    GeoSearch? geo,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    return await remoteDataSource.search(
      query: query,
      filters: filters,
      geo: geo,
      sort: sort,
      page: page,
      limit: limit,
    );
  }

  @override
  Future<List<String>> getSuggestions(String query) async {
    return await remoteDataSource.getSuggestions(query);
  }

  @override
  Future<Property> getPropertyById(String id) async {
    return await remoteDataSource.getPropertyById(id);
  }

  @override
  Future<SearchResult> searchWithinPolygon({
    required List<Map<String, double>> polygon,
    SearchFilters? filters,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    return await remoteDataSource.searchWithinPolygon(
      polygon: polygon,
      filters: filters,
      sort: sort,
      page: page,
      limit: limit,
    );
  }
}
