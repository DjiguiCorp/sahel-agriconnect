import 'package:flutter/material.dart';

/// Minimal launch placeholder.
///
/// Heavy animated splash (particle field + multiple repeating controllers)
/// was removed after repeated iOS launch crashes. Native [LaunchScreen]
/// covers the brief gap; [GoRouter] redirect sends `/` to language/terms/
/// home/dashboard immediately once [AuthState] finishes loading.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF060f0a),
      body: Center(
        child: SizedBox(
          width: 28,
          height: 28,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: Color(0xFFB5850A),
          ),
        ),
      ),
    );
  }
}
