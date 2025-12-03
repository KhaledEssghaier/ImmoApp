import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/favorites_provider.dart';
import '../models/favorite_state.dart';
import '../../../widgets/guest_login_prompt.dart';
import '../../auth/providers/auth_provider.dart';

class FavoriteButton extends ConsumerStatefulWidget {
  final String propertyId;
  final double size;
  final Color? activeColor;
  final Color? inactiveColor;
  final VoidCallback? onToggle;

  const FavoriteButton({
    Key? key,
    required this.propertyId,
    this.size = 24,
    this.activeColor,
    this.inactiveColor,
    this.onToggle,
  }) : super(key: key);

  @override
  ConsumerState<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends ConsumerState<FavoriteButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotateAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.0,
          end: 1.4,
        ).chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.4,
          end: 1.0,
        ).chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_controller);

    _rotateAnimation = Tween<double>(
      begin: 0,
      end: 0.1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.elasticOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() async {
    // Check if user is guest
    final authState = ref.read(authProvider);
    if (authState.isGuest) {
      showGuestLoginPrompt(context, feature: 'add favorites');
      return;
    }

    // Trigger animation
    await _controller.forward(from: 0);

    // Toggle favorite
    ref.read(favoritesProvider.notifier).toggleFavorite(widget.propertyId);

    // Callback
    widget.onToggle?.call();
  }

  @override
  Widget build(BuildContext context) {
    final isFavorite = ref.watch(isFavoriteProvider(widget.propertyId));
    final status = ref.watch(favoriteStatusProvider(widget.propertyId));

    final activeColor = widget.activeColor ?? const Color(0xFFFF6B6B);
    final inactiveColor = widget.inactiveColor ?? Colors.white;

    return GestureDetector(
      onTap: _handleTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Transform.rotate(
              angle: _rotateAnimation.value,
              child: _buildIcon(isFavorite, status, activeColor, inactiveColor),
            ),
          );
        },
      ),
    );
  }

  Widget _buildIcon(
    bool isFavorite,
    FavoriteSyncStatus status,
    Color activeColor,
    Color inactiveColor,
  ) {
    // Show loading indicator for pending status
    if (status == FavoriteSyncStatus.pending) {
      return SizedBox(
        width: widget.size,
        height: widget.size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(
              isFavorite ? Icons.favorite : Icons.favorite_border,
              size: widget.size,
              color: isFavorite
                  ? activeColor.withOpacity(0.5)
                  : inactiveColor.withOpacity(0.5),
            ),
            SizedBox(
              width: widget.size * 1.2,
              height: widget.size * 1.2,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  isFavorite ? activeColor : inactiveColor,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Show warning indicator for failed status
    if (status == FavoriteSyncStatus.failed) {
      return Badge(
        label: const Icon(Icons.warning, size: 8, color: Colors.white),
        backgroundColor: Colors.orange,
        child: Icon(
          isFavorite ? Icons.favorite : Icons.favorite_border,
          size: widget.size,
          color: isFavorite ? activeColor : inactiveColor,
        ),
      );
    }

    // Normal favorite icon
    return Icon(
      isFavorite ? Icons.favorite : Icons.favorite_border,
      size: widget.size,
      color: isFavorite ? activeColor : inactiveColor,
      shadows: isFavorite
          ? [Shadow(color: activeColor.withOpacity(0.5), blurRadius: 8)]
          : null,
    );
  }
}

/// Compact favorite button for property cards
class CompactFavoriteButton extends ConsumerWidget {
  final String propertyId;

  const CompactFavoriteButton({Key? key, required this.propertyId})
    : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorite = ref.watch(isFavoriteProvider(propertyId));
    final status = ref.watch(favoriteStatusProvider(propertyId));

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: FavoriteButton(
        propertyId: propertyId,
        size: 20,
        activeColor: const Color(0xFFFF6B6B),
        inactiveColor: Colors.grey.shade600,
      ),
    );
  }
}

/// Large favorite button for detail pages
class LargeFavoriteButton extends ConsumerWidget {
  final String propertyId;
  final bool showLabel;

  const LargeFavoriteButton({
    Key? key,
    required this.propertyId,
    this.showLabel = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFavorite = ref.watch(isFavoriteProvider(propertyId));

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isFavorite
              ? [const Color(0xFFFF6B6B), const Color(0xFFFF5252)]
              : [const Color(0xFF1F2C34), const Color(0xFF1A2328)],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: isFavorite
                ? const Color(0xFFFF6B6B).withOpacity(0.3)
                : Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            ref.read(favoritesProvider.notifier).toggleFavorite(propertyId);
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                FavoriteButton(
                  propertyId: propertyId,
                  size: 24,
                  activeColor: Colors.white,
                  inactiveColor: Colors.white,
                ),
                if (showLabel) ...[
                  const SizedBox(width: 8),
                  Text(
                    isFavorite ? 'Saved' : 'Save',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
