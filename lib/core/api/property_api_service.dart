import 'package:dio/dio.dart';
import '../models/property_model.dart';
import 'dio_client.dart';

class PropertyApiService {
  final DioClient _dioClient;

  PropertyApiService(this._dioClient);

  Future<PropertyListResponse> getProperties({
    String? city,
    num? minPrice,
    num? maxPrice,
    String? propertyType,
    String? transactionType,
    int? bedrooms,
    double? longitude,
    double? latitude,
    num? radius,
    int page = 1,
    int limit = 10,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{'page': page, 'limit': limit};

    // Don't add status to query params - backend defaults to 'available'
    // The backend will filter out sold/rented properties automatically

    if (city != null) queryParams['city'] = city;
    if (minPrice != null) queryParams['minPrice'] = minPrice;
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
    if (propertyType != null) queryParams['propertyType'] = propertyType;
    if (transactionType != null) {
      queryParams['transactionType'] = transactionType;
    }
    if (bedrooms != null) queryParams['bedrooms'] = bedrooms;
    if (longitude != null) queryParams['longitude'] = longitude;
    if (latitude != null) queryParams['latitude'] = latitude;
    if (radius != null) queryParams['radius'] = radius;

    try {
      // ignore: avoid_print
      print('[PropertyAPI] Fetching from ${DioClient.baseUrl}/properties');
      final response = await _dioClient.dio.get(
        '/properties',
        queryParameters: queryParams,
      );
      // ignore: avoid_print
      print('[PropertyAPI] Response status: ${response.statusCode}');
      // ignore: avoid_print
      print('[PropertyAPI] Response data type: ${response.data.runtimeType}');
      // ignore: avoid_print
      print('[PropertyAPI] Response data: ${response.data}');

      // Check if response is an error
      if (response.data is Map && (response.data as Map).containsKey('error')) {
        final errorMsg = (response.data as Map)['message'] ?? 'Unknown error';
        throw Exception('Backend error: $errorMsg');
      }

      final result = PropertyListResponse.fromJson(response.data);
      // ignore: avoid_print
      print('[PropertyAPI] Parsed ${result.properties.length} properties');

      // Check if properties have images
      if (result.properties.isNotEmpty) {
        final firstProp = result.properties[0];
        print(
          '[PropertyAPI] First property images count: ${firstProp.images.length}',
        );
        if (firstProp.images.isNotEmpty) {
          final previewLength = firstProp.images[0].length > 50
              ? 50
              : firstProp.images[0].length;
          print(
            '[PropertyAPI] First image preview: ${firstProp.images[0].substring(0, previewLength)}...',
          );
        }
      }

      return result;
    } catch (e, stackTrace) {
      // ignore: avoid_print
      print('[PropertyAPI] ❌ ERROR: $e');
      // ignore: avoid_print
      print('[PropertyAPI] ❌ Stack trace: $stackTrace');
      if (e is DioException) {
        // ignore: avoid_print
        print('[PropertyAPI] ❌ DioException type: ${e.type}');
        // ignore: avoid_print
        print('[PropertyAPI] ❌ DioException response: ${e.response?.data}');
        // ignore: avoid_print
        print(
          '[PropertyAPI] ❌ DioException statusCode: ${e.response?.statusCode}',
        );
      }
      rethrow;
    }
  }

  Future<Property> getPropertyById(String id) async {
    final response = await _dioClient.dio.get('/properties/$id');

    return Property.fromJson(response.data);
  }

  Future<Property> createProperty(Property property) async {
    print('[PropertyAPI] 📤 Creating property...');

    // Prepare data for backend - exclude fields that backend generates
    final propertyData = property.toJson();
    propertyData.remove('_id');
    propertyData.remove('ownerId');
    propertyData.remove('createdAt');
    propertyData.remove('updatedAt');
    propertyData.remove('isDeleted');

    print('[PropertyAPI] Property data keys: ${propertyData.keys.toList()}');
    print('[PropertyAPI] Has images: ${propertyData['images'] != null}');
    if (propertyData['images'] != null) {
      print(
        '[PropertyAPI] Images count: ${(propertyData['images'] as List).length}',
      );
    }

    final response = await _dioClient.dio.post(
      '/properties',
      data: propertyData,
    );

    print('[PropertyAPI] ✅ Create response status: ${response.statusCode}');
    print(
      '[PropertyAPI] ✅ Create response has images: ${response.data['images'] != null}',
    );
    if (response.data['images'] != null) {
      print(
        '[PropertyAPI] ✅ Response images count: ${(response.data['images'] as List).length}',
      );
    }

    return Property.fromJson(response.data);
  }

  Future<Property> updateProperty(String id, Property property) async {
    print('[PropertyAPI] 🔄 Updating property $id...');

    // Prepare data for backend - exclude fields that backend generates/manages
    final propertyData = property.toJson();
    propertyData.remove('_id');
    propertyData.remove('ownerId');
    propertyData.remove('createdAt');
    propertyData.remove('updatedAt');
    propertyData.remove('isDeleted');

    print('[PropertyAPI] Update data keys: ${propertyData.keys.toList()}');
    print('[PropertyAPI] Has images: ${propertyData['images'] != null}');
    if (propertyData['images'] != null) {
      final images = propertyData['images'] as List;
      print('[PropertyAPI] Images count: ${images.length}');
      if (images.isNotEmpty) {
        print('[PropertyAPI] First image length: ${images[0].length} chars');
      }
    }

    final response = await _dioClient.dio.put(
      '/properties/$id',
      data: propertyData,
    );

    print('[PropertyAPI] ✅ Update response status: ${response.statusCode}');
    print(
      '[PropertyAPI] ✅ Update response has images: ${response.data['images'] != null}',
    );
    if (response.data['images'] != null) {
      print(
        '[PropertyAPI] ✅ Response images count: ${(response.data['images'] as List).length}',
      );
    }

    return Property.fromJson(response.data);
  }

  Future<void> deleteProperty(String id) async {
    await _dioClient.dio.delete('/properties/$id');
  }

  Future<Property> updatePropertyStatus(String id, String status) async {
    final response = await _dioClient.dio.put(
      '/properties/$id',
      data: {'status': status},
    );

    return Property.fromJson(response.data);
  }

  Future<List<Property>> getMyProperties() async {
    final response = await _dioClient.dio.get(
      '/properties/owner/my-properties',
    );

    return (response.data as List)
        .map((json) => Property.fromJson(json))
        .toList();
  }
}
