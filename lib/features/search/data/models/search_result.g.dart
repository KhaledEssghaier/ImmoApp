// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SearchResult _$SearchResultFromJson(Map<String, dynamic> json) => SearchResult(
  data: (json['data'] as List<dynamic>)
      .map((e) => Property.fromJson(e as Map<String, dynamic>))
      .toList(),
  pagination: SearchPagination.fromJson(
    json['pagination'] as Map<String, dynamic>,
  ),
  filters: json['filters'] == null
      ? null
      : SearchFilters.fromJson(json['filters'] as Map<String, dynamic>),
  sort: json['sort'] as String?,
);

Map<String, dynamic> _$SearchResultToJson(SearchResult instance) =>
    <String, dynamic>{
      'data': instance.data,
      'pagination': instance.pagination,
      'filters': instance.filters,
      'sort': instance.sort,
    };

SearchPagination _$SearchPaginationFromJson(Map<String, dynamic> json) =>
    SearchPagination(
      page: (json['page'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
      total: (json['total'] as num).toInt(),
      pages: (json['pages'] as num).toInt(),
    );

Map<String, dynamic> _$SearchPaginationToJson(SearchPagination instance) =>
    <String, dynamic>{
      'page': instance.page,
      'limit': instance.limit,
      'total': instance.total,
      'pages': instance.pages,
    };

SearchFilters _$SearchFiltersFromJson(Map<String, dynamic> json) =>
    SearchFilters(
      priceMin: (json['priceMin'] as num?)?.toDouble(),
      priceMax: (json['priceMax'] as num?)?.toDouble(),
      propertyType: json['propertyType'] as String?,
      transactionType: json['transactionType'] as String?,
      bedroomsMin: (json['bedroomsMin'] as num?)?.toInt(),
      bedroomsMax: (json['bedroomsMax'] as num?)?.toInt(),
      bathroomsMin: (json['bathroomsMin'] as num?)?.toInt(),
      surfaceMin: (json['surfaceMin'] as num?)?.toDouble(),
      surfaceMax: (json['surfaceMax'] as num?)?.toDouble(),
      amenities: (json['amenities'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      city: json['city'] as String?,
    );

Map<String, dynamic> _$SearchFiltersToJson(SearchFilters instance) =>
    <String, dynamic>{
      'priceMin': instance.priceMin,
      'priceMax': instance.priceMax,
      'propertyType': instance.propertyType,
      'transactionType': instance.transactionType,
      'bedroomsMin': instance.bedroomsMin,
      'bedroomsMax': instance.bedroomsMax,
      'bathroomsMin': instance.bathroomsMin,
      'surfaceMin': instance.surfaceMin,
      'surfaceMax': instance.surfaceMax,
      'amenities': instance.amenities,
      'city': instance.city,
    };

GeoSearch _$GeoSearchFromJson(Map<String, dynamic> json) => GeoSearch(
  lat: (json['lat'] as num).toDouble(),
  lng: (json['lng'] as num).toDouble(),
  radiusKm: (json['radiusKm'] as num).toDouble(),
);

Map<String, dynamic> _$GeoSearchToJson(GeoSearch instance) => <String, dynamic>{
  'lat': instance.lat,
  'lng': instance.lng,
  'radiusKm': instance.radiusKm,
};
