import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'lead.engineer@pcb-vision.ai');
  final _passwordController = TextEditingController(text: 'changeme');
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please enter both email and password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      await auth.login(email: email, password: password);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _showForgotPasswordDialog() async {
    final emailTextController = TextEditingController(text: _emailController.text.trim());
    bool isSending = false;
    String? dialogError;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text(
            'Reset Password',
            style: AppTypography.heading2.copyWith(fontSize: 18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Enter your email address to receive a secure password recovery link via Supabase Auth.',
                style: AppTypography.bodySmall,
              ),
              const SizedBox(height: 14),
              if (dialogError != null)
                Container(
                  padding: const EdgeInsets.all(8),
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: AppColors.qaFailBg,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.qaFailBorder),
                  ),
                  child: Text(
                    dialogError!,
                    style: AppTypography.bodySmall.copyWith(color: AppColors.qaFail, fontSize: 11),
                  ),
                ),
              TextField(
                controller: emailTextController,
                keyboardType: TextInputType.emailAddress,
                style: AppTypography.mono.copyWith(fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'Operator Email',
                  prefixIcon: Icon(Icons.email_outlined, size: 18),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSending ? null : () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isSending
                  ? null
                  : () async {
                      final resetEmail = emailTextController.text.trim();
                      if (resetEmail.isEmpty) {
                        setDialogState(() => dialogError = 'Please enter your email.');
                        return;
                      }
                      setDialogState(() {
                        isSending = true;
                        dialogError = null;
                      });
                      try {
                        final supabaseService = context.read<SupabaseService>();
                        await supabaseService.resetPasswordForEmail(resetEmail);
                        if (ctx.mounted) {
                          Navigator.of(ctx).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.industrial900,
                              content: Text('Password reset instructions sent to $resetEmail via Supabase Auth.'),
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() {
                          isSending = false;
                          dialogError = e.toString();
                        });
                      }
                    },
              child: isSending
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Send Reset Link'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo & Header
                Center(
                  child: Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: AppColors.industrial900,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.industrial900.withValues(alpha: 0.25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(Icons.memory, color: AppColors.industrial200, size: 28),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: Text(
                    'PCB-Vision Enterprise',
                    style: AppTypography.heading1.copyWith(
                      fontSize: 22,
                      color: AppColors.industrial900,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Center(
                  child: Text(
                    'Industrial Automated Optical Inspection & QA System',
                    style: AppTypography.bodySmall.copyWith(fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 28),

                // Login Card
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.bgSurface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.borderSubtle),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'SIGN IN WITH WORKSPACE CREDENTIALS',
                        style: AppTypography.label.copyWith(fontSize: 10),
                      ),
                      const SizedBox(height: 14),

                      if (_error != null)
                        Container(
                          padding: const EdgeInsets.all(10),
                          margin: const EdgeInsets.only(bottom: 14),
                          decoration: BoxDecoration(
                            color: AppColors.qaFailBg,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.qaFailBorder),
                          ),
                          child: Text(
                            _error!,
                            style: AppTypography.bodySmall.copyWith(color: AppColors.qaFail),
                          ),
                        ),

                      Text('Email Address', style: AppTypography.label),
                      const SizedBox(height: 4),
                      TextField(
                        controller: _emailController,
                        style: AppTypography.mono.copyWith(fontSize: 13),
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          hintText: 'user@pcb-vision.ai',
                          prefixIcon: Icon(Icons.email_outlined, size: 18),
                        ),
                      ),
                      const SizedBox(height: 14),

                      Text('Password', style: AppTypography.label),
                      const SizedBox(height: 4),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        style: AppTypography.mono.copyWith(fontSize: 13),
                        decoration: const InputDecoration(
                          hintText: '••••••••',
                          prefixIcon: Icon(Icons.lock_outline, size: 18),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: _showForgotPasswordDialog,
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(50, 30),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Forgot Password?',
                            style: AppTypography.mono.copyWith(
                              fontSize: 11,
                              color: AppColors.industrial600,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        child: _isLoading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Sign In to Industrial Console'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Quick Demo Roles
                Text(
                  'ONE-TAP ROLE TESTING (RBAC)',
                  style: AppTypography.label.copyWith(fontSize: 10),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _demoRoleButton(
                      label: 'Quality Eng',
                      role: UserRole.engineer,
                      auth: auth,
                      color: AppColors.industrial600,
                    ),
                    const SizedBox(width: 8),
                    _demoRoleButton(
                      label: 'Sys Admin',
                      role: UserRole.admin,
                      auth: auth,
                      color: const Color(0xFFB45309),
                    ),
                    const SizedBox(width: 8),
                    _demoRoleButton(
                      label: 'Auditor',
                      role: UserRole.viewer,
                      auth: auth,
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _demoRoleButton({
    required String label,
    required UserRole role,
    required AuthProvider auth,
    required Color color,
  }) {
    return Expanded(
      child: OutlinedButton(
        onPressed: () async {
          await auth.demoLogin(role);
        },
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 8),
          side: BorderSide(color: color.withValues(alpha: 0.4)),
        ),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.mono.copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ),
    );
  }
}
