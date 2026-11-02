import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/age_gate_refresh.dart';
import 'core/auth_state.dart';
import 'core/terms_refresh.dart';
import 'core/language_provider.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'navigation/session_nav.dart';
import 'screens/age_gate_screen.dart';
import 'screens/shared/terms_screen.dart';
import 'services/offline_queue.dart';

/// TestFlight launch probe. If this screen opens on device, Flutter engine is fine
/// and the crash is in real bootstrap (keychain / plugins / router).
/// Set to false after build 24 is confirmed on TestFlight.
const bool kLaunchSmokeTest = false;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (kLaunchSmokeTest) {
    runApp(
      const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: _LaunchSmokeScreen(),
      ),
    );
    return;
  }

  await _bootstrapFullApp();
}

class _LaunchSmokeScreen extends StatelessWidget {
  const _LaunchSmokeScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF1a3c2e),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Build 24 OK',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  'If you see this on TestFlight, the crash is not the Flutter engine — it is app startup code.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFFB8C5B0),
                    fontSize: 15,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> _bootstrapFullApp() async {
  final authState = AuthState();
  try {
    await authState.restoreSession();
  } catch (e, st) {
    debugPrint('restoreSession failed: $e');
    if (kDebugMode) debugPrint('$st');
  }

  bool ageAccepted = false;
  bool termsAccepted = false;
  try {
    ageAccepted = await AgeGateScreen.hasAccepted();
  } catch (_) {}
  try {
    termsAccepted = await TermsScreen.hasAccepted();
  } catch (_) {}

  final ageGate = AgeGateRefresh(ageAccepted);
  final termsGate = TermsRefresh(termsAccepted);
  final offlineQueue = OfflineQueue.deferred();

  buildRouter(authState, ageGate, termsGate);
  onAuthSessionExpired = () {
    authState.logoutAll();
    if (isAppRouterReady) {
      appRouter.go('/home');
    }
  };

  try {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );
    await SystemChrome.setPreferredOrientations(
      [DeviceOrientation.portraitUp],
    );
  } catch (_) {}

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authState),
        ChangeNotifierProvider.value(value: ageGate),
        ChangeNotifierProvider.value(value: termsGate),
        ChangeNotifierProvider.value(value: offlineQueue),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
      ],
      child: SahelApp(
        authState: authState,
        ageGate: ageGate,
        termsGate: termsGate,
        offlineQueue: offlineQueue,
      ),
    ),
  );
}

class SahelApp extends StatefulWidget {
  const SahelApp({
    super.key,
    required this.authState,
    required this.ageGate,
    required this.termsGate,
    required this.offlineQueue,
  });

  final AuthState authState;
  final AgeGateRefresh ageGate;
  final TermsRefresh termsGate;
  final OfflineQueue offlineQueue;

  static void updateLocale(Locale locale) {
    _SahelAppState._instance?.setLocale(locale);
  }

  @override
  State<SahelApp> createState() => _SahelAppState();
}

class _SahelAppState extends State<SahelApp> {
  static const _kLocalePrefKey = 'app_locale';
  static _SahelAppState? _instance;
  Locale _locale = const Locale('fr');
  bool _postLaunchStarted = false;

  @override
  void initState() {
    super.initState();
    _instance = this;
    _loadSavedLocale();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_runPostLaunchWork());
    });
  }

  Future<void> _runPostLaunchWork() async {
    if (_postLaunchStarted) return;
    _postLaunchStarted = true;
    await Future<void>.delayed(const Duration(milliseconds: 50));
    if (!mounted) return;

    try {
      widget.offlineQueue.start();
    } catch (e) {
      debugPrint('OfflineQueue start failed: $e');
    }

    try {
      final appLinks = AppLinks();
      appLinks.uriLinkStream.listen(_handleDeepLink, onError: (Object e) {
        debugPrint('uriLinkStream error: $e');
      });
      final initial = await appLinks.getInitialLink();
      if (initial != null) _handleDeepLink(initial);
    } catch (e) {
      debugPrint('Deep link init skipped: $e');
    }
  }

  void _handleDeepLink(Uri uri) {
    if (!mounted || !isAppRouterReady) return;
    if (uri.host == 'payment' || uri.pathSegments.contains('payment')) {
      final role = uri.queryParameters['role'] ?? 'cooperative';
      final lang = uri.queryParameters['lang'];
      const routes = {
        'cooperative': '/login/cooperative',
        'investor': '/login/investor',
        'processor': '/login/processor',
        'farmer': '/login/farmer',
      };
      final dest = routes[role] ?? '/home';
      final q = lang != null ? '?lang=$lang&payment=success' : '?payment=success';
      try {
        appRouter.go('$dest$q');
      } catch (_) {}
    } else if (uri.pathSegments.contains('magic')) {
      final code = uri.queryParameters['c'] ?? '';
      final email = uri.queryParameters['e'] ?? '';
      if (code.isNotEmpty && email.isNotEmpty) {
        try {
          appRouter.go(
            '/auth/magic?c=${Uri.encodeComponent(code)}&e=${Uri.encodeComponent(email)}',
          );
        } catch (_) {}
      }
    }
  }

  @override
  void dispose() {
    if (identical(_instance, this)) _instance = null;
    super.dispose();
  }

  Future<void> _loadSavedLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_kLocalePrefKey) ?? 'fr';
      if (mounted && (saved == 'fr' || saved == 'en')) {
        setState(() => _locale = Locale(saved));
      }
    } catch (_) {}
  }

  void setLocale(Locale locale) {
    if (!mounted) return;
    setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    return ScrollConfiguration(
      behavior: const _BouncingScrollBehavior(),
      child: MaterialApp.router(
        title: 'Sahel AgriConnect',
        debugShowCheckedModeBanner: false,
        color: const Color(0xFF060f0a),
        theme: AppTheme.light.copyWith(
          scaffoldBackgroundColor: const Color(0xFF060f0a),
          canvasColor: const Color(0xFF060f0a),
        ),
        darkTheme: AppTheme.dark.copyWith(
          scaffoldBackgroundColor: const Color(0xFF060f0a),
          canvasColor: const Color(0xFF060f0a),
        ),
        themeMode: ThemeMode.dark,
        routerConfig: appRouter,
        locale: _locale,
        supportedLocales: const [Locale('fr'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
      ),
    );
  }
}

class _BouncingScrollBehavior extends ScrollBehavior {
  const _BouncingScrollBehavior();
  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      const BouncingScrollPhysics();
}
