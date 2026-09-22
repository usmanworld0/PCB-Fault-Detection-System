import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_provider.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);
  @override
  String toString() => message;
}

class ApiService {
  final AuthProvider _auth;
  ApiService(this._auth);

  String get _baseUrl => _auth.serverUrl;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_auth.token.isNotEmpty) 'Authorization': 'Bearer ${_auth.token}',
      };

  Future<Map<String, dynamic>> _request(String method, String path,
      {Map<String, dynamic>? body, Map<String, String>? queryParams}) async {
    final uri = Uri.parse('$_baseUrl$path').replace(queryParameters: queryParams);
    late http.Response response;

    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: _headers);
        break;
      case 'POST':
        response = await http.post(uri, headers: _headers, body: body != null ? jsonEncode(body) : null);
        break;
      default:
        throw ApiException(0, 'Unsupported method: $method');
    }

    if (response.statusCode == 401) {
      await _auth.logout();
      throw ApiException(401, 'Session expired. Please login again.');
    }
    if (response.statusCode >= 400) {
      String detail = 'Request failed';
      try {
        final decoded = jsonDecode(response.body);
        detail = decoded['detail'] ?? detail;
      } catch (_) {}
      throw ApiException(response.statusCode, detail);
    }
    return jsonDecode(response.body);
  }

  Future<List<dynamic>> _requestList(String path, {Map<String, String>? queryParams}) async {
    final uri = Uri.parse('$_baseUrl$path').replace(queryParameters: queryParams);
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 401) {
      await _auth.logout();
      throw ApiException(401, 'Session expired. Please login again.');
    }
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, 'Request failed');
    }
    return jsonDecode(response.body);
  }

  // --- Auth ---
  Future<Map<String, dynamic>> login(String serverUrl, String email, String password) async {
    final uri = Uri.parse('${serverUrl.replaceAll(RegExp(r"/+\$"), "")}/auth/login');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode >= 400) {
      String detail = 'Login failed';
      try {
        detail = jsonDecode(response.body)['detail'] ?? detail;
      } catch (_) {}
      throw ApiException(response.statusCode, detail);
    }
    return jsonDecode(response.body);
  }

  // --- Stats ---
  Future<Map<String, dynamic>> getStats() => _request('GET', '/stats');

  // --- Inspections ---
  Future<Map<String, dynamic>> getInspections({
    String? status,
    String? model,
    int limit = 50,
    int offset = 0,
  }) {
    final params = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    if (status != null) params['status'] = status;
    if (model != null) params['model'] = model;
    return _request('GET', '/inspections', queryParams: params);
  }

  Future<Map<String, dynamic>> getInspectionDetail(String id) =>
      _request('GET', '/inspections/$id');

  // --- Models ---
  Future<List<dynamic>> getModels() => _requestList('/models');
}
