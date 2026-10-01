import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';

class ModelsScreen extends StatefulWidget {
  const ModelsScreen({super.key});

  @override
  State<ModelsScreen> createState() => _ModelsScreenState();
}

class _ModelsScreenState extends State<ModelsScreen> {
  late Future<List<ModelSummary>> _models;

  @override
  void initState() {
    super.initState();
    _models = context.read<SupabaseService>().fetchModels();
  }

  Future<void> _refresh() async {
    final next = context.read<SupabaseService>().fetchModels();
    setState(() => _models = next);
    await next;
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.bgApp,
    body: FutureBuilder<List<ModelSummary>>(
      future: _models,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _state(
            Icons.cloud_off_outlined,
            'Could not load models',
            '${snapshot.error}',
          );
        }
        final models = snapshot.data ?? const <ModelSummary>[];
        if (models.isEmpty) {
          return _state(
            Icons.memory_outlined,
            'No models available',
            'Model performance data will appear here when it is available.',
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            itemCount: models.length + 1,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) => index == 0
                ? _intro(models.length)
                : _modelCard(models[index - 1]),
          ),
        );
      },
    ),
  );

  Widget _intro(int count) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Row(
      children: [
        const Icon(Icons.memory_outlined, color: AppColors.industrial700),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Model performance', style: AppTypography.heading2),
              Text(
                '$count registered models',
                style: AppTypography.bodySmallReadable,
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Refresh models',
          onPressed: _refresh,
          icon: const Icon(Icons.refresh),
        ),
      ],
    ),
  );

  Widget _modelCard(ModelSummary model) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.bgSurface,
      borderRadius: BorderRadius.circular(15),
      border: Border.all(color: AppColors.borderSubtle),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.02),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                model.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.heading2.copyWith(fontSize: 16),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.insights_outlined, color: AppColors.industrial700),
          ],
        ),
        if (model.architecture?.trim().isNotEmpty == true) ...[
          const SizedBox(height: 5),
          Text(
            model.architecture!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.bodySmallReadable.copyWith(
              color: AppColors.industrial800,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final columnCount = constraints.maxWidth >= 520 ? 3 : 2;
            final metricWidth =
                (constraints.maxWidth - (columnCount - 1) * 12) / columnCount;
            return Wrap(
              spacing: 12,
              runSpacing: 16,
              children: [
                _metric(
                  'mAP50',
                  model.map50,
                  metricWidth,
                  color: AppColors.industrial800,
                ),
                _metric(
                  'mAP50–95',
                  model.map50_95,
                  metricWidth,
                  color: AppColors.industrial800,
                ),
                _metric('Precision', model.precision, metricWidth),
                _metric('Recall', model.recall, metricWidth),
                _metric('F1', model.f1, metricWidth),
                _metric(
                  'Inference time',
                  model.inferenceTimeMs,
                  metricWidth,
                  suffix: ' ms',
                  percent: false,
                ),
              ],
            );
          },
        ),
      ],
    ),
  );

  Widget _metric(
    String label,
    double? value,
    double width, {
    String suffix = '%',
    bool percent = true,
    Color color = AppColors.textPrimary,
  }) => SizedBox(
    width: width,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.bodySmallReadable.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value == null
              ? '—'
              : '${percent ? (value * 100).toStringAsFixed(1) : value.toStringAsFixed(1)}$suffix',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTypography.heading2.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    ),
  );

  Widget _state(IconData icon, String title, String message) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 42, color: AppColors.textMuted),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: AppTypography.heading3,
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppTypography.bodySmallReadable,
          ),
        ],
      ),
    ),
  );
}
