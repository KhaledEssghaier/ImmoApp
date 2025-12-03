import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/dio_client.dart';
import '../../../core/api/auth_api_service.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../core/models/user_model.dart';
import '../../../core/models/auth_response.dart';

// Storage provider
final storageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

// Dio client provider
final dioClientProvider = Provider<DioClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return DioClient(storage);
});

// Auth API service provider
final authApiServiceProvider = Provider<AuthApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AuthApiService(dioClient);
});

// Auth state
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;
  final bool isGuest;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
    this.isGuest = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
    bool? isGuest,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isGuest: isGuest ?? this.isGuest,
    );
  }
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthApiService _authApiService;
  final SecureStorageService _storageService;

  AuthNotifier(this._authApiService, this._storageService)
    : super(AuthState()) {
    _checkAuth();
  }

  // Check if user is authenticated
  Future<void> _checkAuth() async {
    // Check if user is in guest mode
    final isGuestMode = await _storageService.isGuestMode();
    if (isGuestMode) {
      state = state.copyWith(isGuest: true, isAuthenticated: false);
      return;
    }

    final isLoggedIn = await _storageService.isLoggedIn();
    if (isLoggedIn) {
      try {
        final user = await _authApiService.getMe();
        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isGuest: false,
        );
      } catch (e) {
        // Token expired or invalid - clear and force re-login
        print('[AuthProvider] ❌ Auth check failed: $e');
        print('[AuthProvider] 🔄 Clearing tokens and forcing logout...');
        await _storageService.clearTokens();
        state = state.copyWith(
          isAuthenticated: false,
          user: null,
          isGuest: false,
        );
      }
    }
  }

  // Verify token is valid - call this before critical operations
  Future<bool> verifyToken() async {
    final accessToken = await _storageService.getAccessToken();
    if (accessToken == null) {
      // Token missing but state shows authenticated - force logout
      print(
        '[AuthProvider] ⚠️ Token missing but user shows authenticated - forcing logout',
      );
      state = state.copyWith(isAuthenticated: false, user: null);
      return false;
    }
    return true;
  }

  // Force logout when token is expired (called from interceptors)
  Future<void> forceLogout() async {
    print('[AuthProvider] 🔒 Token expired - forcing logout');
    await _storageService.clearTokens();
    state = state.copyWith(isAuthenticated: false, user: null);
  }

  // Signup
  Future<bool> signup({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authApiService.signup(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
      );

      await _saveAuthData(response);

      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  // Continue as Guest
  Future<void> continueAsGuest() async {
    await _storageService.setGuestMode(true);
    state = state.copyWith(isGuest: true, isAuthenticated: false, user: null);
  }

  // Login
  Future<bool> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authApiService.login(
        email: email,
        password: password,
      );

      await _saveAuthData(response);

      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken != null) {
        await _authApiService.logout(refreshToken);
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      await _storageService.clearTokens();
      await _storageService.setGuestMode(false);
      state = AuthState();
    }
  }

  // Save auth data
  Future<void> _saveAuthData(AuthResponse response) async {
    await _storageService.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );
    await _storageService.saveUserId(response.user.id);
  }
}

// Auth provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authApiService = ref.watch(authApiServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  return AuthNotifier(authApiService, storageService);
});
