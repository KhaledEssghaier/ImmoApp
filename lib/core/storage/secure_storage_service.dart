import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    webOptions: WebOptions(
      dbName: 'appimmo_db',
      publicKey: 'appimmo_public_key',
    ),
  );

  // Keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _guestModeKey = 'guest_mode';

  // Save tokens
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    try {
      print('[SecureStorage] 💾 Saving tokens...');
      if (kIsWeb) {
        // Use SharedPreferences for web (fallback)
        final prefs = await SharedPreferences.getInstance();
        final accessSaved = await prefs.setString(_accessTokenKey, accessToken);
        final refreshSaved = await prefs.setString(
          _refreshTokenKey,
          refreshToken,
        );
        print(
          '[SecureStorage] ✅ Web tokens saved: access=$accessSaved, refresh=$refreshSaved',
        );

        // Verify immediately
        final verifyAccess = prefs.getString(_accessTokenKey);
        print(
          '[SecureStorage] 🔍 Verification - token exists: ${verifyAccess != null}, length: ${verifyAccess?.length}',
        );
      } else {
        await Future.wait([
          _storage.write(key: _accessTokenKey, value: accessToken),
          _storage.write(key: _refreshTokenKey, value: refreshToken),
        ]);
        print('[SecureStorage] ✅ Mobile tokens saved');
      }
    } catch (e) {
      // ignore: avoid_print
      print('[SecureStorage] ❌ Error saving tokens: $e');
    }
  }

  // Get access token
  Future<String?> getAccessToken() async {
    try {
      String? token;
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        token = prefs.getString(_accessTokenKey);
      } else {
        token = await _storage.read(key: _accessTokenKey);
      }
      // ignore: avoid_print
      print(
        '[SecureStorage] 🔍 getAccessToken: ${token != null ? "Found (${token.substring(0, 20)}...)" : "NOT FOUND"}',
      );
      return token;
    } catch (e) {
      // ignore: avoid_print
      print('[SecureStorage] Error reading access token: $e');
      return null;
    }
  }

  // Get refresh token
  Future<String?> getRefreshToken() async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString(_refreshTokenKey);
      }
      return await _storage.read(key: _refreshTokenKey);
    } catch (e) {
      // ignore: avoid_print
      print('[SecureStorage] Error reading refresh token: $e');
      return null;
    }
  }

  // Save user ID
  Future<void> saveUserId(String userId) async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userIdKey, userId);
      } else {
        await _storage.write(key: _userIdKey, value: userId);
      }
    } catch (e) {
      // ignore: avoid_print
      print('[SecureStorage] Error saving user ID: $e');
    }
  }

  // Get user ID
  Future<String?> getUserId() async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString(_userIdKey);
      }
      return await _storage.read(key: _userIdKey);
    } catch (e) {
      // ignore: avoid_print
      print('[SecureStorage] Error reading user ID: $e');
      return null;
    }
  }

  // Clear all tokens
  Future<void> clearTokens() async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        await Future.wait([
          prefs.remove(_accessTokenKey),
          prefs.remove(_refreshTokenKey),
          prefs.remove(_userIdKey),
        ]);
      } else {
        await _storage.deleteAll();
      }
    } catch (e) {
      // ignore: avoid_print
      print('[SecureStorage] Error clearing tokens: $e');
    }
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final accessToken = await getAccessToken();
    return accessToken != null;
  }

  // Set guest mode
  Future<void> setGuestMode(bool isGuest) async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_guestModeKey, isGuest);
      } else {
        await _storage.write(key: _guestModeKey, value: isGuest.toString());
      }
      print('[SecureStorage] 👤 Guest mode set to: $isGuest');
    } catch (e) {
      print('[SecureStorage] Error setting guest mode: $e');
    }
  }

  // Check if in guest mode
  Future<bool> isGuestMode() async {
    try {
      if (kIsWeb) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getBool(_guestModeKey) ?? false;
      }
      final value = await _storage.read(key: _guestModeKey);
      return value == 'true';
    } catch (e) {
      print('[SecureStorage] Error reading guest mode: $e');
      return false;
    }
  }
}
