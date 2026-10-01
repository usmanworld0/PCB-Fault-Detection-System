import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../services/inspection_report_service.dart';
import 'dart:math' as math;

class InspectionDetailScreen extends StatefulWidget {
  final String inspectionId;

  const InspectionDetailScreen({super.key, required this.inspectionId});

  @override
  State<InspectionDetailScreen> createState() => _InspectionDetailScreenState();
}

class _InspectionDetailScreenState extends State<InspectionDetailScreen> {
  // View mode: 'OVERLAY' or 'SIDE_BY_SIDE'
  String _viewMode = 'OVERLAY';
  DefectItem? _selectedDefect;
  late String _activeId;

  @override
  void initState() {
    super.initState();
    _activeId = widget.inspectionId;
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final matches = service.allInspections
        .where((item) => item.id == widget.inspectionId)
        .toList();
    if (matches.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.bgApp,
        appBar: AppBar(title: const Text('Inspection details')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.inbox_outlined,
                  size: 40,
                  color: AppColors.textMuted,
                ),
                const SizedBox(height: 10),
                Text('Inspection not available', style: AppTypography.heading3),
                const SizedBox(height: 6),
                Text(
                  'Refresh inspection history and try again.',
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySmall,
                ),
                TextButton(
                  onPressed: service.fetchInspections,
                  child: const Text('Refresh'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    final inspection = matches.first;

    final relatedSubInspections = (inspection.pcbId != null && inspection.pcbId!.isNotEmpty)
        ? service.inspections.where((i) => i.pcbId == inspection.pcbId).toList()
        : <InspectionRecord>[];
    relatedSubInspections.sort((a, b) => a.imageIndex.compareTo(b.imageIndex));

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              inspection.id,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.mono.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              '${inspection.stationId}${inspection.operatorEmail == null ? '' : ' • ${inspection.operatorEmail}'}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodySmall.copyWith(fontSize: 10),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Generate and share PDF report',
            onPressed: () => _shareReport(inspection),
            icon: const Icon(Icons.picture_as_pdf_outlined),
          ),
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

            _buildDefectsSection(inspection),

            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }

  Future<void> _shareReport(InspectionRecord inspection) async {
    try {
      await InspectionReportService.share(inspection);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Could not create report: $e')));
      }
    }
  }

  Widget _buildViewModeSelector() {
    return Container(
      color: AppColors.bgSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _modeButton('AI Overlay', 'OVERLAY', Icons.layers_outlined),
          const SizedBox(width: 8),
          _modeButton(
            'Side-by-Side',
            'SIDE_BY_SIDE',
            Icons.view_column_outlined,
          ),
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
          padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 2),
          decoration: BoxDecoration(
            color: isSel ? AppColors.industrial600 : AppColors.bgMuted,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSel ? AppColors.industrial700 : AppColors.borderSubtle,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 13,
                color: isSel ? Colors.white : AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.mono.copyWith(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isSel ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageWorkspace(InspectionRecord inspection) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final stageHeight = math.min(
          constraints.maxWidth / 1.6,
          MediaQuery.sizeOf(context).height * 0.44,
        );
        return Container(
          height: stageHeight,
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          decoration: BoxDecoration(
            color: AppColors.bgMuted,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: AppColors.borderSubtle),
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (_viewMode == 'OVERLAY')
                _buildOverlayView(inspection)
              else
                _buildSideBySideView(inspection),
              Positioned(
                left: 10,
                right: 10,
                bottom: 8,
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: constraints.maxWidth * 0.7,
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        inspection.source,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.mono.copyWith(
                          fontSize: 9,
                          color: Colors.white70,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOverlayView(InspectionRecord inspection) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;
        final boxes = <Widget>[];
        final labels = <Widget>[];
        for (final defect in inspection.defects) {
          final x1 = defect.boxX1.clamp(0.0, 1.0);
          final y1 = defect.boxY1.clamp(0.0, 1.0);
          final x2 = defect.boxX2.clamp(x1, 1.0);
          final y2 = defect.boxY2.clamp(y1, 1.0);
          final left = x1 * w;
          final top = y1 * h;
          final boxWidth = math.min(w - left, math.max(2.0, (x2 - x1) * w));
          final boxHeight = math.min(h - top, math.max(2.0, (y2 - y1) * h));
          final color = _severityColor(defect.severity);
          final isSelected = _selectedDefect?.id == defect.id;
          final labelWidth = w * 0.62;
          final labelLeft = math.min(left, math.max(0.0, w - labelWidth));
          final labelTop = top >= 20 ? top - 20 : 0.0;
          boxes.add(
            Positioned(
              left: left,
              top: top,
              width: boxWidth,
              height: boxHeight,
              child: GestureDetector(
                onTap: () => setState(() => _selectedDefect = defect),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected ? Colors.white : color,
                      width: isSelected ? 2.5 : 1.5,
                    ),
                    color: color.withValues(alpha: 0.2),
                  ),
                ),
              ),
            ),
          );
          labels.add(
            Positioned(
              left: labelLeft,
              top: labelTop,
              width: labelWidth,
              child: GestureDetector(
                onTap: () => setState(() => _selectedDefect = defect),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text(
                    '${defect.defectClass} ${(defect.confidence * 100).toStringAsFixed(0)}%',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.mono.copyWith(
                      fontSize: 8,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          );
        }
        return Stack(
          fit: StackFit.expand,
          children: [
            _pcbImage(inspection.annotatedUrl, 'Annotated image unavailable'),
            ...boxes,
            ...labels,
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
              _pcbImage(inspection.imageUrl, 'Original image unavailable'),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'RAW INPUT',
                    style: AppTypography.mono.copyWith(
                      fontSize: 9,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        VerticalDivider(width: 2, thickness: 2, color: AppColors.industrial500),
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.industrial600,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'AI INFERENCE',
                    style: AppTypography.mono.copyWith(
                      fontSize: 9,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pcbImage(String url, String message) {
    if (url.trim().isEmpty) return _imagePlaceholder(message);
    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => _imagePlaceholder(message),
    );
  }

  Widget _imagePlaceholder(String message) => ColoredBox(
    color: AppColors.bgMuted,
    child: Center(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.memory_outlined, color: AppColors.textMuted),
            const SizedBox(height: 4),
            Text(
              message,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodySmall,
            ),
          ],
        ),
      ),
    ),
  );

  Widget _buildDefectsSection(InspectionRecord inspection) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            runSpacing: 4,
            children: [
              Text(
                'DETECTED DEFECTS (${inspection.defects.length})',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.label.copyWith(fontSize: 11),
              ),
              if (inspection.defects.isNotEmpty)
                Text(
                  'Tap a detection box to highlight the defect',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: AppColors.qaPassBorder),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_circle_outline,
                    color: AppColors.qaPass,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'No defects detected for this inspection.',
                      style: AppTypography.body.copyWith(
                        color: AppColors.qaPass,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            ...inspection.defects.map((defect) {
              final isSelected = _selectedDefect?.id == defect.id;
              return LayoutBuilder(
                builder: (context, constraints) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.industrial50
                        : AppColors.bgSurface,
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.purityTeal
                          : AppColors.borderSubtle,
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          ConstrainedBox(
                            constraints: BoxConstraints(
                              maxWidth: constraints.maxWidth * 0.52,
                            ),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: _severityColor(
                                  defect.severity,
                                ).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                defect.defectClass.toUpperCase(),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.mono.copyWith(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: _severityColor(defect.severity),
                                ),
                              ),
                            ),
                          ),
                          _statusPill(defect.severity.value.toUpperCase()),
                          _statusPill(
                            '${(defect.confidence * 100).toStringAsFixed(1)}% confidence',
                          ),
                          _statusPill(
                            (defect.status ?? 'DETECTED').toUpperCase(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Bounding Box: [${defect.boxX1.toStringAsFixed(2)}, ${defect.boxY1.toStringAsFixed(2)}] to [${defect.boxX2.toStringAsFixed(2)}, ${defect.boxY2.toStringAsFixed(2)}]',
                        softWrap: true,
                        style: AppTypography.mono.copyWith(
                          fontSize: 10,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
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
        style: AppTypography.mono.copyWith(
          fontSize: 9,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
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
}
