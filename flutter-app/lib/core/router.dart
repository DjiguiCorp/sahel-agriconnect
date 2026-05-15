import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'age_gate_refresh.dart';
import 'auth_state.dart';
import 'terms_refresh.dart';
import '../screens/age_gate_screen.dart';
import '../screens/auth/farmer_auth_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/cooperative/cooperative_dashboard.dart';
import '../screens/farmer/farmer_dashboard.dart';
import '../screens/government/government_dashboard.dart';
import '../screens/home_screen.dart';
import '../screens/investor/investor_dashboard.dart';
import '../screens/language_screen.dart';
import '../screens/processor/processor_dashboard.dart';
import '../screens/role_screen.dart';
import '../screens/shared/about_screen.dart';
import '../screens/shared/change_contact_screen.dart';
import '../screens/shared/delete_account_screen.dart';
import '../screens/shared/edit_profile_screen.dart';
import '../screens/shared/help_screen.dart';
import '../screens/shared/language_screen.dart' as settings_language;
import '../screens/shared/notification_settings_screen.dart';
import '../screens/shared/notifications_screen.dart';
import '../screens/shared/pending_vetting_screen.dart';
import '../screens/shared/profile_screen.dart';
import '../screens/shared/terms_screen.dart';
import '../screens/shared/webview_screen.dart';
import '../screens/splash_screen.dart';

final GlobalKey<NavigatorState> _rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');

GlobalKey<NavigatorState> get rootNavigatorKey => _rootKey;

late GoRouter appRouter;

GoRouter buildRouter(
  AuthState authState,
  AgeGateRefresh ageGate,
  TermsRefresh termsGate,
) {
  appRouter = GoRouter(
      navigatorKey: _rootKey,
      initialLocation: '/home',
      refreshListenable: Listenable.merge([authState, ageGate, termsGate]),
      // Navigation logic:
      // - Unauthenticated (guest): /home and /guest/* allowed
      // - Pending vetting: /pending-vetting only
      // - Authenticated: role-specific dashboard
      // - Logged out: return to /home as guest
      redirect: (context, state) async {
        final loc = state.matchedLocation;

        if (authState.loading) return '/';

        if (!termsGate.accepted && loc != '/terms') {
          return '/terms';
        }

        final prefs = await SharedPreferences.getInstance();
        final langSelected = prefs.getBool('language_selected') ?? false;
        if (termsGate.accepted && !langSelected && loc != '/language') {
          return '/language';
        }

        // Age gate — investor routes only
        final isInvestorPath =
            loc.startsWith('/investor') || loc == '/login/investor';
        if (isInvestorPath && !ageGate.accepted) {
          return '/age-gate';
        }
        if (loc == '/age-gate') {
          if (!ageGate.accepted) return null;
          return authState.isLoggedIn
              ? _dashboardRoute(authState.role)
              : '/login/investor';
        }

        final loggedIn = authState.isLoggedIn;

        if (loggedIn && loc.startsWith('/guest/')) {
          return _dashboardRoute(authState.role);
        }

        if (loggedIn && _routeMismatch(authState.role, loc)) {
          return _dashboardRoute(authState.role);
        }

        if (authState.isGuest) {
          if (_isProtectedPath(loc)) {
            return _loginPathFor(loc);
          }
        }

        if (loggedIn &&
            (loc == '/' ||
                loc == '/role' ||
                loc.startsWith('/login') ||
                loc.startsWith('/register'))) {
          return _dashboardRoute(authState.role);
        }

        return null;
      },
      routes: [
        GoRoute(path: '/age-gate', builder: (_, __) => const AgeGateScreen()),
        GoRoute(
          path: '/terms',
          builder: (context, state) {
            final viewOnly = state.uri.queryParameters['view'] == '1';
            return TermsScreen(viewOnly: viewOnly);
          },
        ),
        GoRoute(path: '/language', builder: (_, __) => const LanguageScreen()),
        GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
        // Public & dashboards: /home, /guest/*, /farmer, /investor, /cooperative,
        // /government, /processor, /notifications, /profile.
        GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        GoRoute(
          path: '/guest/farmer',
          builder: (_, __) => const HomeScreen(initialGuestCategory: 0),
        ),
        GoRoute(
          path: '/guest/investor',
          builder: (_, __) => const HomeScreen(initialGuestCategory: 1),
        ),
        GoRoute(
          path: '/guest/cooperative',
          builder: (_, __) => const HomeScreen(initialGuestCategory: 2),
        ),
        GoRoute(
          path: '/guest/markets',
          builder: (_, __) => const HomeScreen(initialGuestCategory: 3),
        ),
        GoRoute(path: '/role', builder: (_, __) => const RoleScreen()),
        GoRoute(
            path: '/login/farmer',
            builder: (_, __) => const FarmerAuthScreen()),
        GoRoute(
          path: '/login/investor',
          builder: (_, __) => const LoginScreen(role: AuthRole.investor),
        ),
        GoRoute(
          path: '/login/cooperative',
          builder: (_, __) => const LoginScreen(role: AuthRole.cooperative),
        ),
        GoRoute(
          path: '/login/government',
          builder: (_, __) => const LoginScreen(role: AuthRole.government),
        ),
        GoRoute(
          path: '/login/ngo',
          builder: (_, __) => const LoginScreen(role: AuthRole.ngo),
        ),
        GoRoute(
          path: '/login/processor',
          builder: (_, __) => const LoginScreen(role: AuthRole.processor),
        ),
        GoRoute(
          path: '/pending-vetting',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>? ?? {};
            return PendingVettingScreen(
              role: extra['role'] ?? AuthRole.none,
              contact: extra['contact'] ?? '',
              sessionToken: extra['sessionToken'],
              verificationId: extra['verificationId'],
            );
          },
        ),
        GoRoute(
            path: '/farmer', builder: (_, __) => const FarmerDashboard()),
        GoRoute(
            path: '/investor', builder: (_, __) => const InvestorDashboard()),
        GoRoute(
            path: '/cooperative',
            builder: (_, __) => const CooperativeDashboard()),
        GoRoute(
            path: '/government',
            builder: (_, __) => const GovernmentDashboard()),
        GoRoute(
            path: '/processor',
            builder: (_, __) => const ProcessorDashboard()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(
          path: '/profile/edit',
          builder: (_, __) => const EditProfileScreen(),
        ),
        GoRoute(
          path: '/profile/change-phone',
          builder: (_, __) => const ChangeContactScreen(type: 'phone'),
        ),
        GoRoute(
          path: '/profile/change-email',
          builder: (_, __) => const ChangeContactScreen(type: 'email'),
        ),
        GoRoute(
          path: '/profile/language',
          builder: (_, __) => const settings_language.LanguageScreen(),
        ),
        GoRoute(
          path: '/profile/notifications',
          builder: (_, __) => const NotificationSettingsScreen(),
        ),
        GoRoute(
          path: '/profile/delete-account',
          builder: (_, __) => const DeleteAccountScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (_, __) => const NotificationsScreen(),
        ),
        GoRoute(path: '/help', builder: (_, __) => const HelpScreen()),
        GoRoute(path: '/faq', builder: (_, __) => const HelpScreen()),
        GoRoute(
          path: '/webview',
          builder: (context, state) {
            final uri = state.uri;
            final title = uri.queryParameters['title'] ?? 'Web';
            final url = uri.queryParameters['url'] ??
                'https://sahelagriconnect.com';
            return InAppWebViewScreen(title: title, url: url);
          },
        ),
        GoRoute(path: '/about-app', builder: (_, __) => const AboutAppScreen()),
      ],
    );
  authState.onLogout = () {
    Future.microtask(() => appRouter.go('/home'));
  };
  return appRouter;
}

