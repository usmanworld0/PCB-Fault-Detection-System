import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';

class EnterpriseHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showStationBadge;

  const EnterpriseHeader({
    super.key,
    required this.title,
    this.actions,
    this.showStationBadge = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final supabase = context.watch<SupabaseService>();

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bgSurface,
        border: Border(
          bottom: BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              // Logo icon & app title
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.industrial900,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Center(
                  child: Icon(
                    Icons.memory,
                    size: 20,
                    color: AppColors.industrial200,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Text(
                        'PCB-Vision',
                        style: AppTypography.heading3.copyWith(
                          color: AppColors.industrial900,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Live Supabase status pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.qaPassBg,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: AppColors.qaPassBorder, width: 1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 5,
                              height: 5,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.qaPass,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              supabase.isInitialized ? 'SUPABASE LIVE' : 'SYNCING',
                              style: AppTypography.mono.copyWith(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppColors.qaPass,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Text(
                    title,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              // Role chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: auth.role == UserRole.admin
                      ? const Color(0xFFFEF3C7)
                      : (auth.role == UserRole.engineer
                          ? AppColors.industrial50
                          : AppColors.bgMuted),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: auth.role == UserRole.admin
                        ? const Color(0xFFFDE68A)
                        : (auth.role == UserRole.engineer
                            ? AppColors.industrial200
                            : AppColors.borderSubtle),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      auth.role == UserRole.admin
                          ? Icons.admin_panel_settings_outlined
                          : (auth.role == UserRole.engineer
                              ? Icons.verified_user_outlined
                              : Icons.visibility_outlined),
                      size: 13,
                      color: auth.role == UserRole.admin
                          ? const Color(0xFFB45309)
                          : (auth.role == UserRole.engineer
                              ? AppColors.industrial700
                              : AppColors.textSecondary),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      auth.role == UserRole.admin
                          ? 'ADMIN'
                          : (auth.role == UserRole.engineer ? 'QA ENG' : 'VIEWER'),
                      style: AppTypography.mono.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: auth.role == UserRole.admin
                            ? const Color(0xFF92400E)
                            : (auth.role == UserRole.engineer
                                ? AppColors.industrial800
                                : AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              if (actions != null) ...actions!,
            ],
          ),
        ),
      ),
    );
  }
}
