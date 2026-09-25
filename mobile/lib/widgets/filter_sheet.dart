import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';

class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const FilterSheet(),
    );
  }

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  late String _timeframe;
  String? _batch;
  String? _defectType;
  String? _station;
  InspectionStatus? _status;

  final List<String> _batches = ['All', 'BATCH-2026-A1', 'BATCH-2026-B2', 'BATCH-2026-C3'];
  final List<String> _defectTypes = ['All', 'open', 'short', 'mousebite', 'spur', 'copper', 'pinhole'];
  final List<String> _stations = ['All', 'STATION-01', 'STATION-02', 'STATION-03'];

  @override
  void initState() {
    super.initState();
    final service = context.read<SupabaseService>();
    _timeframe = service.filterTimeframe;
    _batch = service.filterBatch ?? 'All';
    _defectType = service.filterDefectType ?? 'All';
    _station = service.filterStation ?? 'All';
    _status = service.filterStatus;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bgSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderStrong,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'FILTER INSPECTIONS & ANALYTICS',
                style: AppTypography.heading3.copyWith(
                  letterSpacing: 0.5,
                  fontSize: 13,
                  color: AppColors.industrial900,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _timeframe = '30d';
                    _batch = 'All';
                    _defectType = 'All';
                    _station = 'All';
                    _status = null;
                  });
                },
                child: Text(
                  'Reset',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.industrial600,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 16),

          // 1. Date Range
          Text('TIMEFRAME', style: AppTypography.label),
          const SizedBox(height: 8),
          Row(
            children: [
              _timeChip('Today', 'today'),
              const SizedBox(width: 8),
              _timeChip('7 Days', '7d'),
              const SizedBox(width: 8),
              _timeChip('30 Days', '30d'),
              const SizedBox(width: 8),
              _timeChip('All Time', 'all'),
            ],
          ),
          const SizedBox(height: 16),

          // 2. Inspection Station
          Text('INSPECTION STATION', style: AppTypography.label),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: _stations.map((st) {
              final isSel = _station == st;
              return ChoiceChip(
                label: Text(st),
                selected: isSel,
                onSelected: (val) => setState(() => _station = st),
                selectedColor: AppColors.industrial100,
                labelStyle: AppTypography.mono.copyWith(
                  fontSize: 11,
                  color: isSel ? AppColors.industrial800 : AppColors.textSecondary,
                  fontWeight: isSel ? FontWeight.w600 : FontWeight.w400,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // 3. PCB Batch
          Text('PCB BATCH', style: AppTypography.label),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: _batches.map((b) {
              final isSel = _batch == b;
              return ChoiceChip(
                label: Text(b),
                selected: isSel,
                onSelected: (val) => setState(() => _batch = b),
                selectedColor: AppColors.industrial100,
                labelStyle: AppTypography.mono.copyWith(
                  fontSize: 11,
                  color: isSel ? AppColors.industrial800 : AppColors.textSecondary,
                  fontWeight: isSel ? FontWeight.w600 : FontWeight.w400,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // 4. Defect Type
          Text('DEFECT TYPE', style: AppTypography.label),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _defectTypes.map((dt) {
              final isSel = _defectType == dt;
              return ChoiceChip(
                label: Text(dt.toUpperCase()),
                selected: isSel,
                onSelected: (val) => setState(() => _defectType = dt),
                selectedColor: AppColors.industrial100,
                labelStyle: AppTypography.mono.copyWith(
                  fontSize: 10,
                  color: isSel ? AppColors.industrial800 : AppColors.textSecondary,
                  fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                context.read<SupabaseService>().setFilters(
                  timeframe: _timeframe,
                  batch: _batch,
                  defectType: _defectType,
                  station: _station,
                  status: _status,
                );
                Navigator.pop(context);
              },
              child: const Text('Apply Filters'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _timeChip(String label, String value) {
    final isSel = _timeframe == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _timeframe = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSel ? AppColors.industrial600 : AppColors.bgMuted,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSel ? AppColors.industrial700 : AppColors.borderSubtle,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTypography.mono.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isSel ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
