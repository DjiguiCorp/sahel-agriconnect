import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/age_gate_refresh.dart';
import '../core/auth_state.dart';
import '../core/router.dart';
import '../core/terms_refresh.dart';
import '../screens/auth/investor_kyc_screen.dart';
import '../widgets/premium_upgrade_dialog.dart';

/// Enable with: `--dart-define=APP_STORE_SHOTS=1`
const bool kAppStoreShots =
    bool.fromEnvironment('APP_STORE_SHOTS', defaultValue: false);

/// Walks key App Store surfaces and prints `APP_STORE_SHOT_READY:<id>` so a
/// host script can capture each frame with `xcrun simctl io screenshot`.
Future<void> runAppStoreShotTour({
  required AuthState auth,
  required AgeGateRefresh ageGate,
  required TermsRefresh termsGate,
}) async {
  if (!kAppStoreShots || !kDebugMode) return;

  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool('language_selected', true);
  await prefs.setBool('terms_accepted', true);
  await prefs.setBool('age_gate_accepted', true);
  await prefs.setString('app_locale', 'en');
  if (!termsGate.accepted) termsGate.onAccepted();
  if (!ageGate.accepted) ageGate.onAcceptedFromPrefs();

  // Let first-frame redirects settle.
  await Future<void>.delayed(const Duration(seconds: 3));
  if (!isAppRouterReady) return;

  Future<void> hold(String id) async {
    // print() (not debugPrint) so flutter run / tee always capture the marker.
    // ignore: avoid_print
    print('APP_STORE_SHOT_READY:$id');
    // Host script screenshots during this window.
    await Future<void>.delayed(const Duration(seconds: 5));
  }

  Future<void> guestAt(String route) async {
    if (auth.isLoggedIn) await auth.logout();
    auth.continueAsGuest();
    appRouter.go(route);
    await Future<void>.delayed(const Duration(milliseconds: 900));
  }

  Future<void> sessionAt(
    AuthRole role,
    String route, {
    Map<String, dynamic>? user,
  }) async {
    await auth.setSession(
      role,
      'app-store-shot-token-${role.name}',
      user ??
          {
            'nom': 'Awa Diallo',
            'name': 'Awa Diallo',
            'email': 'awa.diallo@sahelagriconnect.com',
            'role': role.name,
            'accountStatus': 'active',
          },
    );
    appRouter.go(route);
    await Future<void>.delayed(const Duration(milliseconds: 1200));
  }

  // 1 — Home
  await guestAt('/home');
  await hold('01-home');

  // 2 — Role selection
  await guestAt('/role');
  await hold('02-roles');

  // 3 — Farmer dashboard
  await sessionAt(AuthRole.farmer, '/farmer');
  await hold('03-farmer');

  // 4 — Cooperative + Growth upgrade prompt
  await sessionAt(
    AuthRole.cooperative,
    '/cooperative',
    user: {
      'nom': 'Coopérative Banamba',
      'name': 'Coopérative Banamba',
      'email': 'coop.banamba@sahelagriconnect.com',
      'role': 'cooperative',
      'accountStatus': 'active',
      'tier': 'free',
    },
  );
  await Future<void>.delayed(const Duration(milliseconds: 600));
  final ctx = rootNavigatorKey.currentContext;
  if (ctx != null && ctx.mounted) {
    unawaited(
      PremiumUpgradeDialog.showCoopGrowthUpgrade(ctx, isFr: false),
    );
    await Future<void>.delayed(const Duration(milliseconds: 700));
  }
  await hold('04-coop-growth');
  if (ctx != null && ctx.mounted) {
    final nav = Navigator.of(ctx, rootNavigator: true);
    if (nav.canPop()) nav.pop();
  }

  // 5 — Investor KYC (ID upload step — selfie is next)
  InvestorKycScreen.screenshotStep = 1;
  await sessionAt(
    AuthRole.investor,
    '/investor/kyc',
    user: {
      'nom': 'Mariam Keita',
      'name': 'Mariam Keita',
      'email': 'mariam.keita@sahelagriconnect.com',
      'role': 'investor',
      'accountStatus': 'pending_kyc',
    },
  );
  await hold('05-investor-kyc');

  // Extra frame: selfie-with-ID step (saved beside the six core shots)
  InvestorKycScreen.screenshotStep = 2;
  appRouter.go('/home');
  await Future<void>.delayed(const Duration(milliseconds: 400));
  appRouter.go('/investor/kyc');
  await Future<void>.delayed(const Duration(milliseconds: 900));
  await hold('05b-investor-kyc-selfie');

  // 6 — AfriYield Exchange
  await sessionAt(
    AuthRole.investor,
    '/investor',
    user: {
      'nom': 'Mariam Keita',
      'name': 'Mariam Keita',
      'email': 'mariam.keita@sahelagriconnect.com',
      'role': 'investor',
      'accountStatus': 'active',
    },
  );
  await hold('06-afriyield');

  // ignore: avoid_print
  print('APP_STORE_SHOT_READY:done');
}
