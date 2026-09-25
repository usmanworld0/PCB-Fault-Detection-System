import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:crypto/crypto.dart';
import '../models/models.dart';

class AuthProvider extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();

  UserProfile? _currentUser;
  String? _sessionToken;
  Duration _sessionTimeout = const Duration(hours: 8);
  bool _isLoading = true;

  UserProfile? get currentUser => _currentUser;
  bool get isAuthenticated =>
      _currentUser != null &&
      _sessionToken != null &&
      !_currentUser!.isSessionExpired;
  UserRole get role => _currentUser?.role ?? UserRole.viewer;
  bool get canReview => role.canReview;
  bool get canManageSystem => role.canManageSystem;
  bool get isReadOnly => role.isReadOnly;
  bool get isLoading => _isLoading;
  Duration get sessionTimeout => _sessionTimeout;

  AuthProvider() {
    _initAuth();
  }

  /// Hash password using SHA-256
  static String hashPassword(String password, String salt) {
    final bytes = utf8.encode('$salt:$password:pcb_vision_salt_2026');
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<void> _initAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _storage.read(key: 'session_token');
      final userJsonStr = await _storage.read(key: 'user_profile');
      final timeoutHoursStr = await _storage.read(key: 'session_timeout_hours');

      if (timeoutHoursStr != null) {
        final hours = int.tryParse(timeoutHoursStr) ?? 8;
        _sessionTimeout = Duration(hours: hours);
      }

      if (token != null && userJsonStr != null) {
        final Map<String, dynamic> userMap = jsonDecode(userJsonStr);
        final user = UserProfile.fromJson(userMap);

        if (!user.isSessionExpired) {
          _currentUser = user;
          _sessionToken = token;
        } else {
          // Session expired
          await logout();
        }
      } else {
        // Auto-seed with default demo Quality Engineer for frictionless first impression
        await demoLogin(UserRole.engineer);
      }
    } catch (e) {
      debugPrint('Error restoring session: $e');
      await demoLogin(UserRole.engineer);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Change session timeout configuration
  Future<void> setSessionTimeout(Duration duration) async {
    _sessionTimeout = duration;
    await _storage.write(key: 'session_timeout_hours', value: duration.inHours.toString());
    if (_currentUser != null) {
      _currentUser = UserProfile(
        id: _currentUser!.id,
        email: _currentUser!.email,
        role: _currentUser!.role,
        name: _currentUser!.name,
        avatarUrl: _currentUser!.avatarUrl,
        sessionExpiresAt: DateTime.now().add(_sessionTimeout),
      );
      await _storage.write(key: 'user_profile', value: jsonEncode(_currentUser!.toJson()));
      notifyListeners();
    }
  }

  /// Login with email and password
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    final normEmail = email.trim().toLowerCase();

    // Determine user role and properties based on email or default admin
    UserRole userRole = UserRole.engineer;
    String name = 'Quality Engineer';

    if (normEmail.contains('admin')) {
      userRole = UserRole.admin;
      name = 'System Admin';
    } else if (normEmail.contains('viewer') || normEmail.contains('audit')) {
      userRole = UserRole.viewer;
      name = 'Auditor';
    } else {
      name = normEmail.split('@').first;
      name = name[0].toUpperCase() + name.substring(1);
    }

    final token = 'pcb_token_${DateTime.now().millisecondsSinceEpoch}_${sha256.convert(utf8.encode(normEmail)).toString().substring(0, 16)}';
    final expiresAt = DateTime.now().add(_sessionTimeout);

    final user = UserProfile(
      id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
      email: normEmail,
      role: userRole,
      name: name,
      sessionExpiresAt: expiresAt,
    );

    _currentUser = user;
    _sessionToken = token;

    // Persist securely
    await _storage.write(key: 'session_token', value: token);
    await _storage.write(key: 'user_profile', value: jsonEncode(user.toJson()));

    // Store hashed credential
    final salt = normEmail;
    final hashed = hashPassword(password, salt);
    await _storage.write(key: 'cred_hash_$normEmail', value: hashed);

    notifyListeners();
    return true;
  }

  /// Fast demo login for switching roles
  Future<void> demoLogin(UserRole demoRole) async {
    String email;
    String name;

    switch (demoRole) {
      case UserRole.admin:
        email = 'admin@pcb-vision.ai';
        name = 'Sarah Connor (Admin)';
        break;
      case UserRole.engineer:
        email = 'lead.engineer@pcb-vision.ai';
        name = 'Alex Rivera, Lead QA';
        break;
      case UserRole.viewer:
        email = 'auditor@pcb-vision.ai';
        name = 'Marcus Vance (Viewer)';
        break;
    }

    final expiresAt = DateTime.now().add(_sessionTimeout);
    final user = UserProfile(
      id: 'demo_${demoRole.value}',
      email: email,
      role: demoRole,
      name: name,
      sessionExpiresAt: expiresAt,
    );

    _currentUser = user;
    _sessionToken = 'demo_token_${demoRole.value}_${DateTime.now().millisecondsSinceEpoch}';

    await _storage.write(key: 'session_token', value: _sessionToken);
    await _storage.write(key: 'user_profile', value: jsonEncode(user.toJson()));

    notifyListeners();
  }

  /// Logout and clear secure storage
  Future<void> logout() async {
    _currentUser = null;
    _sessionToken = null;
    await _storage.delete(key: 'session_token');
    await _storage.delete(key: 'user_profile');
    notifyListeners();
  }
}
