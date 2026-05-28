import 'dart:ui';

import 'package:flutter/material.dart';

import 'theme.dart';

/// Extra scroll padding when using [GlassBottomNav] with [Scaffold.extendBody].
const double kGlassNavBottomInset = 88;

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

/// Floating liquid-glass shell for bottom navigation (YouVersion-style).
///
/// Wrap a transparent [NavigationBar] (or similar) as [child].
/// Pair with [Scaffold.extendBody] = true so content scrolls behind the bar.
class GlassBottomNav extends StatelessWidget {
  final Widget child;
  final EdgeInsets margin;
  final double blurSigma;
  final double borderRadius;

  const GlassBottomNav({
    super.key,
    required this.child,
    this.margin = const EdgeInsets.fromLTRB(16, 0, 16, 10),
    this.blurSigma = 18,
    this.borderRadius = 28,
  });

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(borderRadius);
    return SafeArea(
      top: false,
      child: Padding(
        padding: margin,
        child: RepaintBoundary(
          child: ClipRRect(
            borderRadius: radius,
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.07),
                  borderRadius: radius,
                  border: Border.all(
                    color: AppColors.glassBorder,
                    width: 0.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.32),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: child,
              ),
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

/// Gradient portal header with glass orbs and optional stats row.
class GlassPortalHeader extends StatelessWidget {
  final List<Color> gradientColors;
  final Color accentColor;
  final Color? secondaryAccent;
  final Widget titleRow;
  final Widget? statsRow;
  final EdgeInsets padding;

  const GlassPortalHeader({
    super.key,
    required this.gradientColors,
    required this.accentColor,
    required this.titleRow,
    this.secondaryAccent,
    this.statsRow,
    this.padding = const EdgeInsets.fromLTRB(20, 12, 20, 16),
  });

  @override
  Widget build(BuildContext context) {
    final secondary = secondaryAccent ?? accentColor;
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
          stops: const [0.0, 0.52, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.28),
            blurRadius: 18,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          Positioned(
            top: -48,
            right: -22,
            child: Container(
              width: 175,
              height: 175,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    accentColor.withValues(alpha: 0.16),
                    accentColor.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          if (secondaryAccent != null)
            Positioned(
              top: 36,
              right: 56,
              child: Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: secondary.withValues(alpha: 0.06),
                ),
              ),
            ),
          Positioned(
            top: 24,
            left: -36,
            child: Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.035),
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
                child: Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.white.withValues(alpha: 0.2),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: padding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  titleRow,
                  if (statsRow != null) ...[
                    const SizedBox(height: 14),
                    statsRow!,
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Frosted stat tile for portal headers (use inside a [Row]).
class GlassStatTile extends StatelessWidget {
  final String value;
  final String label;
  final Color accentColor;
  final Color? valueColor;
  final IconData? icon;

  const GlassStatTile({
    super.key,
    required this.value,
    required this.label,
    required this.accentColor,
    this.valueColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final displayValue = valueColor ?? accentColor;
    return Expanded(
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        blurSigma: 14,
        borderRadius: BorderRadius.circular(14),
        borderColor: accentColor.withValues(alpha: 0.3),
        backgroundColor: Colors.white.withValues(alpha: 0.07),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 15, color: accentColor.withValues(alpha: 0.92)),
              const SizedBox(height: 5),
            ],
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: displayValue,
                fontSize: 15,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.58),
                fontSize: 9,
                height: 1.2,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Circular or pill glass action in portal headers.
class GlassHeaderIconButton extends StatelessWidget {
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;
  final String? tooltip;
  final String? label;
  final bool circular;

  const GlassHeaderIconButton({
    super.key,
    required this.icon,
    required this.accentColor,
    required this.onTap,
    this.tooltip,
    this.label,
    this.circular = true,
  });

  @override
  Widget build(BuildContext context) {
    final radius = circular ? 999.0 : 20.0;
    final button = GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            width: circular ? 40 : null,
            height: circular ? 40 : null,
            padding: circular
                ? null
                : const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: circular ? 0.14 : 0.1),
              shape: circular ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: circular ? null : BorderRadius.circular(20),
              border: Border.all(
                color: accentColor.withValues(alpha: circular ? 0.42 : 0.28),
                width: 0.5,
              ),
            ),
            child: circular
                ? Icon(icon, color: accentColor, size: 20)
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        icon,
                        color: Colors.white.withValues(alpha: 0.92),
                        size: 15,
                      ),
                      if (label != null) ...[
                        const SizedBox(width: 4),
                        Text(
                          label!,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
    if (tooltip != null) {
      return Tooltip(message: tooltip!, child: button);
    }
    return button;
  }
}
