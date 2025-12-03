import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/property_api_service.dart';
import '../../../core/models/property_model.dart';
import '../../auth/providers/auth_provider.dart';

// Property API service provider
final propertyApiServiceProvider = Provider<PropertyApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return PropertyApiService(dioClient);
});

// Property state
class PropertyState {
  final List<Property> properties;
  final Property? selectedProperty;
  final bool isLoading;
  final String? error;
  final int currentPage;
  final int totalPages;
  final PropertyFilters filters;

  PropertyState({
    this.properties = const [],
    this.selectedProperty,
    this.isLoading = false,
    this.error,
    this.currentPage = 1,
    this.totalPages = 1,
    this.filters = const PropertyFilters(),
  });

  PropertyState copyWith({
    List<Property>? properties,
    Property? selectedProperty,
    bool? isLoading,
    String? error,
    int? currentPage,
    int? totalPages,
    PropertyFilters? filters,
  }) {
    return PropertyState(
      properties: properties ?? this.properties,
      selectedProperty: selectedProperty ?? this.selectedProperty,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      filters: filters ?? this.filters,
    );
  }
}

// Property filters
class PropertyFilters {
  final String? city;
  final num? minPrice;
  final num? maxPrice;
  final String? propertyType;
  final String? transactionType;
  final int? bedrooms;
  final double? longitude;
  final double? latitude;
  final num? radius;

  const PropertyFilters({
    this.city,
    this.minPrice,
    this.maxPrice,
    this.propertyType,
    this.transactionType,
    this.bedrooms,
    this.longitude,
    this.latitude,
    this.radius,
  });

  PropertyFilters copyWith({
    String? city,
    num? minPrice,
    num? maxPrice,
    String? propertyType,
    String? transactionType,
    int? bedrooms,
    double? longitude,
    double? latitude,
    num? radius,
  }) {
    return PropertyFilters(
      city: city ?? this.city,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      propertyType: propertyType ?? this.propertyType,
      transactionType: transactionType ?? this.transactionType,
      bedrooms: bedrooms ?? this.bedrooms,
      longitude: longitude ?? this.longitude,
      latitude: latitude ?? this.latitude,
      radius: radius ?? this.radius,
    );
  }

  bool get hasFilters =>
      city != null ||
      minPrice != null ||
      maxPrice != null ||
      propertyType != null ||
      transactionType != null ||
      bedrooms != null ||
      (longitude != null && latitude != null);
}

// Property notifier
class PropertyNotifier extends StateNotifier<PropertyState> {
  final PropertyApiService _propertyApiService;

  PropertyNotifier(this._propertyApiService) : super(PropertyState());

  Future<void> loadProperties({int page = 1}) async {
    // ignore: avoid_print
    print('[PropertyProvider] Starting to load properties...');
    state = state.copyWith(isLoading: true, error: null);

    try {
      // ignore: avoid_print
      print('[PropertyProvider] Calling API...');
      final response = await _propertyApiService.getProperties(
        city: state.filters.city,
        minPrice: state.filters.minPrice,
        maxPrice: state.filters.maxPrice,
        propertyType: state.filters.propertyType,
        transactionType: state.filters.transactionType,
        bedrooms: state.filters.bedrooms,
        longitude: state.filters.longitude,
        latitude: state.filters.latitude,
        radius: state.filters.radius,
        page: page,
        limit: 10,
        // Don't pass status - backend defaults to 'available'
      );

      // ignore: avoid_print
      print(
        '[PropertyProvider] API Success! Got ${response.properties.length} properties',
      );
      // ignore: avoid_print
      print(
        '[PropertyProvider] Properties: ${response.properties.map((p) => p.title).toList()}',
      );
      state = state.copyWith(
        properties: response.properties,
        currentPage: response.page,
        totalPages: response.totalPages,
        isLoading: false,
      );
      // ignore: avoid_print
      print(
        '[PropertyProvider] State updated. isLoading: ${state.isLoading}, properties count: ${state.properties.length}',
      );
    } catch (e) {
      // ignore: avoid_print
      print('[PropertyProvider] ❌ ERROR: $e');
      String errorMessage = 'Failed to load properties. ';
      if (e.toString().contains('SocketException') ||
          e.toString().contains('Connection refused')) {
        errorMessage +=
            'Cannot connect to server. Please ensure backend is running.';
      } else if (e.toString().contains('type') &&
          e.toString().contains('Null')) {
        errorMessage += 'Server returned invalid data.';
      } else {
        errorMessage += 'Please try again later.';
      }
      // Show empty list with error message instead of hanging
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
        properties: [],
      );
    }
  }

  Future<void> loadPropertyById(String id) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final property = await _propertyApiService.getPropertyById(id);
      state = state.copyWith(selectedProperty: property, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> createProperty(Property property) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _propertyApiService.createProperty(property);
      state = state.copyWith(isLoading: false);
      await loadProperties(); // Reload list
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateProperty(String id, Property property) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _propertyApiService.updateProperty(id, property);
      state = state.copyWith(isLoading: false);
      await loadProperties(); // Reload list
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> deleteProperty(String id) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _propertyApiService.deleteProperty(id);
      state = state.copyWith(isLoading: false);
      await loadProperties(); // Reload list
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updatePropertyStatus(String id, String status) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final updatedProperty = await _propertyApiService.updatePropertyStatus(
        id,
        status,
      );
      state = state.copyWith(
        isLoading: false,
        selectedProperty: updatedProperty,
      );
      await loadProperties(); // Reload list
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  void setFilters(PropertyFilters filters) {
    state = state.copyWith(filters: filters);
  }

  void clearFilters() {
    state = state.copyWith(filters: const PropertyFilters());
  }

  void clearSelectedProperty() {
    state = state.copyWith(selectedProperty: null);
  }
}

// Property provider
final propertyProvider = StateNotifierProvider<PropertyNotifier, PropertyState>(
  (ref) {
    final propertyApiService = ref.watch(propertyApiServiceProvider);
    return PropertyNotifier(propertyApiService);
  },
);
