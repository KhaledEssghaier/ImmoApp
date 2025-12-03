import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import 'guest_login_prompt.dart';

class SimpleBottomNavBar extends ConsumerWidget {
  final int currentIndex;

  const SimpleBottomNavBar({super.key, required this.currentIndex});

  void _onTap(BuildContext context, WidgetRef ref, int index) {
    if (index == currentIndex) return;

    // Check if guest is trying to access restricted features
    final authState = ref.read(authProvider);
    if (authState.isGuest) {
      // Restricted features for guests: favorites(1), create(2), chat(3), profile(4)
      if (index == 1) {
        context.push('/favorites'); // Favorites page shows guest info
        return;
      }
      if (index == 2) {
        showGuestLoginPrompt(context, feature: 'create properties');
        return;
      }
      if (index == 3) {
        context.go('/chat'); // Chat page shows guest info
        return;
      }
      if (index == 4) {
        context.go('/profile'); // Profile page shows guest info
        return;
      }
    }

    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.push('/favorites');
        break;
      case 2:
        context.push('/properties/create');
        break;
      case 3:
        context.go('/chat');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: const BoxDecoration(color: Colors.transparent),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                context,
                ref,
                0,
                Icons.home_outlined,
                Icons.home,
                'Home',
              ),
              _buildNavItem(
                context,
                ref,
                1,
                Icons.favorite_border,
                Icons.favorite,
                'Saved',
              ),
              _buildNavItem(
                context,
                ref,
                2,
                Icons.add_circle_outline,
                Icons.add_circle,
                '',
              ),
              _buildNavItem(
                context,
                ref,
                3,
                Icons.chat_bubble_outline,
                Icons.chat_bubble,
                'Messages',
              ),
              _buildNavItem(
                context,
                ref,
                4,
                Icons.person_outline,
                Icons.person,
                'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    WidgetRef ref,
    int index,
    IconData unselectedIcon,
    IconData selectedIcon,
    String label,
  ) {
    final bool isSelected = currentIndex == index;

    return GestureDetector(
      onTap: () => _onTap(context, ref, index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withOpacity(0.3),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? selectedIcon : unselectedIcon,
              color: isSelected
                  ? Theme.of(context).colorScheme.primary
                  : Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
              size: index == 2 ? 32 : 26,
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(
                          context,
                        ).colorScheme.onSurface.withOpacity(0.4),
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
