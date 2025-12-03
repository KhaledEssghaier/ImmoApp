import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  // ===========================
  // PRIMARY COLORS
  // ===========================
  static const Color primaryColor = Color(0xFFFF6B35); // Orange 500
  static const Color primaryDark = Color(0xFFE55A2B); // Orange 700
  static const Color primaryLight = Color(0xFFFFE5DC); // Orange 100

  // ===========================
  // SECONDARY COLORS
  // ===========================
  static const Color secondaryColor = Color(0xFF7B61FF); // Purple
  static const Color accentColor = Color(0xFF4AD4A6); // Mint Green

  // ===========================
  // NEUTRAL COLORS
  // ===========================
  static const Color backgroundColor = Color(0xFFF7F9FC); // Light Gray
  static const Color surfaceColor = Color(0xFFFFFFFF); // Soft White
  static const Color cardColor = Color(0xFFFFFFFF); // Soft White
  static const Color textPrimaryColor = Color(0xFF1A1A1A); // Charcoal
  static const Color textSecondaryColor = Color(0xFF6E6E6E); // Gray 600
  static const Color borderColor = Color(0xFFD8D8D8); // Gray 300
  static const Color dividerColor = Color(0xFFD8D8D8); // Gray 300

  // ===========================
  // STATUS COLORS
  // ===========================
  static const Color successColor = Color(0xFF2ECC71); // Green
  static const Color warningColor = Color(0xFFF1C40F); // Orange
  static const Color errorColor = Color(0xFFE74C3C); // Red

  // ===========================
  // LIGHT THEME (PRIMARY)
  // ===========================
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: primaryColor,
    scaffoldBackgroundColor: backgroundColor,

    colorScheme: const ColorScheme.light(
      primary: primaryColor,
      primaryContainer: primaryLight,
      secondary: secondaryColor,
      secondaryContainer: accentColor,
      tertiary: accentColor,
      surface: surfaceColor,
      background: backgroundColor,
      error: errorColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: textPrimaryColor,
      onBackground: textPrimaryColor,
      onError: Colors.white,
      outline: borderColor,
    ),

    // AppBar theme
    appBarTheme: AppBarTheme(
      backgroundColor: surfaceColor,
      foregroundColor: textPrimaryColor,
      elevation: 0,
      centerTitle: false,
      systemOverlayStyle: SystemUiOverlayStyle.dark,
      iconTheme: const IconThemeData(color: textPrimaryColor),
      actionsIconTheme: const IconThemeData(color: textPrimaryColor),
      titleTextStyle: const TextStyle(
        color: textPrimaryColor,
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
      ),
      shadowColor: borderColor.withOpacity(0.1),
    ),

    // Card theme
    cardTheme: CardThemeData(
      color: cardColor,
      elevation: 0,
      shadowColor: borderColor.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: borderColor.withOpacity(0.2), width: 1),
      ),
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
    ),

    // Text theme
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        color: textPrimaryColor,
        fontSize: 32,
        fontWeight: FontWeight.bold,
        letterSpacing: -1.0,
      ),
      displayMedium: TextStyle(
        color: textPrimaryColor,
        fontSize: 28,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.8,
      ),
      displaySmall: TextStyle(
        color: textPrimaryColor,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
      ),
      headlineLarge: TextStyle(
        color: textPrimaryColor,
        fontSize: 22,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
      ),
      headlineMedium: TextStyle(
        color: textPrimaryColor,
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
      ),
      headlineSmall: TextStyle(
        color: textPrimaryColor,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: TextStyle(
        color: textPrimaryColor,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      titleMedium: TextStyle(
        color: textPrimaryColor,
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      titleSmall: TextStyle(
        color: textPrimaryColor,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      bodyLarge: TextStyle(
        color: textPrimaryColor,
        fontSize: 16,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: TextStyle(
        color: textPrimaryColor,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: TextStyle(
        color: textSecondaryColor,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
      labelLarge: TextStyle(
        color: textPrimaryColor,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      labelMedium: TextStyle(
        color: textSecondaryColor,
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
      labelSmall: TextStyle(
        color: textSecondaryColor,
        fontSize: 11,
        fontWeight: FontWeight.w400,
      ),
    ),

    // Input decoration theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surfaceColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColor, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderColor, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: errorColor, width: 2),
      ),
      hintStyle: const TextStyle(color: textSecondaryColor, fontSize: 14),
      labelStyle: const TextStyle(color: textSecondaryColor, fontSize: 14),
      floatingLabelStyle: const TextStyle(color: primaryColor, fontSize: 14),
      errorStyle: const TextStyle(color: errorColor, fontSize: 12),
    ),

    // Elevated button theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        shadowColor: primaryColor.withOpacity(0.3),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    ),

    // Outlined button theme
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor, width: 2),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    ),

    // Text button theme
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    // Floating action button theme
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),

    // Chip theme
    chipTheme: ChipThemeData(
      backgroundColor: primaryLight,
      selectedColor: primaryColor,
      secondarySelectedColor: primaryColor,
      labelStyle: const TextStyle(color: primaryColor, fontSize: 14),
      secondaryLabelStyle: const TextStyle(color: Colors.white, fontSize: 14),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),

    // Divider theme
    dividerTheme: const DividerThemeData(color: dividerColor, thickness: 1),

    // Icon theme
    iconTheme: const IconThemeData(color: textPrimaryColor, size: 24),

    // Bottom navigation bar theme
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surfaceColor,
      selectedItemColor: primaryColor,
      unselectedItemColor: textSecondaryColor,
      type: BottomNavigationBarType.fixed,
    ),
  );
}
