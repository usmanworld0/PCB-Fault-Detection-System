import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_provider.dart';
import 'services/supabase_service.dart';
import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PCBVisionApp());
}

class PCBVisionApp extends StatelessWidget {
  const PCBVisionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(),
        ),
        ChangeNotifierProvider<SupabaseService>(
          create: (_) => SupabaseService(),
        ),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'PCB-Vision Enterprise',
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(),
            home: auth.isLoading
                ? const Scaffold(
                    backgroundColor: AppColors.bgApp,
                    body: Center(
                      child: CircularProgressIndicator(color: AppColors.industrial600),
                    ),
                  )
                : (auth.isAuthenticated ? const ShellScreen() : const LoginScreen()),
          );
        },
      ),
    );
  }
}
