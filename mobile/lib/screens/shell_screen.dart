import 'package:flutter/material.dart';
import '../services/local_alert_notifications.dart';
import '../widgets/enterprise_header.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'inspections_screen.dart';
import 'models_screen.dart';
import 'settings_screen.dart';
import 'alerts_screen.dart';
import 'inspection_detail_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      LocalAlertNotifications.initialize((inspectionId) async {
        if (!mounted) return;
        await Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => InspectionDetailScreen(inspectionId: inspectionId),
          ),
        );
      }).catchError((Object error) {
        debugPrint('Could not initialize alert tap handling: $error');
      });
    });
  }

  final List<String> _titles = [
    'Analytics Dashboard',
    'Real-Time Inspection Stream',
    'YOLOv8 AI Inference Registry',
    'Station Alerts',
    'User Profile & Settings',
  ];

  final _screens = const [
    DashboardScreen(),
    InspectionsScreen(),
    ModelsScreen(),
    AlertsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgApp,
      appBar: EnterpriseHeader(title: _titles[_index]),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bgSurface,
          border: Border(
            top: BorderSide(color: AppColors.borderSubtle, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _index,
          onTap: (i) => setState(() => _index = i),
          backgroundColor: AppColors.bgSurface,
          selectedItemColor: AppColors.purityTeal,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedLabelStyle: AppTypography.label.copyWith(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppColors.purityTeal,
          ),
          unselectedLabelStyle: AppTypography.bodySmall.copyWith(
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.analytics_outlined, size: 20),
              activeIcon: Icon(Icons.analytics, size: 20),
              label: 'Analytics',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.biotech_outlined, size: 20),
              activeIcon: Icon(Icons.biotech, size: 20),
              label: 'Inspections',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.memory_outlined, size: 20),
              activeIcon: Icon(Icons.memory, size: 20),
              label: 'Models',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_outlined, size: 20),
              activeIcon: Icon(Icons.notifications, size: 20),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline, size: 20),
              activeIcon: Icon(Icons.person, size: 20),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
