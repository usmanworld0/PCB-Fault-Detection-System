import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
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
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final supabase = context.watch<SupabaseService>();
    final user = auth.currentUser;

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
              // PCB Logo - Transparent, no container box or white effects
              Image.asset(
                'assets/images/pcb-fault-logo.png',
                width: 36,
                height: 36,
                fit: BoxFit.contain,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            'PCB VISION',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.heading3.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        if (MediaQuery.sizeOf(context).width >= 420) ...[
                          const SizedBox(width: 8),
                          // Live Supabase status pill
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.qaPassBg,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: AppColors.qaPassBorder,
                                width: 1,
                              ),
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
                                  supabase.isInitialized ? 'LIVE' : 'SYNCING',
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
                      ],
                    ),
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              if (MediaQuery.sizeOf(context).width >= 360)
                const SizedBox(width: 10),
              // Role chip
              if (MediaQuery.sizeOf(context).width >= 360)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: auth.role == UserRole.admin
                        ? const Color(0xFFFEF3C7)
                        : (auth.role == UserRole.engineer
                            ? AppColors.purityTealLight
                            : AppColors.bgMuted),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: auth.role == UserRole.admin
                          ? const Color(0xFFFDE68A)
                          : (auth.role == UserRole.engineer
                              ? AppColors.purityTealBorder
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
                                ? AppColors.purityTealDark
                                : AppColors.textSecondary),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        auth.role == UserRole.admin
                            ? 'ADMIN'
                            : (auth.role == UserRole.engineer
                                ? 'QA ENG'
                                : 'VIEWER'),
                        style: AppTypography.mono.copyWith(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: auth.role == UserRole.admin
                              ? const Color(0xFF92400E)
                              : (auth.role == UserRole.engineer
                                  ? AppColors.purityTealDark
                                  : AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(width: 8),

              // Profile Picture (PFP) Avatar
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: _buildAvatar(user),
              ),

              if (actions != null) ...actions!,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(UserProfile? user) {
    final avatar = user?.avatarUrl;
    final initial = (user?.name.isNotEmpty == true ? user!.name[0] : 'U').toUpperCase();

    if (avatar != null && avatar.isNotEmpty) {
      if (avatar.startsWith('data:image')) {
        try {
          final bytes = base64Decode(avatar.split(',').last);
          return Image.memory(
            bytes,
            width: 32,
            height: 32,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _fallbackAvatar(initial),
          );
        } catch (_) {
          return _fallbackAvatar(initial);
        }
      }
      return CachedNetworkImage(
        imageUrl: avatar,
        width: 32,
        height: 32,
        fit: BoxFit.cover,
        placeholder: (_, __) => _fallbackAvatar(initial),
        errorWidget: (_, __, ___) => _fallbackAvatar(initial),
      );
    }
    return _fallbackAvatar(initial);
  }

  Widget _fallbackAvatar(String initial) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppColors.purityTealLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.purityTealBorder),
      ),
      child: Center(
        child: Text(
          initial,
          style: AppTypography.heading3.copyWith(
            color: AppColors.purityTealDark,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
