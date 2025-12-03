import 'package:json_annotation/json_annotation.dart';

part 'property_model.g.dart';

@JsonSerializable()
class PropertyLocation {
  final double longitude;
  final double latitude;

  PropertyLocation({required this.longitude, required this.latitude});

  factory PropertyLocation.fromJson(Map<String, dynamic> json) =>
      _$PropertyLocationFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyLocationToJson(this);
}

@JsonSerializable()
class PropertyAddress {
  final String country;
  final String city;
  final String? street;
  final String? zipcode;

  PropertyAddress({
    required this.country,
    required this.city,
    this.street,
    this.zipcode,
  });

  factory PropertyAddress.fromJson(Map<String, dynamic> json) =>
      _$PropertyAddressFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyAddressToJson(this);
}

@JsonSerializable(explicitToJson: true)
class Property {
  @JsonKey(name: '_id')
  final String? id;
  final String? ownerId;
  final String title;
  final String description;
  final num price;
  @JsonKey(name: 'propertyType', defaultValue: '')
  final String propertyType;
  @JsonKey(name: 'transactionType', defaultValue: 'sale')
  final String transactionType;
  @JsonKey(name: 'bedrooms', defaultValue: 0)
  final int bedrooms;
  final int bathrooms;
  final num surface;
  @JsonKey(name: 'amenities', defaultValue: [])
  final List<String> amenities;
  final PropertyLocation? location;
  final PropertyAddress address;
  @JsonKey(name: 'mediaIds', defaultValue: [])
  final List<String> mediaIds;
  @JsonKey(name: 'images', defaultValue: [])
  final List<String> images;
  @JsonKey(name: 'status', defaultValue: 'available')
  final String status;
  final bool? isDeleted;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Property({
    this.id,
    this.ownerId,
    required this.title,
    required this.description,
    required this.price,
    required this.propertyType,
    required this.transactionType,
    this.bedrooms = 0,
    this.bathrooms = 0,
    required this.surface,
    this.amenities = const [],
    this.location,
    required this.address,
    this.mediaIds = const [],
    this.images = const [],
    this.status = 'available',
    this.isDeleted,
    this.createdAt,
    this.updatedAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    // Normalize the JSON to handle both search service and main service formats
    final normalizedJson = Map<String, dynamic>.from(json);

    // Handle 'type' vs 'propertyType'
    if (json.containsKey('type') && !json.containsKey('propertyType')) {
      normalizedJson['propertyType'] = json['type'];
    }

    // Handle 'status' vs 'transactionType' (status: FOR_SALE -> transactionType: sale)
    if (json.containsKey('status') && !json.containsKey('transactionType')) {
      final status = json['status'] as String;
      normalizedJson['transactionType'] = status.contains('SALE')
          ? 'sale'
          : 'rent';
    }

    // Handle 'rooms' vs 'bedrooms'
    if (json.containsKey('rooms') && !json.containsKey('bedrooms')) {
      normalizedJson['bedrooms'] = json['rooms'];
    }

    // Handle 'images' vs 'mediaIds'
    if (json.containsKey('images') && !json.containsKey('mediaIds')) {
      normalizedJson['mediaIds'] = json['images'];
    }

    // Handle 'features' vs 'amenities'
    if (json.containsKey('features') && !json.containsKey('amenities')) {
      normalizedJson['amenities'] = json['features'];
    }

    // Handle location format from search service
    if (json.containsKey('location') && json['location'] is Map) {
      final loc = json['location'] as Map<String, dynamic>;
      if (loc.containsKey('coordinates') && loc['coordinates'] is List) {
        final coords = loc['coordinates'] as List;
        if (coords.length >= 2) {
          normalizedJson['location'] = {
            'longitude': coords[0],
            'latitude': coords[1],
          };
        }
      }
    }

    // Handle address zipCode vs zipcode
    if (json.containsKey('address') && json['address'] is Map) {
      final addr = Map<String, dynamic>.from(json['address'] as Map);
      if (addr.containsKey('zipCode') && !addr.containsKey('zipcode')) {
        addr['zipcode'] = addr['zipCode'];
      }
      normalizedJson['address'] = addr;
    }

    return _$PropertyFromJson(normalizedJson);
  }

  Map<String, dynamic> toJson() => _$PropertyToJson(this);
  Property copyWith({
    String? id,
    String? ownerId,
    String? title,
    String? description,
    num? price,
    String? propertyType,
    String? transactionType,
    int? bedrooms,
    int? bathrooms,
    num? surface,
    List<String>? amenities,
    PropertyLocation? location,
    PropertyAddress? address,
    List<String>? mediaIds,
    List<String>? images,
    String? status,
    bool? isDeleted,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Property(
      id: id ?? this.id,
      ownerId: ownerId ?? this.ownerId,
      title: title ?? this.title,
      description: description ?? this.description,
      price: price ?? this.price,
      propertyType: propertyType ?? this.propertyType,
      transactionType: transactionType ?? this.transactionType,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      surface: surface ?? this.surface,
      amenities: amenities ?? this.amenities,
      location: location ?? this.location,
      address: address ?? this.address,
      mediaIds: mediaIds ?? this.mediaIds,
      images: images ?? this.images,
      status: status ?? this.status,
      isDeleted: isDeleted ?? this.isDeleted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

@JsonSerializable()
class PropertyListResponse {
  final List<Property> properties;
  final int total;
  final int page;
  final int totalPages;

  PropertyListResponse({
    required this.properties,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  factory PropertyListResponse.fromJson(Map<String, dynamic> json) =>
      _$PropertyListResponseFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyListResponseToJson(this);
}