bool _isProfileOrSupportPath(String loc) {
  if (loc.startsWith('/profile')) return true;
  if (loc == '/notifications' || loc.startsWith('/notifications/')) return true;
  if (loc == '/help' || loc.startsWith('/help/')) return true;
  if (loc == '/faq') return true;
  if (loc == '/about-app') return true;
  return false;
}

bool _isProtectedPath(String loc) {
  if (loc.startsWith('/guest/')) return false;
  if (_isProfileOrSupportPath(loc)) return true;
  const paths = [
    '/farmer',
    '/investor',
    '/cooperative',
    '/government',
    '/processor',
  ];
  for (final p in paths) {
    if (loc == p || loc.startsWith('$p/')) return true;
  }
  return false;
}

String _loginPathFor(String loc) {
  return '/home';
}

bool _routeMismatch(AuthRole role, String loc) {
  if (loc == '/webview') return false;
  if (_isProfileOrSupportPath(loc)) return false;
  // NGO shares the government dashboard.
  if (role == AuthRole.ngo && loc.startsWith('/government')) return false;
  switch (role) {
    case AuthRole.farmer:
      return !(loc.startsWith('/farmer'));
    case AuthRole.investor:
      return !(loc.startsWith('/investor'));
    case AuthRole.cooperative:
      return !(loc.startsWith('/cooperative'));
    case AuthRole.government:
      return !(loc.startsWith('/government'));
    case AuthRole.ngo:
      return !(loc.startsWith('/government'));
    case AuthRole.processor:
      return !(loc.startsWith('/farmer') || loc.startsWith('/processor'));
    default:
      return false;
  }
}

String _dashboardRoute(AuthRole role) {
  switch (role) {
    case AuthRole.farmer:
      return '/farmer';
    case AuthRole.investor:
      return '/investor';
    case AuthRole.cooperative:
      return '/cooperative';
    case AuthRole.government:
      return '/government';
    case AuthRole.ngo:
      return '/government';
    case AuthRole.processor:
      return '/farmer';
    default:
      return '/role';
  }
}
