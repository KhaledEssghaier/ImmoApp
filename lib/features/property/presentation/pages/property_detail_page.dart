import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/property_provider.dart';
import '../../../chat/presentation/providers/chat_provider.dart';
import '../../../chat/presentation/screens/chat_screen.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../favorites/providers/favorites_provider.dart';
import '../../../../widgets/property_map_widget.dart';

class PropertyDetailPage extends ConsumerStatefulWidget {
  final String propertyId;

  const PropertyDetailPage({super.key, required this.propertyId});

  @override
  ConsumerState<PropertyDetailPage> createState() => _PropertyDetailPageState();
}

class _PropertyDetailPageState extends ConsumerState<PropertyDetailPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref
          .read(propertyProvider.notifier)
          .loadPropertyById(widget.propertyId),
    );
  }

  Uint8List _base64ToImage(String base64String) {
    try {
      // Remove data:image/...;base64, prefix if present
      String base64Data = base64String;
      if (base64String.contains(',')) {
        base64Data = base64String.split(',')[1];
      }
      return base64Decode(base64Data);
    } catch (e) {
      print('❌ Error decoding base64 in detail page: $e');
      rethrow;
    }
  }

  void _showStatusChangeDialog(
    BuildContext context,
    WidgetRef ref,
    String newStatus,
  ) {
    String statusText = newStatus == 'sold'
        ? 'Sold'
        : newStatus == 'rented'
        ? 'Rented'
        : 'Available';

    String message = newStatus == 'available'
        ? 'Mark this property as available again? It will appear in public listings.'
        : 'Mark this property as $statusText? It will be hidden from public listings but remain visible in your properties.';

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
        title: Row(
          children: [
            Icon(
              newStatus == 'available' ? Icons.replay : Icons.check_circle,
              color: newStatus == 'available' ? Colors.orange : Colors.green,
              size: 28,
            ),
            const SizedBox(width: 12),
            Text(
              'Mark as $statusText',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            fontSize: 16,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);

              // Show loading
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => Center(
                  child: CircularProgressIndicator(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              );

              // Update status
              final success = await ref
                  .read(propertyProvider.notifier)
                  .updatePropertyStatus(widget.propertyId, newStatus);

              // Close loading
              if (context.mounted) Navigator.pop(context);

              if (success) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Property marked as $statusText'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  // Refresh the page
                  ref
                      .read(propertyProvider.notifier)
                      .loadPropertyById(widget.propertyId);
                }
              } else {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to update property status'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: newStatus == 'available'
                  ? Colors.orange
                  : Colors.green,
              foregroundColor: Theme.of(context).colorScheme.onPrimary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          ),
        ),
        title: Row(
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              color: Colors.orange,
              size: 28,
            ),
            const SizedBox(width: 12),
            Text(
              'Delete Property',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to delete this property? This action cannot be undone.',
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            fontSize: 16,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(dialogContext);

              // Show loading
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => Center(
                  child: CircularProgressIndicator(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              );

              // Delete property
              final success = await ref
                  .read(propertyProvider.notifier)
                  .deleteProperty(widget.propertyId);

              // Close loading
              if (context.mounted) Navigator.pop(context);

              if (success) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Property deleted successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  context.go('/home');
                }
              } else {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to delete property'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertyState = ref.watch(propertyProvider);
    final property = propertyState.selectedProperty;

    if (propertyState.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (property == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Property not found')),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          // App Bar with Image
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            leading: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                icon: Icon(
                  Icons.arrow_back,
                  color: Theme.of(context).colorScheme.onSurface,
                  size: 22,
                ),
                onPressed: () => context.pop(),
                padding: EdgeInsets.zero,
              ),
            ),
            actions: [
              // Edit/Delete options (only for owner)
              Consumer(
                builder: (context, ref, child) {
                  final authState = ref.watch(authProvider);
                  final isOwner = property.ownerId == authState.user?.id;

                  if (!isOwner) return const SizedBox.shrink();

                  return PopupMenuButton<String>(
                    icon: Container(
                      margin: const EdgeInsets.only(right: 4),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Theme.of(
                          context,
                        ).colorScheme.surface.withOpacity(0.9),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.more_vert,
                        color: Theme.of(context).colorScheme.onSurface,
                        size: 22,
                      ),
                    ),
                    color: Theme.of(context).colorScheme.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.white.withOpacity(0.1)),
                    ),
                    onSelected: (value) {
                      if (value == 'edit') {
                        context.push(
                          '/properties/${widget.propertyId}/edit',
                          extra: property,
                        );
                      } else if (value == 'delete') {
                        _showDeleteDialog(context, ref);
                      } else if (value.startsWith('mark_')) {
                        final status = value.substring(
                          5,
                        ); // Remove 'mark_' prefix
                        _showStatusChangeDialog(context, ref, status);
                      }
                    },
                    itemBuilder: (context) {
                      final List<PopupMenuItem<String>> items = [
                        PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(
                                Icons.edit,
                                color: Theme.of(context).colorScheme.primary,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Edit Property',
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ];

                      // Add status change option only if property is available
                      if (property.status == 'available') {
                        final statusText = property.transactionType == 'sale'
                            ? 'Mark as Sold'
                            : 'Mark as Rented';
                        final statusValue = property.transactionType == 'sale'
                            ? 'sold'
                            : 'rented';

                        items.add(
                          PopupMenuItem(
                            value: 'mark_$statusValue',
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.check_circle,
                                  color: Colors.green,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  statusText,
                                  style: TextStyle(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else {
                        // Add option to mark as available again
                        items.add(
                          PopupMenuItem(
                            value: 'mark_available',
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.replay,
                                  color: Colors.orange,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Mark as Available',
                                  style: TextStyle(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      items.add(
                        PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              const Icon(
                                Icons.delete,
                                color: Colors.redAccent,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Delete Property',
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );

                      return items;
                    },
                  );
                },
              ),
              // Favorite button
              Consumer(
                builder: (context, ref, child) {
                  final favoritesState = ref.watch(favoritesProvider);
                  final isFavorite = favoritesState.isFavorite(
                    widget.propertyId,
                  );

                  return Container(
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.surface.withOpacity(0.9),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: IconButton(
                      icon: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite
                            ? Colors.red
                            : Theme.of(context).colorScheme.onSurface,
                        size: 22,
                      ),
                      onPressed: () {
                        ref
                            .read(favoritesProvider.notifier)
                            .toggleFavorite(widget.propertyId);
                      },
                      padding: EdgeInsets.zero,
                    ),
                  );
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _DetailImageCarousel(
                images: property.images,
                propertyType: property.propertyType,
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type and Status badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Theme.of(
                                context,
                              ).colorScheme.primary.withOpacity(0.2),
                              Theme.of(
                                context,
                              ).colorScheme.primary.withOpacity(0.15),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Theme.of(
                              context,
                            ).colorScheme.primary.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          '${property.transactionType.toUpperCase()} • ${property.propertyType.toUpperCase()}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (property.status != 'available') ...[
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: property.status == 'sold'
                                ? Colors.green.withOpacity(0.2)
                                : Colors.orange.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: property.status == 'sold'
                                  ? Colors.green.withOpacity(0.5)
                                  : Colors.orange.withOpacity(0.5),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.check_circle,
                                size: 16,
                                color: property.status == 'sold'
                                    ? Colors.green
                                    : Colors.orange,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                property.status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: property.status == 'sold'
                                      ? Colors.green
                                      : Colors.orange,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    property.title,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Location
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 20,
                        color: Theme.of(
                          context,
                        ).colorScheme.onSurface.withOpacity(0.6),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${property.address.street ?? ''}, ${property.address.city}, ${property.address.country}',
                          style: TextStyle(
                            fontSize: 16,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Price
                  Text(
                    '\$${property.price.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Details Cards
                  Row(
                    children: [
                      if (property.bedrooms > 0)
                        Expanded(
                          child: _DetailCard(
                            icon: Icons.bed_outlined,
                            value: '${property.bedrooms}',
                            label: 'Bedrooms',
                          ),
                        ),
                      if (property.bedrooms > 0) const SizedBox(width: 12),
                      if (property.bathrooms > 0)
                        Expanded(
                          child: _DetailCard(
                            icon: Icons.bathroom_outlined,
                            value: '${property.bathrooms}',
                            label: 'Bathrooms',
                          ),
                        ),
                      if (property.bathrooms > 0) const SizedBox(width: 12),
                      Expanded(
                        child: _DetailCard(
                          icon: Icons.square_foot,
                          value: '${property.surface}',
                          label: 'Surface m²',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Description
                  Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    property.description,
                    style: TextStyle(
                      fontSize: 16,
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withOpacity(0.7),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Amenities
                  if (property.amenities.isNotEmpty) ...[
                    Text(
                      'Amenities',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: property.amenities.map((amenity) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Theme.of(context).colorScheme.surface,
                                Theme.of(
                                  context,
                                ).colorScheme.surface.withOpacity(0.9),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withOpacity(0.2),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  _getAmenityIcon(amenity),
                                  size: 16,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                amenity,
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Location Map
                  Text(
                    'Location',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (property.location != null)
                    PropertyMapWidget(
                      latitude: property.location!.latitude,
                      longitude: property.location!.longitude,
                      zoom: 15.0,
                      interactive: true,
                      height: 300,
                    )
                  else
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Theme.of(context).colorScheme.surface,
                            Theme.of(
                              context,
                            ).colorScheme.surface.withOpacity(0.9),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.2),
                          width: 1,
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Theme.of(
                                  context,
                                ).colorScheme.primary.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.location_off,
                                size: 48,
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.4),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Location not available',
                              style: TextStyle(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.4),
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 100), // Space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),

      // Contact/Edit button (conditional based on ownership)
      bottomNavigationBar: Builder(
        builder: (context) {
          final authState = ref.watch(authProvider);
          final isOwner = property.ownerId == authState.user?.id;

          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Theme.of(context).colorScheme.surface,
                  Theme.of(context).colorScheme.surface.withOpacity(0.9),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  blurRadius: 12,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: isOwner
                ? Row(
                    children: [
                      // Edit button
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Theme.of(context).colorScheme.primary,
                                Theme.of(
                                  context,
                                ).colorScheme.primary.withOpacity(0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Theme.of(
                                  context,
                                ).colorScheme.primary.withOpacity(0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ElevatedButton.icon(
                            onPressed: () {
                              context.push(
                                '/properties/${widget.propertyId}/edit',
                                extra: property,
                              );
                            },
                            icon: Icon(
                              Icons.edit,
                              color: Theme.of(context).colorScheme.onPrimary,
                            ),
                            label: Text(
                              'Edit Property',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).colorScheme.onPrimary,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Delete button
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.redAccent,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.redAccent.withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: IconButton(
                          onPressed: () => _showDeleteDialog(context, ref),
                          icon: Icon(
                            Icons.delete,
                            color: Theme.of(context).colorScheme.onPrimary,
                            size: 24,
                          ),
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                    ],
                  )
                : Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Theme.of(context).colorScheme.primary,
                          Theme.of(
                            context,
                          ).colorScheme.primary.withOpacity(0.8),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(
                            context,
                          ).colorScheme.primary.withOpacity(0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: () async {
                        final authState = ref.read(authProvider);

                        if (!authState.isAuthenticated ||
                            authState.user == null) {
                          // Show login required dialog
                          if (context.mounted) {
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: const Text('Login Required'),
                                content: const Text(
                                  'Please log in to contact the property owner.',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Cancel'),
                                  ),
                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(context);
                                      context.go('/login');
                                    },
                                    child: const Text('Login'),
                                  ),
                                ],
                              ),
                            );
                          }
                          return;
                        }

                        // Check if trying to contact yourself
                        if (property.ownerId == authState.user!.id) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('You cannot contact yourself'),
                                backgroundColor: Colors.orange,
                              ),
                            );
                          }
                          return;
                        }

                        // Check if ownerId is available
                        if (property.ownerId == null ||
                            property.ownerId!.isEmpty) {
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Owner information not available',
                                ),
                                backgroundColor: Colors.orange,
                              ),
                            );
                          }
                          return;
                        }

                        // Show loading indicator
                        if (context.mounted) {
                          showDialog(
                            context: context,
                            barrierDismissible: false,
                            builder: (context) => Center(
                              child: CircularProgressIndicator(
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                          );
                        }

                        try {
                          // Create or get existing conversation
                          final conversation = await ref
                              .read(conversationsProvider.notifier)
                              .getOrCreateConversation(
                                otherUserId: property.ownerId!,
                                propertyId: property.id ?? widget.propertyId,
                              );

                          // Close loading dialog
                          if (context.mounted) {
                            Navigator.pop(context);

                            // Navigate to chat screen
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ChatScreen(
                                  conversationId: conversation.id,
                                  otherUserName: conversation.otherUser.name,
                                  otherUserId: conversation.otherUser.id,
                                ),
                              ),
                            );
                          }
                        } catch (e) {
                          // Close loading dialog
                          if (context.mounted) {
                            Navigator.pop(context);

                            // Show error message
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Failed to start conversation: $e',
                                ),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Contact Owner',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onPrimary,
                        ),
                      ),
                    ),
                  ),
          );
        },
      ),
    );
  }

  IconData _getAmenityIcon(String amenity) {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return Icons.wifi;
      case 'parking':
        return Icons.local_parking;
      case 'elevator':
        return Icons.elevator;
      case 'ac':
      case 'air conditioning':
        return Icons.ac_unit;
      case 'pool':
      case 'swimming pool':
        return Icons.pool;
      case 'gym':
        return Icons.fitness_center;
      default:
        return Icons.check_circle;
    }
  }
}

class _DetailCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _DetailCard({
    required this.icon,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.surface,
            Theme.of(context).colorScheme.surface.withOpacity(0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              size: 28,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// Image carousel widget for detail page
class _DetailImageCarousel extends StatefulWidget {
  final List<String> images;
  final String propertyType;

  const _DetailImageCarousel({
    required this.images,
    required this.propertyType,
  });

  @override
  State<_DetailImageCarousel> createState() => _DetailImageCarouselState();
}

class _DetailImageCarouselState extends State<_DetailImageCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return _buildPlaceholderImage();
    }

    return Stack(
      children: [
        // Image carousel
        PageView.builder(
          controller: _pageController,
          onPageChanged: (index) {
            setState(() {
              _currentPage = index;
            });
          },
          itemCount: widget.images.length,
          itemBuilder: (context, index) {
            return _base64ToImage(widget.images[index]);
          },
        ),

        // Left arrow
        if (_currentPage > 0)
          Positioned(
            left: 16,
            top: 0,
            bottom: 0,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  _pageController.previousPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.chevron_left,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
            ),
          ),

        // Right arrow
        if (_currentPage < widget.images.length - 1)
          Positioned(
            right: 16,
            top: 0,
            bottom: 0,
            child: Center(
              child: GestureDetector(
                onTap: () {
                  _pageController.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.chevron_right,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
            ),
          ),

        // Page indicators
        if (widget.images.length > 1)
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.images.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentPage == index
                        ? Theme.of(context).colorScheme.onSurface
                        : Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.4),
                  ),
                ),
              ),
            ),
          ),

        // Image counter badge
        if (widget.images.length > 1)
          Positioned(
            top: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_currentPage + 1}/${widget.images.length}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _base64ToImage(String base64String) {
    try {
      // Remove data:image/jpeg;base64, prefix if present
      String cleanBase64 = base64String;
      if (base64String.contains(',')) {
        cleanBase64 = base64String.split(',')[1];
      }

      final bytes = base64Decode(cleanBase64);
      return Image.memory(
        bytes,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (context, error, stackTrace) {
          print('Error decoding image: $error');
          return _buildPlaceholderImage();
        },
      );
    } catch (e) {
      print('Error parsing base64 image: $e');
      return _buildPlaceholderImage();
    }
  }

  Widget _buildPlaceholderImage() {
    Color color1, color2;
    switch (widget.propertyType.toLowerCase()) {
      case 'apartment':
        color1 = const Color(0xFF667eea);
        color2 = const Color(0xFF764ba2);
        break;
      case 'house':
        color1 = const Color(0xFFf093fb);
        color2 = const Color(0xFFF5576C);
        break;
      case 'villa':
        color1 = const Color(0xFF4facfe);
        color2 = const Color(0xFF00f2fe);
        break;
      case 'land':
        color1 = const Color(0xFF43e97b);
        color2 = const Color(0xFF38f9d7);
        break;
      default:
        color1 = const Color(0xFFfa709a);
        color2 = const Color(0xFFfee140);
    }

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color1, color2],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.image_outlined,
          size: 80,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
        ),
      ),
    );
  }
}
