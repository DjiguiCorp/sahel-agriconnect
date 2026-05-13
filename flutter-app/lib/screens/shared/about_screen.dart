import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutAppScreen extends StatelessWidget {
  const AboutAppScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: const Text('About'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1a3c2e),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Center(
                    child: Text(
                      'SA',
                      style: TextStyle(
                        color: Color(0xFFB5850A),
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Sahel AgriConnect',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1a3c2e),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Version 1.0.0',
                  style: TextStyle(color: Colors.grey[500], fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 0.5),
            ),
            child: const Text(
              "Sahel AgriConnect is a digital platform connecting West African farmers, cooperatives, and transformation centers to diaspora investors and international buyers.\n\nAfriYield Exchange — included in this app — enables diaspora members to invest in certified cooperative supply chains and receive returns, transforming traditional remittances into productive agricultural capital.\n\nOperating across Mali, Senegal, Burkina Faso, Ghana, Côte d'Ivoire and beyond.",
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF555555),
                height: 1.7,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200, width: 0.5),
            ),
            child: Column(
              children: [
                _infoRow('Developer', 'Djigui Corporation'),
                _infoRow('Website', 'sahelagriconnect.com'),
                _infoRow('Email', 'info@djiguicorporation.org'),
                _infoRow('Minimum age', '18 years'),
                _infoRow('Languages', 'English · Français · Bambara · Fulani'),
                _infoRow('Platform', 'iOS & Android'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: TextButton(
              onPressed: () => launchUrl(
                Uri.parse('https://sahelagriconnect.com'),
                mode: LaunchMode.externalApplication,
              ),
              child: const Text(
                'Visit sahelagriconnect.com',
                style: TextStyle(
                  color: Color(0xFF1a3c2e),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        child: Row(
          children: [
            SizedBox(
              width: 120,
              child: Text(
                label,
                style: TextStyle(fontSize: 13, color: Colors.grey[500]),
              ),
            ),
            Expanded(
              child: Text(
                value,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1a3c2e),
                ),
              ),
            ),
          ],
        ),
      );
}
