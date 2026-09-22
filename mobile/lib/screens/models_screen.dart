import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';

import '../services/api_service.dart';

class ModelsScreen extends StatefulWidget {
  const ModelsScreen({super.key});

  @override
  State<ModelsScreen> createState() => _ModelsScreenState();
}

class _ModelsScreenState extends State<ModelsScreen> {
  List<dynamic> _models = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = context.read<ApiService>();
      _models = await api.getModels();
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Text('Models', style: Theme.of(context).textTheme.headlineMedium),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return _buildShimmer();
    if (_error != null) return _buildError();
    if (_models.isEmpty) return _buildEmpty();

    return RefreshIndicator(
      color: const Color(0xFF6366F1),
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _models.length,
        itemBuilder: (context, i) => _buildModelCard(Map<String, dynamic>.from(_models[i])),
      ),
    );
  }

  Widget _buildModelCard(Map<String, dynamic> model) {
    final name = model['name'] ?? '';
    final arch = model['arch'] ?? '';
    final map50 = (model['map50'] as num?)?.toDouble();
    final precision = (model['precision'] as num?)?.toDouble();
    final recall = (model['recall'] as num?)?.toDouble();
    final f1 = (model['f1'] as num?)?.toDouble();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.model_training, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                      const SizedBox(height: 2),
                      Text(arch, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                if (map50 != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _scoreColor(map50).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('${(map50 * 100).toStringAsFixed(1)}%',
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: _scoreColor(map50))),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Metrics row
            Row(
              children: [
                if (precision != null) Expanded(child: _metricTile('Precision', precision)),
                if (recall != null) Expanded(child: _metricTile('Recall', recall)),
                if (f1 != null) Expanded(child: _metricTile('F1 Score', f1)),
              ],
            ),

            // mAP50 bar
            if (map50 != null) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Text('mAP@50', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  const Spacer(),
                  Text('${(map50 * 100).toStringAsFixed(1)}%', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFCBD5E1))),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: map50,
                  minHeight: 6,
                  backgroundColor: Colors.white.withValues(alpha: 0.06),
                  valueColor: AlwaysStoppedAnimation(_scoreColor(map50)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _metricTile(String label, double value) {
    return Column(
      children: [
        Text('${(value * 100).toStringAsFixed(1)}%',
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
      ],
    );
  }

  Color _scoreColor(double v) {
    if (v >= 0.9) return const Color(0xFF10B981);
    if (v >= 0.8) return const Color(0xFF6366F1);
    if (v >= 0.6) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: const Color(0xFF1A2236),
      highlightColor: const Color(0xFF2A3350),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          height: 140,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.cloud_off, size: 48, color: Colors.white.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          Text('Failed to load models', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
          const SizedBox(height: 16),
          TextButton.icon(onPressed: _load, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.layers_clear_outlined, size: 48, color: Colors.white.withValues(alpha: 0.2)),
          const SizedBox(height: 12),
          Text('No models registered', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}
