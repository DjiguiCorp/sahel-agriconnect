import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme.dart';

class GuestBanner extends StatefulWidget {
  final VoidCallback? onDismiss;
  final VoidCallback? onSignIn;

  const GuestBanner({
    super.key,
    this.onDismiss,
    this.onSignIn,
  });

  @override
  State<GuestBanner> createState() => _GuestBannerState();
}

class _GuestBannerState extends State<GuestBanner> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    return AnimatedSlide(
      offset: _dismissed ? const Offset(0, -1) : Offset.zero,
      duration: const Duration(milliseconds: 300),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.15),
          border: Border(
            bottom: BorderSide(
              color: AppColors.gold.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
        ),
        child: Row(
          children: [
            const Text('🌾', style: TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Exploring as guest',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontSize: 13,
                ),
              ),
            ),
            GestureDetector(
              onTap: widget.onSignIn ?? () => context.go('/home'),
              child: const Text(
                'Sign in',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () {
                setState(() => _dismissed = true);
                widget.onDismiss?.call();
              },
              child: Icon(
                Icons.close,
                size: 16,
                color: Colors.white.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
