import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/language_provider.dart';
import '../../core/theme.dart';

class DeleteAccountScreen extends StatelessWidget {
  const DeleteAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lp = context.watch<LanguageProvider>();

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
            child: Text(
              lp.t(
                'Account deletion is completed on our secure web platform after verification. This screen will link to that flow when available.',
                'La suppression du compte s\'effectue sur notre plateforme sécurisée après vérification. Ce lien sera disponible prochainement.',
              ),
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Color(0x99FFFFFF),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
