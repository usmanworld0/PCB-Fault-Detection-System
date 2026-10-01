import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Purity UI Color Palette for PCB Vision Enterprise Mobile App.
/// Matches the web platform's Purity UI Dashboard design tokens.
class AppColors {
  AppColors._();

  // ─── Background & Surface ──────────────────────────────────
  static const bgApp = Color(0xFFF8F9FA); // Purity canvas gray
  static const bgSurface = Color(0xFFFFFFFF); // White card surface
  static const bgMuted = Color(0xFFF7FAFC); // Subtle background
  static const bgHover = Color(0xFFEDF2F7);

  // ─── Purity Teal (Primary Brand) ───────────────────────────
  static const purityTeal = Color(0xFF4FD1C5); // Core Purity Teal
  static const purityTealHover = Color(0xFF38B2AC);
  static const purityTealDark = Color(0xFF319795);
  static const purityTealLight = Color(0xFFE6FFFA);
  static const purityTealBorder = Color(0xFFB2F5EA);

  // ─── Text Hierarchy ────────────────────────────────────────
  static const textPrimary = Color(0xFF2D3748); // Deep Slate Headings / Strong
  static const textSecondary = Color(0xFF718096); // Slate Body Text
  static const textMuted = Color(0xFFA0AEC0); // Slate Subtitles / Labels
  static const textStrong = Color(0xFF1A202C);

  // ─── Borders ───────────────────────────────────────────────
  static const borderSubtle = Color(0xFFE2E8F0);
  static const borderStrong = Color(0xFFCBD5E0);

  // ─── Semantic QA / Status Colors ───────────────────────────
  static const qaPass = Color(0xFF48BB78); // Green
  static const qaPassBg = Color(0xFFF0FFF4);
  static const qaPassBorder = Color(0xFFC6F6D5);

  static const qaFail = Color(0xFFE53E3E); // Red
  static const qaFailBg = Color(0xFFFFF5F5);
  static const qaFailBorder = Color(0xFFFED7D7);

  static const qaWarning = Color(0xFFED8936); // Amber / Orange
  static const qaWarningBg = Color(0xFFFFFAF0);
  static const qaWarningBorder = Color(0xFFFEEBC8);

  static const qaInfo = Color(0xFF4FD1C5); // Teal info
  static const qaInfoBg = Color(0xFFE6FFFA);
  static const qaInfoBorder = Color(0xFFB2F5EA);

  static const qaReview = Color(0xFF805AD5); // Purple review
  static const qaReviewBg = Color(0xFFFAF5FF);
  static const qaReviewBorder = Color(0xFFE9D8FD);

  // ─── Backward compatibility aliases ────────────────────────
  static const industrial50 = Color(0xFFE6FFFA);
  static const industrial100 = Color(0xFFB2F5EA);
  static const industrial200 = Color(0xFF81E6D9);
  static const industrial300 = Color(0xFF4FD1C5);
  static const industrial400 = Color(0xFF38B2AC);
  static const industrial500 = Color(0xFF319795);
  static const industrial600 = Color(0xFF4FD1C5); // Maps directly to Purity Teal
  static const industrial700 = Color(0xFF2D3748);
  static const industrial800 = Color(0xFF1A202C);
  static const industrial900 = Color(0xFF2D3748);
  static const industrial950 = Color(0xFF1A202C);

  // ─── Navigation ────────────────────────────────────────────
  static const sidebarBg = Color(0xFFFFFFFF);
  static const sidebarActive = Color(0xFF4FD1C5);
  static const sidebarText = Color(0xFF718096);
  static const sidebarTextActive = Color(0xFF2D3748);
}

/// App-wide typography matching Purity UI (Plus Jakarta Sans).
class AppTypography {
  AppTypography._();

  static TextStyle heading1 = GoogleFonts.plusJakartaSans(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle heading2 = GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  );

  static TextStyle heading3 = GoogleFonts.plusJakartaSans(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static TextStyle body = GoogleFonts.plusJakartaSans(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static TextStyle bodySmall = GoogleFonts.plusJakartaSans(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: AppColors.textMuted,
  );

  static TextStyle get bodySmallReadable =>
      GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: AppColors.textSecondary,
      );

  static TextStyle label = GoogleFonts.plusJakartaSans(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppColors.textMuted,
    letterSpacing: 0.6,
  );

  static TextStyle mono = GoogleFonts.jetBrainsMono(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  static TextStyle statValue = GoogleFonts.plusJakartaSans(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );

  static TextStyle statLabel = GoogleFonts.plusJakartaSans(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppColors.textMuted,
    letterSpacing: 0.5,
  );

  static TextStyle buttonText = GoogleFonts.plusJakartaSans(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: Colors.white,
    letterSpacing: 0.5,
  );
}

/// Material ThemeData built from Purity UI specifications.
ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.bgApp,
    colorScheme: const ColorScheme.light(
      primary: AppColors.purityTeal,
      onPrimary: Colors.white,
      secondary: AppColors.purityTealHover,
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
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.bgSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
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
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(color: AppColors.borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(color: AppColors.borderSubtle),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(
          color: AppColors.purityTeal,
          width: 1.5,
        ),
      ),
      hintStyle: GoogleFonts.plusJakartaSans(
        fontSize: 13,
        color: AppColors.textMuted,
      ),
      labelStyle: GoogleFonts.plusJakartaSans(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.purityTeal,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        textStyle: GoogleFonts.plusJakartaSans(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.textPrimary,
        side: const BorderSide(color: AppColors.borderSubtle),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        textStyle: GoogleFonts.plusJakartaSans(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.bgMuted,
      selectedColor: AppColors.purityTealLight,
      labelStyle: GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w600,
      ),
      side: const BorderSide(color: AppColors.borderSubtle),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.bgSurface,
      selectedItemColor: AppColors.purityTeal,
      unselectedItemColor: AppColors.textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w700,
      ),
      unselectedLabelStyle: GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w500,
      ),
    ),
  );
}
