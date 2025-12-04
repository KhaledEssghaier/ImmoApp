import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:image/image.dart' as img;
import 'package:latlong2/latlong.dart';
import '../../../../core/models/property_model.dart';
import '../../providers/property_provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../../widgets/guest_login_prompt.dart';
import '../../../../widgets/property_map_widget.dart';

class CreatePropertyPage extends ConsumerStatefulWidget {
  final Property? existingProperty;

  const CreatePropertyPage({super.key, this.existingProperty});

  @override
  ConsumerState<CreatePropertyPage> createState() => _CreatePropertyPageState();
}

class _CreatePropertyPageState extends ConsumerState<CreatePropertyPage> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;

  // Form controllers
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _bedroomsController = TextEditingController();
  final _bathroomsController = TextEditingController();
  final _surfaceController = TextEditingController();

  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _zipController = TextEditingController();
  final _countryController = TextEditingController();

  final _longitudeController = TextEditingController();
  final _latitudeController = TextEditingController();

  String _propertyType = 'apartment';
  String _transactionType = 'rent';
  List<String> _selectedAmenities = [];
  List<XFile> _selectedImages = [];
  final ImagePicker _imagePicker = ImagePicker();

  final List<String> _availableAmenities = [
    'WiFi',
    'Parking',
    'Elevator',
    'AC',
    'Pool',
    'Gym',
    'Garden',
    'Balcony',
    'Security',
    'Pet Friendly',
  ];

  @override
  void initState() {
    super.initState();

    // Check if user is guest before allowing property creation
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authProvider);
      if (authState.isGuest) {
        showGuestLoginPrompt(context, feature: 'create properties').then((
          shouldLogin,
        ) {
          if (shouldLogin != true && mounted) {
            context.pop();
          }
        });
      }
    });

    // Populate form if editing existing property
    if (widget.existingProperty != null) {
      final property = widget.existingProperty!;
      _titleController.text = property.title;
      _descriptionController.text = property.description;
      _priceController.text = property.price.toString();
      _bedroomsController.text = property.bedrooms.toString();
      _bathroomsController.text = property.bathrooms.toString();
      _surfaceController.text = property.surface.toString();

      _streetController.text = property.address.street ?? '';
      _cityController.text = property.address.city;
      _zipController.text = property.address.zipcode ?? '';
      _countryController.text = property.address.country;

      if (property.location != null) {
        _longitudeController.text = property.location!.longitude.toString();
        _latitudeController.text = property.location!.latitude.toString();
      }

      _propertyType = property.propertyType;
      _transactionType = property.transactionType;
      _selectedAmenities = List.from(property.amenities);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _surfaceController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _zipController.dispose();
    _countryController.dispose();
    _longitudeController.dispose();
    _latitudeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        elevation: 4,
        shadowColor: Colors.black.withOpacity(0.3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          widget.existingProperty != null ? 'Edit Property' : 'New Listing',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Step Progress Indicator
          _buildStepIndicator(),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(key: _formKey, child: _buildCurrentStep()),
            ),
          ),

          // Bottom Action Button
          _buildBottomButton(),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Text(
            'Step ${_currentStep + 1}/4',
            style: TextStyle(
              color: Colors.grey[900],
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          Text(
            _getStepTitle(),
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
        ],
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0:
        return 'Next: Details';
      case 1:
        return 'Next: Location';
      case 2:
        return 'Next: Review';
      case 3:
        return 'Complete';
      default:
        return '';
    }
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildBasicInfoStep();
      case 1:
        return _buildAddressStep();
      case 2:
        return _buildLocationStep();
      case 3:
        return _buildReviewStep();
      default:
        return _buildBasicInfoStep();
    }
  }

  Widget _buildBottomButton() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: ElevatedButton(
          onPressed: _currentStep == 3 ? _submitProperty : _onStepContinue,
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 4,
            shadowColor: Theme.of(context).colorScheme.primary.withOpacity(0.3),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _currentStep == 3 ? 'Create Property' : 'Next',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (_currentStep < 3) ...[
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward, size: 20),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Transaction Type Selection
        Text(
          'What are you listing?',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildTransactionTypeCard(
                'sale',
                'For Sale',
                Icons.sell_outlined,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildTransactionTypeCard(
                'rent',
                'For Rent',
                Icons.home_outlined,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),

        // Property Details
        Text(
          'Property Details',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),

        // Property Type Dropdown
        _buildDarkDropdown(
          label: 'Property Type',
          value: _propertyType,
          items: const [
            DropdownMenuItem(value: 'apartment', child: Text('Apartment')),
            DropdownMenuItem(value: 'house', child: Text('House')),
            DropdownMenuItem(value: 'villa', child: Text('Villa')),
            DropdownMenuItem(value: 'studio', child: Text('Studio')),
            DropdownMenuItem(value: 'duplex', child: Text('Duplex')),
            DropdownMenuItem(value: 'land', child: Text('Land')),
            DropdownMenuItem(value: 'office', child: Text('Office')),
          ],
          onChanged: (value) {
            setState(() {
              _propertyType = value!;
            });
          },
        ),
        const SizedBox(height: 16),

        // Title
        _buildDarkTextField(
          controller: _titleController,
          label: 'Title',
          hint: 'e.g. Modern 2-Bedroom Apartment',
        ),
        const SizedBox(height: 16),

        // Price
        _buildDarkTextField(
          controller: _priceController,
          label: 'Price',
          hint: '0',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),

        // Surface
        _buildDarkTextField(
          controller: _surfaceController,
          label: 'Surface (m²)',
          hint: '0',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),

        // Bedrooms & Bathrooms
        Row(
          children: [
            Expanded(
              child: _buildDarkTextField(
                controller: _bedroomsController,
                label: 'Bedrooms',
                hint: '0',
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDarkTextField(
                controller: _bathroomsController,
                label: 'Bathrooms',
                hint: '0',
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),

        // Description
        Text(
          'Description',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        _buildDarkTextField(
          controller: _descriptionController,
          label: 'Description',
          hint: 'Tell us about the property...',
          maxLines: 5,
        ),
        const SizedBox(height: 32),

        // Photos Section
        Text(
          'Property Photos',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Add up to 10 photos',
          style: TextStyle(color: Colors.grey[600], fontSize: 14),
        ),
        const SizedBox(height: 16),
        _buildPhotoSelector(),
      ],
    );
  }

  Widget _buildPhotoSelector() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with count
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.photo_library_outlined,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Property Photos',
                    style: TextStyle(
                      color: Colors.grey[900],
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withOpacity(0.3),
                  ),
                ),
                child: Text(
                  '${_selectedImages.length}/10',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Photo grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1,
            ),
            itemCount: _selectedImages.length + 1,
            itemBuilder: (context, index) {
              if (index == _selectedImages.length) {
                // Add photo button
                return InkWell(
                  onTap: _selectedImages.length < 10 ? _pickImages : null,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _selectedImages.length < 10
                            ? Theme.of(
                                context,
                              ).colorScheme.primary.withOpacity(0.5)
                            : Colors.grey[300]!,
                        width: 2,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.add_photo_alternate_outlined,
                          color: _selectedImages.length < 10
                              ? Theme.of(context).colorScheme.primary
                              : Colors.grey[400],
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _selectedImages.length < 10 ? 'Add' : 'Full',
                          style: TextStyle(
                            color: _selectedImages.length < 10
                                ? Theme.of(context).colorScheme.primary
                                : Colors.grey[400],
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
              return _buildImagePreview(_selectedImages[index], index);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildImagePreview(XFile image, int index) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
          width: 1.5,
        ),
      ),
      child: Stack(
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: kIsWeb
                ? Image.network(
                    image.path,
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: const Color(0xFF1A2332),
                        child: const Center(
                          child: Icon(
                            Icons.broken_image_outlined,
                            color: Colors.white38,
                            size: 32,
                          ),
                        ),
                      );
                    },
                  )
                : Image.file(
                    File(image.path),
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[200],
                        child: Center(
                          child: Icon(
                            Icons.broken_image_outlined,
                            color: Colors.grey[400],
                            size: 32,
                          ),
                        ),
                      );
                    },
                  ),
          ),
          // Gradient overlay for better button visibility
          Positioned(
            top: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [Colors.black.withOpacity(0.6), Colors.transparent],
                ),
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(12),
                  bottomLeft: Radius.circular(20),
                ),
              ),
              child: const SizedBox.shrink(),
            ),
          ),
          // Remove button
          Positioned(
            top: 4,
            right: 4,
            child: InkWell(
              onTap: () => _removeImage(index),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.9),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 14),
              ),
            ),
          ),
          // Index badge
          Positioned(
            bottom: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${index + 1}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickImages() async {
    if (_selectedImages.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Maximum 10 photos reached'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    try {
      // Use pickImage for better web compatibility
      // On web, pickMultiImage is not fully supported
      if (kIsWeb) {
        // For web, pick one image at a time
        final XFile? image = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 80,
        );

        if (image != null) {
          setState(() {
            _selectedImages.add(image);
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Photo added (${_selectedImages.length}/10)'),
              backgroundColor: const Color(0xFF3ABAEC),
              duration: const Duration(seconds: 1),
            ),
          );
        }
      } else {
        // For mobile, try multi-select
        try {
          final List<XFile> images = await _imagePicker.pickMultiImage(
            imageQuality: 80,
          );

          if (images.isNotEmpty) {
            final remainingSlots = 10 - _selectedImages.length;
            final imagesToAdd = images.take(remainingSlots).toList();

            setState(() {
              _selectedImages.addAll(imagesToAdd);
            });

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  '${imagesToAdd.length} photo${imagesToAdd.length > 1 ? 's' : ''} added',
                ),
                backgroundColor: const Color(0xFF3ABAEC),
                duration: const Duration(seconds: 2),
              ),
            );
          }
        } catch (e) {
          // Fallback to single image picker if multi fails
          print('Multi-select not available, using single select: $e');
          final XFile? image = await _imagePicker.pickImage(
            source: ImageSource.gallery,
            imageQuality: 80,
          );

          if (image != null) {
            setState(() {
              _selectedImages.add(image);
            });

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Photo added (${_selectedImages.length}/10)'),
                backgroundColor: const Color(0xFF3ABAEC),
                duration: const Duration(seconds: 1),
              ),
            );
          }
        }
      }
    } catch (e) {
      print('Error picking images: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error selecting image'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  Future<Uint8List> _compressImage(Uint8List bytes) async {
    // Decode image
    final image = img.decodeImage(bytes);
    if (image == null) return bytes;

    // Calculate new dimensions (max 1200px width/height)
    int width = image.width;
    int height = image.height;
    const maxDimension = 1200;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = (height * maxDimension / width).round();
        width = maxDimension;
      } else {
        width = (width * maxDimension / height).round();
        height = maxDimension;
      }
    }

    // Resize image
    final resized = img.copyResize(image, width: width, height: height);

    // Compress as JPEG with 85% quality
    final compressed = img.encodeJpg(resized, quality: 85);

    return Uint8List.fromList(compressed);
  }

  Widget _buildTransactionTypeCard(String value, String label, IconData icon) {
    final isSelected = _transactionType == value;
    return InkWell(
      onTap: () {
        setState(() {
          _transactionType = value;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? Theme.of(context).colorScheme.primary
                : Colors.grey[300]!,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey[600],
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected
                    ? Theme.of(context).colorScheme.primary
                    : Colors.grey[900],
                fontSize: 16,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDarkTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: TextStyle(color: Colors.grey[900]),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!, width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: Theme.of(context).colorScheme.primary,
                width: 2,
              ),
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
        ),
      ],
    );
  }

  Widget _buildDarkDropdown({
    required String label,
    required String value,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!, width: 1),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              items: items,
              onChanged: onChanged,
              isExpanded: true,
              dropdownColor: Colors.white,
              style: TextStyle(color: Colors.grey[900], fontSize: 16),
              icon: Icon(Icons.keyboard_arrow_down, color: Colors.grey[600]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAddressStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Property Address',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 20),
        _buildDarkTextField(
          controller: _streetController,
          label: 'Street Address',
          hint: 'e.g. 123 Main Street',
        ),
        const SizedBox(height: 16),
        _buildDarkTextField(
          controller: _cityController,
          label: 'City',
          hint: 'e.g. Tunis',
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildDarkTextField(
                controller: _countryController,
                label: 'Country',
                hint: 'e.g. Tunisia',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDarkTextField(
                controller: _zipController,
                label: 'ZIP Code',
                hint: 'e.g. 1000',
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLocationStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Property Location',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Select property location on the map or enter coordinates manually',
          style: TextStyle(color: Colors.grey[600], fontSize: 14),
        ),
        const SizedBox(height: 20),
        PropertyMapPicker(
          initialLatitude: _latitudeController.text.isNotEmpty
              ? double.tryParse(_latitudeController.text) ?? 36.8065
              : 36.8065,
          initialLongitude: _longitudeController.text.isNotEmpty
              ? double.tryParse(_longitudeController.text) ?? 10.1815
              : 10.1815,
          onLocationSelected: (LatLng location) {
            setState(() {
              _latitudeController.text = location.latitude.toStringAsFixed(6);
              _longitudeController.text = location.longitude.toStringAsFixed(6);
            });
          },
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: _buildDarkTextField(
                controller: _latitudeController,
                label: 'Latitude',
                hint: 'e.g. 36.8065',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDarkTextField(
                controller: _longitudeController,
                label: 'Longitude',
                hint: 'e.g. 10.1815',
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'Amenities',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableAmenities.map((amenity) {
            final isSelected = _selectedAmenities.contains(amenity);
            return InkWell(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedAmenities.remove(amenity);
                  } else {
                    _selectedAmenities.add(amenity);
                  }
                });
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey[300]!,
                    width: 1.5,
                  ),
                ),
                child: Text(
                  amenity,
                  style: TextStyle(
                    color: isSelected
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey[700],
                    fontWeight: isSelected
                        ? FontWeight.w600
                        : FontWeight.normal,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Review Your Listing',
          style: TextStyle(
            color: Colors.grey[900],
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 20),
        _buildReviewCard(
          'Transaction Type',
          _transactionType == 'sale' ? 'For Sale' : 'For Rent',
        ),
        _buildReviewCard('Property Type', _propertyType.toUpperCase()),
        _buildReviewCard('Title', _titleController.text),
        _buildReviewCard('Description', _descriptionController.text),
        _buildReviewCard('Price', '\$${_priceController.text}'),
        _buildReviewCard('Surface', '${_surfaceController.text} m²'),
        _buildReviewCard('Bedrooms', _bedroomsController.text),
        _buildReviewCard('Bathrooms', _bathroomsController.text),
        _buildReviewCard(
          'Street',
          _streetController.text.isNotEmpty ? _streetController.text : 'N/A',
        ),
        _buildReviewCard('City', _cityController.text),
        _buildReviewCard('Country', _countryController.text),
        _buildReviewCard(
          'ZIP Code',
          _zipController.text.isNotEmpty ? _zipController.text : 'N/A',
        ),
        _buildReviewCard('Latitude', _latitudeController.text),
        _buildReviewCard('Longitude', _longitudeController.text),
        if (_selectedAmenities.isNotEmpty)
          _buildReviewCard('Amenities', _selectedAmenities.join(', ')),
        if (_selectedImages.isNotEmpty)
          _buildReviewCard(
            'Photos',
            '${_selectedImages.length} photo${_selectedImages.length > 1 ? 's' : ''} selected',
          ),
      ],
    );
  }

  Widget _buildReviewCard(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: TextStyle(
                color: Colors.grey[900],
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  void _onStepContinue() {
    if (_currentStep < 3) {
      if (_validateCurrentStep()) {
        setState(() => _currentStep++);
      }
    } else {
      _submitProperty();
    }
  }

  void _onStepCancel() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  bool _validateCurrentStep() {
    print('🔍 Validating step $_currentStep');

    switch (_currentStep) {
      case 0:
        // Manually check required fields
        if (_titleController.text.isEmpty) {
          print('❌ Title is empty');
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Please enter a title')));
          return false;
        }
        if (_descriptionController.text.isEmpty) {
          print('❌ Description is empty');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter a description')),
          );
          return false;
        }
        if (_priceController.text.isEmpty) {
          print('❌ Price is empty');
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Please enter a price')));
          return false;
        }
        if (_surfaceController.text.isEmpty) {
          print('❌ Surface is empty');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter surface area')),
          );
          return false;
        }
        print('✅ Step 0 is valid');
        return true;

      case 1:
        // Address validation
        if (_cityController.text.isEmpty) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Please enter city')));
          return false;
        }
        if (_countryController.text.isEmpty) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Please enter country')));
          return false;
        }
        return true;

      case 2:
        // Location validation
        if (_longitudeController.text.isEmpty ||
            _latitudeController.text.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter location coordinates')),
          );
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  Future<void> _submitProperty() async {
    print('🚀 Submitting property...');

    // Check authentication first
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please login to create a property'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
      return;
    }

    print('✅ User authenticated: ${authState.user?.email}');

    // Verify token exists - critical check
    final hasValidToken = await ref.read(authProvider.notifier).verifyToken();
    if (!hasValidToken) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Session expired. Please login again'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 4),
          ),
        );
        // Navigate to login
        context.go('/login');
      }
      return;
    }

    // Check if user has available credits
    final userId = authState.user?.id;
    if (userId != null) {
      try {
        final response = await http.get(
          Uri.parse('http://localhost:3012/billing/subscriptions/$userId'),
        );

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final remainingCredits = data['remainingCredits'] ?? 0;

          if (remainingCredits <= 0) {
            // No credits available - redirect to payment
            if (mounted) {
              final shouldProceed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  backgroundColor: const Color(0xFF1A2332),
                  title: const Text(
                    'No Credits Available',
                    style: TextStyle(color: Colors.white),
                  ),
                  content: const Text(
                    'You need credits to publish a property. Would you like to purchase credits now?',
                    style: TextStyle(color: Colors.white70),
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3ABAEC),
                      ),
                      child: const Text('Get Credits'),
                    ),
                  ],
                ),
              );

              if (shouldProceed == true && mounted) {
                context.push('/payment-selection');
              }
            }
            return;
          }
        }
      } catch (e) {
        print('Error checking credits: $e');
        // Continue with property creation if credit check fails (fallback)
      }
    }

    // Clean and validate coordinates - remove any non-numeric characters except . and -
    final cleanedLongitude = _longitudeController.text
        .replaceAll(RegExp(r'[^\d.-]'), '')
        .trim();
    final cleanedLatitude = _latitudeController.text
        .replaceAll(RegExp(r'[^\d.-]'), '')
        .trim();

    print(
      '📍 Cleaned coordinates: Lat=$cleanedLatitude, Lng=$cleanedLongitude',
    );

    final longitude = double.tryParse(cleanedLongitude);
    final latitude = double.tryParse(cleanedLatitude);

    if (longitude == null || latitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Invalid coordinates. Please enter valid decimal numbers.\nLongitude: $cleanedLongitude, Latitude: $cleanedLatitude',
          ),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    // Convert and compress images to base64
    List<String> base64Images = [];
    if (_selectedImages.isNotEmpty) {
      print('📸 Converting ${_selectedImages.length} images to base64...');
      for (var image in _selectedImages) {
        try {
          final bytes = await image.readAsBytes();

          // Compress image to reduce size (max 800KB per image)
          final compressedBytes = await _compressImage(bytes);
          final base64String = base64Encode(compressedBytes);

          // Calculate size in KB
          final sizeKB = (base64String.length * 0.75 / 1024).toStringAsFixed(2);
          print('📦 Image size: $sizeKB KB');

          // Include mime type prefix for proper display
          final extension = image.path.split('.').last.toLowerCase();
          final mimeType = extension == 'png' ? 'image/png' : 'image/jpeg';
          base64Images.add('data:$mimeType;base64,$base64String');
          print(
            '✅ Converted image ${base64Images.length}/${_selectedImages.length}',
          );
        } catch (e) {
          print('❌ Failed to convert image: $e');
        }
      }
      print('✅ Successfully converted ${base64Images.length} images');
    }

    final property = Property(
      id: '',
      ownerId: '',
      title: _titleController.text,
      description: _descriptionController.text,
      price: double.parse(_priceController.text),
      propertyType: _propertyType,
      transactionType: _transactionType,
      bedrooms: int.tryParse(_bedroomsController.text) ?? 0,
      bathrooms: int.tryParse(_bathroomsController.text) ?? 0,
      surface: double.parse(_surfaceController.text),
      amenities: _selectedAmenities,
      location: PropertyLocation(longitude: longitude, latitude: latitude),
      address: PropertyAddress(
        street: _streetController.text.isNotEmpty
            ? _streetController.text
            : null,
        city: _cityController.text,
        zipcode: _zipController.text.isNotEmpty ? _zipController.text : null,
        country: _countryController.text,
      ),
      mediaIds: [],
      images: base64Images,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    try {
      final isEditing = widget.existingProperty != null;

      if (isEditing) {
        print('📤 Calling updateProperty API...');
        print('📸 Property has ${property.images.length} images');
        await ref
            .read(propertyProvider.notifier)
            .updateProperty(widget.existingProperty!.id!, property);
      } else {
        print('📤 Calling createProperty API...');
        print('📸 Property has ${property.images.length} images');
        if (property.images.isNotEmpty) {
          print(
            '🖼️ First image preview: ${property.images[0].substring(0, 50)}...',
          );
        }
        await ref.read(propertyProvider.notifier).createProperty(property);
      }

      if (mounted) {
        // Close loading dialog
        Navigator.pop(context);

        print('✅ Property ${isEditing ? "updated" : "created"} successfully');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Property ${isEditing ? "updated" : "created"} successfully!',
            ),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    } catch (e, stackTrace) {
      print(
        '❌ Error ${widget.existingProperty != null ? "updating" : "creating"} property: $e',
      );
      print('Stack trace: $stackTrace');

      if (mounted) {
        // Close loading dialog
        Navigator.pop(context);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error ${widget.existingProperty != null ? "updating" : "creating"} property: $e',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
