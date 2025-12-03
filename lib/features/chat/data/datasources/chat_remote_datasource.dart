import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';

class ChatRemoteDataSource {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
    ),
  );

  final SecureStorageService _storage = SecureStorageService();

  ChatRemoteDataSource() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null) {
            print('[ChatDio] 🔑 Adding token to ${options.path}');
            options.headers['Authorization'] = 'Bearer $token';
          } else {
            print('[ChatDio] ⚠️ No token found for ${options.path}');
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          print(
            '[ChatDio] ❌ Error ${error.response?.statusCode}: ${error.requestOptions.path}',
          );
          if (error.response?.statusCode == 401) {
            print('[ChatDio] 🔄 Attempting token refresh...');
            final refreshed = await _refreshToken();
            if (refreshed) {
              print('[ChatDio] ✅ Token refreshed, retrying request');
              final token = await _storage.getAccessToken();
              error.requestOptions.headers['Authorization'] = 'Bearer $token';
              return handler.resolve(await _dio.fetch(error.requestOptions));
            } else {
              print('[ChatDio] ❌ Token refresh failed, clearing tokens');
              await _storage.clearTokens();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) {
        print('[ChatDio] ❌ No refresh token available');
        return false;
      }

      print('[ChatDio] 📞 Calling refresh endpoint');
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final newAccessToken = response.data['accessToken'];
      final newRefreshToken = response.data['refreshToken'];

      await _storage.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );

      print('[ChatDio] ✅ Tokens refreshed successfully');
      return true;
    } catch (e) {
      print('[ChatDio] ❌ Refresh token error: $e');
      return false;
    }
  }

  Future<List<ConversationModel>> getConversations() async {
    try {
      print(
        '🔍 Fetching conversations from: ${ApiConstants.baseUrl}${ApiConstants.conversations}',
      );
      final response = await _dio.get(ApiConstants.conversations);
      print('📦 Response status: ${response.statusCode}');
      print('📦 Response data type: ${response.data.runtimeType}');
      print('📦 Response data: ${response.data}');

      // Handle both array response and object with data field
      final dynamic rawData = response.data;
      final List<dynamic> data;

      if (rawData is List) {
        data = rawData;
      } else if (rawData is Map && rawData.containsKey('data')) {
        data = rawData['data'] as List<dynamic>;
      } else {
        throw Exception('Unexpected response format: ${rawData.runtimeType}');
      }

      print('✅ Parsing ${data.length} conversations');
      final conversations = <ConversationModel>[];

      for (var i = 0; i < data.length; i++) {
        try {
          final json = data[i] as Map<String, dynamic>;
          print(
            '📝 Parsing conversation ${i + 1}/${data.length}: ${json['id']}',
          );
          final conversation = ConversationModel.fromJson(json);
          conversations.add(conversation);
          print('✅ Successfully parsed conversation ${i + 1}');
        } catch (e, stackTrace) {
          print('❌ Error parsing conversation ${i + 1}: ${data[i]}');
          print('❌ Error: $e');
          print('❌ Stack trace: $stackTrace');
          // Skip this conversation and continue with others
          continue;
        }
      }

      print(
        '✅ Successfully parsed ${conversations.length}/${data.length} conversations',
      );
      return conversations;
    } catch (e, stackTrace) {
      print('❌ Failed to load conversations: $e');
      print('Stack trace: $stackTrace');
      throw Exception('Failed to load conversations: $e');
    }
  }

  Future<ConversationModel> getOrCreateConversation({
    required String otherUserId,
    String? propertyId,
  }) async {
    try {
      print('🔍 Creating/getting conversation with user: $otherUserId');
      final response = await _dio.post(
        ApiConstants.conversations,
        data: {
          'participantIds': [otherUserId],
          if (propertyId != null) 'propertyId': propertyId,
        },
      );

      print('✅ Got conversation: ${response.data}');
      return ConversationModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e, stackTrace) {
      print('❌ Failed to create/get conversation: $e');
      print('Stack trace: $stackTrace');
      throw Exception('Failed to create/get conversation: $e');
    }
  }

  Future<List<MessageModel>> getMessages(
    String conversationId, {
    int limit = 50,
    String? before,
    DateTime? since,
  }) async {
    try {
      final queryParams = {
        'limit': limit.toString(),
        if (before != null) 'before': before,
        if (since != null) 'since': since.toIso8601String(),
      };

      print(
        '🔍 Fetching messages from: ${ApiConstants.baseUrl}${ApiConstants.conversationMessages(conversationId)}',
      );
      final response = await _dio.get(
        ApiConstants.conversationMessages(conversationId),
        queryParameters: queryParams,
      );

      print('📦 Messages response status: ${response.statusCode}');
      print('📦 Messages response data type: ${response.data.runtimeType}');
      print('📦 Messages response data: ${response.data}');

      // Handle both array response and object with data field
      final dynamic rawData = response.data;
      final List<dynamic> data;

      if (rawData is List) {
        data = rawData;
      } else if (rawData is Map && rawData.containsKey('data')) {
        data = rawData['data'] as List<dynamic>;
      } else {
        throw Exception('Unexpected response format: ${rawData.runtimeType}');
      }

      print('✅ Parsing ${data.length} messages');
      final messages = <MessageModel>[];

      for (var i = 0; i < data.length; i++) {
        try {
          final json = data[i] as Map<String, dynamic>;
          final message = MessageModel.fromJson(json);
          messages.add(message);
        } catch (e, stackTrace) {
          print('❌ Error parsing message ${i + 1}: ${data[i]}');
          print('❌ Error: $e');
          print('❌ Stack trace: $stackTrace');
          // Skip this message and continue with others
          continue;
        }
      }

      print('✅ Successfully parsed ${messages.length}/${data.length} messages');
      return messages;
    } catch (e, stackTrace) {
      print('❌ Failed to load messages: $e');
      print('Stack trace: $stackTrace');
      throw Exception('Failed to load messages: $e');
    }
  }

  Future<void> markMessagesRead(
    String conversationId,
    List<String> messageIds,
  ) async {
    try {
      await _dio.post(
        ApiConstants.markRead(conversationId),
        data: {'messageIds': messageIds},
      );
    } catch (e) {
      throw Exception('Failed to mark messages as read: $e');
    }
  }

  Future<Map<String, dynamic>> uploadAttachment(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });

      final response = await _dio.post(
        ApiConstants.uploadMedia,
        data: formData,
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to upload attachment: $e');
    }
  }

  Future<void> deleteConversation(String conversationId) async {
    try {
      print('🗑️ Deleting conversation: $conversationId');
      await _dio.post('${ApiConstants.conversations}/$conversationId/delete');
      print('✅ Conversation deleted successfully');
    } catch (e, stackTrace) {
      print('❌ Failed to delete conversation: $e');
      print('Stack trace: $stackTrace');
      throw Exception('Failed to delete conversation: $e');
    }
  }

  Future<void> muteConversation(String conversationId) async {
    try {
      print('🔇 Muting conversation: $conversationId');
      await _dio.post('${ApiConstants.conversations}/$conversationId/mute');
      print('✅ Conversation muted successfully');
    } catch (e) {
      throw Exception('Failed to mute conversation: $e');
    }
  }

  Future<void> unmuteConversation(String conversationId) async {
    try {
      print('🔔 Unmuting conversation: $conversationId');
      await _dio.post('${ApiConstants.conversations}/$conversationId/unmute');
      print('✅ Conversation unmuted successfully');
    } catch (e) {
      throw Exception('Failed to unmute conversation: $e');
    }
  }

  Future<void> blockUser(String conversationId) async {
    try {
      print('🚫 Blocking user in conversation: $conversationId');
      await _dio.post('${ApiConstants.conversations}/$conversationId/block');
      print('✅ User blocked successfully');
    } catch (e) {
      throw Exception('Failed to block user: $e');
    }
  }

  Future<void> unblockUser(String conversationId) async {
    try {
      print('✅ Unblocking user in conversation: $conversationId');
      await _dio.post('${ApiConstants.conversations}/$conversationId/unblock');
      print('✅ User unblocked successfully');
    } catch (e) {
      throw Exception('Failed to unblock user: $e');
    }
  }

  Future<Map<String, dynamic>> editMessage(
    String messageId,
    String newText,
  ) async {
    try {
      print('✏️ Editing message: $messageId');
      final response = await _dio.put(
        '${ApiConstants.conversations}/messages/$messageId',
        data: {'text': newText},
      );
      print('✅ Message edited successfully');
      return response.data as Map<String, dynamic>;
    } catch (e, stackTrace) {
      print('❌ Failed to edit message: $e');
      print('Stack trace: $stackTrace');
      throw Exception('Failed to edit message: $e');
    }
  }
}
