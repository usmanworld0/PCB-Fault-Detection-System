import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:shimmer/shimmer.dart';

import '../services/api_service.dart';
import '../widgets/stat_card.dart';
import '../widgets/section_header.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<ApiService>();
      final data = await api.getStats();
      if (mounted) setState(() { _stats = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        color: const Color(0xFF6366F1),
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _buildHeader()),
            if (_loading) SliverToBoxAdapter(child: _buildShimmer()),
            if (_error != null) SliverToBoxAdapter(child: _buildError()),
            if (_stats != null) ...[
              SliverToBoxAdapter(child: _buildStatCards()),
              SliverToBoxAdapter(child: const SectionHeader(title: 'Defects by Class')),
              SliverToBoxAdapter(child: _buildDefectsByClass()),
              SliverToBoxAdapter(child: const SectionHeader(title: 'Severity Breakdown')),
              SliverToBoxAdapter(child: _buildSeverityChart()),
              SliverToBoxAdapter(child: const SectionHeader(title: '30-Day Trend')),
              SliverToBoxAdapter(child: _buildTrendChart()),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.memory, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 12),
          Text('Dashboard', style: Theme.of(context).textTheme.headlineMedium),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Shimmer.fromColors(
        baseColor: const Color(0xFF1A2236),
        highlightColor: const Color(0xFF2A3350),
        child: Column(
          children: List.generate(3, (_) => Container(
            height: 80,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          )),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Icon(Icons.cloud_off, size: 48, color: Colors.white.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          Text('Could not load dashboard', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 15)),
          const SizedBox(height: 6),
          Text(_error!, style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontSize: 13), textAlign: TextAlign.center),
          const SizedBox(height: 16),
          TextButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCards() {
    final total = _stats!['total_inspections'] ?? 0;
    final pass = _stats!['pass_count'] ?? 0;
    final fail = _stats!['fail_count'] ?? 0;
    final defects = _stats!['total_defects'] ?? 0;
    final passRate = total > 0 ? (pass / total * 100) : 0.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: StatCard(
                label: 'Total Inspections',
                value: total.toString(),
                icon: Icons.assignment_outlined,
                color: const Color(0xFF6366F1),
              )),
              const SizedBox(width: 12),
              Expanded(child: StatCard(
                label: 'Pass Rate',
                value: '${passRate.toStringAsFixed(1)}%',
                icon: Icons.check_circle_outline,
                color: const Color(0xFF10B981),
              )),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: StatCard(
                label: 'Failed',
                value: fail.toString(),
                icon: Icons.cancel_outlined,
                color: const Color(0xFFEF4444),
              )),
              const SizedBox(width: 12),
              Expanded(child: StatCard(
                label: 'Total Defects',
                value: defects.toString(),
                icon: Icons.bug_report_outlined,
                color: const Color(0xFFF59E0B),
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDefectsByClass() {
    final byClass = Map<String, dynamic>.from(_stats!['defects_by_class'] ?? {});
    if (byClass.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Text('No defect data yet', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
      );
    }
    final colors = [
      const Color(0xFFEF4444), const Color(0xFFF59E0B), const Color(0xFF6366F1),
      const Color(0xFF10B981), const Color(0xFF06B6D4), const Color(0xFFA855F7),
    ];
    final entries = byClass.entries.toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: List.generate(entries.length, (i) {
              final e = entries[i];
              final maxVal = entries.map((x) => (x.value as num).toDouble()).reduce((a, b) => a > b ? a : b);
              final fraction = maxVal > 0 ? (e.value as num).toDouble() / maxVal : 0.0;
              return Padding(
                padding: EdgeInsets.only(bottom: i < entries.length - 1 ? 12 : 0),
                child: Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(e.key, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFCBD5E1))),
                    ),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: fraction,
                          minHeight: 8,
                          backgroundColor: Colors.white.withValues(alpha: 0.06),
                          valueColor: AlwaysStoppedAnimation(colors[i % colors.length]),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      width: 32,
                      child: Text('${e.value}', textAlign: TextAlign.right,
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  Widget _buildSeverityChart() {
    final bySeverity = Map<String, dynamic>.from(_stats!['defects_by_severity'] ?? {});
    if (bySeverity.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Text('No severity data yet', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
      );
    }

    final severityColors = {
      'Critical': const Color(0xFFEF4444),
      'Moderate': const Color(0xFFF59E0B),
      'Minor': const Color(0xFF10B981),
    };

    final sections = bySeverity.entries.map((e) {
      final color = severityColors[e.key] ?? const Color(0xFF6366F1);
      return PieChartSectionData(
        value: (e.value as num).toDouble(),
        color: color,
        radius: 28,
        title: '',
      );
    }).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              SizedBox(
                width: 80,
                height: 80,
                child: PieChart(PieChartData(
                  sections: sections,
                  sectionsSpace: 2,
                  centerSpaceRadius: 18,
                  startDegreeOffset: -90,
                )),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: bySeverity.entries.map((e) {
                    final color = severityColors[e.key] ?? const Color(0xFF6366F1);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                          const SizedBox(width: 8),
                          Text(e.key, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFCBD5E1))),
                          const Spacer(),
                          Text('${e.value}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white)),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrendChart() {
    final trend = List<Map<String, dynamic>>.from(
        (_stats!['trend_last_30_days'] as List?)?.map((e) => Map<String, dynamic>.from(e)) ?? []);
    if (trend.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Text('No trend data', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
      );
    }

    final inspectionSpots = trend.asMap().entries.map((e) =>
        FlSpot(e.key.toDouble(), (e.value['inspections'] as num?)?.toDouble() ?? 0)).toList();
    final defectSpots = trend.asMap().entries.map((e) =>
        FlSpot(e.key.toDouble(), (e.value['defects'] as num?)?.toDouble() ?? 0)).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
          child: SizedBox(
            height: 180,
            child: LineChart(LineChartData(
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => FlLine(color: Colors.white.withValues(alpha: 0.05), strokeWidth: 1),
              ),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 32,
                  getTitlesWidget: (v, _) => Text(v.toInt().toString(),
                      style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B))),
                )),
                bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                LineChartBarData(
                  spots: inspectionSpots,
                  isCurved: true,
                  color: const Color(0xFF6366F1),
                  barWidth: 2.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [const Color(0xFF6366F1).withValues(alpha: 0.2), const Color(0xFF6366F1).withValues(alpha: 0.0)],
                    ),
                  ),
                ),
                LineChartBarData(
                  spots: defectSpots,
                  isCurved: true,
                  color: const Color(0xFFEF4444),
                  barWidth: 2.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [const Color(0xFFEF4444).withValues(alpha: 0.15), const Color(0xFFEF4444).withValues(alpha: 0.0)],
                    ),
                  ),
                ),
              ],
              lineTouchData: const LineTouchData(enabled: false),
            )),
          ),
        ),
      ),
    );
  }
}
