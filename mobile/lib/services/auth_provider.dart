import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;
  StreamSubscription<AuthState>? _authSubscription;
  UserProfile? _currentUser;
  bool _isLoading = true;

  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated =>
      _client.auth.currentSession != null && _currentUser != null;
  UserRole get role => _currentUser?.role ?? UserRole.viewer;
  bool get canReview => role.canReview;
  bool get canManageSystem => role.canManageSystem;
  bool get isReadOnly => role.isReadOnly;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    _authSubscription = _client.auth.onAuthStateChange.listen(
      (state) => _setUser(state.session?.user),
      onError: (Object error) =>
          debugPrint('Supabase Auth state stream failed: $error'),
    );

    _setUser(_client.auth.currentUser);

    // Remove data written by the retired local/demo authentication flow.
    const legacyStorage = FlutterSecureStorage();
    try {
      await Future.wait([
        legacyStorage.delete(key: 'session_token'),
        legacyStorage.delete(key: 'user_profile'),
        legacyStorage.delete(key: 'session_timeout_hours'),
      ]);
    } catch (error) {
      debugPrint('Could not clear retired local sign-in data: $error');
    }

    _isLoading = false;
    notifyListeners();
  }

  void _setUser(User? user) {
    if (user == null) {
      _currentUser = null;
    } else {
      final email = user.email ?? '';
      final displayName =
          user.userMetadata?['full_name']?.toString() ??
          user.userMetadata?['name']?.toString() ??
          (email.contains('@')
              ? email.substring(0, email.indexOf('@'))
              : email);
      // App metadata is managed by trusted Supabase administrators. Do not
      // grant roles based on email text or user-editable metadata.
      final appRole = user.appMetadata['role']?.toString();
      final avatarUrl = user.userMetadata?['avatar_url']?.toString() ??
          user.userMetadata?['picture']?.toString();
      _currentUser = UserProfile(
        id: user.id,
        email: email,
        role: UserRoleExt.fromString(appRole),
        name: displayName.isEmpty ? 'User' : displayName,
        avatarUrl: avatarUrl,
      );
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> updateAvatar(String? newAvatarUrl) async {
    if (_currentUser == null) return;
    _currentUser = UserProfile(
      id: _currentUser!.id,
      email: _currentUser!.email,
      role: _currentUser!.role,
      name: _currentUser!.name,
      avatarUrl: newAvatarUrl,
    );
    notifyListeners();

    try {
      await _client.auth.updateUser(
        UserAttributes(
          data: {'avatar_url': newAvatarUrl},
        ),
      );
    } catch (e) {
      debugPrint('Failed to sync avatar with Supabase: $e');
    }
  }

  Future<bool> login({required String email, required String password}) async {
    final response = await _client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
    _setUser(response.user);
    return response.user != null;
  }

  Future<void> logout() async {
    await _client.auth.signOut();
    _setUser(null);
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
