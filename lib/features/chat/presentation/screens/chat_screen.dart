import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/chat_provider.dart';
import '../providers/socket_provider.dart';
import '../widgets/message_bubble.dart';
import '../widgets/typing_indicator.dart';
import '../widgets/chat_input.dart';
import '../../data/datasources/chat_socket_datasource.dart' as datasource;
import '../../data/models/message_model.dart';
import '../../../auth/providers/auth_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String otherUserName;
  final String? otherUserId;
  final String? avatarUrl;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.otherUserName,
    this.otherUserId,
    this.avatarUrl,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isLoadingMore = false;
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      if (_isDisposed) return;

      // Ensure currentUserId is set from auth
      final currentUserId = ref.read(currentUserIdProvider);
      if (currentUserId == null) {
        final authState = ref.read(authProvider);
        if (authState.isAuthenticated && authState.user != null) {
          ref.read(currentUserIdProvider.notifier).state = authState.user!.id;
          print('✅ Chat: Set currentUserId from auth: ${authState.user!.id}');
        }
      } else {
        print('✅ Chat: currentUserId already set: $currentUserId');
      }

      final socket = ref.read(socketProvider);
      socket.joinConversation(widget.conversationId);

      ref
          .read(messagesProvider.notifier)
          .loadMessages(widget.conversationId)
          .then((_) {
            // After messages are loaded, mark visible ones as read
            // Wait a bit for the UI to render
            Future.delayed(const Duration(milliseconds: 500), () {
              if (!_isDisposed) {
                _markVisibleMessagesAsRead();
                print('✅ Marked visible messages as read after load');
              }
            });
          });

      ref.read(currentConversationProvider.notifier).state =
          widget.conversationId;

      // Subscribe to presence if we have other user's ID
      if (widget.otherUserId != null) {
        socket.subscribePresence(widget.otherUserId!);
      }
    });

    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _isDisposed = true;
    _scrollController.dispose();

    // Clean up current conversation to re-enable notifications
    Future.microtask(() {
      // Clear current conversation so notifications work again
      try {
        // Only access ref if not disposed
      } catch (e) {
        print('⚠️ Could not clear conversation on dispose: $e');
      }
    });

    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreMessages();
    }

    _markVisibleMessagesAsRead();
  }

  Future<void> _loadMoreMessages() async {
    if (_isLoadingMore) return;

    final messages = ref.read(messagesProvider).value;
    if (messages == null || messages.isEmpty) return;

    setState(() => _isLoadingMore = true);

    final oldestMessage = messages.last;
    await ref
        .read(messagesProvider.notifier)
        .loadMessages(widget.conversationId, before: oldestMessage.id);

    setState(() => _isLoadingMore = false);
  }

  void _markVisibleMessagesAsRead() {
    final messages = ref.read(messagesProvider).value;
    final currentUserId = ref.read(currentUserIdProvider);

    if (messages == null || currentUserId == null) return;

    final visibleMessages = messages
        .where((m) => m.senderId != currentUserId && m.id != null)
        .take(10)
        .map((m) => m.id!)
        .toList();

    if (visibleMessages.isNotEmpty) {
      ref
          .read(messagesProvider.notifier)
          .markMessagesAsRead(widget.conversationId, visibleMessages);
    }
  }

  void _handleSendMessage(String text) {
    final currentUserId = ref.read(currentUserIdProvider);
    if (currentUserId == null) {
      print('❌ Cannot send message: currentUserId is null');
      return;
    }

    print('✅ Sending message with senderId: $currentUserId');

    ref
        .read(messagesProvider.notifier)
        .sendMessage(
          conversationId: widget.conversationId,
          text: text,
          senderId: currentUserId,
        );

    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleTyping(bool isTyping) {
    ref
        .read(messagesProvider.notifier)
        .sendTypingIndicator(widget.conversationId, isTyping);
  }

  void _handleBackPress() {
    // Clear current conversation so notifications work again
    ref.read(currentConversationProvider.notifier).state = null;
    print('🔙 Cleared current conversation for notifications');
    Navigator.of(context).pop();
  }

  Future<void> _handleEditMessage(String messageId, String newText) async {
    try {
      await ref.read(remoteDataSourceProvider).editMessage(messageId, newText);

      // Reload messages to show updated message
      await ref
          .read(messagesProvider.notifier)
          .loadMessages(widget.conversationId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Message edited'),
            backgroundColor: Theme.of(context).colorScheme.primary,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to edit message: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(messagesProvider);
    final typingUsers = ref.watch(typingUsersProvider);
    final connectionState = ref.watch(connectionStateProvider);
    final currentUserId = ref.watch(currentUserIdProvider);

    return PopScope(
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          ref.read(currentConversationProvider.notifier).state = null;
          print(
            '🔙 System back: Cleared current conversation for notifications',
          );
        }
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).colorScheme.surface,
        appBar: AppBar(
          elevation: 4,
          backgroundColor: Theme.of(context).colorScheme.primary,
          surfaceTintColor: Colors.transparent,
          shadowColor: Colors.black.withOpacity(0.3),
          toolbarHeight: 70,
          leading: Padding(
            padding: const EdgeInsets.only(left: 8),
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              onPressed: _handleBackPress,
            ),
          ),
          titleSpacing: 4,
          title: Row(
            children: [
              // Avatar with border
              Container(
                width: 46,
                height: 46,
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipOval(
                  child:
                      widget.avatarUrl != null && widget.avatarUrl!.isNotEmpty
                      ? Image.network(
                          widget.avatarUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildAvatarText(),
                        )
                      : _buildAvatarText(),
                ),
              ),
              const SizedBox(width: 12),
              // Name and status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      widget.otherUserName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: -0.4,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    connectionState.when(
                      data: (state) => Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color:
                                  state == datasource.ConnectionState.connected
                                  ? Colors.green
                                  : Colors.orange,
                              boxShadow:
                                  state == datasource.ConnectionState.connected
                                  ? [
                                      BoxShadow(
                                        color: Colors.green.withOpacity(0.4),
                                        blurRadius: 4,
                                        spreadRadius: 1,
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            state == datasource.ConnectionState.connected
                                ? 'Online'
                                : 'Connecting...',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Colors.white70,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      loading: () => const Text(
                        'Loading...',
                        style: TextStyle(fontSize: 13, color: Colors.white60),
                      ),
                      error: (_, __) => Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withOpacity(0.3),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'Offline',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white60,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.more_vert_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () async {
                  final value = await showMenu<String>(
                    context: context,
                    position: const RelativeRect.fromLTRB(1000, 80, 0, 0),
                    color: Theme.of(context).colorScheme.surface,
                    elevation: 8,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    items: [
                      if (widget.otherUserId != null &&
                          widget.otherUserId != 'unknown' &&
                          widget.otherUserId!.length == 24)
                        PopupMenuItem(
                          value: 'profile',
                          child: Row(
                            children: [
                              Icon(
                                Icons.person_outline_rounded,
                                color: Theme.of(context).colorScheme.primary,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'View Profile',
                                style: TextStyle(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ),
                      PopupMenuItem(
                        value: 'mute',
                        child: Row(
                          children: [
                            const Icon(
                              Icons.notifications_off_outlined,
                              color: Colors.orange,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Mute',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'block',
                        child: Row(
                          children: [
                            const Icon(
                              Icons.block_outlined,
                              color: Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Block User',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            const Icon(
                              Icons.delete_outline_rounded,
                              color: Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Delete',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );

                  if (value != null) {
                    switch (value) {
                      case 'profile':
                        // Navigate to user profile
                        if (widget.otherUserId != null &&
                            widget.otherUserId != 'unknown' &&
                            widget.otherUserId!.length == 24) {
                          context.push('/user-profile/${widget.otherUserId}');
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Cannot view profile: Invalid user ID',
                              ),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                        break;
                      case 'mute':
                        try {
                          await ref
                              .read(remoteDataSourceProvider)
                              .muteConversation(widget.conversationId);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('Conversation muted'),
                                backgroundColor: Theme.of(
                                  context,
                                ).colorScheme.primary,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Failed to mute: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                        break;
                      case 'block':
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.surface,
                            title: Text(
                              'Block User',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                            content: Text(
                              'Are you sure you want to block ${widget.otherUserName}? You won\'t receive messages from them.',
                              style: TextStyle(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.8),
                              ),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text(
                                  'Cancel',
                                  style: TextStyle(color: Colors.white70),
                                ),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: TextButton.styleFrom(
                                  foregroundColor: Colors.red,
                                ),
                                child: const Text('Block'),
                              ),
                            ],
                          ),
                        );
                        if (confirmed == true) {
                          try {
                            await ref
                                .read(remoteDataSourceProvider)
                                .blockUser(widget.conversationId);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('User blocked'),
                                  backgroundColor: Theme.of(
                                    context,
                                  ).colorScheme.primary,
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                              // Go back to conversation list
                              Navigator.pop(context);
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed to block: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        }
                        break;
                      case 'delete':
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.surface,
                            title: Text(
                              'Delete Conversation',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                            ),
                            content: Text(
                              'Are you sure you want to delete this conversation? This action cannot be undone.',
                              style: TextStyle(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurface.withOpacity(0.8),
                              ),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text(
                                  'Cancel',
                                  style: TextStyle(color: Colors.white70),
                                ),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                style: TextButton.styleFrom(
                                  foregroundColor: Colors.red,
                                ),
                                child: const Text('Delete'),
                              ),
                            ],
                          ),
                        );
                        if (confirmed == true) {
                          try {
                            await ref
                                .read(remoteDataSourceProvider)
                                .deleteConversation(widget.conversationId);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Conversation deleted'),
                                  backgroundColor: Theme.of(
                                    context,
                                  ).colorScheme.primary,
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                              // Go back to conversation list
                              Navigator.pop(context);
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed to delete: $e'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        }
                        break;
                    }
                  }
                },
              ),
            ),
          ],
        ),
        body: Column(
          children: [
            // Subtle connection warning
            connectionState.when(
              data: (state) {
                if (state != datasource.ConnectionState.connected) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              state == datasource.ConnectionState.connecting
                                  ? Colors.orange
                                  : Colors.red,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          state == datasource.ConnectionState.connecting
                              ? 'Reconnecting to server...'
                              : 'No connection. Messages will be sent when back online.',
                          style: TextStyle(
                            fontSize: 12,
                            color:
                                state == datasource.ConnectionState.connecting
                                ? Colors.orange[800]
                                : Colors.red[800],
                          ),
                        ),
                      ],
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // Messages list
            Expanded(
              child: messagesAsync.when(
                data: (messages) {
                  if (messages.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Theme.of(context).colorScheme.primary,
                                  Theme.of(
                                    context,
                                  ).colorScheme.primary.withOpacity(0.7),
                                ],
                              ),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.primary.withOpacity(0.3),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.chat_bubble_outline,
                              size: 50,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'No messages yet',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Start the conversation with ${widget.otherUserName}',
                            style: TextStyle(
                              fontSize: 14,
                              color: Theme.of(
                                context,
                              ).colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    itemCount: messages.length + (_isLoadingMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (_isLoadingMore && index == messages.length) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.blue[400]!,
                                ),
                              ),
                            ),
                          ),
                        );
                      }

                      final message = messages[index];
                      final isMe = message.senderId == currentUserId;

                      // Debug: Log first message comparison
                      if (index == 0) {
                        print(
                          '🔍 Message sender: ${message.senderId}, Current user: $currentUserId, IsMe: $isMe',
                        );
                      }

                      // Show date separator
                      bool showDateSeparator = false;
                      if (index == messages.length - 1) {
                        showDateSeparator = true;
                      } else {
                        final nextMessage = messages[index + 1];
                        showDateSeparator = !_isSameDay(
                          message.createdAt,
                          nextMessage.createdAt,
                        );
                      }

                      return Column(
                        children: [
                          if (showDateSeparator)
                            _buildDateSeparator(message.createdAt),
                          MessageBubble(
                            key: ValueKey(message.id ?? message.localId),
                            message: message,
                            isMe: isMe,
                            onRetry: message.status == MessageStatus.failed
                                ? () => ref
                                      .read(messagesProvider.notifier)
                                      .retryFailedMessage(message)
                                : null,
                            onEdit: isMe && message.id != null
                                ? (newText) =>
                                      _handleEditMessage(message.id!, newText)
                                : null,
                          ),
                        ],
                      );
                    },
                  );
                },
                loading: () => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.blue[400]!,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Loading messages...',
                        style: TextStyle(
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                error: (error, stack) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.red[50],
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.error_outline,
                            size: 40,
                            color: Colors.red[400],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Failed to load messages',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          error.toString(),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: () => ref
                              .read(messagesProvider.notifier)
                              .loadMessages(widget.conversationId),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Try Again'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Theme.of(
                              context,
                            ).colorScheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Typing indicator
            if (typingUsers.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Row(
                  children: [TypingIndicator(userNames: typingUsers.toList())],
                ),
              ),

            // Input
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                border: Border(
                  top: BorderSide(
                    color: Theme.of(
                      context,
                    ).colorScheme.outline.withOpacity(0.1),
                    width: 1,
                  ),
                ),
              ),
              child: ChatInput(
                onSendMessage: _handleSendMessage,
                onTyping: _handleTyping,
                onAttachment: () {
                  // TODO: Show attachment picker
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Attachments coming soon!'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarText() {
    final initials = widget.otherUserName
        .split(' ')
        .take(2)
        .map((word) => word.isNotEmpty ? word[0].toUpperCase() : '')
        .join();

    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [Colors.orange.shade700, Colors.orange.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(date.year, date.month, date.day);

    String dateText;
    if (messageDate == today) {
      dateText = 'Today';
    } else if (messageDate == yesterday) {
      dateText = 'Yesterday';
    } else {
      dateText = '${date.day}/${date.month}/${date.year}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(
            child: Divider(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              dateText,
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Divider(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }
}
