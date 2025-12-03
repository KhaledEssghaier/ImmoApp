import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/favorites_provider.dart';
import '../../widgets/favorite_button.dart';
import '../../models/favorite_state.dart';
import '../../../../core/models/property_model.dart';
import '../../../property/providers/property_provider.dart';
import '../../../../widgets/simple_bottom_nav_bar.dart';
import '../../../../widgets/guest_login_prompt.dart';
import '../../../auth/providers/auth_provider.dart';

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

class WishlistPage extends ConsumerStatefulWidget {
  const WishlistPage({Key? key}) : super(key: key);

  @override
  ConsumerState<WishlistPage> createState() => _WishlistPageState();
}

class _WishlistPageState extends ConsumerState<WishlistPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Sync on page load
    Future.microtask(() {
      ref.read(favoritesProvider.notifier).syncWithServer();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    await ref.read(favoritesProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    // Show guest info if user is in guest mode
    if (authState.isGuest) {
      return Scaffold(
        backgroundColor: Theme.of(context).colorScheme.background,
        appBar: AppBar(
          backgroundColor: Theme.of(context).colorScheme.surface,
          elevation: 0,
          title: const Text(
            'Favorites',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
        body: const GuestInfoWidget(),
        bottomNavigationBar: const SimpleBottomNavBar(currentIndex: 1),
      );
    }

    final favoritesState = ref.watch(favoritesProvider);
    final hasPending = ref.watch(hasPendingFavoritesProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.background,
      body: CustomScrollView(
        controller: _scrollController,
        physics: const BouncingScrollPhysics(),
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            backgroundColor: Theme.of(context).colorScheme.background,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'My Wishlist',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Theme.of(context).colorScheme.primary.withOpacity(0.2),
                      Theme.of(context).colorScheme.background,
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Sync Status Banner
          if (hasPending || favoritesState.isSyncing)
            SliverToBoxAdapter(child: _buildSyncBanner(favoritesState)),

          // Error Banner
          if (favoritesState.error != null)
            SliverToBoxAdapter(child: _buildErrorBanner(favoritesState.error!)),

          // Content
          if (favoritesState.favoriteIds.isEmpty)
            SliverFillRemaining(child: _buildEmptyState())
          else
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: _buildPropertyGrid(favoritesState.favoriteIds.toList()),
            ),
        ],
      ),
      bottomNavigationBar: const SimpleBottomNavBar(currentIndex: 1),
    );
  }

  Widget _buildSyncBanner(FavoriteState state) {
    if (state.isSyncing) {
      return Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.primary.withOpacity(0.1),
              Theme.of(context).colorScheme.primary.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Syncing favorites...',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (state.hasPendingOperations) {
      return Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.orange.withOpacity(0.1),
              Colors.orange.withOpacity(0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange.withOpacity(0.3), width: 1),
        ),
        child: Row(
          children: [
            const Icon(Icons.cloud_upload, color: Colors.orange, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '${state.pendingQueue.length} change(s) pending sync',
                style: const TextStyle(
                  color: Colors.orange,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                ref.read(favoritesProvider.notifier).syncWithServer();
              },
              child: const Text('Sync Now'),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildErrorBanner(String error) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.withOpacity(0.1), Colors.red.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withOpacity(0.3), width: 1),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              error,
              style: const TextStyle(color: Colors.red, fontSize: 14),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.red, size: 20),
            onPressed: () {
              // Clear error by refreshing
              ref.read(favoritesProvider.notifier).refresh();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Theme.of(context).colorScheme.surface,
                  Theme.of(context).colorScheme.surface.withOpacity(0.8),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.favorite_border,
              size: 80,
              color: Colors.white.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No Favorites Yet',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start adding properties to your wishlist',
            style: TextStyle(fontSize: 14, color: Colors.white54),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
            },
            icon: const Icon(Icons.explore),
            label: const Text('Explore Properties'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyGrid(List<String> propertyIds) {
    return SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      delegate: SliverChildBuilderDelegate((context, index) {
        final propertyId = propertyIds[index];
        return _FavoritePropertyCard(propertyId: propertyId);
      }, childCount: propertyIds.length),
    );
  }
}

class _FavoritePropertyCard extends ConsumerWidget {
  final String propertyId;

  const _FavoritePropertyCard({required this.propertyId});

  Widget _buildPropertyImage(BuildContext context, Property property) {
    if (property.images.isEmpty) {
      return Center(
        child: Icon(
          Icons.home_rounded,
          size: 40,
          color: Theme.of(context).colorScheme.primary,
        ),
      );
    }

    final imageData = _safeBase64Decode(property.images.first);
    if (imageData == null) {
      return Center(
        child: Icon(
          Icons.home_rounded,
          size: 40,
          color: Theme.of(context).colorScheme.primary,
        ),
      );
    }

    return Image.memory(
      imageData,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => Center(
        child: Icon(
          Icons.home_rounded,
          size: 40,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Fetch property details (you'll need to implement this provider)
    final propertyAsync = ref.watch(propertyByIdProvider(propertyId));

    return propertyAsync.when(
      data: (property) => _buildCard(context, ref, property),
      loading: () => _buildLoadingCard(context),
      error: (error, stack) => _buildErrorCard(context, error),
    );
  }

  Widget _buildCard(BuildContext context, WidgetRef ref, Property property) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.surface,
            Theme.of(context).colorScheme.surface.withOpacity(0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            // Navigate to property details
            context.push('/properties/${property.id}');
          },
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              Expanded(
                flex: 3,
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                      child: Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Theme.of(
                                context,
                              ).colorScheme.primary.withOpacity(0.3),
                              Theme.of(
                                context,
                              ).colorScheme.primary.withOpacity(0.1),
                            ],
                          ),
                        ),
                        child: _buildPropertyImage(context, property),
                      ),
                    ),
                    // Favorite button
                    Positioned(
                      top: 8,
                      right: 8,
                      child: CompactFavoriteButton(
                        propertyId: property.id ?? '',
                      ),
                    ),
                  ],
                ),
              ),
              // Info
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        property.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${property.address.city}, ${property.address.country}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.white54,
                          height: 1.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      Text(
                        '\$${property.price.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.surface,
            Theme.of(context).colorScheme.surface.withOpacity(0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(
            Theme.of(context).colorScheme.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildErrorCard(BuildContext context, Object error) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.surface,
            Theme.of(context).colorScheme.surface.withOpacity(0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 32),
            const SizedBox(height: 8),
            const Text(
              'Failed to load',
              style: TextStyle(color: Colors.white54, fontSize: 12),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// Provider for fetching property by ID
final propertyByIdProvider = FutureProvider.family<Property, String>((
  ref,
  id,
) async {
  final propertyApiService = ref.watch(propertyApiServiceProvider);
  return await propertyApiService.getPropertyById(id);
});
