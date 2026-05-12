import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/router.dart';
import 'core/theme.dart';
import 'firebase_options.dart';
import 'navigation/session_nav.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = true;

  onAuthSessionExpired = () => appRouter.go('/role');

  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    await NotificationService.init();
  } catch (e, st) {
    debugPrint('Firebase/FCM not ready (configure firebase_options.dart): $e');
    if (kDebugMode) debugPrint('$st');
  }

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const SahelApp());
}

class SahelApp extends StatelessWidget {
  const SahelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Sahel AgriConnect',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      routerConfig: appRouter,
    );
  }
}
