import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/supabase_service.dart';
import '../services/auth_provider.dart';
import '../theme/app_theme.dart';
import '../models/models.dart';

class ModelsScreen extends StatelessWidget {
  const ModelsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final service = context.watch<SupabaseService>();
    final auth = context.watch<AuthProvider>();
    final metrics = service.stats?.modelMetrics;

    final modelsList = [
      {
        'name': 'YOLOv8s-PCB-v2.4',
        'arch': 'YOLOv8 Small (Ultralytics)',
        'isActive': true,
        'dataset': 'PCB-Defect-Industrial-v2 (24,800 images)',
        'map50': 0.942,
        'map50_95': 0.786,
        'precision': 0.958,
        'recall': 0.931,
        'f1': 0.944,
        'latency': 14.8,
        'classes': 'open, short, mousebite, spur, copper, pinhole',
      },
      {
        'name': 'YOLOv8n-PCB-Edge',
        'arch': 'YOLOv8 Nano (Quantized INT8)',
        'isActive': false,
        'dataset': 'PCB-Defect-Industrial-v2',
        'map50': 0.898,
        'map50_95': 0.712,
        'precision': 0.912,
        'recall': 0.884,
        'f1': 0.898,
        'latency': 6.2,
        'classes': 'open, short, mousebite, spur, copper, pinhole',
      },
      {
        'name': 'Faster-RCNN-ResNet50',
        'arch': 'Faster R-CNN with FPN',
        'isActive': false,
        'dataset': 'DeepPCB Benchmark',
        'map50': 0.914,
        'map50_95': 0.741,
        'precision': 0.925,
        'recall': 0.902,
        'f1': 0.913,
        'latency': 48.5,
        'classes': 'open, short, mousebite, spur, copper, pinhole',
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.bgApp,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Active Model Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.industrial900,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.industrial700,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'ACTIVE INFERENCE ENGINE',
                          style: AppTypography.mono.copyWith(
                            color: AppColors.industrial200,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.qaPassBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${metrics?.inferenceLatencyMs ?? 14.8} ms INFERENCE',
                          style: AppTypography.mono.copyWith(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: AppColors.qaPass,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    metrics?.activeModel ?? 'YOLOv8s-PCB-v2.4',
                    style: AppTypography.heading1.copyWith(color: Colors.white, fontSize: 18),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Single-stage defect detection optimized for IPC Class 3 PCB assemblies.',
                    style: AppTypography.bodySmall.copyWith(color: AppColors.industrial200),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _metricBadge('mAP@0.5', '${((metrics?.map50 ?? 0.942) * 100).toStringAsFixed(1)}%'),
                      const SizedBox(width: 8),
                      _metricBadge('Precision', '${((metrics?.precision ?? 0.958) * 100).toStringAsFixed(1)}%'),
                      const SizedBox(width: 8),
                      _metricBadge('Recall', '${((metrics?.recall ?? 0.931) * 100).toStringAsFixed(1)}%'),
                      const SizedBox(width: 8),
                      _metricBadge('F1-Score', '${((metrics?.f1Score ?? 0.944) * 100).toStringAsFixed(1)}%'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            Text('REGISTERED MODEL REGISTRY', style: AppTypography.label),
            const SizedBox(height: 8),

            ...modelsList.map((m) {
              final isCurrent = m['isActive'] == true;
              final mapVal = m['map50'] as double;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.bgSurface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isCurrent ? AppColors.industrial500 : AppColors.borderSubtle,
                    width: isCurrent ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(m['name'] as String, style: AppTypography.heading3),
                        if (isCurrent)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.qaPassBg,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'DEPLOYED',
                              style: AppTypography.mono.copyWith(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppColors.qaPass,
                              ),
                            ),
                          )
                        else if (auth.role == UserRole.admin)
                          OutlinedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Switched active model to ${m['name']}')),
                              );
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              minimumSize: const Size(0, 28),
                            ),
                            child: const Text('Deploy'),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(m['arch'] as String, style: AppTypography.bodySmall),
                    const SizedBox(height: 10),

                    // Metrics
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _smallMetric('mAP@50', '${(mapVal * 100).toStringAsFixed(1)}%'),
                        _smallMetric('Precision', '${((m['precision'] as double) * 100).toStringAsFixed(1)}%'),
                        _smallMetric('Recall', '${((m['recall'] as double) * 100).toStringAsFixed(1)}%'),
                        _smallMetric('Latency', '${m['latency']} ms'),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(3),
                      child: LinearProgressIndicator(
                        value: mapVal,
                        backgroundColor: AppColors.bgMuted,
                        color: AppColors.industrial600,
                        minHeight: 5,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _metricBadge(String label, String val) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.industrial800,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Column(
          children: [
            Text(label, style: AppTypography.bodySmall.copyWith(fontSize: 9, color: AppColors.industrial200)),
            const SizedBox(height: 1),
            Text(val, style: AppTypography.mono.copyWith(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _smallMetric(String label, String val) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.bodySmall.copyWith(fontSize: 9)),
        Text(val, style: AppTypography.mono.copyWith(fontSize: 11, fontWeight: FontWeight.w700)),
      ],
    );
  }
}
