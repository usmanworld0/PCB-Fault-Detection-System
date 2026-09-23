import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import 'package:intl/intl.dart';

import '../services/api_service.dart';
import 'inspection_detail_screen.dart';

class InspectionsScreen extends StatefulWidget {
  const InspectionsScreen({super.key});

  @override
  State<InspectionsScreen> createState() => _InspectionsScreenState();
}

class _InspectionsScreenState extends State<InspectionsScreen> {
  List<dynamic> _items = [];
  int _total = 0;
  bool _loading = true;
  String? _error;
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = context.read<ApiService>();
      final data = await api.getInspections(status: _statusFilter);
      if (mounted) {
        setState(() {
          _items = data['items'] ?? [];
          _total = data['total'] ?? 0;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          _buildHeader(),
          _buildFilters(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Text('Inspections', style: Theme.of(context).textTheme.headlineMedium),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('$_total total', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF818CF8))),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
      child: Row(
        children: [
          _filterChip('All', null),
          const SizedBox(width: 8),
          _filterChip('Pass', 'PASS'),
          const SizedBox(width: 8),
          _filterChip('Fail', 'FAIL'),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String? value) {
    final selected = _statusFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() => _statusFilter = value);
        _load();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF6366F1) : const Color(0xFF1A2236),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? const Color(0xFF6366F1) : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Text(label, style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: selected ? Colors.white : const Color(0xFF94A3B8),
        )),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return _buildShimmer();
    if (_error != null) return _buildError();
    if (_items.isEmpty) return _buildEmpty();

    return RefreshIndicator(
      color: const Color(0xFF6366F1),
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _items.length,
        itemBuilder: (context, i) => _buildItem(_items[i]),
      ),
    );
  }

  Widget _buildItem(Map<String, dynamic> item) {
    final status = item['status'] ?? 'PASS';
    final isFail = status == 'FAIL';
    final model = item['model'] ?? '';
    final defects = item['defect_count'] ?? 0;
    final capturedAt = item['captured_at'] ?? '';

    String formattedDate = '';
    try {
      formattedDate = DateFormat('MMM d, yyyy · HH:mm').format(DateTime.parse(capturedAt));
    } catch (_) {
      formattedDate = capturedAt;
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => InspectionDetailScreen(id: item['id']),
        ));
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 10),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Status indicator
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: (isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isFail ? Icons.cancel_outlined : Icons.check_circle_outline,
                  color: isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: (isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981)).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(status, style: GoogleFonts.inter(
                            fontSize: 11, fontWeight: FontWeight.w700,
                            color: isFail ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                          )),
                        ),
                        const SizedBox(width: 8),
                        if (defects > 0)
                          Text('$defects defect${defects > 1 ? 's' : ''}',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFF59E0B), fontWeight: FontWeight.w500)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(model, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white)),
                    const SizedBox(height: 2),
                    Text(formattedDate, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFF475569), size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: const Color(0xFF1A2236),
      highlightColor: const Color(0xFF2A3350),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: 6,
        itemBuilder: (_, __) => Container(
          height: 84,
          margin: const EdgeInsets.only(bottom: 10),
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
          Text('Failed to load inspections', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
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
          Icon(Icons.inbox_outlined, size: 48, color: Colors.white.withValues(alpha: 0.2)),
          const SizedBox(height: 12),
          Text('No inspections found', style: GoogleFonts.inter(color: const Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}
