class ApiConstants {
  // Update these with your actual backend URLs
  static const String baseUrl = 'http://localhost:3000/api/v1';
  static const String socketUrl = 'http://localhost:3005/chat';

  // Chat endpoints
  static const String conversations = '/chat/conversations';
  static String conversationMessages(String id) =>
      '/chat/conversations/$id/messages';
  static String markRead(String id) => '/chat/conversations/$id/read';

  // Media endpoints
  static const String uploadMedia = '/media/upload';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 10);

  // Socket.IO options
  static const Duration reconnectDelay = Duration(seconds: 2);
  static const Duration maxReconnectDelay = Duration(seconds: 30);
  static const int reconnectAttempts = 5;
}
