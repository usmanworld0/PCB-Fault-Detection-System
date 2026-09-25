import 'package:flutter/material.dart';
import '../widgets/enterprise_header.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'inspections_screen.dart';
import 'models_screen.dart';
import 'settings_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;

  final List<String> _titles = [
    'Enterprise Analytics Dashboard',
    'Real-time Inspection Stream',
    'YOLOv8 AI Inference Registry',
    'Workstation & RBAC Settings',
  ];

  final _screens = const [
    DashboardScreen(),
    InspectionsScreen(),
    ModelsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgApp,
      appBar: EnterpriseHeader(
        title: _titles[_index],
      ),
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
          selectedItemColor: AppColors.industrial600,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedLabelStyle: AppTypography.mono.copyWith(fontSize: 10, fontWeight: FontWeight.w700),
          unselectedLabelStyle: AppTypography.mono.copyWith(fontSize: 10, fontWeight: FontWeight.w500),
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
              icon: Icon(Icons.tune_outlined, size: 20),
              activeIcon: Icon(Icons.tune, size: 20),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}
