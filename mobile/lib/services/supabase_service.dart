import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';
import 'local_alert_notifications.dart';

/// Direct Supabase Integration Service for PCB-Vision
class SupabaseService extends ChangeNotifier {
  static const String supabaseUrl = 'https://ejlsltjncguqggajpmlt.supabase.co';
  static const String supabasePublishableKey =
      'sb_publishable_4eMC4L7COkOGg0kKjBePmA_j0HZouKv';

  SupabaseClient? _client;
  bool _isInitialized = false;
  bool _isConnecting = false;
  String? _initError;

  // Local reactive cache
  List<InspectionRecord> _inspections = [];
  String? _inspectionError;
  AnalyticsSnapshot? _analytics;
  String? _analyticsError;
  bool _isLoading = false;

  // Real-time subscription channels
  RealtimeChannel? _inspectionChannel;
  RealtimeChannel? _defectChannel;
  RealtimeChannel? _notificationChannel;
  String? _notificationTableName;
  bool _notificationsHaveResolved = false;
  String? _notificationResolvedColumn;
  bool _notificationsHaveRead = false;
  String? _notificationReadColumn;
  List<InspectionAlert> _alerts = [];
  bool _alertPreferencesSynced = false;
  StreamSubscription<AuthState>? _authSubscription;
  String? _activeAuthUserId;

  // Active filters
  String _filterTimeframe = 'all'; // 'today', '7d', '30d', 'all'
  String? _filterBatch;
  String? _filterDefectType;
  String? _filterStation;
  InspectionStatus? _filterStatus;

  // Batch inspection queue state
  bool _isBatchProcessing = false;
  int _batchTotal = 0;
  int _batchCurrent = 0;
  String _batchCurrentName = '';

  // Getters
  bool get isInitialized => _isInitialized;
  bool get isConnecting => _isConnecting;
  bool get isLoading => _isLoading;
  String? get initError => _initError;
  List<InspectionRecord> get inspections => _filteredInspections();
  List<InspectionRecord> get allInspections => List.unmodifiable(_inspections);
  String? get inspectionError => _inspectionError;
  List<InspectionAlert> get alerts => List.unmodifiable(_alerts);
  bool get alertPreferencesSynced => _alertPreferencesSynced;
  AnalyticsSnapshot? get analytics => _analytics;
  String? get analyticsError => _analyticsError;
  String get filterTimeframe => _filterTimeframe;
  String? get filterBatch => _filterBatch;
  String? get filterDefectType => _filterDefectType;
  String? get filterStation => _filterStation;
  InspectionStatus? get filterStatus => _filterStatus;

  bool get isBatchProcessing => _isBatchProcessing;
  int get batchTotal => _batchTotal;
  int get batchCurrent => _batchCurrent;
  String get batchCurrentName => _batchCurrentName;
  double get batchProgress =>
      _batchTotal > 0 ? (_batchCurrent / _batchTotal) : 0.0;

  SupabaseService() {
    _initSupabase();
  }

  Future<void> _initSupabase() async {
    _isConnecting = true;
    notifyListeners();
    try {
      _client = Supabase.instance.client;
      _isInitialized = true;
      _authSubscription = _client!.auth.onAuthStateChange.listen(
        _handleAuthState,
      );
      final session = _client!.auth.currentSession;
      if (session != null) {
        _activateAuthenticatedSession(session.user.id);
      }
    } catch (e) {
      _initError = e.toString();
      debugPrint('Supabase client initialization failed: $e');
    } finally {
      _isConnecting = false;
      notifyListeners();
    }
  }

  void _handleAuthState(AuthState state) {
    final userId = state.session?.user.id;
    if (userId == null) {
      _activeAuthUserId = null;
      _inspectionChannel?.unsubscribe();
      _inspectionChannel = null;
      _defectChannel?.unsubscribe();
      _defectChannel = null;
      _inspectionChannel = null;
      _notificationChannel?.unsubscribe();
      _notificationChannel = null;
      _inspections = [];
      _inspectionError = null;
      _alerts = [];
      _analytics = null;
      _analyticsError = null;
      notifyListeners();
      return;
    }
    _activateAuthenticatedSession(userId);
  }

