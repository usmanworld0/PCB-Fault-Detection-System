import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../services/api_service.dart';

class InspectionDetailScreen extends StatefulWidget {
  final String id;
  const InspectionDetailScreen({super.key, required this.id});

  @override
  State<InspectionDetailScreen> createState() => _InspectionDetailScreenState();
}

class _InspectionDetailScreenState extends State<InspectionDetailScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;
  bool _showAnnotated = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = context.read<ApiService>();
      final data = await api.getInspectionDetail(widget.id);
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inspection Detail'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading ? _buildShimmer() : _error != null ? _buildError() : _buildContent(),
    );
  }

  Widget _buildContent() {
    final d = _data!;
    final status = d['status'] ?? 'PASS';
    final isFail = status == 'FAIL';
    final model = d['model'] ?? '';
    final source = d['source'] ?? '';
    final defects = List<Map<String, dynamic>>.from(
        (d['defects'] as List?)?.map((e) => Map<String, dynamic>.from(e)) ?? []);

    String formattedDate = '';
    try {
      formattedDate = DateFormat('MMMM d, yyyy · HH:mm:ss').format(DateTime.parse(d['captured_at']));
    } catch (_) {}

    final imageUrl = _showAnnotated ? (d['annotated_url'] ?? '') : (d['image_url'] ?? '');

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image viewer
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: const Color(0xFF1A2236),
                      child: const Center(child: CircularProgressIndicator(strokeWidth: 2))),
                    errorWidget: (_, __, ___) => Container(color: const Color(0xFF1A2236),
                      child: const Center(child: Icon(Icons.broken_image, color: Color(0xFF475569), size: 40))),
                  ),
                ),
                // Toggle button
                Positioned(
                  top: 10,
                  right: 10,
                  child: GestureDetector(
                    onTap: () => setState(() => _showAnnotated = !_showAnnotated),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_showAnnotated ? Icons.visibility : Icons.visibility_off,
                              color: Colors.white, size: 16),
                          const SizedBox(width: 6),
                          Text(_showAnnotated ? 'Annotated' : 'Original',
                              style: GoogleFonts.inter(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Status row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: (isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: (isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withValues(alpha: 0.3)),
                ),
                child: Text(status, style: GoogleFonts.inter(
                  fontSize: 14, fontWeight: FontWeight.w700,
                  color: isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                )),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(model, style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF818CF8),
                )),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Metadata
          _metaRow(Icons.image_outlined, 'Source', source),
          _metaRow(Icons.access_time, 'Captured', formattedDate),
          _metaRow(Icons.bug_report_outlined, 'Defects', '${defects.length}'),

          const SizedBox(height: 24),

          // Defects table
          if (defects.isNotEmpty) ...[
            Text('Detected Defects', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
            const SizedBox(height: 12),
            ...defects.map((def) => _buildDefectCard(def)),
          ],
        ],
      ),
    );
  }

  Widget _metaRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF64748B)),
          const SizedBox(width: 8),
          Text('$label: ', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
          Expanded(child: Text(value, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFCBD5E1)))),
        ],
      ),
    );
  }

  Widget _buildDefectCard(Map<String, dynamic> def) {
    final className = def['class'] ?? def['class_name'] ?? 'unknown';
    final confidence = (def['confidence'] as num?)?.toDouble() ?? 0;
    final severity = def['severity'] ?? 'Minor';

    final severityColors = {
      'Critical': const Color(0xFFEF4444),
      'Moderate': const Color(0xFFF59E0B),
      'Minor': const Color(0xFF10B981),
    };
    final color = severityColors[severity] ?? const Color(0xFF6366F1);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 40,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(className, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text('${(confidence * 100).toStringAsFixed(1)}%',
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(severity, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
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

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: const Color(0xFF1A2236),
      highlightColor: const Color(0xFF2A3350),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(height: 240, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16))),
            const SizedBox(height: 20),
            Container(height: 40, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
            const SizedBox(height: 12),
            Container(height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.white.withValues(alpha: 0.3)),
          const SizedBox(height: 12),
          Text('Failed to load inspection', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
          const SizedBox(height: 16),
          TextButton.icon(onPressed: _load, icon: const Icon(Icons.refresh, size: 18), label: const Text('Retry')),
        ],
      ),
    );
  }
}
