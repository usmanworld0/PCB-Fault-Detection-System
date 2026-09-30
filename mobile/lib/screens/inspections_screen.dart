import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../services/supabase_service.dart';
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
  String _activeTab = 'ALL';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final query = _searchController.text.trim().toLowerCase();
    final rows = query.isEmpty ? service.inspections : service.allInspections;
    var matchingRows = rows;
    if (query.isNotEmpty) {
      matchingRows = rows
          .where(
            (i) =>
                (i.pcbId ?? '').toLowerCase().contains(query) ||
                i.id.toLowerCase().contains(query) ||
                i.source.toLowerCase().contains(query) ||
                i.batchNumber.toLowerCase().contains(query) ||
                i.stationId.toLowerCase().contains(query) ||
                (i.operatorEmail ?? '').toLowerCase().contains(query) ||
                i.model.toLowerCase().contains(query),
          )
          .toList();
    }
    final groups = _groupInspections(matchingRows);
    final tabGroups = _groupInspections(service.inspections);
    final visibleGroups = query.isNotEmpty || _activeTab == 'ALL'
        ? groups
        : groups.where((group) {
            switch (_activeTab) {
              case 'FAIL':
                return group.isFail;
              case 'PASS':
                return !group.isFail;
              default:
                return true;
            }
          }).toList();

    // Group inspections by PCB ID
    final Map<String, List<InspectionRecord>> pcbGroups = {};
    for (final item in list) {
      final key = (item.pcbId != null && item.pcbId!.isNotEmpty) ? 'pcb:${item.pcbId}' : 'insp:${item.id}';
      pcbGroups.putIfAbsent(key, () => []).add(item);
    }
    final groupedList = pcbGroups.values.toList();

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
                LayoutBuilder(
                  builder: (context, constraints) {
                    final search = Container(
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
                          hintText:
                              'Search by PCB ID, image, station, operator...',
                          hintStyle: AppTypography.bodySmallReadable,
                          prefixIcon: const Icon(
                            Icons.search,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
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
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 10,
                          ),
                        ),
                      ),
                    );
                    final filter = InkWell(
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
                        child: const Icon(
                          Icons.tune_outlined,
                          size: 18,
                          color: AppColors.industrial700,
                        ),
                      ),
                    );
                    final actions = filter;
                    if (constraints.maxWidth < 430) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          search,
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: actions,
                          ),
                        ],
                      );
                    }
                    return Row(
                      children: [
                        Expanded(child: search),
                        const SizedBox(width: 8),
                        actions,
                      ],
                    );
                  },
                ),
                const SizedBox(height: 10),

                // Quick tabs: ALL, FAIL, PASS
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _tabChip('ALL', 'ALL', tabGroups.length),
                    _tabChip(
                      'FAIL',
                      'FAIL',
                      tabGroups.where((group) => group.isFail).length,
                      color: AppColors.qaFail,
                    ),
                    _tabChip(
                      'PASS',
                      'PASS',
                      tabGroups.where((group) => !group.isFail).length,
                      color: AppColors.qaPass,
                    ),
                  ],
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
              child: visibleGroups.isEmpty
                  ? service.isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : service.inspectionError != null
                        ? Center(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.cloud_off_outlined,
                                    size: 40,
                                    color: AppColors.qaWarning,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Could not load inspections',
                                    style: AppTypography.heading3,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    service.inspectionError!,
                                    textAlign: TextAlign.center,
                                    style: AppTypography.bodySmallReadable,
                                  ),
                                  TextButton(
                                    onPressed: service.fetchInspections,
                                    child: const Text('Try again'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.inbox_outlined,
                                  size: 40,
                                  color: AppColors.textMuted,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  query.isEmpty
                                      ? 'No inspections found'
                                      : 'No inspections found for "$query"',
                                  style: AppTypography.heading3,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  query.isEmpty
                                      ? 'Try changing filters or search another PCB ID.'
                                      : 'Check the PCB ID and try again.',
                                  style: AppTypography.bodySmallReadable,
                                ),
                              ],
                            ),
                          )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: visibleGroups.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (ctx, idx) {
                        return _buildPcbGroupCard(ctx, visibleGroups[idx]);
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
          color: isSel
              ? activeColor.withValues(alpha: 0.12)
              : AppColors.bgMuted,
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

  Widget _buildPcbGroupCard(BuildContext context, _PcbInspectionGroup group) {
    final latest = group.latest;
    final pcbId = group.pcbId?.trim();
    final title = pcbId == null || pcbId.isEmpty ? 'PCB ID unavailable' : pcbId;
    final imageCount = group.inspections.length;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.035),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
        title: Row(
          children: [
            Expanded(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.mono.copyWith(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.industrial900,
                ),
              ),
            ),
            const SizedBox(width: 6),
            _statusBadge(
              group.isFail ? InspectionStatus.fail : InspectionStatus.pass,
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 5),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$imageCount ${imageCount == 1 ? 'sub-inspection' : 'sub-inspections'} · Latest ${timeago.format(latest.capturedAt)}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.bodySmallReadable,
              ),
              const SizedBox(height: 5),
              Wrap(
                spacing: 5,
                runSpacing: 4,
                children: [
                  _smallTag(context, latest.stationId),
                  _smallTag(context, latest.model),
                  if (latest.operatorEmail?.isNotEmpty == true)
                    _smallTag(context, latest.operatorEmail!),
                  if (latest.operatorEmail?.isNotEmpty != true &&
                      latest.operatorRole?.isNotEmpty == true)
                    _smallTag(context, latest.operatorRole!),
                  _smallTag(context, '${group.totalDefects} defects'),
                ],
              ),
            ],
          ),
        ),
        children: group.inspections.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          return _subInspectionTile(context, item, index);
        }).toList(),
      ),
    );
  }

  Widget _subInspectionTile(
    BuildContext context,
    InspectionRecord item,
    int fallbackIndex,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final thumbnailWidth = constraints.maxWidth * 0.19;
        return InkWell(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(
              builder: (_) => InspectionDetailScreen(inspectionId: item.id),
            ),
          ),
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 7),
            child: Row(
              children: [
                SizedBox(
                  width: thumbnailWidth,
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: _thumbnail(item.imageUrl),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Image ${item.imageIndex ?? fallbackIndex + 1} · ${item.id}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.mono.copyWith(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 5),
                          _statusBadge(item.finalStatus),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 5,
                        runSpacing: 4,
                        children: [
                          _smallTag(context, item.stationId),
                          _smallTag(context, item.model),
                          if (item.operatorEmail?.isNotEmpty == true)
                            _smallTag(context, item.operatorEmail!),
                          if (item.operatorEmail?.isNotEmpty != true &&
                              item.operatorRole?.isNotEmpty == true)
                            _smallTag(context, item.operatorRole!),
                          _smallTag(context, timeago.format(item.capturedAt)),
                          _smallTag(context, '${item.defects.length} defects'),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _thumbnail(String imageUrl) {
    final decoration = BoxDecoration(
      color: AppColors.bgMuted,
      borderRadius: BorderRadius.circular(6),
      border: Border.all(color: AppColors.borderSubtle),
    );
    if (imageUrl.trim().isEmpty) {
      return Container(
        decoration: decoration,
        child: const Center(
          child: Icon(Icons.memory_outlined, color: AppColors.textMuted),
        ),
      );
    }
    return Container(
      decoration: decoration,
      clipBehavior: Clip.antiAlias,
      child: Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => const ColoredBox(
          color: AppColors.bgMuted,
          child: Center(
            child: Icon(Icons.memory_outlined, color: AppColors.textMuted),
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(InspectionStatus status) {
    final isFail = status == InspectionStatus.fail;
    final color = isFail ? AppColors.qaFail : AppColors.qaPass;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isFail ? AppColors.qaFailBg : AppColors.qaPassBg,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: isFail ? AppColors.qaFailBorder : AppColors.qaPassBorder,
        ),
      ),
      child: Text(
        status.value,
        maxLines: 1,
        style: AppTypography.mono.copyWith(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }

  Widget _smallTag(BuildContext context, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.bgMuted,
        borderRadius: BorderRadius.circular(3),
      ),
      constraints: BoxConstraints(
        maxWidth: MediaQuery.sizeOf(context).width * 0.32,
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        softWrap: false,
        style: AppTypography.mono.copyWith(
          fontSize: 9,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  List<_PcbInspectionGroup> _groupInspections(List<InspectionRecord> rows) {
    final grouped = <String, List<InspectionRecord>>{};
    final pcbIds = <String, String?>{};
    for (final item in rows) {
      final pcbId = item.pcbId?.trim();
      final key = pcbId == null || pcbId.isEmpty
          ? 'inspection:${item.id}'
          : pcbId;
      grouped.putIfAbsent(key, () => []).add(item);
      pcbIds[key] = pcbId?.isEmpty == true ? null : pcbId;
    }
    final groups = grouped.entries
        .map((entry) => _PcbInspectionGroup(pcbIds[entry.key], entry.value))
        .toList();
    groups.sort((a, b) => b.latest.capturedAt.compareTo(a.latest.capturedAt));
    return groups;
  }
}

class _PcbInspectionGroup {
  final String? pcbId;
  final List<InspectionRecord> inspections;

  _PcbInspectionGroup(this.pcbId, List<InspectionRecord> inspections)
    : inspections = List<InspectionRecord>.from(inspections)
        ..sort((a, b) => b.capturedAt.compareTo(a.capturedAt));

  InspectionRecord get latest => inspections.first;
  bool get isFail =>
      inspections.any((item) => item.finalStatus == InspectionStatus.fail);
  int get totalDefects =>
      inspections.fold(0, (total, item) => total + item.defects.length);
}
