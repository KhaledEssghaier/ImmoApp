import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/profile_api_service.dart';
import '../../auth/providers/auth_provider.dart';

// Profile API service provider
final profileApiServiceProvider = Provider<ProfileApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  print('[ProfileProvider] Creating ProfileApiService with DioClient');
  return ProfileApiService(dioClient);
});

// Profile state
class ProfileState {
  final Map<String, dynamic>? profile;
  final bool isLoading;
  final String? error;

  ProfileState({
    this.profile,
    this.isLoading = false,
    this.error,
  });

  ProfileState copyWith({
    Map<String, dynamic>? profile,
    bool? isLoading,
    String? error,
  }) {
    return ProfileState(
      profile: profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Profile notifier
class ProfileNotifier extends StateNotifier<ProfileState> {
  final ProfileApiService _apiService;

  ProfileNotifier(this._apiService) : super(ProfileState());

  Future<void> loadProfile() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final profile = await _apiService.getProfile();
      state = ProfileState(profile: profile, isLoading: false);
    } catch (e) {
      state = ProfileState(error: e.toString(), isLoading: false);
      print('[Profile] Error loading profile: $e');
    }
  }

  Future<bool> updateProfile({
    String? fullName,
    String? email,
    String? phone,
    String? profileImage,
    String? bio,
    String? address,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updatedProfile = await _apiService.updateProfile(
        fullName: fullName,
        email: email,
        phone: phone,
        profileImage: profileImage,
        bio: bio,
        address: address,
      );
      state = ProfileState(profile: updatedProfile, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      print('[Profile] Error updating profile: $e');
      return false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _apiService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      print('[Profile] Error changing password: $e');
      return false;
    }
  }
}

// Profile provider
final profileProvider =
    StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  final apiService = ref.watch(profileApiServiceProvider);
  return ProfileNotifier(apiService);
});
