import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final analytics = service.analytics;
    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: RefreshIndicator(
        color: AppColors.industrial600,
        onRefresh: service.fetchStats,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Live production summary',
                    style: AppTypography.heading2.copyWith(fontSize: 18),
                  ),
                ),
                IconButton(
                  tooltip: 'Refresh analytics',
                  onPressed: service.fetchStats,
                  icon: const Icon(Icons.refresh),
                ),
              ],
            ),
            if (analytics == null && service.analyticsError == null)
              const Padding(
                padding: EdgeInsets.only(top: 100),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (analytics == null)
              _errorState(service.analyticsError!, service.fetchStats)
            else ...[
              if (analytics.totalInspections == 0)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.industrial50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.industrial200),
                  ),
                  child: const Text(
                    'No inspection data yet. Analytics will appear when inspections are added.',
                  ),
                ),
              GridView.count(
                crossAxisCount: MediaQuery.sizeOf(context).width >= 720 ? 3 : 2,
                childAspectRatio: 1.8,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _metric(
                    'Inspections',
                    analytics.totalInspections,
                    Icons.biotech_outlined,
                    AppColors.industrial600,
                  ),
                  _metric(
                    'PASS',
                    analytics.passCount,
                    Icons.check_circle_outline,
                    AppColors.qaPass,
                  ),
                  _metric(
                    'FAIL',
                    analytics.failCount,
                    Icons.error_outline,
                    AppColors.qaFail,
                  ),
                  _metric(
                    'Defects',
                    analytics.totalDefects,
                    Icons.warning_amber_rounded,
                    AppColors.qaWarning,
                  ),
                  _metric(
                    'PCB IDs',
                    analytics.distinctPcbCount,
                    Icons.memory_outlined,
                    AppColors.industrial600,
                  ),
                  _metric(
                    'Inspections · 30 days',
                    analytics.inspectionsLast30Days,
                    Icons.calendar_month_outlined,
                    AppColors.industrial600,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _passFailCard(analytics),
              const SizedBox(height: 14),
              _chartCard(
                title: 'Defects by class',
                subtitle: 'Counts from the defects table',
                child: _classChart(analytics.defectsByClass),
              ),
              const SizedBox(height: 14),
              _severityCard(analytics.defectsBySeverity),
              const SizedBox(height: 14),
              _chartCard(
                title: 'Last 30 days',
                subtitle: 'Daily inspection and defect counts',
                child: _trendChart(analytics.trend),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _metric(String label, int value, IconData icon, Color color) =>
      Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: AppColors.bgSurface,
          border: Border.all(color: AppColors.borderSubtle),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.textPrimary.withValues(alpha: 0.035),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    value.toString(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.heading2.copyWith(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    label,
                    maxLines: 1,
                    style: AppTypography.bodySmallReadable,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _passFailCard(AnalyticsSnapshot data) {
    final total = data.passCount + data.failCount;
    final passRatio = total == 0 ? 0.0 : data.passCount / total;
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PASS / FAIL RATIO',
            style: AppTypography.label.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: SizedBox(
              height: 12,
              child: Row(
                children: [
                  if (passRatio > 0)
                    Expanded(
                      flex: (passRatio * 1000).round(),
                      child: const ColoredBox(color: AppColors.qaPass),
                    ),
                  if (passRatio < 1)
                    Expanded(
                      flex: ((1 - passRatio) * 1000)
                          .round()
                          .clamp(1, 1000)
                          .toInt(),
                      child: const ColoredBox(color: AppColors.qaFail),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 9),
          Text(
            total == 0
                ? 'No inspections recorded'
                : '${(passRatio * 100).toStringAsFixed(1)}% pass  •  ${(100 - passRatio * 100).toStringAsFixed(1)}% fail',
            style: AppTypography.bodySmallReadable,
          ),
        ],
      ),
    );
  }

  Widget _classChart(Map<String, int> values) {
    final entries = values.entries.where((e) => e.value > 0).toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    if (entries.isEmpty) {
      return const _EmptyChart(message: 'No defects recorded.');
    }
    final largest = entries
        .map((e) => e.value)
        .fold<int>(1, (a, b) => a > b ? a : b);
    final maxY = largest.toDouble() * 1.2;
    return SizedBox(
      height: math.max(190, entries.length * 38).toDouble(),
      child: BarChart(
        BarChartData(
          maxY: maxY,
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (_) => AppColors.textPrimary,
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                final name = entries[groupIndex].key;
                return BarTooltipItem(
                  '$name\n${rod.toY.toInt()} defects',
                  AppTypography.bodySmallReadable.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                );
              },
            ),
          ),
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            leftTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= entries.length) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      entries[index].key,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmallReadable.copyWith(
                        fontSize: 9,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          barGroups: entries
              .asMap()
              .entries
              .map(
                (entry) => BarChartGroupData(
                  x: entry.key,
                  barRods: [
                    BarChartRodData(
                      toY: entry.value.value.toDouble(),
                      color: AppColors.qaWarning,
                      width: 20,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ],
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  Widget _severityCard(Map<String, int> counts) {
    const levels = [
      ('Critical', AppColors.qaFail),
      ('Moderate', AppColors.qaWarning),
      ('Minor', AppColors.qaPass),
    ];
    return _panel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Defects by severity',
            style: AppTypography.heading3.copyWith(fontSize: 14),
          ),
          const SizedBox(height: 12),
          Row(
            children: levels
                .map(
                  (level) => Expanded(
                    child: Container(
                      margin: const EdgeInsets.only(right: 7),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: level.$2.withValues(alpha: 0.09),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (counts[level.$1] ?? 0).toString(),
                            style: AppTypography.heading2.copyWith(
                              color: level.$2,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            level.$1,
                            style: AppTypography.bodySmallReadable.copyWith(
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _trendChart(List<AnalyticsTrendPoint> points) {
    if (points.isEmpty) {
      return const _EmptyChart(message: 'No trend data available.');
    }
    if (points.every((point) => point.inspections == 0)) {
      return const _EmptyChart(
        message: 'No inspections recorded in the last 30 days.',
      );
    }
    final maxY =
        math
            .max(
              1,
              points
                  .map((p) => math.max(p.inspections, p.defects))
                  .reduce(math.max),
            )
            .toDouble() *
        1.2;
    return Column(
      children: [
        Wrap(
          spacing: 18,
          runSpacing: 6,
          children: [
            _legendItem('Inspections', AppColors.textSecondary),
            _legendItem('Defects', AppColors.qaWarning),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 205,
          child: BarChart(
            BarChartData(
              maxY: maxY,
              groupsSpace: 5,
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipColor: (_) => AppColors.textPrimary,
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    final label = rodIndex == 0 ? 'Inspections' : 'Defects';
                    return BarTooltipItem(
                      '$label: ${rod.toY.toInt()}',
                      AppTypography.bodySmallReadable.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    );
                  },
                ),
              ),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => const FlLine(
                  color: AppColors.borderSubtle,
                  strokeWidth: 0.7,
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                leftTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: true, reservedSize: 28),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 ||
                          index >= points.length ||
                          index % 5 != 0) {
                        return const SizedBox.shrink();
                      }
                      final date = points[index].date;
                      return Padding(
                        padding: const EdgeInsets.only(top: 5),
                        child: Text(
                          '${date.month}/${date.day}',
                          style: AppTypography.bodySmallReadable.copyWith(
                            fontSize: 8,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              barGroups: points
                  .asMap()
                  .entries
                  .map(
                    (entry) => BarChartGroupData(
                      x: entry.key,
                      barRods: [
                        BarChartRodData(
                          toY: entry.value.inspections.toDouble(),
                          color: AppColors.textSecondary,
                          width: 5,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        BarChartRodData(
                          toY: entry.value.defects.toDouble(),
                          color: AppColors.qaWarning,
                          width: 5,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ],
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _legendItem(String label, Color color) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 9,
        height: 9,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 6),
      Text(label, style: AppTypography.bodySmallReadable),
    ],
  );

  Widget _chartCard({
    required String title,
    required String subtitle,
    required Widget child,
  }) => _panel(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTypography.heading3.copyWith(fontSize: 14)),
        const SizedBox(height: 3),
        Text(subtitle, style: AppTypography.bodySmallReadable),
        const SizedBox(height: 12),
        child,
      ],
    ),
  );

  Widget _panel({required Widget child}) => Container(
    padding: const EdgeInsets.all(14),
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
    child: child,
  );

  Widget _errorState(String message, Future<void> Function() retry) => Padding(
    padding: const EdgeInsets.only(top: 70),
    child: Column(
      children: [
        const Icon(
          Icons.cloud_off_outlined,
          size: 42,
          color: AppColors.qaWarning,
        ),
        const SizedBox(height: 12),
        Text('Could not load live analytics', style: AppTypography.heading3),
        const SizedBox(height: 6),
        const Text(
          'Could not read analytics from Supabase. Check your sign-in and data access, then retry.',
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        SelectableText(
          message,
          textAlign: TextAlign.center,
          style: AppTypography.bodySmallReadable,
        ),
        TextButton(onPressed: retry, child: const Text('Retry')),
      ],
    ),
  );
}

class _EmptyChart extends StatelessWidget {
  final String message;
  const _EmptyChart({required this.message});
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 110,
    child: Center(child: Text(message, style: AppTypography.bodySmallReadable)),
  );
}
