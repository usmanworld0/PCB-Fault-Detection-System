import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();

  String _token = '';
  String _role = '';
  String _email = '';
  String _serverUrl = '';
  bool _isAuthenticated = false;

  bool get isAuthenticated => _isAuthenticated;
  String get token => _token;
  String get role => _role;
  String get email => _email;
  String get serverUrl => _serverUrl;

  AuthProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    _token = await _storage.read(key: 'token') ?? '';
    _role = await _storage.read(key: 'role') ?? '';
    _email = await _storage.read(key: 'email') ?? '';
    _serverUrl = await _storage.read(key: 'server_url') ?? '';
    _isAuthenticated = _token.isNotEmpty && _serverUrl.isNotEmpty;
    notifyListeners();
  }

  Future<void> login({
    required String serverUrl,
    required String email,
    required String token,
    required String role,
  }) async {
    _serverUrl = serverUrl.replaceAll(RegExp(r'/+$'), '');
    _email = email;
    _token = token;
    _role = role;
    _isAuthenticated = true;

    await _storage.write(key: 'server_url', value: _serverUrl);
    await _storage.write(key: 'email', value: _email);
    await _storage.write(key: 'token', value: _token);
    await _storage.write(key: 'role', value: _role);
    notifyListeners();
  }

  Future<void> logout() async {
    _token = '';
    _role = '';
    _email = '';
    _isAuthenticated = false;
    await _storage.deleteAll();
    notifyListeners();
  }
}
