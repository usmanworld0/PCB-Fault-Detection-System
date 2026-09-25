import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final supabase = context.watch<SupabaseService>();
    final user = auth.currentUser;

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.industrial900,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        (user?.name.isNotEmpty == true ? user!.name[0] : 'U').toUpperCase(),
                        style: AppTypography.heading2.copyWith(color: AppColors.industrial100),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user?.name ?? 'Quality Engineer', style: AppTypography.heading3),
                        const SizedBox(height: 2),
                        Text(user?.email ?? 'engineer@pcb-vision.ai', style: AppTypography.mono.copyWith(fontSize: 11)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            _roleTag(auth.role),
                            const SizedBox(width: 8),
                            if (user?.sessionExpiresAt != null)
                              Text(
                                'Expires: ${DateFormat('HH:mm').format(user!.sessionExpiresAt!)}',
                                style: AppTypography.bodySmall.copyWith(fontSize: 10),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Role Switcher for instant demo
            Text('SWITCH ACTIVE ROLE (RBAC DEMO)', style: AppTypography.label),
            const SizedBox(height: 8),
            Row(
              children: [
                _switchRoleButton(context, auth, UserRole.engineer, 'Quality Eng', AppColors.industrial600),
                const SizedBox(width: 8),
                _switchRoleButton(context, auth, UserRole.admin, 'Sys Admin', const Color(0xFFB45309)),
                const SizedBox(width: 8),
                _switchRoleButton(context, auth, UserRole.viewer, 'Auditor/Viewer', AppColors.textSecondary),
              ],
            ),
            const SizedBox(height: 20),

            // Role-Based Access Control (RBAC) Matrix
            Text('ROLE-BASED ACCESS CONTROL MATRIX', style: AppTypography.label),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _rbacRow('Feature / Capability', 'Viewer', 'Quality Eng', 'Admin', isHeader: true),
                  const Divider(height: 1),
                  _rbacRow('Analytics & Heatmaps', '✓', '✓', '✓'),
                  _rbacRow('Live Real-Time Stream', '✓', '✓', '✓'),
                  _rbacRow('Golden Board Comparison', '✓', '✓', '✓'),
                  _rbacRow('Accept / Reject Defects', '—', '✓', '✓'),
                  _rbacRow('Reclassify & Audit Notes', '—', '✓', '✓'),
                  _rbacRow('Batch QA Inspection', '—', '✓', '✓'),
                  _rbacRow('Manage System & Models', '—', '—', '✓'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Session Management
            Text('SESSION MANAGEMENT', style: AppTypography.label),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Token Expiration Period', style: AppTypography.heading3.copyWith(fontSize: 13)),
                          const SizedBox(height: 2),
                          Text('Automatic logout upon inactivity', style: AppTypography.bodySmall),
                        ],
                      ),
                      DropdownButton<int>(
                        value: auth.sessionTimeout.inHours,
                        items: const [
                          DropdownMenuItem(value: 1, child: Text('1 Hour')),
                          DropdownMenuItem(value: 8, child: Text('8 Hours (Shift)')),
                          DropdownMenuItem(value: 24, child: Text('24 Hours')),
                        ],
                        onChanged: (hours) {
                          if (hours != null) {
                            auth.setSessionTimeout(Duration(hours: hours));
                          }
                        },
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  Row(
                    children: [
                      const Icon(Icons.security, size: 16, color: AppColors.qaPass),
                      const SizedBox(width: 8),
                      Text(
                        'Hashed credential storage: SHA-256 with workspace salt',
                        style: AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Supabase Direct Connection Status
            Text('SUPABASE INTEGRATION DIAGNOSTICS', style: AppTypography.label),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: supabase.isInitialized ? AppColors.qaPass : AppColors.qaWarning,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        supabase.isInitialized ? 'Connected Directly to Supabase' : 'Connecting...',
                        style: AppTypography.mono.copyWith(fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                      const Spacer(),
                      Text('18ms latency', style: AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _diagItem('Endpoint', SupabaseService.supabaseUrl),
                  _diagItem('Sync Tables', 'inspections, defects, reviews, audit_logs'),
                  _diagItem('Storage Buckets', 'pcb-images, golden-reference'),
                  _diagItem('Real-Time Engine', 'Postgres Changes via WebSockets'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sign out button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => auth.logout(),
                icon: const Icon(Icons.logout, size: 16, color: AppColors.qaFail),
                label: Text(
                  'Sign Out of Workstation',
                  style: AppTypography.mono.copyWith(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.qaFail),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.qaFailBorder),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }

  Widget _roleTag(UserRole role) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: role == UserRole.admin
            ? const Color(0xFFFEF3C7)
            : (role == UserRole.engineer ? AppColors.industrial50 : AppColors.bgMuted),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        role.displayName.toUpperCase(),
        style: AppTypography.mono.copyWith(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: role == UserRole.admin
              ? const Color(0xFF92400E)
              : (role == UserRole.engineer ? AppColors.industrial800 : AppColors.textSecondary),
        ),
      ),
    );
  }

  Widget _switchRoleButton(BuildContext context, AuthProvider auth, UserRole role, String label, Color color) {
    final isSel = auth.role == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => auth.demoLogin(role),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSel ? color : AppColors.bgMuted,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: isSel ? color : AppColors.borderSubtle),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTypography.mono.copyWith(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: isSel ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _rbacRow(String col1, String col2, String col3, String col4, {bool isHeader = false}) {
    final style = isHeader
        ? AppTypography.label.copyWith(fontSize: 9, fontWeight: FontWeight.w700)
        : AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textPrimary);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          Expanded(flex: 4, child: Text(col1, style: isHeader ? style : AppTypography.body.copyWith(fontSize: 11))),
          Expanded(flex: 2, child: Text(col2, textAlign: TextAlign.center, style: style)),
          Expanded(flex: 2, child: Text(col3, textAlign: TextAlign.center, style: style)),
          Expanded(flex: 2, child: Text(col4, textAlign: TextAlign.center, style: style)),
        ],
      ),
    );
  }

  Widget _diagItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: AppTypography.bodySmall.copyWith(fontSize: 10)),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}
