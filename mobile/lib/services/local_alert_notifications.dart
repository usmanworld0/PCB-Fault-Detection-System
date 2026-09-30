import 'package:flutter/services.dart';

class LocalAlertNotifications {
  static const MethodChannel _channel = MethodChannel(
    'com.pcbvision.pcb_vision/local_alerts',
  );
  static Future<void> Function(String inspectionId)? _onInspectionTap;

  static Future<void> initialize(
    Future<void> Function(String inspectionId) onInspectionTap,
  ) async {
    _onInspectionTap = onInspectionTap;
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'openInspection') {
        final id = call.arguments?.toString();
        if (id != null && id.isNotEmpty) await _onInspectionTap?.call(id);
      }
    });
    final pending = await _channel.invokeMethod<String>(
      'consumePendingInspectionId',
    );
    if (pending != null && pending.isNotEmpty) {
      await _onInspectionTap?.call(pending);
    }
  }

  static Future<void> requestPermission() async {
    await _channel.invokeMethod<bool>('requestPermission');
  }

  static Future<void> show({
    required String title,
    required String message,
    String? inspectionId,
    String? annotatedImageUrl,
  }) async {
    await _channel.invokeMethod<void>('show', {
      'title': title,
      'message': message,
      'inspectionId': inspectionId,
      'annotatedImageUrl': annotatedImageUrl,
    });
  }
}
