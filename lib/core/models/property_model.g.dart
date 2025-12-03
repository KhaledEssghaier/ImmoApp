// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PropertyLocation _$PropertyLocationFromJson(Map<String, dynamic> json) =>
    PropertyLocation(
      longitude: (json['longitude'] as num).toDouble(),
      latitude: (json['latitude'] as num).toDouble(),
    );

Map<String, dynamic> _$PropertyLocationToJson(PropertyLocation instance) =>
    <String, dynamic>{
      'longitude': instance.longitude,
      'latitude': instance.latitude,
    };

PropertyAddress _$PropertyAddressFromJson(Map<String, dynamic> json) =>
    PropertyAddress(
      country: json['country'] as String,
      city: json['city'] as String,
      street: json['street'] as String?,
      zipcode: json['zipcode'] as String?,
    );

Map<String, dynamic> _$PropertyAddressToJson(PropertyAddress instance) =>
    <String, dynamic>{
      'country': instance.country,
      'city': instance.city,
      'street': instance.street,
      'zipcode': instance.zipcode,
    };

Property _$PropertyFromJson(Map<String, dynamic> json) => Property(
  id: json['_id'] as String?,
  ownerId: json['ownerId'] as String?,
  title: json['title'] as String,
  description: json['description'] as String,
  price: json['price'] as num,
  propertyType: json['propertyType'] as String? ?? '',
  transactionType: json['transactionType'] as String? ?? 'sale',
  bedrooms: (json['bedrooms'] as num?)?.toInt() ?? 0,
  bathrooms: (json['bathrooms'] as num?)?.toInt() ?? 0,
  surface: json['surface'] as num,
  amenities:
      (json['amenities'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      [],
  location: json['location'] == null
      ? null
      : PropertyLocation.fromJson(json['location'] as Map<String, dynamic>),
  address: PropertyAddress.fromJson(json['address'] as Map<String, dynamic>),
  mediaIds:
      (json['mediaIds'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      [],
  images:
      (json['images'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      [],
  status: json['status'] as String? ?? 'available',
  isDeleted: json['isDeleted'] as bool?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$PropertyToJson(Property instance) => <String, dynamic>{
  '_id': instance.id,
  'ownerId': instance.ownerId,
  'title': instance.title,
  'description': instance.description,
  'price': instance.price,
  'propertyType': instance.propertyType,
  'transactionType': instance.transactionType,
  'bedrooms': instance.bedrooms,
  'bathrooms': instance.bathrooms,
  'surface': instance.surface,
  'amenities': instance.amenities,
  'location': instance.location?.toJson(),
  'address': instance.address.toJson(),
  'mediaIds': instance.mediaIds,
  'images': instance.images,
  'status': instance.status,
  'isDeleted': instance.isDeleted,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};

PropertyListResponse _$PropertyListResponseFromJson(
  Map<String, dynamic> json,
) => PropertyListResponse(
  properties: (json['properties'] as List<dynamic>)
      .map((e) => Property.fromJson(e as Map<String, dynamic>))
      .toList(),
  total: (json['total'] as num).toInt(),
  page: (json['page'] as num).toInt(),
  totalPages: (json['totalPages'] as num).toInt(),
);

Map<String, dynamic> _$PropertyListResponseToJson(
  PropertyListResponse instance,
) => <String, dynamic>{
  'properties': instance.properties,
  'total': instance.total,
  'page': instance.page,
  'totalPages': instance.totalPages,
};
