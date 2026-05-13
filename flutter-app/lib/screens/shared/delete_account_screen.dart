import 'package:flutter/material.dart';

class DeleteAccountScreen extends StatelessWidget {
  const DeleteAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: const Text('Delete account'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: const Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Account deletion is completed on our secure web platform after verification. This screen will link to that flow when available.',
          style: TextStyle(fontSize: 14, height: 1.5),
        ),
      ),
    );
  }
}
