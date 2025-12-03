import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/dio_client.dart';
import '../storage/secure_storage_service.dart';

/// Provider for SecureStorageService
final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

/// Provider for DioClient
final dioClientProvider = Provider<DioClient>((ref) {
  final storageService = ref.watch(secureStorageServiceProvider);
  return DioClient(storageService);
});

/// Provider for Dio instance (used by datasources)
final apiClientProvider = Provider<Dio>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return dioClient.dio;
});
