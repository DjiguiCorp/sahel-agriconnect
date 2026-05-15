import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';

  static final Map<AuthRole, List<(String, String)>> _allFaqs = {
    AuthRole.farmer: [
      (
        'How do I declare my produce?',
        'Go to the Produce tab, tap the + button, select your commodity, enter the quantity and tap Submit. Your cooperative will be notified immediately.',
      ),
      (
        'How does the AI disease detection work?',
        'Open the AI Tools tab, tap "Disease detect", take a photo of the affected leaf or plant. Our AI analyzes it within seconds and provides diagnosis and treatment recommendations.',
      ),
      (
        'How do I join a cooperative?',
        "A cooperative must invite you. Once they send an invitation to your phone number or email, you'll receive a notification. Tap it to accept and join automatically.",
      ),
      (
        'When will I receive my benefits?',
        "Benefits unlock as you increase your certification level. Go to Profile → Benefits progress to see your current level and what's needed for the next tier.",
      ),
      (
        'What is AfriYield Exchange?',
        'AfriYield Exchange is the investment arm of Sahel AgriConnect. Diaspora investors fund cooperatives like yours to help produce at scale for international markets.',
      ),
      (
        'How do I verify my account?',
        'Go to Profile → Phone number or Email address. Enter your contact, receive a 6-digit code, and enter it to verify.',
      ),
    ],
    AuthRole.investor: [
      (
        'How do I make an investment?',
        'Browse the Opportunities tab, tap any opportunity to see details, then tap "Invest on web". You\'ll be taken to our secure web platform to complete the investment.',
      ),
      (
        'When do I get my capital back?',
        "Capital is returned at the end of the production cycle (90–180 days for Track B). You'll be notified when each milestone is verified and funds are released.",
      ),
      (
        'What are the 3 investment tracks?',
        'Track A: You source a specific commodity with existing buyers. Track B: You invest working capital in a cooperative cycle and receive revenue share. Track C: Premium direct sourcing with our team vetting suppliers in 72h.',
      ),
      (
        'What is the escrow system?',
        'Funds are held by a licensed escrow agent — never by AfriYield directly. They are released in 3 tranches as verified milestones are completed. See the Escrow tab for live status.',
      ),
      (
        'How do I upgrade to Premium?',
        'Go to Profile → Premium subscription. Premium gives you price alerts, priority opportunity access, and weekly market reports for \$299/year.',
      ),
      (
        'What is the 7.5% fee?',
        '5% platform facilitation + 2.5% transaction commission = 7.5% total. Zero fee on failed or cancelled transactions.',
      ),
    ],
    AuthRole.cooperative: [
      (
        "How do I approve a farmer's produce?",
        'Go to the Produce tab. Swipe right on a produce card to approve, or swipe left to reject. The farmer is notified automatically.',
      ),
      (
        'How do I invite farmers to my cooperative?',
        "Go to Members tab, tap Invite, enter their phone number or email, add a message and send. They'll receive a notification with a one-tap accept link.",
      ),
      (
        'How do I respond to a government project?',
        "Go to Projects tab. You'll see all active national projects for your country. Tap Commit, Interested, or Decline on each one.",
      ),
      (
        'How do I promote produce to AfriYield?',
        'After approving a farmer\'s produce, tap the "Promote to AfriYield" button. This action is completed on the web portal for security.',
      ),
    ],
    AuthRole.government: [
      (
        'How do I create a national project?',
        'Complex project creation is available on the web portal at sahelagriconnect.com/government-portal. For quick emergency broadcasts, use the Broadcast tab in the app.',
      ),
      (
        'How do I see who responded to my project?',
        'Go to the Coops tab, select a project to see all cooperative responses categorized as Committed, Interested, or Declined.',
      ),
      (
        'Can I export farmer data?',
        'Data export is available on the web portal only. This keeps sensitive data secure and off mobile devices.',
      ),
    ],
    AuthRole.processor: [
      (
        'How do I declare my produce?',
        'Go to the Produce tab, tap the + button, select your commodity, enter the quantity and tap Submit. Your cooperative will be notified immediately.',
      ),
      (
        'How does the AI disease detection work?',
        'Open the AI Tools tab, tap "Disease detect", take a photo of the affected leaf or plant. Our AI analyzes it within seconds and provides diagnosis and treatment recommendations.',
      ),
      (
        'How do I verify my account?',
        'Go to Profile → Phone number or Email address. Enter your contact, receive a 6-digit code, and enter it to verify.',
      ),
    ],
  };

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthState>().role;
    final faqs = (_allFaqs[role] ?? _allFaqs[AuthRole.farmer]!)
        .where(
          (f) =>
              _search.isEmpty ||
              f.$1.toLowerCase().contains(_search.toLowerCase()) ||
              f.$2.toLowerCase().contains(_search.toLowerCase()),
        )
        .toList();

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFFF8F4E3),
      appBar: AppBar(
        title: const Text('Help center'),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Search help articles...',
              hintStyle: TextStyle(color: Colors.grey[400]),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey),
              suffixIcon: _search.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, color: Colors.grey),
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _search = '');
                      },
                    )
                  : null,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _contactCard(
                  '📧',
                  'Email us',
                  'Response in 48h',
                  () => launchUrl(
                    Uri.parse('mailto:info@djiguicorporation.org'),
                    mode: LaunchMode.externalApplication,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _contactCard(
                  '💬',
                  'WhatsApp',
                  'Chat with our team',
                  () => launchUrl(
                    Uri.parse('https://wa.me/message/sahelagriconnect'),
                    mode: LaunchMode.externalApplication,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Frequently asked questions',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1a3c2e),
            ),
          ),
          const SizedBox(height: 10),
          if (faqs.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'No results for "$_search"',
                  style: TextStyle(color: Colors.grey[500]),
                ),
              ),
            )
          else
            ...faqs.map((faq) => _faqItem(context, faq.$1, faq.$2)),
        ],
      ),
    );
  }

  Widget _contactCard(
    String emoji,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade200, width: 0.5),
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 22)),
              const SizedBox(height: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1a3c2e),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      );

  Widget _faqItem(BuildContext context, String q, String a) => Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade200, width: 0.5),
          ),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            title: Text(
              q,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1a3c2e),
              ),
            ),
            children: [
              Text(
                a,
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      );
}
