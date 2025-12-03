import 'package:json_annotation/json_annotation.dart';
import '../../../../core/models/property_model.dart';

part 'search_result.g.dart';

@JsonSerializable()
class SearchResult {
  final List<Property> data;
  final SearchPagination pagination;
  final SearchFilters? filters;
  final String? sort;

  SearchResult({
    required this.data,
    required this.pagination,
    this.filters,
    this.sort,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) =>
      _$SearchResultFromJson(json);

  Map<String, dynamic> toJson() => _$SearchResultToJson(this);
}

@JsonSerializable()
class SearchPagination {
  final int page;
  final int limit;
  final int total;
  final int pages;

  SearchPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  factory SearchPagination.fromJson(Map<String, dynamic> json) =>
      _$SearchPaginationFromJson(json);

  Map<String, dynamic> toJson() => _$SearchPaginationToJson(this);
}

@JsonSerializable()
class SearchFilters {
  final double? priceMin;
  final double? priceMax;
  final String? propertyType;
  final String? transactionType;
  final int? bedroomsMin;
  final int? bedroomsMax;
  final int? bathroomsMin;
  final double? surfaceMin;
  final double? surfaceMax;
  final List<String>? amenities;
  final String? city;

  SearchFilters({
    this.priceMin,
    this.priceMax,
    this.propertyType,
    this.transactionType,
    this.bedroomsMin,
    this.bedroomsMax,
    this.bathroomsMin,
    this.surfaceMin,
    this.surfaceMax,
    this.amenities,
    this.city,
  });

  factory SearchFilters.fromJson(Map<String, dynamic> json) =>
      _$SearchFiltersFromJson(json);

  Map<String, dynamic> toJson() => _$SearchFiltersToJson(this);

  SearchFilters copyWith({
    double? priceMin,
    double? priceMax,
    String? propertyType,
    String? transactionType,
    int? bedroomsMin,
    int? bedroomsMax,
    int? bathroomsMin,
    double? surfaceMin,
    double? surfaceMax,
    List<String>? amenities,
    String? city,
  }) {
    return SearchFilters(
      priceMin: priceMin ?? this.priceMin,
      priceMax: priceMax ?? this.priceMax,
      propertyType: propertyType ?? this.propertyType,
      transactionType: transactionType ?? this.transactionType,
      bedroomsMin: bedroomsMin ?? this.bedroomsMin,
      bedroomsMax: bedroomsMax ?? this.bedroomsMax,
      bathroomsMin: bathroomsMin ?? this.bathroomsMin,
      surfaceMin: surfaceMin ?? this.surfaceMin,
      surfaceMax: surfaceMax ?? this.surfaceMax,
      amenities: amenities ?? this.amenities,
      city: city ?? this.city,
    );
  }

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (priceMin != null) params['priceMin'] = priceMin;
    if (priceMax != null) params['priceMax'] = priceMax;
    if (propertyType != null) params['propertyType'] = propertyType;
    if (transactionType != null) params['transactionType'] = transactionType;
    if (bedroomsMin != null) params['bedroomsMin'] = bedroomsMin;
    if (bedroomsMax != null) params['bedroomsMax'] = bedroomsMax;
    if (bathroomsMin != null) params['bathroomsMin'] = bathroomsMin;
    if (surfaceMin != null) params['surfaceMin'] = surfaceMin;
    if (surfaceMax != null) params['surfaceMax'] = surfaceMax;
    if (amenities != null && amenities!.isNotEmpty) {
      params['amenities'] = amenities;
    }
    if (city != null) params['city'] = city;
    return params;
  }
}

@JsonSerializable()
class GeoSearch {
  final double lat;
  final double lng;
  final double radiusKm;

  GeoSearch({required this.lat, required this.lng, required this.radiusKm});

  factory GeoSearch.fromJson(Map<String, dynamic> json) =>
      _$GeoSearchFromJson(json);

  Map<String, dynamic> toJson() => _$GeoSearchToJson(this);
}
