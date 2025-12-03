import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/signup_page.dart';
import '../features/home/home_page.dart';
import '../features/property/presentation/pages/property_list_page.dart';
import '../features/property/presentation/pages/property_detail_page.dart';
import '../features/property/presentation/pages/create_property_page.dart';
import '../features/profile/profile_page.dart';
import '../features/chat/presentation/screens/conversation_list_screen.dart';
import '../features/chat/presentation/screens/chat_screen.dart';
import '../features/notifications/presentation/screens/notifications_screen.dart';
import '../features/search/presentation/screens/search_screen.dart';
import '../features/favorites/presentation/screens/wishlist_page.dart';
import '../features/billing/subscription_screen.dart';
import '../features/billing/payment_selection_screen.dart';
import '../features/chat/presentation/screens/user_profile_screen.dart';
import '../features/splash/splash_screen.dart';
import '../core/models/property_model.dart';

// Track if splash has been shown to prevent auth redirect on first load
bool _splashShown = false;

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isSplash = state.matchedLocation == '/splash';

      // Always allow splash screen to show on first load
      if (isSplash) {
        _splashShown = true;
        return null;
      }

      // Don't redirect until splash has been shown at least once
      if (!_splashShown) {
        return null;
      }

      final authState = ref.read(authProvider);
      final isLoggedIn = authState.isAuthenticated;
      final isGuest = authState.isGuest;
      final isAuthRoute =
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup';

      // Allow guests and authenticated users to access most routes
      final isPublicRoute =
          state.matchedLocation == '/home' ||
          state.matchedLocation == '/properties' ||
          state.matchedLocation == '/search' ||
          state.matchedLocation.startsWith('/properties/');

      // Redirect to login only if not authenticated AND not guest AND not on auth/public routes
      if (!isLoggedIn && !isGuest && !isAuthRoute && !isPublicRoute) {
        return '/login';
      }

      // If authenticated user tries to access auth routes, go home
      // But allow guests to access login/signup pages
      if (isLoggedIn && isAuthRoute) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupPage()),
      GoRoute(path: '/home', builder: (context, state) => const HomePage()),
      GoRoute(
        path: '/properties',
        builder: (context, state) => const PropertyListPage(),
      ),
      GoRoute(
        path: '/properties/create',
        builder: (context, state) => const CreatePropertyPage(),
      ),
      GoRoute(
        path: '/properties/:id/edit',
        builder: (context, state) {
          final property = state.extra as Property?;
          return CreatePropertyPage(existingProperty: property);
        },
      ),
      GoRoute(
        path: '/properties/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return PropertyDetailPage(propertyId: id);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) => const ConversationListScreen(),
      ),
      GoRoute(
        path: '/chat/:conversationId',
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId']!;
          final otherUserName = state.uri.queryParameters['name'] ?? 'User';
          final otherUserId = state.uri.queryParameters['userId'];

          return ChatScreen(
            conversationId: conversationId,
            otherUserName: otherUserName,
            otherUserId: otherUserId,
          );
        },
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/favorites',
        builder: (context, state) => const WishlistPage(),
      ),
      GoRoute(
        path: '/subscription',
        builder: (context, state) => const SubscriptionScreen(),
      ),
      GoRoute(
        path: '/payment-selection',
        builder: (context, state) => const PaymentSelectionScreen(),
      ),
      GoRoute(
        path: '/user-profile/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return UserProfileScreen(userId: userId);
        },
      ),
    ],
  );
});
