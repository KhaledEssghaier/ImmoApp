import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/chat_socket_datasource.dart';

final socketProvider = Provider<ChatSocketDataSource>((ref) {
  final socket = ChatSocketDataSource();
  ref.onDispose(() => socket.dispose());
  return socket;
});

final connectionStateProvider = StreamProvider<ConnectionState>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.connectionStream;
});

final messageStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.messageStream;
});

final typingStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.typingStream;
});

final readReceiptStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.readReceiptStream;
});

final presenceStreamProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final socket = ref.watch(socketProvider);
  return socket.presenceStream;
});
