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
  Future<Map<String, dynamic>> getStats() async {
    if (_auth.isDemo) {
      return {
        'total_inspections': 1428,
        'pass_count': 1295,
        'fail_count': 133,
        'yield_rate': 90.69,
        'active_models': 4,
        'defects_by_class': {
          'open': 48,
          'short': 41,
          'mouse_bite': 24,
          'spur': 19,
          'copper': 11,
          'missing_hole': 6,
        },
        'severity_counts': {
          'critical': 89,
          'moderate': 43,
          'minor': 17,
        },
        'trend_30d': List.generate(30, (i) => {
          'date': DateTime.now().subtract(Duration(days: 29 - i)).toIso8601String().split('T')[0],
          'inspections': 35 + ((i * 7 + 11) % 25),
          'fails': (i % 6 == 0) ? 5 : (i % 3 == 0) ? 2 : 1,
        }),
      };
    }
    return _request('GET', '/stats');
  }

  // --- Inspections ---
  Future<Map<String, dynamic>> getInspections({
    String? status,
    String? model,
    int limit = 50,
    int offset = 0,
  }) async {
    if (_auth.isDemo) {
      final sampleItems = [
        {
          'id': 'pcb-insp-001',
          'created_at': DateTime.now().subtract(const Duration(minutes: 12)).toIso8601String(),
          'status': 'FAIL',
          'model_name': 'YOLOv8s',
          'defect_count': 3,
        },
        {
          'id': 'pcb-insp-002',
          'created_at': DateTime.now().subtract(const Duration(minutes: 38)).toIso8601String(),
          'status': 'PASS',
          'model_name': 'Faster R-CNN',
          'defect_count': 0,
        },
        {
          'id': 'pcb-insp-003',
          'created_at': DateTime.now().subtract(const Duration(hours: 1, minutes: 15)).toIso8601String(),
          'status': 'FAIL',
          'model_name': 'RetinaNet',
          'defect_count': 1,
        },
        {
          'id': 'pcb-insp-004',
          'created_at': DateTime.now().subtract(const Duration(hours: 2, minutes: 40)).toIso8601String(),
          'status': 'PASS',
          'model_name': 'YOLOv8s',
          'defect_count': 0,
        },
        {
          'id': 'pcb-insp-005',
          'created_at': DateTime.now().subtract(const Duration(hours: 4, minutes: 5)).toIso8601String(),
          'status': 'FAIL',
          'model_name': 'YOLOv8n',
          'defect_count': 2,
        },
      ];

      final filtered = sampleItems.where((item) {
        if (status != null && item['status'] != status) return false;
        if (model != null && item['model_name'] != model) return false;
        return true;
      }).toList();

      return {
        'items': filtered,
        'total': filtered.length,
      };
    }

    final params = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    if (status != null) params['status'] = status;
    if (model != null) params['model'] = model;
    return _request('GET', '/inspections', queryParams: params);
  }

  Future<Map<String, dynamic>> getInspectionDetail(String id) async {
    if (_auth.isDemo) {
      final isPass = id == 'pcb-insp-002' || id == 'pcb-insp-004';
      return {
        'id': id,
        'created_at': DateTime.now().subtract(const Duration(minutes: 25)).toIso8601String(),
        'status': isPass ? 'PASS' : 'FAIL',
        'model_name': 'YOLOv8s (ONNX Engine)',
        'inference_ms': 10.1,
        'defect_count': isPass ? 0 : 3,
        'original_image_url': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        'annotated_image_url': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        'defects': isPass
            ? []
            : [
                {'class_name': 'open', 'confidence': 0.942, 'severity': 'critical', 'bbox': [112, 85, 145, 110]},
                {'class_name': 'short', 'confidence': 0.908, 'severity': 'critical', 'bbox': [240, 310, 275, 335]},
                {'class_name': 'mouse_bite', 'confidence': 0.835, 'severity': 'moderate', 'bbox': [410, 190, 435, 215]},
              ],
      };
    }
    return _request('GET', '/inspections/$id');
  }

  // --- Models ---
  Future<List<dynamic>> getModels() async {
    if (_auth.isDemo) {
      return [
        {
          'id': 'm1',
          'name': 'Faster R-CNN',
          'architecture': 'ResNet-50 FPN v2',
          'version': 'v2.1',
          'map50': 92.77,
          'precision': 83.40,
          'recall': 94.70,
          'f1_score': 88.69,
          'inference_time_ms': 114.2,
          'is_active': true,
        },
        {
          'id': 'm2',
          'name': 'RetinaNet',
          'architecture': 'ResNet-50 FPN v2',
          'version': 'v1.4',
          'map50': 92.41,
          'precision': 79.74,
          'recall': 94.30,
          'f1_score': 86.41,
          'inference_time_ms': 55.1,
          'is_active': false,
        },
        {
          'id': 'm3',
          'name': 'YOLOv8s',
          'architecture': 'YOLOv8-Small (ONNX)',
          'version': 'v3.0',
          'map50': 87.60,
          'precision': 90.54,
          'recall': 89.56,
          'f1_score': 90.05,
          'inference_time_ms': 10.1,
          'is_active': true,
        },
        {
          'id': 'm4',
          'name': 'YOLOv8n',
          'architecture': 'YOLOv8-Nano (Ultra-fast)',
          'version': 'v3.0',
          'map50': 86.68,
          'precision': 86.38,
          'recall': 89.98,
          'f1_score': 88.14,
          'inference_time_ms': 3.7,
          'is_active': false,
        },
      ];
    }
    return _requestList('/models');
  }
}
