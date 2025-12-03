import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Handling background message: ${message.messageId}');
  debugPrint('Message data: ${message.data}');
  debugPrint('Message notification: ${message.notification?.title}');
}

class NotificationService {
  final Dio _dio;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _fcmToken;
  bool _initialized = false;

  NotificationService(this._dio);

  /// Initialize notification service
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Request permissions
      final settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint(
        'Notification permission status: ${settings.authorizationStatus}',
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        // Initialize local notifications
        await _initializeLocalNotifications();

        // Get FCM token
        _fcmToken = await _fcm.getToken();
        debugPrint('FCM Token: $_fcmToken');

        // Register token with backend
        if (_fcmToken != null) {
          await registerDeviceToken(_fcmToken!);
        }

        // Listen for token refresh
        _fcm.onTokenRefresh.listen((newToken) {
          _fcmToken = newToken;
          registerDeviceToken(newToken);
        });

        // Set up message handlers
        _setupMessageHandlers();

        _initialized = true;
      } else {
        debugPrint('Notification permission denied');
      }
    } catch (e) {
      debugPrint('Error initializing notifications: $e');
    }
  }

  /// Initialize local notifications for foreground display
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create Android notification channel
    const androidChannel = AndroidNotificationChannel(
      'default',
      'Default Notifications',
      description: 'Default notification channel',
      importance: Importance.high,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(androidChannel);
  }

  /// Set up FCM message handlers
  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Foreground message received: ${message.messageId}');
      _showLocalNotification(message);
    });

    // Background message handler (set in main.dart)
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Handle notification taps when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('Notification tapped: ${message.messageId}');
      _handleNotificationTap(message.data);
    });

    // Check for initial message (app opened from terminated state)
    _fcm.getInitialMessage().then((message) {
      if (message != null) {
        debugPrint('App opened from notification: ${message.messageId}');
        _handleNotificationTap(message.data);
      }
    });
  }

  /// Show local notification for foreground messages
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'default',
            'Default Notifications',
            channelDescription: 'Default notification channel',
            importance: Importance.high,
            priority: Priority.high,
            icon: android?.smallIcon ?? '@mipmap/ic_launcher',
            color: const Color(0xFF3ABAEC),
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: message.data.isNotEmpty ? jsonEncode(message.data) : null,
      );
    }
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      final data = jsonDecode(response.payload!);
      _handleNotificationTap(data);
    }
  }

  /// Handle notification navigation
  void _handleNotificationTap(Map<String, dynamic> data) {
    debugPrint('Handling notification tap: $data');

    // Extract route from payload
    final route = data['route'] as String?;
    final notificationId = data['notificationId'] as String?;

    // Mark notification as read
    if (notificationId != null) {
      markNotificationAsRead(notificationId);
    }

    // Navigate to route
    if (route != null) {
      // TODO: Use your navigation service to navigate
      // NavigationService.navigateTo(route);
      debugPrint('Should navigate to: $route');
    }
  }

  /// Register device token with backend
  Future<void> registerDeviceToken(String token) async {
    try {
      String platform = 'web';
      if (defaultTargetPlatform == TargetPlatform.android) {
        platform = 'android';
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        platform = 'ios';
      }

      await _dio.post(
        '/devices/register',
        data: {'deviceToken': token, 'platform': platform},
      );

      debugPrint('Device token registered successfully');
    } catch (e) {
      debugPrint('Failed to register device token: $e');
    }
  }

  /// Remove device token (call on logout)
  Future<void> removeDeviceToken() async {
    if (_fcmToken == null) return;

    try {
      await _dio.delete('/devices/token/$_fcmToken');
      debugPrint('Device token removed');
    } catch (e) {
      debugPrint('Failed to remove device token: $e');
    }
  }

  /// Fetch in-app notifications
  Future<Map<String, dynamic>> fetchNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  }) async {
    try {
      final response = await _dio.get(
        '/notifications',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (unreadOnly) 'unreadOnly': true,
        },
      );

      return response.data;
    } catch (e) {
      debugPrint('Failed to fetch notifications: $e');
      rethrow;
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/notifications/unread-count');
      return response.data['count'] as int;
    } catch (e) {
      debugPrint('Failed to get unread count: $e');
      return 0;
    }
  }

  /// Mark notification as read
  Future<void> markNotificationAsRead(String notificationId) async {
    try {
      await _dio.post('/notifications/$notificationId/read');
      debugPrint('Notification marked as read');
    } catch (e) {
      debugPrint('Failed to mark notification as read: $e');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      await _dio.post('/notifications/mark-all-read');
      debugPrint('All notifications marked as read');
    } catch (e) {
      debugPrint('Failed to mark all as read: $e');
    }
  }

  /// Delete notification
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _dio.post('/notifications/$notificationId/delete');
      debugPrint('Notification deleted');
    } catch (e) {
      debugPrint('Failed to delete notification: $e');
    }
  }

  /// Get current FCM token
  String? get fcmToken => _fcmToken;

  /// Check if initialized
  bool get isInitialized => _initialized;
}
