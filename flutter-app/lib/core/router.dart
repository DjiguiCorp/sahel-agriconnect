import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/splash_screen.dart';
import '../screens/role_screen.dart';
import '../screens/farmer/farmer_dashboard.dart';
import '../screens/investor/investor_dashboard.dart';
import '../screens/cooperative/cooperative_dashboard.dart';
import '../screens/government/government_dashboard.dart';
import '../screens/processor/processor_dashboard.dart';

final GlobalKey<NavigatorState> rootNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'root');

final appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (ctx, state) => const SplashScreen()),
    GoRoute(path: '/role', builder: (ctx, state) => const RoleScreen()),
    GoRoute(path: '/farmer', builder: (ctx, state) => const FarmerDashboard()),
    GoRoute(
        path: '/investor', builder: (ctx, state) => const InvestorDashboard()),
    GoRoute(
        path: '/cooperative',
        builder: (ctx, state) => const CooperativeDashboard()),
    GoRoute(
        path: '/government',
        builder: (ctx, state) => const GovernmentDashboard()),
    GoRoute(
        path: '/processor',
        builder: (ctx, state) => const ProcessorDashboard()),
  ],
);
