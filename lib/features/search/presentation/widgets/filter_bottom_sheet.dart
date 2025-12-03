import 'package:flutter/material.dart';
import '../../data/models/search_result.dart';

class FilterBottomSheet extends StatefulWidget {
  final SearchFilters? initialFilters;
  final Function(SearchFilters?) onApplyFilters;

  const FilterBottomSheet({
    Key? key,
    this.initialFilters,
    required this.onApplyFilters,
  }) : super(key: key);

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late double _minPrice;
  late double _maxPrice;
  String? _propertyType;
  String? _transactionType;
  int? _minBedrooms;
  int? _maxBedrooms;
  int? _minBathrooms;
  double? _minSurface;
  double? _maxSurface;
  List<String> _selectedAmenities = [];
  String? _city;

  final TextEditingController _cityController = TextEditingController();

  final List<String> _propertyTypes = [
    'apartment',
    'house',
    'villa',
    'studio',
    'land',
    'office',
    'duplex',
  ];

  final List<String> _transactionTypes = ['sale', 'rent'];

  final List<String> _availableAmenities = [
    'WiFi',
    'Parking',
    'Pool',
    'Garden',
    'Elevator',
    'Security',
    'Balcony',
    'AC',
    'Gym',
  ];

  @override
  void initState() {
    super.initState();
    _initializeFilters();
  }

  void _initializeFilters() {
    final filters = widget.initialFilters;
    _minPrice = filters?.priceMin ?? 0;
    _maxPrice = filters?.priceMax ?? 10000000;
    _propertyType = filters?.propertyType;
    _transactionType = filters?.transactionType;
    _minBedrooms = filters?.bedroomsMin;
    _maxBedrooms = filters?.bedroomsMax;
    _minBathrooms = filters?.bathroomsMin;
    _minSurface = filters?.surfaceMin;
    _maxSurface = filters?.surfaceMax;
    _selectedAmenities = filters?.amenities ?? [];
    _city = filters?.city;
    _cityController.text = _city ?? '';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF1F2C34),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filters',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              TextButton(
                onPressed: _clearFilters,
                child: const Text(
                  'Clear All',
                  style: TextStyle(color: Colors.blueAccent),
                ),
              ),
            ],
          ),
          const Divider(color: Colors.white24),

          // Scrollable content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Price Range
                  _buildSectionTitle('Price Range'),
                  Row(
                    children: [
                      Text(
                        '\$${_minPrice.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                      Expanded(
                        child: RangeSlider(
                          values: RangeValues(_minPrice, _maxPrice),
                          min: 0,
                          max: 10000000,
                          divisions: 100,
                          labels: RangeLabels(
                            '\$${_minPrice.toStringAsFixed(0)}',
                            '\$${_maxPrice.toStringAsFixed(0)}',
                          ),
                          onChanged: (values) {
                            setState(() {
                              _minPrice = values.start;
                              _maxPrice = values.end;
                            });
                          },
                        ),
                      ),
                      Text(
                        '\$${_maxPrice.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Property Type
                  _buildSectionTitle('Property Type'),
                  Wrap(
                    spacing: 8,
                    children: _propertyTypes.map((type) {
                      return FilterChip(
                        label: Text(type),
                        selected: _propertyType == type,
                        onSelected: (selected) {
                          setState(() {
                            _propertyType = selected ? type : null;
                          });
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // Transaction Type
                  _buildSectionTitle('Transaction Type'),
                  Wrap(
                    spacing: 8,
                    children: _transactionTypes.map((type) {
                      return FilterChip(
                        label: Text(type.toUpperCase()),
                        selected: _transactionType == type,
                        onSelected: (selected) {
                          setState(() {
                            _transactionType = selected ? type : null;
                          });
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // Bedrooms
                  _buildSectionTitle('Bedrooms'),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: _minBedrooms,
                          decoration: const InputDecoration(
                            labelText: 'Min',
                            border: OutlineInputBorder(),
                          ),
                          items: List.generate(10, (i) => i + 1)
                              .map(
                                (num) => DropdownMenuItem(
                                  value: num,
                                  child: Text('$num'),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setState(() => _minBedrooms = value);
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: _maxBedrooms,
                          decoration: const InputDecoration(
                            labelText: 'Max',
                            border: OutlineInputBorder(),
                          ),
                          items: List.generate(10, (i) => i + 1)
                              .map(
                                (num) => DropdownMenuItem(
                                  value: num,
                                  child: Text('$num'),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setState(() => _maxBedrooms = value);
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Bathrooms
                  _buildSectionTitle('Bathrooms (Min)'),
                  DropdownButtonFormField<int>(
                    value: _minBathrooms,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                    ),
                    items: List.generate(6, (i) => i + 1)
                        .map(
                          (num) =>
                              DropdownMenuItem(value: num, child: Text('$num')),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() => _minBathrooms = value);
                    },
                  ),

                  const SizedBox(height: 24),

                  // Surface Area
                  _buildSectionTitle('Surface Area (m²)'),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          initialValue: _minSurface?.toString() ?? '',
                          decoration: const InputDecoration(
                            labelText: 'Min',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (value) {
                            _minSurface = double.tryParse(value);
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          initialValue: _maxSurface?.toString() ?? '',
                          decoration: const InputDecoration(
                            labelText: 'Max',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          onChanged: (value) {
                            _maxSurface = double.tryParse(value);
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Amenities
                  _buildSectionTitle('Amenities'),
                  Wrap(
                    spacing: 8,
                    children: _availableAmenities.map((amenity) {
                      return FilterChip(
                        label: Text(amenity),
                        selected: _selectedAmenities.contains(amenity),
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              _selectedAmenities.add(amenity);
                            } else {
                              _selectedAmenities.remove(amenity);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // City
                  _buildSectionTitle('City'),
                  TextField(
                    controller: _cityController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'Enter city name',
                      hintStyle: TextStyle(color: Colors.white54),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white24),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.blueAccent),
                      ),
                    ),
                    onChanged: (value) {
                      _city = value.isEmpty ? null : value;
                    },
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Apply Button
          const Divider(color: Colors.white24),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    widget.onApplyFilters(null);
                    Navigator.pop(context);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white70,
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Clear'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _applyFilters,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Apply Filters'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    );
  }

  void _clearFilters() {
    setState(() {
      _minPrice = 0;
      _maxPrice = 10000000;
      _propertyType = null;
      _transactionType = null;
      _minBedrooms = null;
      _maxBedrooms = null;
      _minBathrooms = null;
      _minSurface = null;
      _maxSurface = null;
      _selectedAmenities = [];
      _city = null;
      _cityController.clear();
    });
  }

  void _applyFilters() {
    final filters = SearchFilters(
      priceMin: _minPrice > 0 ? _minPrice : null,
      priceMax: _maxPrice < 10000000 ? _maxPrice : null,
      propertyType: _propertyType,
      transactionType: _transactionType,
      bedroomsMin: _minBedrooms,
      bedroomsMax: _maxBedrooms,
      bathroomsMin: _minBathrooms,
      surfaceMin: _minSurface,
      surfaceMax: _maxSurface,
      amenities: _selectedAmenities.isEmpty ? null : _selectedAmenities,
      city: _city,
    );

    widget.onApplyFilters(filters);
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _cityController.dispose();
    super.dispose();
  }
}
