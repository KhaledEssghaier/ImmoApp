import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../providers/notification_providers.dart';
import '../../../../widgets/guest_login_prompt.dart';
import '../../../auth/providers/auth_provider.dart';
// import '../../../../widgets/simple_bottom_nav_bar.dart';

// Notification model
class AppNotification {
  final String id;
  final String title;
  final String body;
  final Map<String, dynamic> payload;
  final String type;
  final bool read;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.payload,
    required this.type,
    required this.read,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    // Safely convert data/payload to Map<String, dynamic>
    Map<String, dynamic> convertToMap(dynamic value) {
      if (value == null) return {};
      if (value is Map<String, dynamic>) return value;
      if (value is Map) {
        return Map<String, dynamic>.from(value);
      }
      return {};
    }

    return AppNotification(
      id: json['_id'] as String,
      title: json['title'] as String,
      // Backend uses 'message' field, map it to 'body' for compatibility
      body: (json['message'] ?? json['body'] ?? '') as String,
      // Backend uses 'data' field, map it to 'payload' for compatibility
      payload: convertToMap(json['data'] ?? json['payload']),
      type: json['type'] as String,
      read: json['read'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

// In-app notifications screen
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  List<AppNotification> _notifications = [];
  List<AppNotification> _allNotifications = [];
  bool _loading = true;
  int _page = 1;
  bool _hasMore = true;
  late TabController _tabController;
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadNotifications();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {
        _selectedFilter = [
          'all',
          'message',
          'property',
          'system',
        ][_tabController.index];
        _filterNotifications();
      });
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _filterNotifications() {
    if (_selectedFilter == 'all') {
      _notifications = List.from(_allNotifications);
    } else if (_selectedFilter == 'property') {
      _notifications = _allNotifications
          .where(
            (n) => n.type == 'property_view' || n.type == 'property_published',
          )
          .toList();
    } else {
      _notifications = _allNotifications
          .where((n) => n.type == _selectedFilter)
          .toList();
    }
  }

  Future<void> _loadNotifications({bool refresh = false}) async {
    if (refresh) {
      _page = 1;
      _hasMore = true;
      _allNotifications.clear();
    }

    setState(() => _loading = true);

    try {
      final notificationService = ref.read(notificationServiceProvider);
      final response = await notificationService.fetchNotifications(
        page: _page,
        limit: 20,
      );

      final data = response['data'] as List;
      final notifications = data
          .map((json) => AppNotification.fromJson(json))
          .toList();

      setState(() {
        if (refresh) {
          _allNotifications = notifications;
        } else {
          _allNotifications.addAll(notifications);
        }
        _filterNotifications();
        _hasMore = _page < (response['pagination']['totalPages'] as int);
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load notifications: $e')),
        );
      }
    }
  }

  Future<void> _markAsRead(AppNotification notification) async {
    if (notification.read) return;

    try {
      final notificationService = ref.read(notificationServiceProvider);
      await notificationService.markNotificationAsRead(notification.id);

      setState(() {
        // Update in all notifications list
        final allIndex = _allNotifications.indexWhere(
          (n) => n.id == notification.id,
        );
        if (allIndex != -1) {
          _allNotifications[allIndex] = AppNotification(
            id: notification.id,
            title: notification.title,
            body: notification.body,
            payload: notification.payload,
            type: notification.type,
            read: true,
            createdAt: notification.createdAt,
          );
        }
        // Refresh filtered list
        _filterNotifications();
      });

      // Refresh unread count
      ref.invalidate(unreadCountProvider);

      // Navigate to route if available
      final route = notification.payload['route'] as String?;
      if (route != null && mounted) {
        context.push(route);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to mark as read: $e')));
      }
    }
  }

  Future<void> _deleteNotification(AppNotification notification) async {
    try {
      final notificationService = ref.read(notificationServiceProvider);
      await notificationService.deleteNotification(notification.id);

      setState(() {
        _notifications.removeWhere((n) => n.id == notification.id);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete notification: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    // Show guest info if user is in guest mode
    if (authState.isGuest) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: AppBar(
          backgroundColor: Theme.of(context).colorScheme.surface,
          elevation: 0,
          title: const Text(
            'Notifications',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
          ),
        ),
        body: const GuestInfoWidget(),
      );
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go('/home');
                  }
                },
              ),
              actions: [
                TextButton.icon(
                  onPressed: _markAllAsRead,
                  icon: Icon(
                    Icons.done_all,
                    color: Theme.of(context).colorScheme.primary,
                    size: 18,
                  ),
                  label: Text(
                    'Mark all',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Theme.of(context).colorScheme.surface,
                        Theme.of(
                          context,
                        ).scaffoldBackgroundColor.withOpacity(0.8),
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Notifications',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          height: 1.1,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Stay updated with your activity',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverTabBarDelegate(
                TabBar(
                  controller: _tabController,
                  indicatorColor: Theme.of(context).colorScheme.primary,
                  indicatorWeight: 3,
                  labelColor: Theme.of(context).colorScheme.primary,
                  unselectedLabelColor: Colors.white54,
                  labelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  tabs: const [
                    Tab(text: 'All'),
                    Tab(text: 'Messages'),
                    Tab(text: 'Properties'),
                    Tab(text: 'System'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: Column(
          children: [
            // Date Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                  bottom: BorderSide(
                    color: Colors.white.withOpacity(0.1),
                    width: 1,
                  ),
                ),
              ),
              child: const Text(
                'Today',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            // Notifications List
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => _loadNotifications(refresh: true),
                color: Theme.of(context).colorScheme.primary,
                backgroundColor: Theme.of(context).colorScheme.surface,
                child: _loading && _notifications.isEmpty
                    ? Center(
                        child: CircularProgressIndicator(
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      )
                    : _notifications.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: _notifications.length + (_hasMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _notifications.length) {
                            // Load more indicator
                            if (!_loading) {
                              _page++;
                              _loadNotifications();
                            }
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: CircularProgressIndicator(
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                            );
                          }

                          final notification = _notifications[index];
                          return _buildNotificationCard(notification);
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
      // Bottom Navigation
      //bottomNavigationBar: const SimpleBottomNavBar(currentIndex: 3),
    );
  }

  Widget _buildNotificationCard(AppNotification notification) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: notification.read
              ? [
                  Theme.of(context).colorScheme.surface.withOpacity(0.5),
                  Theme.of(context).colorScheme.surface.withOpacity(0.3),
                ]
              : [
                  Theme.of(context).colorScheme.surface,
                  Theme.of(context).colorScheme.surface.withOpacity(0.9),
                ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notification.read
              ? Colors.white.withOpacity(0.03)
              : Theme.of(context).colorScheme.primary.withOpacity(0.2),
          width: notification.read ? 1 : 1.5,
        ),
        boxShadow: notification.read
            ? []
            : [
                BoxShadow(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _markAsRead(notification),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon based on type with enhanced design
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        _getColorForType(notification.type).withOpacity(0.2),
                        _getColorForType(notification.type).withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _getColorForType(
                        notification.type,
                      ).withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    _getIconForType(notification.type),
                    color: _getColorForType(notification.type),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: notification.read
                                    ? FontWeight.w500
                                    : FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (!notification.read)
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        notification.body,
                        style: TextStyle(
                          fontSize: 14,
                          color: notification.read
                              ? Colors.white54
                              : Colors.white70,
                          height: 1.5,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: Colors.white.withOpacity(0.4),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatTimestamp(notification.createdAt),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.4),
                              fontWeight: FontWeight.w500,
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
        ),
      ),
    );
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'message':
        return const Color(0xFF25D366); // Green
      case 'property_view':
      case 'property_published':
        return const Color(0xFFFF6B35); // Orange
      case 'promotion':
        return const Color(0xFFFFB800); // Yellow
      case 'admin':
        return const Color(0xFFFF6B6B); // Red
      default:
        return const Color(0xFF3ABAEC);
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.notifications_none,
              size: 80,
              color: Colors.white24,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No notifications',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'You\'re all caught up!',
            style: TextStyle(fontSize: 14, color: Colors.white54),
          ),
        ],
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'message':
        return Icons.chat_bubble_outline;
      case 'property_view':
        return Icons.visibility_outlined;
      case 'property_published':
        return Icons.home_outlined;
      case 'promotion':
        return Icons.local_offer_outlined;
      case 'admin':
        return Icons.admin_panel_settings_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return DateFormat.MMMd().format(timestamp);
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final notificationService = ref.read(notificationServiceProvider);
      await notificationService.markAllAsRead();

      setState(() {
        // Update both lists
        _allNotifications = _allNotifications.map((n) {
          return AppNotification(
            id: n.id,
            title: n.title,
            body: n.body,
            payload: n.payload,
            type: n.type,
            read: true,
            createdAt: n.createdAt,
          );
        }).toList();
        _filterNotifications();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('All notifications marked as read'),
            backgroundColor: Theme.of(context).colorScheme.primary,
            duration: const Duration(seconds: 2),
          ),
        );
      }

      // Refresh unread count
      ref.invalidate(unreadCountProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to mark all as read: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _SliverTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: Theme.of(context).colorScheme.surface,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
