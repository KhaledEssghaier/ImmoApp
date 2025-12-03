import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../data/datasources/search_remote_datasource.dart';
import '../../data/repositories/search_repository_impl.dart';
import '../../data/models/search_result.dart';
import '../../../../core/models/property_model.dart';

// Dio provider (can be shared with other services)
final searchDioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3007/api/v1', // Desktop/Web/iOS
      // baseUrl: 'http://10.0.2.2:3007/api/v1', // Android Emulator
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  // Add interceptor for logging (optional)
  dio.interceptors.add(
    LogInterceptor(requestBody: true, responseBody: true, error: true),
  );

  return dio;
});

// Data source provider
final searchRemoteDataSourceProvider = Provider<SearchRemoteDataSource>((ref) {
  return SearchRemoteDataSourceImpl(dio: ref.watch(searchDioProvider));
});

// Repository provider
final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepositoryImpl(
    remoteDataSource: ref.watch(searchRemoteDataSourceProvider),
  );
});

// State class for search
class SearchState {
  final List<Property> properties;
  final SearchPagination? pagination;
  final SearchFilters? filters;
  final GeoSearch? geo;
  final String? sort;
  final String? query;
  final bool isLoading;
  final String? error;
  final bool hasMore;

  SearchState({
    this.properties = const [],
    this.pagination,
    this.filters,
    this.geo,
    this.sort,
    this.query,
    this.isLoading = false,
    this.error,
    this.hasMore = true,
  });

  SearchState copyWith({
    List<Property>? properties,
    SearchPagination? pagination,
    SearchFilters? filters,
    GeoSearch? geo,
    String? sort,
    String? query,
    bool? isLoading,
    String? error,
    bool? hasMore,
  }) {
    return SearchState(
      properties: properties ?? this.properties,
      pagination: pagination ?? this.pagination,
      filters: filters ?? this.filters,
      geo: geo ?? this.geo,
      sort: sort ?? this.sort,
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

// Search controller
class SearchController extends StateNotifier<SearchState> {
  final SearchRepository repository;

  SearchController({required this.repository}) : super(SearchState());

  Future<void> search({
    String? query,
    SearchFilters? filters,
    GeoSearch? geo,
    String? sort,
    int page = 1,
  }) async {
    try {
      // If it's page 1, set loading state
      if (page == 1) {
        state = state.copyWith(
          isLoading: true,
          error: null,
          properties: [],
          query: query,
          filters: filters,
          geo: geo,
          sort: sort,
        );
      }

      final result = await repository.search(
        query: query,
        filters: filters,
        geo: geo,
        sort: sort,
        page: page,
        limit: 20,
      );

      // Append or replace properties
      final newProperties = page == 1
          ? result.data
          : [...state.properties, ...result.data];

      state = state.copyWith(
        properties: newProperties,
        pagination: result.pagination,
        isLoading: false,
        hasMore: result.pagination.page < result.pagination.pages,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore || state.pagination == null) {
      return;
    }

    await search(
      query: state.query,
      filters: state.filters,
      geo: state.geo,
      sort: state.sort,
      page: state.pagination!.page + 1,
    );
  }

  void clearSearch() {
    state = SearchState();
  }

  void updateFilters(SearchFilters filters) {
    state = state.copyWith(filters: filters);
  }

  void updateSort(String sort) {
    state = state.copyWith(sort: sort);
  }
}

// Search controller provider
final searchControllerProvider =
    StateNotifierProvider<SearchController, SearchState>((ref) {
      return SearchController(repository: ref.watch(searchRepositoryProvider));
    });

// Autocomplete provider
final searchSuggestionsProvider = FutureProvider.family<List<String>, String>((
  ref,
  query,
) async {
  if (query.isEmpty) return [];

  final repository = ref.watch(searchRepositoryProvider);
  return await repository.getSuggestions(query);
});

// Property by ID provider
final propertyByIdProvider = FutureProvider.family<Property, String>((
  ref,
  id,
) async {
  final repository = ref.watch(searchRepositoryProvider);
  return await repository.getPropertyById(id);
});
