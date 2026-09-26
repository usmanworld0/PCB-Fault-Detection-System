import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class PcbHeatmapView extends StatefulWidget {
  final List<DefectHeatmapPoint> points;
  final double height;

  const PcbHeatmapView({
    super.key,
    required this.points,
    this.height = 240,
  });

  @override
  State<PcbHeatmapView> createState() => _PcbHeatmapViewState();
}

class _PcbHeatmapViewState extends State<PcbHeatmapView> {
  DefectHeatmapPoint? _selectedPoint;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F2B1D), // Dark PCB FR-4 green substrate
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderSubtle, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Custom PCB layout & heatmap canvas
          GestureDetector(
            onTapUp: (details) {
              final box = context.findRenderObject() as RenderBox?;
              if (box != null) {
                final local = details.localPosition;
                final normX = local.dx / box.size.width;
                final normY = local.dy / box.size.height;

                // Find closest point within threshold
                DefectHeatmapPoint? closest;
                double minDist = 0.12;
                for (final p in widget.points) {
                  final dist = (p.normX - normX).abs() + (p.normY - normY).abs();
                  if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                  }
                }
                setState(() {
                  _selectedPoint = closest;
                });
              }
            },
            child: CustomPaint(
              size: Size.infinite,
              painter: _PcbHeatmapPainter(points: widget.points, selectedPoint: _selectedPoint),
            ),
          ),

          // Header overlay
          Positioned(
            top: 10,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.blur_circular, size: 12, color: Color(0xFF34D399)),
                  const SizedBox(width: 4),
                  Text(
                    'DEFECT DENSITY HEATMAP — BOARD REV 2.4',
                    style: AppTypography.mono.copyWith(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Selected defect tooltip
          if (_selectedPoint != null)
            Positioned(
              bottom: 10,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.industrial900,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.industrial400),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _selectedPoint!.severity == SeverityLevel.critical
                            ? AppColors.qaFail
                            : AppColors.qaWarning,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${_selectedPoint!.defectClass.toUpperCase()} (${_selectedPoint!.severity.value})',
                      style: AppTypography.mono.copyWith(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () => setState(() => _selectedPoint = null),
                      child: const Icon(Icons.close, size: 12, color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ),

          // Legend
          Positioned(
            bottom: 10,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _legendDot(const Color(0xFF10B981), 'Low'),
                  const SizedBox(width: 6),
                  _legendDot(const Color(0xFFF59E0B), 'Med'),
                  const SizedBox(width: 6),
                  _legendDot(const Color(0xFFEF4444), 'Crit'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 3),
        Text(
          label,
          style: AppTypography.mono.copyWith(fontSize: 8, color: Colors.white70),
        ),
      ],
    );
  }
}

class _PcbHeatmapPainter extends CustomPainter {
  final List<DefectHeatmapPoint> points;
  final DefectHeatmapPoint? selectedPoint;

  _PcbHeatmapPainter({required this.points, this.selectedPoint});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Draw subtle PCB grid & copper trace simulation
    final gridPaint = Paint()
      ..color = const Color(0xFF1B4D33).withValues(alpha: 0.4)
      ..strokeWidth = 0.5;

    for (double x = 0; x < w; x += 16) {
      canvas.drawLine(Offset(x, 0), Offset(x, h), gridPaint);
    }
    for (double y = 0; y < h; y += 16) {
      canvas.drawLine(Offset(0, y), Offset(w, y), gridPaint);
    }

    // 2. Draw mock copper IC traces and contact pads
    final tracePaint = Paint()
      ..color = const Color(0xFFB8860B).withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final padPaint = Paint()
      ..color = const Color(0xFFCFB53B).withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;

    // IC package 1 (Microcontroller)
    final ic1 = Rect.fromCenter(center: Offset(w * 0.35, h * 0.45), width: w * 0.22, height: h * 0.35);
    canvas.drawRect(ic1, tracePaint);
    for (double py = ic1.top + 6; py < ic1.bottom; py += 10) {
      canvas.drawCircle(Offset(ic1.left - 4, py), 1.8, padPaint);
      canvas.drawCircle(Offset(ic1.right + 4, py), 1.8, padPaint);
    }

    // IC package 2 (Power Regulator)
    final ic2 = Rect.fromCenter(center: Offset(w * 0.75, h * 0.55), width: w * 0.16, height: h * 0.28);
    canvas.drawRect(ic2, tracePaint);

    // Traces
    canvas.drawLine(Offset(ic1.right, ic1.top + 10), Offset(ic2.left, ic2.top + 10), tracePaint);
    canvas.drawLine(Offset(ic1.right, ic1.top + 25), Offset(ic2.left, ic2.top + 25), tracePaint);

    // 3. Draw Heatmap density hotspots
    for (final p in points) {
      final center = Offset(p.normX * w, p.normY * h);
      final radius = (24.0 + (p.weight * 22.0)).clamp(20.0, 48.0);

      Color coreColor;
      Color midColor;
      if (p.severity == SeverityLevel.critical) {
        coreColor = const Color(0xFFEF4444).withValues(alpha: 0.85);
        midColor = const Color(0xFFF97316).withValues(alpha: 0.45);
      } else if (p.severity == SeverityLevel.moderate) {
        coreColor = const Color(0xFFF59E0B).withValues(alpha: 0.80);
        midColor = const Color(0xFFFBBF24).withValues(alpha: 0.40);
      } else {
        coreColor = const Color(0xFF10B981).withValues(alpha: 0.75);
        midColor = const Color(0xFF34D399).withValues(alpha: 0.35);
      }

      final gradient = ui.Gradient.radial(
        center,
        radius,
        [coreColor, midColor, coreColor.withValues(alpha: 0.0)],
        [0.0, 0.5, 1.0],
      );

      final heatPaint = Paint()
        ..shader = gradient
        ..style = PaintingStyle.fill;

      canvas.drawCircle(center, radius, heatPaint);

      // Core point pin
      final pinPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, 2.5, pinPaint);
    }

    // 4. Highlight selected point if any
    if (selectedPoint != null) {
      final center = Offset(selectedPoint!.normX * w, selectedPoint!.normY * h);
      final selectPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;
      canvas.drawCircle(center, 12, selectPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _PcbHeatmapPainter oldDelegate) {
    return oldDelegate.points != points || oldDelegate.selectedPoint != selectedPoint;
  }
}
