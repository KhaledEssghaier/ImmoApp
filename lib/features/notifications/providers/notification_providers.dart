import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../services/notification_service.dart';
import '../../auth/providers/auth_provider.dart';

// Provider for notification-specific Dio instance
final notificationDioProvider = Provider<Dio>((ref) {
  final storage = ref.read(storageServiceProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3006/api/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Add logging interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        print(
          '[NotificationDio] 📞 Request to: ${options.method} ${options.uri}',
        );
        final token = await storage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
          print('[NotificationDio] 🔑 Token added');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        print('[NotificationDio] ✅ Response: ${response.statusCode}');
        return handler.next(response);
      },
      onError: (error, handler) {
        print('[NotificationDio] ❌ Error: ${error.message}');
        return handler.next(error);
      },
    ),
  );

  return dio;
});

// Provider for notification service
final notificationServiceProvider = Provider<NotificationService>((ref) {
  final dio = ref.watch(notificationDioProvider);
  return NotificationService(dio);
});

// Provider for unread count
final unreadCountProvider = FutureProvider<int>((ref) async {
  final notificationService = ref.watch(notificationServiceProvider);
  return await notificationService.getUnreadCount();
});

// Provider for notifications list
final notificationsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final notificationService = ref.watch(notificationServiceProvider);
  return await notificationService.fetchNotifications(page: 1, limit: 20);
});

// StateNotifier for managing notifications state
class NotificationsNotifier extends StateNotifier<AsyncValue<List<dynamic>>> {
  final NotificationService _service;
  int _currentPage = 1;
  bool _hasMore = true;

  NotificationsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadNotifications();
  }

  Future<void> loadNotifications({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      state = const AsyncValue.loading();
    }

    try {
      final response = await _service.fetchNotifications(
        page: _currentPage,
        limit: 20,
      );

      final notifications = response['data'] as List;
      final pagination = response['pagination'] as Map<String, dynamic>;

      _hasMore = _currentPage < pagination['totalPages'];

      if (refresh) {
        state = AsyncValue.data(notifications);
      } else {
        state.whenData((current) {
          state = AsyncValue.data([...current, ...notifications]);
        });
      }
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> loadMore() async {
    if (!_hasMore) return;
    _currentPage++;
    await loadNotifications();
  }

  Future<void> markAsRead(String notificationId) async {
    await _service.markNotificationAsRead(notificationId);
    // Update local state
    state.whenData((notifications) {
      final updated = notifications.map((n) {
        if (n['_id'] == notificationId) {
          return {...n, 'read': true};
        }
        return n;
      }).toList();
      state = AsyncValue.data(updated);
    });
  }

  Future<void> deleteNotification(String notificationId) async {
    await _service.deleteNotification(notificationId);
    // Update local state
    state.whenData((notifications) {
      final updated = notifications
          .where((n) => n['_id'] != notificationId)
          .toList();
      state = AsyncValue.data(updated);
    });
  }
}

final notificationsNotifierProvider =
    StateNotifierProvider<NotificationsNotifier, AsyncValue<List<dynamic>>>((
      ref,
    ) {
      final service = ref.watch(notificationServiceProvider);
      return NotificationsNotifier(service);
    });
