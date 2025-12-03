import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../../core/constants/api_constants.dart';
import '../../../../core/storage/secure_storage_service.dart';

enum ConnectionState { disconnected, connecting, connected }

class ChatSocketDataSource {
  IO.Socket? _socket;
  final SecureStorageService _storage = SecureStorageService();

  final _connectionController = StreamController<ConnectionState>.broadcast();
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _readReceiptController =
      StreamController<Map<String, dynamic>>.broadcast();
  final _presenceController =
      StreamController<Map<String, dynamic>>.broadcast();

  ConnectionState _currentState = ConnectionState.disconnected;
  Timer? _reconnectTimer;
  int _reconnectAttempt = 0;
  bool _isInitialized = false;

  Stream<ConnectionState> get connectionStream => _connectionController.stream;
  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingController.stream;
  Stream<Map<String, dynamic>> get readReceiptStream =>
      _readReceiptController.stream;
  Stream<Map<String, dynamic>> get presenceStream => _presenceController.stream;

  bool get isConnected => _currentState == ConnectionState.connected;

  ChatSocketDataSource() {
    _initSocket();
  }

  Future<void> _initSocket() async {
    if (_isInitialized) return;

    final token = await _storage.getAccessToken();

    _socket = IO.io(
      ApiConstants.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .setReconnectionDelay(ApiConstants.reconnectDelay.inMilliseconds)
          .setReconnectionDelayMax(
            ApiConstants.maxReconnectDelay.inMilliseconds,
          )
          .setReconnectionAttempts(ApiConstants.reconnectAttempts)
          .build(),
    );

    _isInitialized = true;
    _setupListeners();
  }

  void _setupListeners() {
    _socket?.onConnect((_) {
      print('✅ Socket connected');
      _currentState = ConnectionState.connected;
      _connectionController.add(ConnectionState.connected);
      _reconnectAttempt = 0;
      _reconnectTimer?.cancel();
    });

    _socket?.onDisconnect((_) {
      print('❌ Socket disconnected');
      _currentState = ConnectionState.disconnected;
      _connectionController.add(ConnectionState.disconnected);
      _attemptReconnect();
    });

    _socket?.onConnectError((error) {
      print('❌ Connection error: $error');
      if (error.toString().contains('401')) {
        _handleAuthError();
      }
    });

    _socket?.onError((error) {
      print('❌ Socket error: $error');
    });

    // Chat events
    _socket?.on('message_new', (data) {
      print('📨 New message received: $data');
      _messageController.add(Map<String, dynamic>.from(data));
    });

    _socket?.on('message_status', (data) {
      print('✅ Message status: $data');
      _messageController.add(Map<String, dynamic>.from(data));
    });

    _socket?.on('typing', (data) {
      print('⌨️ Typing: $data');
      _typingController.add(Map<String, dynamic>.from(data));
    });

    _socket?.on('read_receipt', (data) {
      print('👁️ Read receipt: $data');
      _readReceiptController.add(Map<String, dynamic>.from(data));
    });

    _socket?.on('messages_read', (data) {
      print('✅ Messages marked as read: $data');
      _readReceiptController.add(Map<String, dynamic>.from(data));
    });

    _socket?.on('joined_conversation', (data) {
      print('🎉 Joined conversation: $data');
      // Can be used for confirmation or additional logic
    });

    _socket?.on('presence_update', (data) {
      print('👤 Presence: $data');
      _presenceController.add(Map<String, dynamic>.from(data));
    });
  }

  void _attemptReconnect() {
    if (_reconnectAttempt >= ApiConstants.reconnectAttempts) {
      print('❌ Max reconnection attempts reached');
      return;
    }

    _reconnectAttempt++;
    final delay = _calculateBackoffDelay();

    print(
      '🔄 Reconnecting in ${delay.inSeconds}s (attempt $_reconnectAttempt)',
    );
    _currentState = ConnectionState.connecting;
    _connectionController.add(ConnectionState.connecting);

    _reconnectTimer = Timer(delay, () {
      _socket?.connect();
    });
  }

  Duration _calculateBackoffDelay() {
    // Exponential backoff: 2^attempt seconds, max 30s
    final seconds = (1 << _reconnectAttempt).clamp(1, 30);
    return Duration(seconds: seconds);
  }

  Future<void> _handleAuthError() async {
    print('🔐 Auth error - attempting token refresh');
    // TODO: Implement token refresh logic
    // For now, just disconnect
    disconnect();
  }

  Future<void> connect() async {
    await _initSocket();

    if (_currentState != ConnectionState.disconnected) {
      return;
    }

    _socket?.connect();
    _currentState = ConnectionState.connecting;
    _connectionController.add(ConnectionState.connecting);
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _socket?.disconnect();
    _currentState = ConnectionState.disconnected;
    _connectionController.add(ConnectionState.disconnected);
  }

  // Chat operations
  void joinConversation(String conversationId) {
    _socket?.emit('join_conversation', {'conversationId': conversationId});
  }

  void leaveConversation(String conversationId) {
    _socket?.emit('leave_conversation', {'conversationId': conversationId});
  }

  void sendMessage(Map<String, dynamic> message) {
    print('📤 Sending message: $message');
    _socket?.emit('message_send', message);
  }

  void sendTyping(String conversationId, bool isTyping) {
    _socket?.emit('typing', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  void markMessagesRead(String conversationId, List<String> messageIds) {
    _socket?.emit('message_read', {
      'conversationId': conversationId,
      'messageIds': messageIds,
    });
  }

  void subscribePresence(String userId) {
    _socket?.emit('presence_subscribe', {'userId': userId});
  }

  void dispose() {
    _reconnectTimer?.cancel();
    _socket?.dispose();
    _connectionController.close();
    _messageController.close();
    _typingController.close();
    _readReceiptController.close();
    _presenceController.close();
  }
}
