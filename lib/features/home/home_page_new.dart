import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/simple_bottom_nav_bar.dart';
import '../property/providers/property_provider.dart';
import '../notifications/providers/notification_providers.dart';

// Helper function to safely decode base64 images
Uint8List? _safeBase64Decode(String base64String) {
  try {
    // Remove data URI prefix if present
    String cleanBase64 = base64String;
    if (base64String.contains(',')) {
      cleanBase64 = base64String.split(',').last;
    }
    // Remove any whitespace
    cleanBase64 = cleanBase64.replaceAll(RegExp(r'\s+'), '');
    return base64Decode(cleanBase64);
  } catch (e) {
    print('Error decoding base64 image: $e');
    return null;
  }
}

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(propertyProvider.notifier).loadProperties(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertyState = ref.watch(propertyProvider);
    final properties = propertyState.properties;

    return Scaffold(
      backgroundColor: const Color(0xFF0B141A),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome, Alex!',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white54,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Find your next home',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: _buildNotificationIcon(ref),
                        onPressed: () => context.push('/notifications'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Search Bar
                  TextField(
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search by City, Neighborhood...',
                      hintStyle: const TextStyle(color: Colors.white54),
                      prefixIcon: const Icon(
                        Icons.search,
                        color: Colors.white54,
                      ),
                      filled: true,
                      fillColor: const Color(0xFF1F2C34),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onTap: () => context.push('/properties'),
                  ),
                  const SizedBox(height: 16),
                  // Filter Chips
                  Row(
                    children: [
                      Expanded(
                        child: _FilterChip(
                          label: 'For Sale',
                          icon: Icons.keyboard_arrow_down,
                          onTap: () {},
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _FilterChip(
                          label: 'Price',
                          icon: Icons.keyboard_arrow_down,
                          onTap: () {},
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _FilterChip(
                          label: 'Property Type',
                          icon: Icons.keyboard_arrow_down,
                          onTap: () {},
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: propertyState.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Featured Properties
                          const Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 16,
                            ),
                            child: Text(
                              'Featured Properties',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          ...properties
                              .take(2)
                              .map(
                                (property) => _PropertyCard(
                                  property: property,
                                  onTap: () => context.push(
                                    '/properties/${property.id}',
                                  ),
                                ),
                              ),

                          // Recently Added
                          const Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 16,
                            ),
                            child: Text(
                              'Recently Added',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          ...properties
                              .skip(2)
                              .map(
                                (property) => _PropertyCard(
                                  property: property,
                                  onTap: () => context.push(
                                    '/properties/${property.id}',
                                  ),
                                ),
                              ),
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),

      // Bottom Navigation
      bottomNavigationBar: const SimpleBottomNavBar(currentIndex: 0),
    );
  }

  Widget _buildNotificationIcon(WidgetRef ref) {
    final unreadCountAsync = ref.watch(unreadCountProvider);

    return unreadCountAsync.when(
      data: (count) {
        if (count == 0) {
          return const Icon(Icons.notifications_outlined, color: Colors.white);
        }

        return Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.notifications_outlined, color: Colors.white),
            Positioned(
              right: -2,
              top: -2,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFF0B141A),
                    width: 1.5,
                  ),
                ),
                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                child: Center(
                  child: Text(
                    count > 99 ? '99+' : count.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      height: 1,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ],
        );
      },
      loading: () =>
          const Icon(Icons.notifications_outlined, color: Colors.white),
      error: (_, __) =>
          const Icon(Icons.notifications_outlined, color: Colors.white),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2C34),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                label,
                style: const TextStyle(fontSize: 13, color: Colors.white),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            Icon(icon, size: 16, color: Colors.white54),
          ],
        ),
      ),
    );
  }
}

class _PropertyCard extends StatelessWidget {
  final dynamic property;
  final VoidCallback onTap;

  const _PropertyCard({required this.property, required this.onTap});

  Widget _buildPropertyImage(dynamic property) {
    if (property.images == null || property.images.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.home_rounded, size: 50, color: Color(0xFF3ABAEC)),
            const SizedBox(height: 8),
            Text(
              property.propertyType.toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF3ABAEC),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    final imageData = _safeBase64Decode(property.images.first);
    if (imageData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.home_rounded, size: 50, color: Color(0xFF3ABAEC)),
            const SizedBox(height: 8),
            Text(
              property.propertyType.toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF3ABAEC),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return Image.memory(
      imageData,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.home_rounded, size: 50, color: Color(0xFF3ABAEC)),
            const SizedBox(height: 8),
            Text(
              property.propertyType.toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF3ABAEC),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isForSale = property.transactionType == 'sale';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2C34),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          const Color(0xFF3ABAEC).withOpacity(0.3),
                          const Color(0xFF3ABAEC).withOpacity(0.1),
                        ],
                      ),
                    ),
                    child: _buildPropertyImage(property),
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isForSale ? Colors.green : const Color(0xFF3ABAEC),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isForSale ? 'FOR SALE' : 'NEW',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.favorite_border, size: 20),
                  ),
                ),
              ],
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '\$${property.price.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${property.address.street ?? property.address.city}, ${property.address.city}, ${property.address.country}',
                    style: const TextStyle(fontSize: 14, color: Colors.white54),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (property.bedrooms > 0) ...[
                        const Icon(Icons.bed, size: 18, color: Colors.white54),
                        const SizedBox(width: 4),
                        Text(
                          '${property.bedrooms} beds',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(width: 16),
                      ],
                      if (property.bathrooms > 0) ...[
                        const Icon(
                          Icons.bathroom,
                          size: 18,
                          color: Colors.white54,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${property.bathrooms} baths',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(width: 16),
                      ],
                      const Icon(
                        Icons.square_foot,
                        size: 18,
                        color: Colors.white54,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${property.surface.toInt()} sqft',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
