# PCB-Vision Mobile

Flutter companion app for the PCB inspection system. It uses the Supabase project configured in the app for authentication and inspection data.

## Requirements

- Flutter 3.32 or newer (includes Dart 3.8 or newer)
- Android Studio and Android SDK for Android builds
- An Android emulator or a USB-connected Android device with USB debugging enabled
- For iOS builds: macOS with Xcode installed

## Run locally

Open a terminal at the repository root, then run:

```bash
cd mobile
flutter doctor
flutter pub get
flutter devices
flutter run
```

If more than one device is available, choose one with:

```bash
flutter run -d <device-id>
```

Sign in with an existing Supabase Auth account. The app's Supabase connection is already configured; do not add keys or credentials to this README.

To run the web target in Chrome, when supported by your local Flutter setup:

```bash
flutter run -d chrome --web-hostname 127.0.0.1 --web-port 8080
```

## Build Android release

```bash
cd mobile
flutter pub get
flutter build apk --release
```

The APK is written to `build/app/outputs/flutter-apk/app-release.apk`. To build an Android App Bundle instead, run `flutter build appbundle --release`.

## Alerts and preferences

Realtime alert updates and in-app notifications require the app to have an active connection to Supabase. Closed-app push notifications are not configured. The optional SQL migration files in this folder are provided for review; run them in Supabase only if your team decides to apply those schema changes.
