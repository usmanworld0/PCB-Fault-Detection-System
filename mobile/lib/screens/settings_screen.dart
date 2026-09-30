import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
                        (user?.name.isNotEmpty == true ? user!.name[0] : 'U')
                            .toUpperCase(),
                        style: AppTypography.heading2.copyWith(
                          color: AppColors.industrial100,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'Quality Engineer',
                          style: AppTypography.heading3,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? 'engineer@pcb-vision.ai',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.mono.copyWith(fontSize: 11),
                        ),
                        const SizedBox(height: 4),
                        _roleTag(auth.role),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Role-Based Access Control (RBAC) Matrix
            Text(
              'ROLE-BASED ACCESS CONTROL MATRIX',
              style: AppTypography.label,
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _rbacRow(
                    'Feature / Capability',
                    'Viewer',
                    'Quality Eng',
                    'Admin',
                    isHeader: true,
                  ),
                  const Divider(height: 1),
                  _rbacRow('Analytics & Heatmaps', '✓', '✓', '✓'),
                  _rbacRow('Live Real-Time Stream', '✓', '✓', '✓'),
                  _rbacRow('Inspection Image Views', '✓', '✓', '✓'),
                  _rbacRow('View Defect Details', '✓', '✓', '✓'),
                  _rbacRow('Batch QA Inspection', '—', '✓', '✓'),
                  _rbacRow('Manage System & Models', '—', '—', '✓'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            Text('DATA CONNECTION', style: AppTypography.label),
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
                          color: supabase.isInitialized
                              ? AppColors.qaPass
                              : AppColors.qaWarning,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          supabase.isInitialized
                              ? 'Supabase connection ready'
                              : 'Connecting to Supabase…',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.mono.copyWith(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sign out button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => auth.logout(),
                icon: const Icon(
                  Icons.logout,
                  size: 16,
                  color: AppColors.qaFail,
                ),
                label: Text(
                  'Sign Out of Workstation',
                  style: AppTypography.mono.copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.qaFail,
                  ),
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
            : (role == UserRole.engineer
                  ? AppColors.industrial50
                  : AppColors.bgMuted),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        role.displayName.toUpperCase(),
        style: AppTypography.mono.copyWith(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: role == UserRole.admin
              ? const Color(0xFF92400E)
              : (role == UserRole.engineer
                    ? AppColors.industrial800
                    : AppColors.textSecondary),
        ),
      ),
    );
  }

  Widget _rbacRow(
    String col1,
    String col2,
    String col3,
    String col4, {
    bool isHeader = false,
  }) {
    final style = isHeader
        ? AppTypography.label.copyWith(fontSize: 9, fontWeight: FontWeight.w700)
        : AppTypography.mono.copyWith(
            fontSize: 10,
            color: AppColors.textPrimary,
          );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Text(
              col1,
              style: isHeader
                  ? style
                  : AppTypography.body.copyWith(fontSize: 11),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(col2, textAlign: TextAlign.center, style: style),
          ),
          Expanded(
            flex: 2,
            child: Text(col3, textAlign: TextAlign.center, style: style),
          ),
          Expanded(
            flex: 2,
            child: Text(col4, textAlign: TextAlign.center, style: style),
          ),
        ],
      ),
    );
  }
}