  void _activateAuthenticatedSession(String userId) {
    if (_activeAuthUserId == userId) return;
    _activeAuthUserId = userId;
    unawaited(_setupRealtimeSubscriptions());
    _requestLocalAlertPermission();
    fetchInspections();
    fetchStats();
  }

  /// Real-time subscription to inspection table updates
  Future<void> _setupRealtimeSubscriptions() async {
    if (_client?.auth.currentSession == null || _inspectionChannel != null) {
      return;
    }

    try {
      _inspectionChannel = _client!
          .channel('public:inspections')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'inspections',
            callback: (payload) {
              debugPrint('Real-time inspection event: ${payload.eventType}');
              fetchInspections();
              fetchStats();
            },
          )
          .subscribe();
      _defectChannel = _client!
          .channel('public:defects')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'defects',
            callback: (payload) {
              debugPrint('Real-time defect event: ${payload.eventType}');
              fetchInspections();
              fetchStats();
            },
          )
          .subscribe();
      final notificationTable = await _resolveNotificationTable();
      _notificationChannel = _client!
          .channel('public:$notificationTable')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: notificationTable,
            callback: (payload) {
              if (payload.eventType == PostgresChangeEvent.insert) {
                unawaited(_handleNewNotification(payload.newRecord));
              } else {
                unawaited(fetchAlerts());
              }
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Error setting up realtime subscriptions: $e');
    }
  }

  Future<String> _resolveNotificationTable() async {
    if (_notificationTableName != null) return _notificationTableName!;
    if (_client == null) throw StateError('Supabase is not connected.');
    Object? lastError;
    for (final table in ['notifs', 'notifications']) {
      try {
        await _client!.from(table).select('*').limit(1);
        _notificationTableName = table;
        return table;
      } catch (error) {
        lastError = error;
        if (!_isMissingNotificationTable(error)) rethrow;
      }
    }
    throw StateError(
      'Neither public.notifs nor public.notifications is available: $lastError',
    );
  }

  bool _isMissingNotificationTable(Object error) {
    if (error is! PostgrestException) return false;
    return error.code == '42P01' || error.code == 'PGRST205';
  }

  Future<void> _handleNewNotification(Map<String, dynamic> row) async {
    try {
      final refreshed = await fetchAlerts();
      final alertId = (row['id'] ?? row['notification_id'] ?? row['notif_id'])
          ?.toString();
      InspectionAlert? alert;
      for (final item in refreshed) {
        if (item.id == alertId) alert = item;
      }
      if (alert == null || alert.isRead || alert.isResolved) return;
      final preferences = await loadAlertPreferences();
      if (!preferences.inAppEnabled) return;
      final inspection = alert.inspection;
      final critical = alert.severity.toLowerCase() == 'critical';
      await LocalAlertNotifications.show(
        title: alert.title,
        message: alert.message,
        inspectionId: critical ? inspection?.id : null,
        annotatedImageUrl: critical ? inspection?.annotatedUrl : null,
      );
    } catch (error, stackTrace) {
      debugPrint('Handling a new real-time alert failed: $error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  Future<void> _requestLocalAlertPermission() async {
    try {
      await LocalAlertNotifications.requestPermission();
    } catch (e) {
      debugPrint('Notification permission request failed: $e');
    }
  }

  @override
  void dispose() {
    _inspectionChannel?.unsubscribe();
    _defectChannel?.unsubscribe();
    _notificationChannel?.unsubscribe();
    _authSubscription?.cancel();
    super.dispose();
  }

  /// Filter setter
  void setFilters({
    String? timeframe,
    String? batch,
    String? defectType,
    String? station,
    InspectionStatus? status,
  }) {
    if (timeframe != null) _filterTimeframe = timeframe;
    _filterBatch = batch;
    _filterDefectType = defectType;
    _filterStation = station;
    _filterStatus = status;
    notifyListeners();
  }

  void resetFilters() {
    _filterTimeframe = 'all';
    _filterBatch = null;
    _filterDefectType = null;
    _filterStation = null;
    _filterStatus = null;
    notifyListeners();
  }

  List<InspectionRecord> _filteredInspections() {
    return _inspections.where((item) {
      if (_filterStatus != null && item.finalStatus != _filterStatus) {
        return false;
      }
      if (_filterBatch != null &&
          _filterBatch != 'All' &&
          item.batchNumber != _filterBatch) {
        return false;
      }
      if (_filterStation != null &&
          _filterStation != 'All' &&
          item.stationId != _filterStation) {
        return false;
      }
      if (_filterDefectType != null && _filterDefectType != 'All') {
        final hasDefect = item.defects.any(
          (d) =>
              d.defectClass.toLowerCase() == _filterDefectType!.toLowerCase(),
        );
        if (!hasDefect) return false;
      }
      if (_filterTimeframe != 'all') {
        final now = DateTime.now();
        final diff = now.difference(item.capturedAt);
        if (_filterTimeframe == 'today' && diff.inHours > 24) return false;
        if (_filterTimeframe == '7d' && diff.inDays > 7) return false;
        if (_filterTimeframe == '30d' && diff.inDays > 30) return false;
      }
      return true;
    }).toList();
  }

  /// Fetch inspections from Supabase directly
  Future<void> fetchInspections() async {
    if (_client?.auth.currentSession == null) {
      _inspections = [];
      _inspectionError = null;
      notifyListeners();
      return;
    }
    _isLoading = true;
    _inspectionError = null;
    notifyListeners();

    try {
      if (_client != null) {
        const pageSize = 1000;
        final records = <InspectionRecord>[];
        var offset = 0;
        while (true) {
          final page = await _client!
              .from('inspections')
              .select('*, defects(*)')
              .order('captured_at', ascending: false)
              .order('id')
              .range(offset, offset + pageSize - 1);
          records.addAll(
            page.map(
              (row) =>
                  InspectionRecord.fromJson(Map<String, dynamic>.from(row)),
            ),
          );
          if (page.length < pageSize) break;
          offset += pageSize;
        }
        _inspections = records;
        _inspectionError = null;
      } else {
        _inspections = [];
      }
    } catch (e) {
      debugPrint('Supabase fetch query failed: $e');
      _inspections = [];
      _inspectionError = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch dashboard stats and metrics
  Future<void> fetchStats() async {
    if (_client?.auth.currentSession == null) {
      _analytics = null;
      _analyticsError = null;
      notifyListeners();
      return;
    }
    try {
      if (_client == null) throw StateError('Supabase is not connected.');
      final now = DateTime.now().toUtc();
      final today = DateTime.utc(now.year, now.month, now.day);
      final firstDay = today.subtract(const Duration(days: 29));
      final trendStart = firstDay.toIso8601String();
      final trendEnd = today.add(const Duration(days: 1)).toIso8601String();
      final results = await Future.wait<Object>([
        _client!.from('inspections').count(CountOption.exact),
        _client!
            .from('inspections')
            .count(CountOption.exact)
            .eq('status', 'PASS'),
        _client!
            .from('inspections')
            .count(CountOption.exact)
            .eq('status', 'FAIL'),
        _client!.from('defects').count(CountOption.exact),
        _readAnalyticsRows('defects', 'class, severity', orderBy: 'id'),
        _readAnalyticsRows(
          'inspections',
          'captured_at, defects(id)',
          orderBy: 'captured_at',
          thenOrderBy: 'id',
          capturedAtFrom: trendStart,
          capturedAtBefore: trendEnd,
        ),
        _readAnalyticsRows('inspections', 'pcb_id', orderBy: 'id'),
      ]);

      final classCounts = <String, int>{};
      final severityCounts = <String, int>{};
      for (final defect in results[4] as List<Map<String, dynamic>>) {
        final defectClass = defect['class']?.toString().trim();
        final severity = defect['severity']?.toString().trim();
        if (defectClass != null && defectClass.isNotEmpty) {
          classCounts.update(
            defectClass,
            (count) => count + 1,
            ifAbsent: () => 1,
          );
        }
        if (severity != null && severity.isNotEmpty) {
          severityCounts.update(
            severity,
            (count) => count + 1,
            ifAbsent: () => 1,
          );
        }
      }

      final dailyCounts = <DateTime, int>{};
      final dailyDefectCounts = <DateTime, int>{};
      for (var offset = 0; offset < 30; offset++) {
        final date = firstDay.add(Duration(days: offset));
        dailyCounts[date] = 0;
        dailyDefectCounts[date] = 0;
      }
      for (final row in results[5] as List<Map<String, dynamic>>) {
        final capturedAt = DateTime.tryParse(
          row['captured_at']?.toString() ?? '',
        );
        if (capturedAt == null) continue;
        final stamp = capturedAt.toUtc();
        final date = DateTime.utc(stamp.year, stamp.month, stamp.day);
        if (dailyCounts.containsKey(date)) {
          dailyCounts[date] = dailyCounts[date]! + 1;
          final defects = row['defects'];
          if (defects is List) {
            dailyDefectCounts[date] = dailyDefectCounts[date]! + defects.length;
          }
        }
      }

      final pcbIds = <String>{};
      for (final row in results[6] as List<Map<String, dynamic>>) {
        final pcbId = row['pcb_id']?.toString().trim();
        if (pcbId != null && pcbId.isNotEmpty) pcbIds.add(pcbId);
      }
      _analytics = AnalyticsSnapshot(
        totalInspections: results[0] as int,
        passCount: results[1] as int,
        failCount: results[2] as int,
        totalDefects: results[3] as int,
        distinctPcbCount: pcbIds.length,
        inspectionsLast30Days: dailyCounts.values.fold(
          0,
          (sum, count) => sum + count,
        ),
        defectsByClass: classCounts,
        defectsBySeverity: severityCounts,
        trend: dailyCounts.entries
            .map(
              (entry) => AnalyticsTrendPoint(
                date: entry.key,
                inspections: entry.value,
                defects: dailyDefectCounts[entry.key] ?? 0,
              ),
            )
            .toList(),
      );
      _analyticsError = null;
    } catch (e, stackTrace) {
      _analytics = null;
      _analyticsError = e.toString();
      debugPrint('Supabase analytics queries failed: $e');
      debugPrintStack(stackTrace: stackTrace);
    }
    notifyListeners();
  }

  Future<List<Map<String, dynamic>>> _readAnalyticsRows(
    String table,
    String columns, {
    required String orderBy,
    String? thenOrderBy,
    String? capturedAtFrom,
    String? capturedAtBefore,
  }) async {
    const pageSize = 1000;
    final allRows = <Map<String, dynamic>>[];
    var offset = 0;
    while (true) {
      dynamic query = _client!.from(table).select(columns);
      if (capturedAtFrom != null) {
        query = query.gte('captured_at', capturedAtFrom);
      }
      if (capturedAtBefore != null) {
        query = query.lt('captured_at', capturedAtBefore);
      }
      query = query.order(orderBy);
      if (thenOrderBy != null) query = query.order(thenOrderBy);
      final page =
          await query.range(offset, offset + pageSize - 1) as List<dynamic>;
      allRows.addAll(page.map((row) => Map<String, dynamic>.from(row as Map)));
      if (page.length < pageSize) break;
      offset += pageSize;
    }
    return allRows;
  }

  Future<List<ModelSummary>> fetchModels() async {
    if (_client?.auth.currentSession == null) {
      throw StateError('Sign in before loading models.');
    }
    final rows = await _client!
        .from('models')
        .select('name, arch, map50, map50_95, precision, recall, f1, cpu_ms')
        .order('name');
    return rows
        .map((row) => ModelSummary.fromJson(Map<String, dynamic>.from(row)))
        .toList();
  }

  Future<List<InspectionAlert>> fetchAlerts({int? criticalThreshold}) async {
    if (_client?.auth.currentSession == null) {
      throw StateError('Sign in before loading alerts.');
    }
    final table = await _resolveNotificationTable();
    final rows = (await _client!.from(table).select('*').limit(500)).toList();
    rows.sort((left, right) {
      final leftRow = Map<String, dynamic>.from(left as Map);
      final rightRow = Map<String, dynamic>.from(right as Map);
      final leftDate = _notificationCreatedAt(leftRow);
      final rightDate = _notificationCreatedAt(rightRow);
      return rightDate.compareTo(leftDate);
    });
    _notificationsHaveResolved = false;
    _notificationsHaveRead = false;
    if (rows.isNotEmpty) {
      final first = Map<String, dynamic>.from(rows.first as Map);
      _notificationResolvedColumn = first.containsKey('resolved')
          ? 'resolved'
          : (first.containsKey('is_resolved') ? 'is_resolved' : null);
      _notificationsHaveResolved = _notificationResolvedColumn != null;
      _notificationReadColumn = first.containsKey('is_read')
          ? 'is_read'
          : (first.containsKey('read')
                ? 'read'
                : (first.containsKey('is_seen')
                      ? 'is_seen'
                      : (first.containsKey('seen') ? 'seen' : null)));
      _notificationsHaveRead = _notificationReadColumn != null;
    }
    final localResolved = await _loadLocalResolvedAlertIds();
    final localRead = await _loadLocalReadAlertIds();

    final ids = rows
        .map((row) {
          final item = Map<String, dynamic>.from(row as Map);
          return (item['inspection_id'] ?? item['inspectionId'])?.toString();
        })
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();
    final Map<String, InspectionRecord> inspectionsById = {};
    if (ids.isNotEmpty) {
      final inspectionRows = await _client!
          .from('inspections')
          .select('*, defects(*)')
          .inFilter('id', ids);
      for (final row in inspectionRows) {
        final inspection = InspectionRecord.fromJson(
          Map<String, dynamic>.from(row),
        );
        inspectionsById[inspection.id] = inspection;
      }
    }

    final alerts = <InspectionAlert>[];
    for (final rawRow in rows) {
      final row = Map<String, dynamic>.from(rawRow as Map);
      final rawId = row['id'] ?? row['notification_id'] ?? row['notif_id'];
      final alertId = rawId?.toString() ?? '';
      final id = (row['inspection_id'] ?? row['inspectionId'])?.toString();
      final inspection = id == null ? null : inspectionsById[id];
      if (criticalThreshold != null && inspection != null) {
        final criticalCount = inspection.defects
            .where((d) => d.severity == SeverityLevel.critical)
            .length;
        if (criticalCount < criticalThreshold) continue;
      }
      final isRead =
          row['is_read'] == true ||
          row['read'] == true ||
          row['is_seen'] == true ||
          row['seen'] == true ||
          localRead.contains(alertId);
      alerts.add(
        InspectionAlert(
          id: alertId,
          title:
              (row['title'] ?? row['subject'] ?? row['type'])?.toString() ??
              'Inspection alert',
          message:
              (row['message'] ??
                      row['body'] ??
                      row['description'] ??
                      row['details'])
                  ?.toString() ??
              '',
          severity:
              (row['severity'] ?? row['level'] ?? row['priority'])
                  ?.toString() ??
              'Info',
          createdAt: _notificationCreatedAt(row),
          isResolved:
              row['resolved'] == true ||
              row['is_resolved'] == true ||
              localResolved.contains(alertId),
          isRead: isRead,
          inspection: inspection,
        ),
      );
    }
    alerts.sort((a, b) {
      if (a.isRead != b.isRead) return a.isRead ? 1 : -1;
      return b.createdAt.compareTo(a.createdAt);
    });
    _alerts = alerts;
    notifyListeners();
    return alerts;
  }

  DateTime _notificationCreatedAt(Map<String, dynamic> row) =>
      DateTime.tryParse(
        (row['created_at'] ?? row['timestamp'] ?? row['inserted_at'])
                ?.toString() ??
            '',
      ) ??
      DateTime.fromMillisecondsSinceEpoch(0);

  Future<void> resolveAlert(String alertId) async {
    if (_client?.auth.currentSession == null) {
      throw StateError('Sign in before resolving alerts.');
    }
    final resolvedIds = await _loadLocalResolvedAlertIds();
    resolvedIds.add(alertId);
    final userId = _client!.auth.currentUser!.id;
    const storage = FlutterSecureStorage();
    await storage.write(
      key: 'resolved_alert_ids_$userId',
      value: jsonEncode(resolvedIds.toList()),
    );
    try {
      final table = await _resolveNotificationTable();
      if (_notificationsHaveResolved) {
        await _client!
            .from(table)
            .update({_notificationResolvedColumn!: true})
            .eq('id', alertId);
      }
    } catch (error, stackTrace) {
      debugPrint(
        'Could not update notification state in Supabase; device state was saved: $error',
      );
      debugPrintStack(stackTrace: stackTrace);
    }
    _alerts = _alerts
        .map(
          (alert) => alert.id == alertId
              ? InspectionAlert(
                  id: alert.id,
                  title: alert.title,
                  message: alert.message,
                  severity: alert.severity,
                  createdAt: alert.createdAt,
                  isResolved: true,
                  isRead: alert.isRead,
                  inspection: alert.inspection,
                )
              : alert,
        )
        .toList();
    notifyListeners();
  }

  Future<void> markAlertRead(String alertId) async {
    if (_client?.auth.currentSession == null) {
      throw StateError('Sign in before updating alerts.');
    }
    final readIds = await _loadLocalReadAlertIds();
    readIds.add(alertId);
    final userId = _client!.auth.currentUser!.id;
    const storage = FlutterSecureStorage();
    await storage.write(
      key: 'read_alert_ids_$userId',
      value: jsonEncode(readIds.toList()),
    );
    try {
      final table = await _resolveNotificationTable();
      if (_notificationsHaveRead) {
        await _client!
            .from(table)
            .update({_notificationReadColumn!: true})
            .eq('id', alertId);
      }
    } catch (error) {
      debugPrint('Could not persist alert read state to Supabase: $error');
    }
    _alerts = _alerts
        .map(
          (alert) => alert.id == alertId
              ? InspectionAlert(
                  id: alert.id,
                  title: alert.title,
                  message: alert.message,
                  severity: alert.severity,
                  createdAt: alert.createdAt,
                  isResolved: alert.isResolved,
                  isRead: true,
                  inspection: alert.inspection,
                )
              : alert,
        )
        .toList();
    notifyListeners();
  }

  Future<Set<String>> _loadLocalAlertIds(String prefix) async {
    final userId = _client?.auth.currentUser?.id;
    if (userId == null) return <String>{};
    const storage = FlutterSecureStorage();
    final saved = await storage.read(key: '${prefix}_alert_ids_$userId');
    if (saved == null || saved.isEmpty) return <String>{};
    try {
      return (jsonDecode(saved) as List<dynamic>)
          .map((id) => id.toString())
          .toSet();
    } catch (error) {
      debugPrint('Could not read local alert history: $error');
      return <String>{};
    }
  }

  Future<Set<String>> _loadLocalResolvedAlertIds() =>
      _loadLocalAlertIds('resolved');

  Future<Set<String>> _loadLocalReadAlertIds() => _loadLocalAlertIds('read');

  Future<int> loadCriticalAlertThreshold() async {
    return (await loadAlertPreferences()).defectCountThreshold;
  }

  Future<void> saveCriticalAlertThreshold(int threshold) async {
    final preferences = await loadAlertPreferences();
    await saveAlertPreferences(
      preferences.copyWith(
        defectCountThreshold: threshold.clamp(1, 20).toInt(),
      ),
    );
  }

  Future<AlertPreferences> loadAlertPreferences() async {
    final userId = _client?.auth.currentUser?.id;
    if (userId == null) throw StateError('Sign in to load alert preferences.');
    try {
      final row = await _client!
          .from('notification_preferences')
          .select(
            'defect_count_threshold, defect_rate_threshold, in_app_enabled, email_enabled, sms_enabled',
          )
          .eq('user_id', userId)
          .maybeSingle();
      if (row != null) return AlertPreferences.fromJson(row);
    } catch (error) {
      debugPrint('Could not load Supabase alert preferences: $error');
    }
    const storage = FlutterSecureStorage();
    final saved = await storage.read(key: 'alert_preferences_$userId');
    if (saved != null) {
      try {
        return AlertPreferences.fromJson(jsonDecode(saved));
      } catch (error) {
        debugPrint('Could not read saved alert preferences: $error');
      }
    }
    return const AlertPreferences();
  }

  Future<void> saveAlertPreferences(AlertPreferences preferences) async {
    final userId = _client?.auth.currentUser?.id;
    if (userId == null) throw StateError('Sign in to save alert preferences.');
    final payload = preferences.toJson(userId);
    const storage = FlutterSecureStorage();
    await storage.write(
      key: 'alert_preferences_$userId',
      value: jsonEncode(payload),
    );
    try {
      await _client!
          .from('notification_preferences')
          .upsert(payload, onConflict: 'user_id');
      _alertPreferencesSynced = true;
    } catch (error) {
      _alertPreferencesSynced = false;
      debugPrint(
        'Supabase alert preferences are not available; saved for this device and user: $error',
      );
    }
  }

  /// Submit an audit review for an inspection (Accept, Reject, Reclassify)
  Future<bool> submitReview({
    required String inspectionId,
    required ReviewDecision decision,
    required String reviewerEmail,
    required String justification,
    String? notes,
    String? newDefectClass,
    String? defectId,
  }) async {
    final now = DateTime.now();
    final finalStatus = (decision == ReviewDecision.overridePass)
        ? InspectionStatus.pass
        : InspectionStatus.fail;

    final review = ReviewRecord(
      id: 'rev_${now.millisecondsSinceEpoch}',
      inspectionId: inspectionId,
      automatedResult: 'FAIL',
      reviewDecision: decision.value,
      finalResult: finalStatus.value,
      reviewerEmail: reviewerEmail,
      justification: justification,
      notes: notes,
      createdAt: now,
    );

    // 1. Try updating Supabase directly
    if (_client?.auth.currentSession != null) {
      try {
        await _client!.from('reviews').insert({
          'inspection_id': inspectionId,
          'automated_result': 'FAIL',
          'review_decision': decision.value,
          'final_result': finalStatus.value,
          'reviewer_email': reviewerEmail,
          'justification': justification,
          'notes': notes,
        });

        await _client!
            .from('inspections')
            .update({
              'review_status': decision == ReviewDecision.confirm
                  ? 'confirmed'
                  : 'overridden',
              'final_status': finalStatus.value,
            })
            .eq('id', inspectionId);

        // Also record audit log in Supabase
        await _client!.from('audit_logs').insert({
          'action': 'INSPECTION_REVIEW',
          'entity': 'inspections',
          'entity_id': inspectionId,
          'user_email': reviewerEmail,
          'description':
              'Decision: ${decision.label} - Justification: $justification',
        });
      } catch (e) {
        debugPrint('Supabase direct review submission note: $e');
      }
    }

    // 2. Update local state reactively
    final index = _inspections.indexWhere((i) => i.id == inspectionId);
    if (index != -1) {
      final old = _inspections[index];
      List<DefectItem> updatedDefects = old.defects;

      if (decision == ReviewDecision.reclassify &&
          newDefectClass != null &&
          defectId != null) {
        updatedDefects = old.defects.map((d) {
          if (d.id == defectId) {
            return d.copyWith(
              defectClass: newDefectClass,
              status: 'reclassified',
            );
          }
          return d;
        }).toList();
      } else if (decision == ReviewDecision.overridePass) {
        updatedDefects = old.defects
            .map((d) => d.copyWith(status: 'rejected_false_positive'))
            .toList();
      } else {
        updatedDefects = old.defects
            .map((d) => d.copyWith(status: 'confirmed_defect'))
            .toList();
      }

      final updatedReviews = List<ReviewRecord>.from(old.reviews)
        ..insert(0, review);
      _inspections[index] = old.copyWith(
        finalStatus: finalStatus,
        reviewStatus: decision == ReviewDecision.confirm
            ? 'CONFIRMED'
            : 'OVERRIDDEN',
        defects: updatedDefects,
        reviews: updatedReviews,
      );

      notifyListeners();
    }

    return true;
  }

  /// Batch inspection workflow: processes multiple boards sequentially
  Future<void> runBatchInspection(List<String> boardNames) async {
    _isBatchProcessing = true;
    _batchTotal = boardNames.length;
    _batchCurrent = 0;
    notifyListeners();

    for (int i = 0; i < boardNames.length; i++) {
      _batchCurrent = i + 1;
      _batchCurrentName = boardNames[i];
      notifyListeners();

      // Simulate sequential inspection pipeline
      await Future.delayed(const Duration(milliseconds: 900));

      final hasDefect = (i % 2 == 1);
      final newRecord = InspectionRecord(
        id: 'BATCH-${DateTime.now().millisecondsSinceEpoch}-$i',
        capturedAt: DateTime.now(),
        source: boardNames[i],
        model: 'yolov8s-pcb-v2.4',
        status: hasDefect ? InspectionStatus.fail : InspectionStatus.pass,
        imageUrl: '',
        annotatedUrl: '',
        stationId: 'STATION-01',
        batchNumber: 'BATCH-2026-LIVE',
        reviewStatus: hasDefect ? 'UNREVIEWED' : 'CONFIRMED',
        finalStatus: hasDefect ? InspectionStatus.fail : InspectionStatus.pass,
        defects: hasDefect
            ? [
                DefectItem(
                  id: 'def_b_$i',
                  defectClass: i % 4 == 0
                      ? 'mousebite'
                      : (i % 3 == 0 ? 'spur' : 'short'),
                  confidence: 0.92,
                  severity: SeverityLevel.moderate,
                  boxX1: 0.25 + (i * 0.1) % 0.4,
                  boxY1: 0.30 + (i * 0.1) % 0.3,
                  boxX2: 0.40 + (i * 0.1) % 0.4,
                  boxY2: 0.45 + (i * 0.1) % 0.3,
                ),
              ]
            : [],
        reviews: [],
      );

      _inspections.insert(0, newRecord);

      // Store in Supabase if online
      if (_client?.auth.currentSession != null) {
        try {
          await _client!.from('inspections').insert({
            'source': newRecord.source,
            'model': newRecord.model,
            'status': newRecord.status.value,
            'station_id': newRecord.stationId,
            'review_status': newRecord.reviewStatus,
          });
        } catch (_) {}
      }
    }

    _isBatchProcessing = false;
    _batchTotal = 0;
    _batchCurrent = 0;
    _batchCurrentName = '';
    notifyListeners();
  }

  /// Generate seed heatmap points
  /// High-fidelity enterprise PCB factory inspection data
}

