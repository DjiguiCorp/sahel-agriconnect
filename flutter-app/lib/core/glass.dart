import 'dart:ui';

import 'package:flutter/material.dart';

import 'theme.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;
  final double blurSigma;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius,
    this.borderColor,
    this.backgroundColor,
    this.blurSigma = 20,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: Container(
            padding: padding ?? const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: backgroundColor ?? Colors.white.withValues(alpha: 0.06),
              borderRadius: borderRadius ?? BorderRadius.circular(20),
              border: Border.all(
                color: borderColor ?? Colors.white.withValues(alpha: 0.12),
                width: 0.5,
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

class GlassButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color? backgroundColor;
  final Color? textColor;
  final Widget? icon;
  final bool isPrimary;

  const GlassButton({
    super.key,
    required this.label,
    required this.onTap,
    this.backgroundColor,
    this.textColor,
    this.icon,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: isPrimary
                  ? AppColors.gold
                  : (backgroundColor ?? Colors.white.withValues(alpha: 0.1)),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isPrimary
                    ? AppColors.gold.withValues(alpha: 0.5)
                    : Colors.white.withValues(alpha: 0.15),
                width: 0.5,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[icon!, const SizedBox(width: 8)],
                Text(
                  label,
                  style: TextStyle(
                    color: isPrimary
                        ? AppColors.forestGreen
                        : (textColor ?? Colors.white),
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class GlassOrb extends StatefulWidget {
  final Widget child;
  final double size;
  final Color? color;

  const GlassOrb({super.key, required this.child, this.size = 120, this.color});

  @override
  State<GlassOrb> createState() => _GlassOrbState();
}

class _GlassOrbState extends State<GlassOrb>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(seconds: 3))
      ..repeat(reverse: true);
    _scaleAnim = Tween<double>(begin: 1.0, end: 1.04).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnim,
      builder: (_, __) => Transform.scale(
        scale: _scaleAnim.value,
        child: SizedBox(
          width: widget.size,
          height: widget.size,
          child: ClipOval(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color:
                      (widget.color ?? AppColors.gold).withValues(alpha: 0.12),
                  border: Border.all(
                    color: (widget.color ?? AppColors.gold)
                        .withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                child: Center(child: widget.child),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
