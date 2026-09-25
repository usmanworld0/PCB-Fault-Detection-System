import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Enterprise Industrial Color Palette — mirrors the web platform's Tailwind config.
/// Reference: web/tailwind.config.js (industrial, surface, qa palettes)
class AppColors {
  AppColors._();

  // ─── Background & Surface ──────────────────────────────────
  static const bgApp = Color(0xFFF8FAFC);         // surface-50
  static const bgSurface = Color(0xFFFFFFFF);      // white
  static const bgMuted = Color(0xFFF1F5F9);        // surface-100

  // ─── Text ──────────────────────────────────────────────────
  static const textPrimary = Color(0xFF0F172A);    // surface-900
  static const textSecondary = Color(0xFF475569);  // surface-600
  static const textMuted = Color(0xFF94A3B8);      // surface-400
  static const textStrong = Color(0xFF1E293B);     // surface-800

  // ─── Borders ───────────────────────────────────────────────
  static const borderSubtle = Color(0xFFE2E8F0);  // surface-200
  static const borderStrong = Color(0xFFCBD5E1);  // surface-300

  // ─── Industrial Blue ───────────────────────────────────────
  static const industrial50 = Color(0xFFF0F7FC);
  static const industrial100 = Color(0xFFE0EEF7);
  static const industrial200 = Color(0xFFBADCF0);
  static const industrial300 = Color(0xFF7FC1E4);
  static const industrial400 = Color(0xFF3CA3D4);
  static const industrial500 = Color(0xFF1587BE);
  static const industrial600 = Color(0xFF0C6DA0);
  static const industrial700 = Color(0xFF0B5882);
  static const industrial800 = Color(0xFF0D4B6C);
  static const industrial900 = Color(0xFF103F5A);
  static const industrial950 = Color(0xFF0A293D);

  // ─── QA Status Semantic Colors ─────────────────────────────
  static const qaPass = Color(0xFF059669);
  static const qaPassBg = Color(0xFFECFDF5);
  static const qaPassBorder = Color(0xFFA7F3D0);

  static const qaFail = Color(0xFFDC2626);
  static const qaFailBg = Color(0xFFFEF2F2);
  static const qaFailBorder = Color(0xFFFECACA);

  static const qaWarning = Color(0xFFD97706);
  static const qaWarningBg = Color(0xFFFFFBEB);
  static const qaWarningBorder = Color(0xFFFDE68A);

  static const qaInfo = Color(0xFF0284C7);
  static const qaInfoBg = Color(0xFFF0F9FF);
  static const qaInfoBorder = Color(0xFFBAE6FD);

  static const qaReview = Color(0xFF6366F1);
  static const qaReviewBg = Color(0xFFEEF2FF);
  static const qaReviewBorder = Color(0xFFC7D2FE);

  // ─── Sidebar / Navigation ─────────────────────────────────
  static const sidebarBg = Color(0xFF103F5A);       // industrial-900
  static const sidebarActive = Color(0xFF1587BE);   // industrial-500
  static const sidebarText = Color(0xFFBADCF0);     // industrial-200
  static const sidebarTextActive = Colors.white;
}

/// App-wide text theme using Google Fonts Inter — matching the web platform.
class AppTypography {
  AppTypography._();

  static TextStyle heading1 = GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle heading2 = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  );

  static TextStyle heading3 = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static TextStyle body = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static TextStyle bodySmall = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
  );

  static TextStyle label = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: AppColors.textMuted,
    letterSpacing: 0.5,
  );

  static TextStyle mono = GoogleFonts.jetBrainsMono(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  static TextStyle statValue = GoogleFonts.inter(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );

  static TextStyle statLabel = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted,
  );

  static TextStyle buttonText = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: Colors.white,
  );
}

/// Material ThemeData built from the enterprise palette.
ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.bgApp,
    colorScheme: ColorScheme.light(
      primary: AppColors.industrial600,
      onPrimary: Colors.white,
      secondary: AppColors.industrial400,
      onSecondary: Colors.white,
      surface: AppColors.bgSurface,
      onSurface: AppColors.textPrimary,
      error: AppColors.qaFail,
      onError: Colors.white,
      outline: AppColors.borderSubtle,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.bgSurface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.bgSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: AppColors.borderSubtle, width: 1),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.borderSubtle,
      thickness: 1,
      space: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.bgSurface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: AppColors.borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: AppColors.borderSubtle),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: const BorderSide(color: AppColors.industrial500, width: 1.5),
      ),
      hintStyle: GoogleFonts.inter(
        fontSize: 13,
        color: AppColors.textMuted,
      ),
      labelStyle: GoogleFonts.inter(
        fontSize: 13,
        color: AppColors.textSecondary,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.industrial600,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        textStyle: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.textSecondary,
        side: const BorderSide(color: AppColors.borderSubtle),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        textStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.bgMuted,
      selectedColor: AppColors.industrial100,
      labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
      side: const BorderSide(color: AppColors.borderSubtle),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.bgSurface,
      selectedItemColor: AppColors.industrial600,
      unselectedItemColor: AppColors.textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w400),
    ),
  );
}
