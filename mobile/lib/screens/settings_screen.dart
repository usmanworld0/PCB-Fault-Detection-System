import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  void _showUploadPfpDialog(BuildContext context, AuthProvider auth) {
    final textController = TextEditingController(text: auth.currentUser?.avatarUrl ?? '');
    String? previewUrl = auth.currentUser?.avatarUrl;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppColors.bgSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          title: Text(
            'Upload PFP',
            style: AppTypography.heading2.copyWith(fontSize: 18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Enter an image URL or image data string to set your custom profile picture.',
                style: AppTypography.bodySmallReadable,
              ),
              const SizedBox(height: 16),
              // Live Avatar Preview
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(color: AppColors.borderSubtle, width: 2),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(13),
                    child: _buildAvatarImage(previewUrl, auth.currentUser?.name ?? 'U', 80),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: textController,
                style: AppTypography.body.copyWith(fontSize: 12),
                decoration: const InputDecoration(
                  labelText: 'Profile Picture Image URL',
                  hintText: 'https://example.com/avatar.jpg',
                  prefixIcon: Icon(Icons.link, size: 18),
                ),
                onChanged: (val) {
                  setDialogState(() {
                    previewUrl = val.trim();
                  });
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogCtx).pop(),
              child: Text(
                'Cancel',
                style: AppTypography.body.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                final url = textController.text.trim();
                auth.updateAvatar(url.isEmpty ? null : url);
                Navigator.of(dialogCtx).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: AppColors.purityTeal,
                    content: Text(
                      'Profile picture updated successfully',
                      style: AppTypography.body.copyWith(color: Colors.white),
                    ),
                  ),
                );
              },
              child: const Text('Save PFP'),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildAvatarImage(String? avatar, String name, double size) {
    final initial = (name.isNotEmpty ? name[0] : 'U').toUpperCase();
    if (avatar != null && avatar.isNotEmpty) {
      if (avatar.startsWith('data:image')) {
        try {
          final bytes = base64Decode(avatar.split(',').last);
          return Image.memory(
            bytes,
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _fallback(initial, size),
          );
        } catch (_) {
          return _fallback(initial, size);
        }
      }
      return CachedNetworkImage(
        imageUrl: avatar,
        width: size,
        height: size,
        fit: BoxFit.cover,
        placeholder: (_, __) => _fallback(initial, size),
        errorWidget: (_, __, ___) => _fallback(initial, size),
      );
    }
    return _fallback(initial, size);
  }

  static Widget _fallback(String initial, double size) {
    return Container(
      width: size,
      height: size,
      color: AppColors.purityTealLight,
      child: Center(
        child: Text(
          initial,
          style: AppTypography.heading1.copyWith(
            color: AppColors.purityTealDark,
            fontSize: size * 0.4,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

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
            // User Profile Card (Purity UI styling)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: AppColors.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      // User Custom PFP
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(
                            color: AppColors.purityTealBorder,
                            width: 2,
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(13),
                          child: _buildAvatarImage(
                            user?.avatarUrl,
                            user?.name ?? 'User',
                            60,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.name ?? 'Quality Engineer',
                              style: AppTypography.heading2.copyWith(fontSize: 17),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user?.email ?? 'engineer@pcb-vision.ai',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            _roleTag(auth.role),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Divider(height: 1),
                  const SizedBox(height: 14),

                  // Profile Picture Actions
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _showUploadPfpDialog(context, auth),
                          icon: const Icon(Icons.camera_alt_outlined, size: 16),
                          label: const Text('Upload PFP'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.purityTeal,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      if (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty) ...[
                        const SizedBox(width: 10),
                        OutlinedButton(
                          onPressed: () {
                            auth.updateAvatar(null);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: AppColors.textPrimary,
                                content: Text(
                                  'Profile picture removed',
                                  style: AppTypography.body.copyWith(
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.qaFail,
                            side: const BorderSide(color: AppColors.qaFailBorder),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Remove PFP'),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Role-Based Access Control (RBAC) Matrix
            Text(
              'ROLE-BASED ACCESS CONTROL MATRIX',
              style: AppTypography.label,
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: AppColors.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
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
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: supabase.isInitialized
                          ? AppColors.qaPass
                          : AppColors.qaWarning,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      supabase.isInitialized
                          ? 'Supabase Real-Time Data Synced'
                          : 'Connecting to Supabase…',
                      style: AppTypography.bodySmallReadable.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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
                  style: AppTypography.buttonText.copyWith(
                    color: AppColors.qaFail,
                    fontSize: 12,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.qaFailBorder),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: role == UserRole.admin
            ? const Color(0xFFFEF3C7)
            : (role == UserRole.engineer
                ? AppColors.purityTealLight
                : AppColors.bgMuted),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: role == UserRole.admin
              ? const Color(0xFFFDE68A)
              : (role == UserRole.engineer
                  ? AppColors.purityTealBorder
                  : AppColors.borderSubtle),
        ),
      ),
      child: Text(
        role.displayName.toUpperCase(),
        style: AppTypography.mono.copyWith(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: role == UserRole.admin
              ? const Color(0xFF92400E)
              : (role == UserRole.engineer
                  ? AppColors.purityTealDark
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
        ? AppTypography.label.copyWith(fontSize: 10, fontWeight: FontWeight.w700)
        : AppTypography.body.copyWith(
            fontSize: 11,
            color: AppColors.textPrimary,
          );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Text(
              col1,
              style: isHeader
                  ? style
                  : AppTypography.body.copyWith(
                      fontSize: 12,
                      color: AppColors.textPrimary,
                    ),
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
