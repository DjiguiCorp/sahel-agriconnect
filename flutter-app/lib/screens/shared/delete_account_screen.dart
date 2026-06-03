import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/auth_state.dart';
import '../../core/language_provider.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';

const _deleteMailto =
    'mailto:privacy@sahelagriconnect.com?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20Sahel%20AgriConnect%20account.%0A%0ARegistered%20email%3A%20';

const _webDeleteUrl = 'https://sahelagriconnect.com/delete-account';

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  bool _deleting = false;

  Future<void> _openMailto() async {
    final uri = Uri.parse(_deleteMailto);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open email app')),
      );
    }
  }

  Future<void> _openWebPage() async {
    final uri = Uri.parse(_webDeleteUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open browser')),
      );
    }
  }

  Future<void> _deleteInApp(LanguageProvider lp) async {
    final isFr = lp.locale.languageCode == 'fr';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1e4535),
        title: Text(
          isFr ? 'Supprimer mon compte ?' : 'Delete my account?',
          style: const TextStyle(color: Colors.white),
        ),
        content: Text(
          isFr
              ? 'Cette action est définitive.'
              : 'This action is permanent.',
          style: const TextStyle(color: Color(0x99FFFFFF)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(isFr ? 'Annuler' : 'Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              isFr ? 'Supprimer' : 'Delete',
              style: const TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    setState(() => _deleting = true);
    try {
      final auth = context.read<AuthState>();
      final token = auth.token;
      if (token == null || token.isEmpty) {
        throw Exception(isFr ? 'Session expirée' : 'Session expired');
      }
      final res = await ApiService.delete('/api/farmers/account', token: token);
      if (res['success'] != true) {
        throw Exception(res['error']?.toString() ?? 'Deletion failed');
      }
      await auth.clearSavedFarmerIdentity();
      await auth.logout();
      if (mounted) context.go('/home');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: Colors.red.shade700,
        ),
      );
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();
    final auth = context.watch<AuthState>();
    final isFarmer = auth.role == AuthRole.farmer && auth.isLoggedIn;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(lp.t('Delete account', 'Supprimer le compte')),
        backgroundColor: const Color(0xFF1a3c2e),
        foregroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  lp.t(
                    'Delete Your Account',
                    'Supprimer votre compte',
                  ),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  lp.t(
                    'To request deletion of your account and data, send an email to privacy@sahelagriconnect.com. Include your registered email address. Your account and all associated data will be deleted within 30 days of your request.',
                    'Pour demander la suppression de votre compte et de vos données, envoyez un e-mail à privacy@sahelagriconnect.com avec votre adresse enregistrée. Suppression sous 30 jours.',
                  ),
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    color: Color(0x99FFFFFF),
                  ),
                ),
                const SizedBox(height: 20),
                _sectionTitle(lp.t('Data deleted', 'Données supprimées')),
                _bullet(lp.t('Profile information', 'Informations de profil')),
                _bullet(lp.t('Production records', 'Données de production')),
                _bullet(lp.t(
                  'Cooperative membership data',
                  "Données d'adhésion coopérative",
                )),
                const SizedBox(height: 16),
                _sectionTitle(lp.t('Data retained', 'Données conservées')),
                _bullet(lp.t(
                  'Financial transaction records (required by law, retained 7 years)',
                  'Transactions financières (obligation légale, 7 ans)',
                )),
                const SizedBox(height: 24),
                SizedBox(
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: _openMailto,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: AppColors.forestGreen,
                    ),
                    icon: const Icon(Icons.mail_outline),
                    label: Text(lp.t(
                      'Email deletion request',
                      'Demande par e-mail',
                    )),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: _openWebPage,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(
                        color: Colors.white.withValues(alpha: 0.3),
                      ),
                    ),
                    icon: const Icon(Icons.language),
                    label: Text(lp.t('Open web page', 'Page web')),
                  ),
                ),
                if (isFarmer) ...[
                  const SizedBox(height: 20),
                  Text(
                    lp.t(
                      'Signed in as farmer — delete immediately in the app:',
                      'Connecté en tant qu\'agriculteur — suppression immédiate :',
                    ),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0x99FFFFFF),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: _deleting ? null : () => _deleteInApp(lp),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade300,
                        side: BorderSide(color: Colors.red.withValues(alpha: 0.5)),
                      ),
                      icon: _deleting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.delete_forever_outlined),
                      label: Text(lp.t(
                        'Delete my account and data',
                        'Supprimer mon compte et mes données',
                      )),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.gold,
          ),
        ),
      );

  Widget _bullet(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6, left: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• ', style: TextStyle(color: Color(0x99FFFFFF))),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(fontSize: 13, color: Color(0x99FFFFFF)),
              ),
            ),
          ],
        ),
      );
}
