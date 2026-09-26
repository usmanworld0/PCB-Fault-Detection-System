import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../services/supabase_service.dart';
import '../services/auth_provider.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/filter_sheet.dart';
import 'inspection_detail_screen.dart';

class InspectionsScreen extends StatefulWidget {
  const InspectionsScreen({super.key});

  @override
  State<InspectionsScreen> createState() => _InspectionsScreenState();
}

class _InspectionsScreenState extends State<InspectionsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _activeTab = 'ALL'; // 'ALL', 'FAIL', 'PASS', 'PENDING'

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final auth = context.watch<AuthProvider>();

    var list = service.inspections;

    // Local tab filtering
    if (_activeTab == 'FAIL') {
      list = list.where((i) => i.finalStatus == InspectionStatus.fail).toList();
    } else if (_activeTab == 'PASS') {
      list = list.where((i) => i.finalStatus == InspectionStatus.pass).toList();
    } else if (_activeTab == 'PENDING') {
      list = list.where((i) => i.reviewStatus == 'UNREVIEWED' || i.reviewStatus == 'PENDING').toList();
    }

    // Search query
    final query = _searchController.text.trim().toLowerCase();
    if (query.isNotEmpty) {
      list = list.where((i) =>
        i.id.toLowerCase().contains(query) ||
        i.source.toLowerCase().contains(query) ||
        i.batchNumber.toLowerCase().contains(query) ||
        i.stationId.toLowerCase().contains(query)
      ).toList();
    }

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: Column(
        children: [
          // Search & Action Toolbar
          Container(
            color: AppColors.bgSurface,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Column(
              children: [
                Row(
                  children: [
                    // Search bar
                    Expanded(
                      child: Container(
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppColors.bgMuted,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (_) => setState(() {}),
                          style: AppTypography.mono.copyWith(fontSize: 12),
                          decoration: InputDecoration(
                            isDense: true,
                            hintText: 'Search by ID, board, batch, station...',
                            hintStyle: AppTypography.bodySmall,
                            prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.textMuted),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 16),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {});
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Filter button
                    InkWell(
                      onTap: () => FilterSheet.show(context),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        height: 38,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColors.bgMuted,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: const Icon(Icons.tune_outlined, size: 18, color: AppColors.industrial700),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Batch Inspection trigger button
                    ElevatedButton.icon(
                      onPressed: service.isBatchProcessing
                          ? null
                          : () => _showBatchInspectionDialog(context, service),
                      icon: service.isBatchProcessing
                          ? const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.playlist_play_rounded, size: 16),
                      label: Text(
                        service.isBatchProcessing ? 'Scanning...' : 'Batch QA',
                        style: AppTypography.mono.copyWith(fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        minimumSize: const Size(0, 38),
                        backgroundColor: AppColors.industrial600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Quick tabs: ALL, FAIL, PASS, PENDING
                Row(
                  children: [
                    _tabChip('ALL', 'ALL', service.inspections.length),
                    const SizedBox(width: 6),
                    _tabChip('FAIL', 'FAIL', service.inspections.where((i) => i.finalStatus == InspectionStatus.fail).length, color: AppColors.qaFail),
                    const SizedBox(width: 6),
                    _tabChip('PASS', 'PASS', service.inspections.where((i) => i.finalStatus == InspectionStatus.pass).length, color: AppColors.qaPass),
                    const SizedBox(width: 6),
                    _tabChip('PENDING', 'PENDING', service.inspections.where((i) => i.reviewStatus == 'UNREVIEWED' || i.reviewStatus == 'PENDING').length, color: AppColors.qaWarning),
                  ],
                ),
              ],
            ),
          ),

          // Batch progress banner if active
          if (service.isBatchProcessing)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.industrial50,
              child: Row(
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.industrial600),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Batch Inspection in progress: ${service.batchCurrent} of ${service.batchTotal}',
                          style: AppTypography.mono.copyWith(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.industrial800),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          service.batchCurrentName,
                          style: AppTypography.bodySmall.copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${(service.batchProgress * 100).toInt()}%',
                    style: AppTypography.mono.copyWith(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.industrial700),
                  ),
                ],
              ),
            ),

          // Inspection List
          Expanded(
            child: RefreshIndicator(
              color: AppColors.industrial600,
              onRefresh: () async {
                await service.fetchInspections();
              },
              child: list.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.inbox_outlined, size: 40, color: AppColors.textMuted),
                          const SizedBox(height: 8),
                          Text('No inspections found', style: AppTypography.heading3),
                          const SizedBox(height: 4),
                          Text('Try changing filters or searching another keyword', style: AppTypography.bodySmall),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: list.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, idx) {
                        return _buildInspectionCard(ctx, list[idx], auth);
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabChip(String label, String value, int count, {Color? color}) {
    final isSel = _activeTab == value;
    final activeColor = color ?? AppColors.industrial600;

    return GestureDetector(
      onTap: () => setState(() => _activeTab = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSel ? activeColor.withValues(alpha: 0.12) : AppColors.bgMuted,
          borderRadius: BorderRadius.circular(5),
          border: Border.all(
            color: isSel ? activeColor : AppColors.borderSubtle,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTypography.mono.copyWith(
                fontSize: 10,
                fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                color: isSel ? activeColor : AppColors.textSecondary,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: isSel ? activeColor : AppColors.borderStrong,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                count.toString(),
                style: AppTypography.mono.copyWith(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInspectionCard(BuildContext context, InspectionRecord item, AuthProvider auth) {
    final isFail = item.finalStatus == InspectionStatus.fail;
    final statusColor = isFail ? AppColors.qaFail : AppColors.qaPass;
    final statusBg = isFail ? AppColors.qaFailBg : AppColors.qaPassBg;
    final statusBorder = isFail ? AppColors.qaFailBorder : AppColors.qaPassBorder;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => InspectionDetailScreen(inspectionId: item.id),
          ),
        );
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Board thumbnail preview with defect bounding marker
            Stack(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFF133E26), // PCB green substrate
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.borderSubtle),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.network(
                    item.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Center(
                      child: Icon(Icons.memory, color: Colors.white54, size: 28),
                    ),
                  ),
                ),
                if (item.defects.isNotEmpty)
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.qaFail,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${item.defects.length}',
                        style: AppTypography.mono.copyWith(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),

            // Card details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.id,
                        style: AppTypography.mono.copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.industrial900,
                        ),
                      ),
                      // Pass / Fail badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: statusBg,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: statusBorder),
                        ),
                        child: Text(
                          item.finalStatus.value,
                          style: AppTypography.mono.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.source,
                    style: AppTypography.body.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),

                  // Metadata tags: Station, Batch, Time
                  Row(
                    children: [
                      _smallTag(item.stationId),
                      const SizedBox(width: 6),
                      _smallTag(item.batchNumber),
                      const Spacer(),
                      Text(
                        timeago.format(item.capturedAt),
                        style: AppTypography.bodySmall.copyWith(fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Review Status & Defect tags
                  Row(
                    children: [
                      _reviewStatusPill(item.reviewStatus),
                      const SizedBox(width: 6),
                      if (item.defects.isNotEmpty)
                        Expanded(
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: item.defects.take(3).map((d) {
                                return Container(
                                  margin: const EdgeInsets.only(right: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: AppColors.bgMuted,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                  child: Text(
                                    d.defectClass.toUpperCase(),
                                    style: AppTypography.mono.copyWith(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _smallTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.bgMuted,
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        text,
        style: AppTypography.mono.copyWith(fontSize: 9, color: AppColors.textSecondary),
      ),
    );
  }

  Widget _reviewStatusPill(String status) {
    Color bg;
    Color text;
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        bg = AppColors.qaPassBg;
        text = AppColors.qaPass;
        break;
      case 'OVERRIDDEN':
        bg = AppColors.qaInfoBg;
        text = AppColors.qaInfo;
        break;
      default:
        bg = AppColors.qaWarningBg;
        text = AppColors.qaWarning;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        status.toUpperCase(),
        style: AppTypography.mono.copyWith(fontSize: 9, fontWeight: FontWeight.w700, color: text),
      ),
    );
  }

  void _showBatchInspectionDialog(BuildContext context, SupabaseService service) {
    final boards = [
      'LINE1_TRAY_A_001.png',
      'LINE1_TRAY_A_002.png',
      'LINE1_TRAY_A_003.png',
      'LINE1_TRAY_A_004.png',
      'LINE1_TRAY_A_005.png',
    ];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Start Batch Inspection Workflow', style: AppTypography.heading2),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sequential inspection pipeline will process ${boards.length} queued PCB boards through YOLOv8s AI inference & Supabase storage.',
              style: AppTypography.body,
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.bgMuted,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: boards.map((b) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      const Icon(Icons.crop_original, size: 14, color: AppColors.industrial600),
                      const SizedBox(width: 6),
                      Text(b, style: AppTypography.mono.copyWith(fontSize: 11)),
                    ],
                  ),
                )).toList(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              service.runBatchInspection(boards);
            },
            child: const Text('Begin Inspection'),
          ),
        ],
      ),
    );
  }
}
