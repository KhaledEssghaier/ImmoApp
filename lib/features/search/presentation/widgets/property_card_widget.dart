import 'package:flutter/material.dart';
import '../../../../core/models/property_model.dart';

class PropertyCardWidget extends StatelessWidget {
  final Property property;
  final VoidCallback onTap;

  const PropertyCardWidget({
    Key? key,
    required this.property,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      color: const Color(0xFF1F2C34),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Colors.white10),
      ),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Property Image
            _buildImage(),

            // Property Details
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    property.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.white54,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${property.address.city}, ${property.address.country}',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Property Info
                  Row(
                    children: [
                      _buildInfoChip(Icons.bed, '${property.bedrooms} beds'),
                      const SizedBox(width: 8),
                      _buildInfoChip(
                        Icons.bathtub,
                        '${property.bathrooms} baths',
                      ),
                      const SizedBox(width: 8),
                      _buildInfoChip(
                        Icons.square_foot,
                        '${property.surface} m²',
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Price and Status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$${property.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.blueAccent,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _getStatusColor(property.transactionType),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          property.transactionType.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
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

  Widget _buildImage() {
    if (property.mediaIds.isEmpty) {
      return Container(
        height: 200,
        color: Colors.grey[300],
        child: const Center(
          child: Icon(Icons.home, size: 64, color: Colors.grey),
        ),
      );
    }

    return Stack(
      children: [
        Image.network(
          property.mediaIds.first,
          height: 200,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              height: 200,
              color: Colors.grey[300],
              child: const Center(
                child: Icon(Icons.broken_image, size: 64, color: Colors.grey),
              ),
            );
          },
        ),
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              property.propertyType,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white54),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Colors.white70),
        ),
      ],
    );
  }

  Color _getStatusColor(String transactionType) {
    switch (transactionType.toLowerCase()) {
      case 'sale':
        return Colors.green;
      case 'rent':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
