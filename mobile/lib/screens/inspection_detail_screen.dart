import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../services/supabase_service.dart';
import '../services/auth_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';

class InspectionDetailScreen extends StatefulWidget {
  final String inspectionId;

  const InspectionDetailScreen({super.key, required this.inspectionId});

  @override
  State<InspectionDetailScreen> createState() => _InspectionDetailScreenState();
}

class _InspectionDetailScreenState extends State<InspectionDetailScreen> {
  // View mode: 'OVERLAY', 'SIDE_BY_SIDE', 'GOLDEN_COMPARE'
  String _viewMode = 'OVERLAY';
  double _splitRatio = 0.5; // for golden board compare slider
  DefectItem? _selectedDefect;

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final auth = context.watch<AuthProvider>();

    final inspection = service.inspections.firstWhere(
      (i) => i.id == widget.inspectionId,
      orElse: () => service.inspections.first,
    );

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              inspection.id,
              style: AppTypography.mono.copyWith(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            Text(
              '${inspection.stationId} • ${inspection.batchNumber}',
              style: AppTypography.bodySmall.copyWith(fontSize: 10),
            ),
          ],
        ),
        actions: [
          // Status chip
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: inspection.finalStatus == InspectionStatus.pass
                  ? AppColors.qaPassBg
                  : AppColors.qaFailBg,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: inspection.finalStatus == InspectionStatus.pass
                    ? AppColors.qaPassBorder
                    : AppColors.qaFailBorder,
              ),
            ),
            child: Text(
              inspection.finalStatus.value,
              style: AppTypography.mono.copyWith(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: inspection.finalStatus == InspectionStatus.pass
                    ? AppColors.qaPass
                    : AppColors.qaFail,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mode selector bar
            _buildViewModeSelector(),

            // Interactive inspection viewer
            _buildImageWorkspace(inspection),

            // Viewer mode warning if user is a viewer
            if (auth.isReadOnly)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.bgMuted,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Viewer Mode: Read-only access. Quality Engineer or Admin role required for audit actions.',
                        style: AppTypography.bodySmall.copyWith(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),

            // Defect details & action cards
            _buildDefectsSection(inspection, auth, service),

            // Audit Trail History
            _buildAuditTrailSection(inspection),

            const SizedBox(height: 36),
          ],
        ),
      ),
      bottomNavigationBar: auth.canReview ? _buildReviewBottomBar(inspection, auth, service) : null,
    );
  }

  Widget _buildViewModeSelector() {
    return Container(
      color: AppColors.bgSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _modeButton('AI Overlay', 'OVERLAY', Icons.layers_outlined),
          const SizedBox(width: 8),
          _modeButton('Side-by-Side', 'SIDE_BY_SIDE', Icons.view_column_outlined),
          const SizedBox(width: 8),
          _modeButton('Golden Board', 'GOLDEN_COMPARE', Icons.compare_arrows_rounded),
        ],
      ),
    );
  }

  Widget _modeButton(String title, String mode, IconData icon) {
    final isSel = _viewMode == mode;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _viewMode = mode),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 7),
          decoration: BoxDecoration(
            color: isSel ? AppColors.industrial600 : AppColors.bgMuted,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSel ? AppColors.industrial700 : AppColors.borderSubtle,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 13, color: isSel ? Colors.white : AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                title,
                style: AppTypography.mono.copyWith(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isSel ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageWorkspace(InspectionRecord inspection) {
    return Container(
      height: 260,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      decoration: BoxDecoration(
        color: const Color(0xFF0F2618), // PCB substrate dark green
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_viewMode == 'OVERLAY')
            _buildOverlayView(inspection)
          else if (_viewMode == 'SIDE_BY_SIDE')
            _buildSideBySideView(inspection)
          else
            _buildGoldenCompareView(inspection),

          // Watermark / Source pill
          Positioned(
            bottom: 8,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                inspection.source,
                style: AppTypography.mono.copyWith(fontSize: 9, color: Colors.white70),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverlayView(InspectionRecord inspection) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;

        return Stack(
          fit: StackFit.expand,
          children: [
            // Processed PCB image
            Image.network(
              inspection.annotatedUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Center(
                child: Icon(Icons.memory, color: Colors.white30, size: 48),
              ),
            ),

            // Defect bounding boxes
            ...inspection.defects.map((d) {
              final isSel = _selectedDefect?.id == d.id;
              final left = d.boxX1 * w;
              final top = d.boxY1 * h;
              final boxW = (d.boxX2 - d.boxX1) * w;
              final boxH = (d.boxY2 - d.boxY1) * h;

              final boxColor = d.severity == SeverityLevel.critical
                  ? AppColors.qaFail
                  : (d.severity == SeverityLevel.moderate ? AppColors.qaWarning : AppColors.industrial400);

              return Positioned(
                left: left,
                top: top,
                width: boxW.clamp(24.0, w),
                height: boxH.clamp(24.0, h),
                child: GestureDetector(
                  onTap: () => setState(() => _selectedDefect = d),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSel ? Colors.white : boxColor,
                        width: isSel ? 2.5 : 1.5,
                      ),
                      color: boxColor.withValues(alpha: 0.2),
                    ),
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                        color: boxColor,
                        child: Text(
                          '${d.defectClass} ${(d.confidence * 100).toInt()}%',
                          style: AppTypography.mono.copyWith(
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ],
        );
      },
    );
  }

  Widget _buildSideBySideView(InspectionRecord inspection) {
    return Row(
      children: [
        // Original Input Image
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                inspection.imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.broken_image, color: Colors.white)),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('RAW INPUT', style: AppTypography.mono.copyWith(fontSize: 9, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
        Container(width: 2, color: AppColors.industrial500),
        // Processed Inference Image
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              _buildOverlayView(inspection),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.industrial600,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('AI INFERENCE', style: AppTypography.mono.copyWith(fontSize: 9, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGoldenCompareView(InspectionRecord inspection) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Golden Reference Board (background)
        Image.network(
          inspection.goldenReferenceUrl ?? inspection.imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.memory, color: Colors.white)),
        ),

        // Inspected Board (clipped by splitRatio slider)
        ClipRect(
          clipper: _HorizontalSplitClipper(_splitRatio),
          child: _buildOverlayView(inspection),
        ),

        // Split Divider Bar
        Positioned(
          left: (MediaQuery.of(context).size.width - 32) * _splitRatio - 1.5,
          top: 0,
          bottom: 0,
          child: Container(
            width: 3,
            color: Colors.white,
            child: Center(
              child: Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: AppColors.industrial600,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.code, size: 12, color: Colors.white),
              ),
            ),
          ),
        ),

        // Gesture detector for slider dragging
        GestureDetector(
          onHorizontalDragUpdate: (details) {
            final box = context.findRenderObject() as RenderBox?;
            if (box != null) {
              setState(() {
                _splitRatio = (details.localPosition.dx / box.size.width).clamp(0.05, 0.95);
              });
            }
          },
        ),

        // Labels
        Positioned(
          top: 8,
          left: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text('INSPECTED BOARD', style: AppTypography.mono.copyWith(fontSize: 9, color: Colors.white)),
          ),
        ),
        Positioned(
          top: 8,
          right: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.qaPass.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text('GOLDEN REFERENCE', style: AppTypography.mono.copyWith(fontSize: 9, color: Colors.white)),
          ),
        ),
      ],
    );
  }

  Widget _buildDefectsSection(InspectionRecord inspection, AuthProvider auth, SupabaseService service) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'DETECTED DEFECTS (${inspection.defects.length})',
                style: AppTypography.label.copyWith(fontSize: 11),
              ),
              if (inspection.defects.isNotEmpty)
                Text(
                  'Tap defect to inspect & act',
                  style: AppTypography.bodySmall.copyWith(fontSize: 10),
                ),
            ],
          ),
          const SizedBox(height: 8),

          if (inspection.defects.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.qaPassBg,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.qaPassBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_outline, color: AppColors.qaPass, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'No defects detected. Board meets IPC Class 3 standard tolerances.',
                      style: AppTypography.body.copyWith(color: AppColors.qaPass, fontSize: 12),
                    ),
                  ),
                ],
              ),
            )
          else
            ...inspection.defects.map((d) {
              final isSel = _selectedDefect?.id == d.id;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: isSel ? AppColors.industrial50 : AppColors.bgSurface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSel ? AppColors.industrial400 : AppColors.borderSubtle,
                    width: isSel ? 1.5 : 1,
                  ),
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: _severityColor(d.severity).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            d.defectClass.toUpperCase(),
                            style: AppTypography.mono.copyWith(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _severityColor(d.severity),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${(d.confidence * 100).toStringAsFixed(1)}% confidence',
                          style: AppTypography.mono.copyWith(fontSize: 11, color: AppColors.textSecondary),
                        ),
                        const Spacer(),
                        _statusPill(d.status ?? 'DETECTED'),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Bounding Box: [${d.boxX1.toStringAsFixed(2)}, ${d.boxY1.toStringAsFixed(2)}] to [${d.boxX2.toStringAsFixed(2)}, ${d.boxY2.toStringAsFixed(2)}]',
                      style: AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textMuted),
                    ),

                    // Actions if Quality Engineer
                    if (auth.canReview) ...[
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          _defectActionButton(
                            label: 'Reclassify',
                            icon: Icons.edit_note,
                            color: AppColors.industrial600,
                            onTap: () => _openAuditDialog(
                              context: context,
                              inspection: inspection,
                              auth: auth,
                              service: service,
                              defaultDecision: ReviewDecision.reclassify,
                              defect: d,
                            ),
                          ),
                          const SizedBox(width: 8),
                          _defectActionButton(
                            label: 'Reject False Pos',
                            icon: Icons.close,
                            color: AppColors.qaFail,
                            onTap: () => _openAuditDialog(
                              context: context,
                              inspection: inspection,
                              auth: auth,
                              service: service,
                              defaultDecision: ReviewDecision.overridePass,
                              defect: d,
                            ),
                          ),
                          const SizedBox(width: 8),
                          _defectActionButton(
                            label: 'Accept Defect',
                            icon: Icons.check,
                            color: AppColors.qaPass,
                            onTap: () => _openAuditDialog(
                              context: context,
                              inspection: inspection,
                              auth: auth,
                              service: service,
                              defaultDecision: ReviewDecision.confirm,
                              defect: d,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _defectActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: AppTypography.mono.copyWith(fontSize: 10, fontWeight: FontWeight.w700, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusPill(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.bgMuted,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.toUpperCase(),
        style: AppTypography.mono.copyWith(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
      ),
    );
  }

  Color _severityColor(SeverityLevel sev) {
    switch (sev) {
      case SeverityLevel.critical:
        return AppColors.qaFail;
      case SeverityLevel.moderate:
        return AppColors.qaWarning;
      case SeverityLevel.minor:
        return AppColors.industrial600;
    }
  }

  Widget _buildAuditTrailSection(InspectionRecord inspection) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'AUDIT TRAIL & LOGS (${inspection.reviews.length})',
            style: AppTypography.label.copyWith(fontSize: 11),
          ),
          const SizedBox(height: 8),

          if (inspection.reviews.isEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.bgSurface,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Text(
                'No manual audit reviews logged yet for this board.',
                style: AppTypography.bodySmall,
              ),
            )
          else
            ...inspection.reviews.map((rev) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgSurface,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          rev.reviewDecision,
                          style: AppTypography.mono.copyWith(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: rev.reviewDecision.contains('PASS') ? AppColors.qaPass : AppColors.qaFail,
                          ),
                        ),
                        Text(
                          timeago.format(rev.createdAt),
                          style: AppTypography.bodySmall.copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      rev.justification,
                      style: AppTypography.body.copyWith(fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Auditor: ${rev.reviewerEmail}',
                      style: AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textMuted),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildReviewBottomBar(InspectionRecord inspection, AuthProvider auth, SupabaseService service) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.bgSurface,
        border: Border(top: BorderSide(color: AppColors.borderSubtle)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => _openAuditDialog(
                  context: context,
                  inspection: inspection,
                  auth: auth,
                  service: service,
                  defaultDecision: ReviewDecision.overridePass,
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.qaPass,
                  side: const BorderSide(color: AppColors.qaPassBorder),
                ),
                child: const Text('Override PASS'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton(
                onPressed: () => _openAuditDialog(
                  context: context,
                  inspection: inspection,
                  auth: auth,
                  service: service,
                  defaultDecision: ReviewDecision.confirm,
                ),
                child: const Text('Confirm AI Result'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openAuditDialog({
    required BuildContext context,
    required InspectionRecord inspection,
    required AuthProvider auth,
    required SupabaseService service,
    required ReviewDecision defaultDecision,
    DefectItem? defect,
  }) {
    ReviewDecision decision = defaultDecision;
    String? newDefectClass = 'short';
    final justificationController = TextEditingController();
    String? errorText;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            backgroundColor: AppColors.bgSurface,
            title: Text('Submit QA Audit Review', style: AppTypography.heading2),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('AUDITOR', style: AppTypography.label),
                  const SizedBox(height: 2),
                  Text(auth.currentUser?.email ?? 'engineer@pcb-vision.ai', style: AppTypography.mono.copyWith(fontSize: 11)),
                  const SizedBox(height: 12),

                  Text('REVIEW DECISION', style: AppTypography.label),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<ReviewDecision>(
                    initialValue: decision,
                    decoration: const InputDecoration(isDense: true),
                    items: ReviewDecision.values.map((d) {
                      return DropdownMenuItem(
                        value: d,
                        child: Text(d.label, style: AppTypography.body),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setDialogState(() => decision = val);
                    },
                  ),
                  const SizedBox(height: 12),

                  if (decision == ReviewDecision.reclassify) ...[
                    Text('NEW DEFECT CLASSIFICATION', style: AppTypography.label),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: newDefectClass,
                      decoration: const InputDecoration(isDense: true),
                      items: ['open', 'short', 'mousebite', 'spur', 'copper', 'pinhole'].map((cls) {
                        return DropdownMenuItem(
                          value: cls,
                          child: Text(cls.toUpperCase(), style: AppTypography.mono),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => newDefectClass = val);
                      },
                    ),
                    const SizedBox(height: 12),
                  ],

                  Text('MANDATORY AUDIT NOTES & JUSTIFICATION', style: AppTypography.label),
                  const SizedBox(height: 4),
                  TextField(
                    controller: justificationController,
                    maxLines: 3,
                    style: AppTypography.body,
                    decoration: InputDecoration(
                      hintText: 'Describe technical reason, IPC Class 3 tolerance, pad/trace id...',
                      errorText: errorText,
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final text = justificationController.text.trim();
                  if (text.length < 8) {
                    setDialogState(() {
                      errorText = 'Mandatory audit note must be at least 8 characters.';
                    });
                    return;
                  }

                  Navigator.pop(ctx);
                  await service.submitReview(
                    inspectionId: inspection.id,
                    decision: decision,
                    reviewerEmail: auth.currentUser?.email ?? 'engineer@pcb-vision.ai',
                    justification: text,
                    newDefectClass: newDefectClass,
                    defectId: defect?.id,
                  );

                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: AppColors.industrial900,
                      content: Text('Audit review logged to Supabase: ${decision.label}'),
                    ),
                  );
                },
                child: const Text('Submit Review'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _HorizontalSplitClipper extends CustomClipper<Rect> {
  final double splitRatio;

  _HorizontalSplitClipper(this.splitRatio);

  @override
  Rect getClip(Size size) {
    return Rect.fromLTWH(0, 0, size.width * splitRatio, size.height);
  }

  @override
  bool shouldReclip(covariant _HorizontalSplitClipper oldClipper) {
    return oldClipper.splitRatio != splitRatio;
  }
}
