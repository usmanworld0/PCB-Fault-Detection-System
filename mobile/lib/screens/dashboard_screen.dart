import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/supabase_service.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../widgets/stat_card.dart';
import '../widgets/section_header.dart';
import '../widgets/pcb_heatmap_view.dart';
import '../widgets/filter_sheet.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _trendPeriod = 'Daily'; // 'Daily', 'Weekly', 'Monthly'

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final stats = service.stats;

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: RefreshIndicator(
        color: AppColors.industrial600,
        onRefresh: () async {
          await service.fetchInspections();
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Top action bar with filter pill
            SliverToBoxAdapter(
              child: _buildFilterBar(service),
            ),

            if (service.isLoading && stats == null)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.industrial600),
                ),
              )
            else if (stats != null) ...[
              // 1. KPI Stats Cards Grid
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.35,
                  ),
                  delegate: SliverChildListDelegate([
                    StatCard(
                      label: 'Total Inspections',
                      value: stats.totalInspections.toString(),
                      icon: Icons.biotech_outlined,
                      accentColor: AppColors.industrial600,
                      delta: '+8.4%',
                      deltaIsPositive: true,
                      subtitle: 'vs prior batch',
                    ),
                    StatCard(
                      label: 'Defect Rate',
                      value: '${stats.defectRate.toStringAsFixed(1)}%',
                      icon: Icons.warning_amber_rounded,
                      accentColor: stats.defectRate > 2.0 ? AppColors.qaFail : AppColors.qaWarning,
                      delta: '-0.3%',
                      deltaIsPositive: true,
                      subtitle: '${stats.failCount} failed boards',
                    ),
                    StatCard(
                      label: 'Yield Rate',
                      value: '${stats.yieldRate.toStringAsFixed(1)}%',
                      icon: Icons.verified_outlined,
                      accentColor: AppColors.qaPass,
                      delta: '+0.5%',
                      deltaIsPositive: true,
                      subtitle: 'IPC Class 3 Target',
                    ),
                    StatCard(
                      label: 'Critical Defects',
                      value: stats.criticalDefects.toString(),
                      icon: Icons.crisis_alert_outlined,
                      accentColor: stats.criticalDefects > 0 ? AppColors.qaFail : AppColors.qaPass,
                      delta: stats.criticalDefects == 0 ? 'Optimal' : 'Action Req',
                      deltaIsPositive: stats.criticalDefects == 0,
                      subtitle: 'Requires QA review',
                    ),
                  ]),
                ),
              ),

              // 2. Pass / Fail Ratio Indicator
              SliverToBoxAdapter(
                child: _buildPassFailBar(stats),
              ),

              // 3. Time Series Defect Trends
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Defect Trends Over Time',
                  subtitle: 'Historical defect trajectory & inspection volume',
                  trailing: Container(
                    decoration: BoxDecoration(
                      color: AppColors.bgMuted,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: ['Daily', 'Weekly', 'Monthly'].map((p) {
                        final isSel = _trendPeriod == p;
                        return GestureDetector(
                          onTap: () => setState(() => _trendPeriod = p),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.industrial600 : Colors.transparent,
                              borderRadius: BorderRadius.circular(5),
                            ),
                            child: Text(
                              p,
                              style: AppTypography.mono.copyWith(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: isSel ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: _buildTrendChartCard(stats),
              ),

              // 4. PCB Defect Location Heatmap
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Defect Location Heatmap',
                  subtitle: 'Spatial distribution across PCB surface layout',
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.industrial50,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.industrial200),
                    ),
                    child: Text(
                      '${stats.heatmapPoints.length} Hotspots',
                      style: AppTypography.mono.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.industrial700,
                      ),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: PcbHeatmapView(points: stats.heatmapPoints),
              ),

              // 5. Defects by Classification Type
              SliverToBoxAdapter(
                child: const SectionHeader(
                  title: 'Defects by Classification',
                  subtitle: 'Breakdown across IPC defect taxonomy categories',
                ),
              ),
              SliverToBoxAdapter(
                child: _buildDefectsByType(stats),
              ),

              // 6. Model Performance & Confidence Score Distribution
              SliverToBoxAdapter(
                child: const SectionHeader(
                  title: 'Model Performance & Confidence',
                  subtitle: 'YOLOv8s detection metrics & score distribution',
                ),
              ),
              SliverToBoxAdapter(
                child: _buildModelMetricsCard(stats),
              ),

              const SliverToBoxAdapter(
                child: SizedBox(height: 32),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar(SupabaseService service) {
    return Container(
      color: AppColors.bgSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          // Filter button
          InkWell(
            onTap: () => FilterSheet.show(context),
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.bgMuted,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.tune_outlined, size: 14, color: AppColors.industrial700),
                  const SizedBox(width: 6),
                  Text(
                    'Filters',
                    style: AppTypography.mono.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.industrial900,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Active filter tags scroll
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _filterTag('Time: ${service.filterTimeframe.toUpperCase()}'),
                  if (service.filterStation != null && service.filterStation != 'All')
                    _filterTag('Station: ${service.filterStation}'),
                  if (service.filterBatch != null && service.filterBatch != 'All')
                    _filterTag('Batch: ${service.filterBatch}'),
                  if (service.filterDefectType != null && service.filterDefectType != 'All')
                    _filterTag('Type: ${service.filterDefectType!.toUpperCase()}'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterTag(String text) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.industrial50,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppColors.industrial200),
      ),
      child: Text(
        text,
        style: AppTypography.mono.copyWith(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: AppColors.industrial700,
        ),
      ),
    );
  }

  Widget _buildPassFailBar(DashboardStats stats) {
    final passPct = stats.yieldRate;
    final failPct = stats.defectRate;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PASS / FAIL RATIO',
                style: AppTypography.label.copyWith(fontSize: 10),
              ),
              Text(
                '${passPct.toStringAsFixed(1)}% PASS  •  ${failPct.toStringAsFixed(1)}% FAIL',
                style: AppTypography.mono.copyWith(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: SizedBox(
              height: 10,
              child: Row(
                children: [
                  Expanded(
                    flex: (passPct * 10).toInt(),
                    child: Container(color: AppColors.qaPass),
                  ),
                  if (failPct > 0)
                    Expanded(
                      flex: (failPct * 10).toInt().clamp(1, 1000),
                      child: Container(color: AppColors.qaFail),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _statusBadge('PASS COUNT', stats.passCount.toString(), AppColors.qaPass),
              _statusBadge('FAIL COUNT', stats.failCount.toString(), AppColors.qaFail),
              _statusBadge('PENDING QA', stats.pendingReviews.toString(), AppColors.qaWarning),
              _statusBadge('ACTIVE ALERTS', stats.activeAlerts.toString(), AppColors.qaInfo),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusBadge(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.bodySmall.copyWith(fontSize: 9)),
        const SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 4),
            Text(
              value,
              style: AppTypography.mono.copyWith(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTrendChartCard(DashboardStats stats) {
    List<TrendPoint> points;
    switch (_trendPeriod) {
      case 'Weekly':
        points = stats.trendWeekly;
        break;
      case 'Monthly':
        points = stats.trendMonthly;
        break;
      default:
        points = stats.trendDaily;
        break;
    }

    if (points.isEmpty) return const SizedBox.shrink();

    final maxY = points.map((p) => p.inspections.toDouble()).fold(10.0, (a, b) => a > b ? a : b) * 1.15;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.fromLTRB(14, 16, 16, 12),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$_trendPeriod Defect Trajectory',
                style: AppTypography.heading3.copyWith(fontSize: 13),
              ),
              Row(
                children: [
                  _chartLegend(AppColors.industrial600, 'Inspections'),
                  const SizedBox(width: 10),
                  _chartLegend(AppColors.qaFail, 'Defects'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                maxY: maxY,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (val) => FlLine(
                    color: AppColors.borderSubtle,
                    strokeWidth: 0.8,
                  ),
                ),
                titlesData: FlTitlesData(
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 32,
                      getTitlesWidget: (val, meta) => Text(
                        val.toInt().toString(),
                        style: AppTypography.mono.copyWith(fontSize: 9, color: AppColors.textMuted),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (val, meta) {
                        final idx = val.toInt();
                        if (idx >= 0 && idx < points.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              points[idx].label,
                              style: AppTypography.mono.copyWith(fontSize: 9, color: AppColors.textSecondary),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: points.asMap().entries.map((entry) {
                  final i = entry.key;
                  final p = entry.value;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: p.inspections.toDouble(),
                        color: AppColors.industrial600,
                        width: 10,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                      ),
                      BarChartRodData(
                        toY: (p.defects * 4).toDouble().clamp(0.0, maxY), // scaled for visual prominence
                        color: AppColors.qaFail,
                        width: 8,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(3)),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chartLegend(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 4),
        Text(label, style: AppTypography.bodySmall.copyWith(fontSize: 10)),
      ],
    );
  }

  Widget _buildDefectsByType(DashboardStats stats) {
    final maxCount = stats.defectsByClass.values.fold(1, (a, b) => a > b ? a : b);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        children: stats.defectsByClass.entries.map((entry) {
          final count = entry.value;
          final pct = maxCount > 0 ? (count / maxCount) : 0.0;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Row(
              children: [
                SizedBox(
                  width: 80,
                  child: Text(
                    entry.key.toUpperCase(),
                    style: AppTypography.mono.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: SizedBox(
                      height: 8,
                      child: LinearProgressIndicator(
                        value: pct.clamp(0.05, 1.0),
                        backgroundColor: AppColors.bgMuted,
                        color: _defectColor(entry.key),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 28,
                  child: Text(
                    count.toString(),
                    textAlign: TextAlign.right,
                    style: AppTypography.mono.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Color _defectColor(String cls) {
    switch (cls.toLowerCase()) {
      case 'short':
        return AppColors.qaFail;
      case 'open':
        return const Color(0xFFE11D48);
      case 'mousebite':
        return AppColors.qaWarning;
      case 'spur':
        return const Color(0xFFF97316);
      case 'copper':
        return AppColors.industrial500;
      default:
        return const Color(0xFF8B5CF6);
    }
  }

  Widget _buildModelMetricsCard(DashboardStats stats) {
    final m = stats.modelMetrics;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(m.activeModel, style: AppTypography.mono.copyWith(fontSize: 12, fontWeight: FontWeight.w700)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.qaPassBg,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '${m.inferenceLatencyMs} ms LATENCY',
                  style: AppTypography.mono.copyWith(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.qaPass),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 4 metric pills
          Row(
            children: [
              _metricPill('mAP@0.5', '${(m.map50 * 100).toStringAsFixed(1)}%'),
              const SizedBox(width: 8),
              _metricPill('Precision', '${(m.precision * 100).toStringAsFixed(1)}%'),
              const SizedBox(width: 8),
              _metricPill('Recall', '${(m.recall * 100).toStringAsFixed(1)}%'),
              const SizedBox(width: 8),
              _metricPill('F1 Score', '${(m.f1Score * 100).toStringAsFixed(1)}%'),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'CONFIDENCE SCORE DISTRIBUTION',
            style: AppTypography.label.copyWith(fontSize: 9),
          ),
          const SizedBox(height: 8),
          // Confidence distribution bars
          Column(
            children: stats.confidenceDistribution.map((bin) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    SizedBox(
                      width: 55,
                      child: Text(
                        bin.rangeLabel,
                        style: AppTypography.mono.copyWith(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    ),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: (bin.percentage / 100).clamp(0.02, 1.0),
                          backgroundColor: AppColors.bgMuted,
                          color: AppColors.industrial600,
                          minHeight: 6,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 40,
                      child: Text(
                        '${bin.percentage.toStringAsFixed(0)}%',
                        textAlign: TextAlign.right,
                        style: AppTypography.mono.copyWith(fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _metricPill(String title, String val) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.bgMuted,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: Column(
          children: [
            Text(title, style: AppTypography.bodySmall.copyWith(fontSize: 9)),
            const SizedBox(height: 2),
            Text(
              val,
              style: AppTypography.mono.copyWith(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.industrial900),
            ),
          ],
        ),
      ),
    );
  }
}
