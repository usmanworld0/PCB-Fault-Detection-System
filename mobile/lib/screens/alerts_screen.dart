import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import 'inspection_detail_screen.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  AlertPreferences _preferences = const AlertPreferences();
  bool _loading = true;
  String? _error;
  String _filter = 'UNREAD';

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final service = context.read<SupabaseService>();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final preferences = await service.loadAlertPreferences();
      await service.fetchAlerts();
      if (!mounted) return;
      setState(() {
        _preferences = preferences;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _savePreferences(AlertPreferences next) async {
    final service = context.read<SupabaseService>();
    setState(() => _preferences = next);
    try {
      await service.saveAlertPreferences(next);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              service.alertPreferencesSynced
                  ? 'Preferences saved for this account.'
                  : 'Saved on this device. Run the alert preferences migration to sync to your account.',
            ),
          ),
        );
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save preferences: $error')),
      );
    }
  }

  Future<void> _resolve(InspectionAlert alert) async {
    try {
      await context.read<SupabaseService>().resolveAlert(alert.id);
      await _refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Alert marked as resolved.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Could not resolve alert: $e')));
      }
    }
  }

  Future<void> _markRead(InspectionAlert alert) async {
    try {
      await context.read<SupabaseService>().markAlertRead(alert.id);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Could not update alert: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final alerts = service.alerts;
    final unread = alerts.where((a) => !a.isRead && !a.isResolved).length;
    final visible = alerts.where((alert) {
      switch (_filter) {
        case 'UNREAD':
          return !alert.isRead && !alert.isResolved;
        case 'RESOLVED':
          return alert.isResolved;
        default:
          return true;
      }
    }).toList();
    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            _preferencesCard(),
            const SizedBox(height: 14),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'UNREAD', label: Text('Unread')),
                ButtonSegment(value: 'ALL', label: Text('All')),
                ButtonSegment(value: 'RESOLVED', label: Text('Resolved')),
              ],
              selected: {_filter},
              onSelectionChanged: (selection) =>
                  setState(() => _filter = selection.first),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Text(
                  _filter == 'RESOLVED'
                      ? 'Resolved alerts'
                      : (_filter == 'ALL' ? 'All alerts' : 'Unread alerts'),
                  style: AppTypography.heading2.copyWith(fontSize: 16),
                ),
                const Spacer(),
                Text('$unread unread', style: AppTypography.bodySmallReadable),
                IconButton(
                  onPressed: _refresh,
                  tooltip: 'Refresh alerts',
                  icon: const Icon(Icons.refresh, size: 20),
                ),
              ],
            ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 80),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              _empty(Icons.cloud_off_outlined, 'Could not load alerts', _error!)
            else if (visible.isEmpty)
              _empty(
                Icons.notifications_none,
                _filter == 'RESOLVED'
                    ? 'No resolved alerts'
                    : 'No alerts to show',
                _filter == 'UNREAD'
                    ? 'New unread alerts will appear here automatically.'
                    : 'Alerts will appear here as they are recorded.',
              )
            else
              ...visible.map(_alertCard),
          ],
        ),
      ),
    );
  }

  Widget _preferencesCard() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.bgSurface,
      border: Border.all(color: AppColors.borderSubtle),
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: AppColors.textPrimary.withValues(alpha: 0.035),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Alert preferences', style: AppTypography.heading2),
        const SizedBox(height: 4),
        Text(
          'Applied by server-side alert rules when configured.',
          style: AppTypography.bodySmallReadable,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 16,
          runSpacing: 8,
          children: [
            _preferenceDropdown<int>(
              label: 'Critical defects',
              value: _preferences.defectCountThreshold,
              values: List.generate(20, (i) => i + 1),
              labelFor: (n) => '$n or more',
              onChanged: (value) => _savePreferences(
                _preferences.copyWith(defectCountThreshold: value),
              ),
            ),
            _preferenceDropdown<double>(
              label: 'Defect rate',
              value: _preferences.defectRateThreshold,
              values: const [0.01, 0.05, 0.10, 0.20, 0.30],
              labelFor: (n) => '${(n * 100).toStringAsFixed(0)}%',
              onChanged: (value) => _savePreferences(
                _preferences.copyWith(defectRateThreshold: value),
              ),
            ),
          ],
        ),
        const Divider(height: 20),
        _channelSwitch('In-app', true, enabled: false),
        _channelSwitch(
          'Email',
          _preferences.emailEnabled,
          onChanged: (value) =>
              _savePreferences(_preferences.copyWith(emailEnabled: value)),
        ),
        _channelSwitch(
          'SMS',
          _preferences.smsEnabled,
          onChanged: (value) =>
              _savePreferences(_preferences.copyWith(smsEnabled: value)),
        ),
        Text(
          'Email and SMS preferences are stored for future delivery; sending is not enabled.',
          style: AppTypography.bodySmallReadable,
        ),
      ],
    ),
  );

  Widget _preferenceDropdown<T>({
    required String label,
    required T value,
    required List<T> values,
    required String Function(T value) labelFor,
    required Future<void> Function(T value) onChanged,
  }) => ConstrainedBox(
    constraints: const BoxConstraints(minWidth: 130, maxWidth: 210),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.bodySmallReadable),
        DropdownButton<T>(
          isExpanded: true,
          value: value,
          items: values
              .map(
                (item) => DropdownMenuItem<T>(
                  value: item,
                  child: Text(labelFor(item)),
                ),
              )
              .toList(),
          onChanged: _loading
              ? null
              : (item) {
                  if (item != null) onChanged(item);
                },
        ),
      ],
    ),
  );

  Widget _channelSwitch(
    String label,
    bool value, {
    bool enabled = true,
    ValueChanged<bool>? onChanged,
  }) => SwitchListTile.adaptive(
    contentPadding: EdgeInsets.zero,
    dense: true,
    title: Text(label, style: AppTypography.body),
    value: value,
    onChanged: enabled ? onChanged : null,
  );

  Widget _alertCard(InspectionAlert alert) {
    final color = alert.severity.toLowerCase() == 'critical'
        ? AppColors.qaFail
        : AppColors.qaWarning;
    final inspection = alert.inspection;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        border: Border.all(color: AppColors.borderSubtle),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.035),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.crisis_alert, color: color, size: 19),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  alert.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.heading3.copyWith(fontSize: 13),
                ),
              ),
              _stateBadge(
                alert.isResolved
                    ? 'RESOLVED'
                    : (alert.isRead ? 'READ' : 'UNREAD'),
                alert.isResolved
                    ? AppColors.textSecondary
                    : (alert.isRead ? AppColors.textSecondary : color),
              ),
            ],
          ),
          const SizedBox(height: 7),
          Text(
            alert.message,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.bodySmallReadable,
          ),
          const SizedBox(height: 8),
          Text(
            DateFormat.yMMMd().add_jm().format(alert.createdAt),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.bodySmallReadable.copyWith(fontSize: 10),
          ),
          if (inspection != null) ...[
            const SizedBox(height: 10),
            InkWell(
              onTap: () async {
                if (!alert.isRead) await _markRead(alert);
                if (!mounted) return;
                await Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) =>
                        InspectionDetailScreen(inspectionId: inspection.id),
                  ),
                );
              },
              child: Row(
                children: [
                  const Icon(
                    Icons.open_in_new,
                    size: 15,
                    color: AppColors.industrial600,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${inspection.source} • ${inspection.status.value} • ${inspection.model}',
                      style: AppTypography.bodySmallReadable.copyWith(
                        color: AppColors.industrial700,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (!alert.isResolved || !alert.isRead) ...[
            const SizedBox(height: 6),
            Wrap(
              alignment: WrapAlignment.end,
              spacing: 8,
              runSpacing: 4,
              children: [
                if (!alert.isRead)
                  TextButton.icon(
                    onPressed: () => _markRead(alert),
                    icon: const Icon(Icons.mark_email_read_outlined, size: 16),
                    label: const Text('Mark read'),
                  ),
                if (!alert.isResolved)
                  TextButton.icon(
                    onPressed: () => _resolve(alert),
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Resolve'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _empty(IconData icon, String title, String message) => Padding(
    padding: const EdgeInsets.only(top: 72),
    child: Column(
      children: [
        Icon(icon, size: 42, color: AppColors.textMuted),
        const SizedBox(height: 10),
        Text(title, style: AppTypography.heading3),
        const SizedBox(height: 6),
        Text(
          message,
          textAlign: TextAlign.center,
          style: AppTypography.bodySmallReadable,
        ),
        TextButton(onPressed: _refresh, child: const Text('Try again')),
      ],
    ),
  );

  Widget _stateBadge(String label, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.09),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Text(
      label,
      maxLines: 1,
      style: AppTypography.mono.copyWith(
        fontSize: 9,
        color: color,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}
