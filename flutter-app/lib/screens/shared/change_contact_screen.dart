import 'package:flutter/material.dart';

class ChangeContactScreen extends StatelessWidget {
  const ChangeContactScreen({super.key, required this.type});

  final String type;

  @override
  Widget build(BuildContext context) {
    final isPhone = type == 'phone';
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: Text(isPhone ? 'Phone number' : 'Email address'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Center(
        child: Text(
          isPhone
              ? 'Phone change with verification — coming soon.'
              : 'Email change with verification — coming soon.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey[600]),
        ),
      ),
    );
  }
}
