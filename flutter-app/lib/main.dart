import 'package:app_links/app_links.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/age_gate_refresh.dart';
import 'core/auth_state.dart';
import 'core/terms_refresh.dart';
import 'core/language_provider.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'firebase_options.dart';
import 'navigation/session_nav.dart';
import 'screens/age_gate_screen.dart';
import 'screens/shared/terms_screen.dart';
import 'services/notification_service.dart';
import 'services/offline_queue.dart';

void _handleDeepLink(Uri uri) {
  // Payment return: sahelagriconnect://payment/success?role=cooperative&lang=en
  if (uri.host == 'payment' ||
      uri.pathSegments.contains('payment') ||
      uri.queryParameters['payment'] == 'success') {
    final role = uri.queryParameters['role'] ?? 'cooperative';
    final lang = uri.queryParameters['lang'];
    if (lang == 'en' || lang == 'fr') {
      // LanguageProvider may not be mounted yet on cold start; route carries hint.
    }
    final loginRoutes = {
      'cooperative': '/login/cooperative',
      'investor': '/login/investor',
      'processor': '/login/processor',
      'farmer': '/login/farmer',
      'government': '/login/government',
      'ngo': '/login/ngo',
    };
    final dest = loginRoutes[role] ?? '/home';
    final q = lang != null ? '?lang=$lang&payment=success' : '?payment=success';
    appRouter.go('$dest$q');
    return;
  }

  // Magic link: sahelagriconnect://auth/magic?c=...&e=...&p=...&r=cooperative&lang=en
  if (uri.pathSegments.contains('magic') ||
      (uri.host == 'auth' && uri.path.contains('magic'))) {
    final code = uri.queryParameters['c'] ?? '';
    final email = uri.queryParameters['e'] ?? '';
    final purpose = uri.queryParameters['p'] ?? '';
    final role = uri.queryParameters['r'] ?? '';
    final lang = uri.queryParameters['lang'] ?? '';
    if (code.isNotEmpty && email.isNotEmpty) {
      final parts = <String>[
        'c=${Uri.encodeComponent(code)}',
        'e=${Uri.encodeComponent(email)}',
        'p=${Uri.encodeComponent(purpose)}',
      ];
      if (role.isNotEmpty) parts.add('r=${Uri.encodeComponent(role)}');
      if (lang.isNotEmpty) parts.add('lang=${Uri.encodeComponent(lang)}');
      appRouter.go('/auth/magic?${parts.join('&')}');
    }
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final authState = AuthState();
  await authState.restoreSession();

  // Listen for deep links when app is already running (background → foreground)
  final appLinks = AppLinks();
  appLinks.uriLinkStream.listen((uri) {
    _handleDeepLink(uri);
  });

  // Handle launch URI (app opened via deep link from cold start)
  final initialUri = await appLinks.getInitialLink();
  if (initialUri != null) {
    _handleDeepLink(initialUri);
  }

  final ageAccepted = await AgeGateScreen.hasAccepted();
  final ageGate = AgeGateRefresh(ageAccepted);

  final termsAccepted = await TermsScreen.hasAccepted();
  final termsGate = TermsRefresh(termsAccepted);

  GoogleFonts.config.allowRuntimeFetching = true;

  buildRouter(authState, ageGate, termsGate);
  onAuthSessionExpired = () {
    authState.logoutAll();
    appRouter.go('/home');
  };

  try {
    await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform);
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
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authState),
        ChangeNotifierProvider.value(value: ageGate),
        ChangeNotifierProvider.value(value: termsGate),
        ChangeNotifierProvider(create: (_) => OfflineQueue()),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
      ],
      child: const SahelApp(),
    ),
  );
}

class SahelApp extends StatefulWidget {
  const SahelApp({super.key});

  /// Public entry point used by [LanguageScreen] (or any other screen)
  /// to switch the app locale at runtime. Forwards to the singleton
  /// state if it's mounted; otherwise a no-op.
  static void updateLocale(Locale locale) {
    _SahelAppState._instance?.setLocale(locale);
  }

  @override
  State<SahelApp> createState() => _SahelAppState();
}

class _SahelAppState extends State<SahelApp> {
  // Persisted under this SharedPreferences key.
  static const _kLocalePrefKey = 'app_locale';

  // Singleton-style handle so any screen can request a locale change
  // without threading an InheritedWidget through every route.
  static _SahelAppState? _instance;

  Locale _locale = const Locale('fr');

  @override
  void initState() {
    super.initState();
    _instance = this;
    _loadSavedLocale();
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
    } catch (_) {
      // Keep the default locale if storage fails.
    }
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

/// Global overscroll physics for all scrollables under [MaterialApp.router].
class _BouncingScrollBehavior extends ScrollBehavior {
  const _BouncingScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const BouncingScrollPhysics();
  }
}
