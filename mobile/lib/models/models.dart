/// User roles in the enterprise inspection system
enum UserRole {
  admin,
  engineer, // Quality Engineer
  viewer,
}

extension UserRoleExt on UserRole {
  String get value {
    switch (this) {
      case UserRole.admin:
        return 'admin';
      case UserRole.engineer:
        return 'engineer';
      case UserRole.viewer:
        return 'viewer';
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'System Admin';
      case UserRole.engineer:
        return 'Quality Engineer';
      case UserRole.viewer:
        return 'Auditor / Viewer';
    }
  }

  bool get canReview => this == UserRole.admin || this == UserRole.engineer;
  bool get canManageSystem => this == UserRole.admin;
  bool get isReadOnly => this == UserRole.viewer;

  static UserRole fromString(String? role) {
    switch (role?.toLowerCase()) {
      case 'admin':
        return UserRole.admin;
      case 'engineer':
      case 'quality engineer':
      case 'qa':
        return UserRole.engineer;
      default:
        return UserRole.viewer;
    }
  }
}

/// User profile
class UserProfile {
  final String id;
  final String email;
  final UserRole role;
  final String name;
  final String? avatarUrl;
  final DateTime? sessionExpiresAt;

  UserProfile({
    required this.id,
    required this.email,
    required this.role,
    required this.name,
    this.avatarUrl,
    this.sessionExpiresAt,
  });

  bool get isSessionExpired =>
      sessionExpiresAt != null && DateTime.now().isAfter(sessionExpiresAt!);

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role.value,
        'name': name,
        'avatar_url': avatarUrl,
        'session_expires_at': sessionExpiresAt?.toIso8601String(),
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? 'user-default',
      email: json['email'] ?? 'operator@pcb-vision.ai',
      role: UserRoleExt.fromString(json['role']),
      name: json['name'] ?? (json['email'] != null ? json['email'].toString().split('@').first : 'Inspector'),
      avatarUrl: json['avatar_url'],
      sessionExpiresAt: json['session_expires_at'] != null
          ? DateTime.tryParse(json['session_expires_at'])
          : null,
    );
  }
}

/// Inspection status enum
enum InspectionStatus { pass, fail }

extension InspectionStatusExt on InspectionStatus {
  String get value => this == InspectionStatus.pass ? 'PASS' : 'FAIL';

  static InspectionStatus fromString(String? val) {
    return (val?.toUpperCase() == 'PASS') ? InspectionStatus.pass : InspectionStatus.fail;
  }
}

/// Defect severity level
enum SeverityLevel { minor, moderate, critical }

extension SeverityLevelExt on SeverityLevel {
  String get value {
    switch (this) {
      case SeverityLevel.minor:
        return 'Minor';
      case SeverityLevel.moderate:
        return 'Moderate';
      case SeverityLevel.critical:
        return 'Critical';
    }
  }

  static SeverityLevel fromString(String? val) {
    switch (val?.toLowerCase()) {
      case 'critical':
        return SeverityLevel.critical;
      case 'minor':
        return SeverityLevel.minor;
      default:
        return SeverityLevel.moderate;
    }
  }
}

/// Review decision
enum ReviewDecision {
  confirm,
  overridePass,
  overrideFail,
  reclassify,
}

extension ReviewDecisionExt on ReviewDecision {
  String get value {
    switch (this) {
      case ReviewDecision.confirm:
        return 'CONFIRM';
      case ReviewDecision.overridePass:
        return 'OVERRIDE_PASS';
      case ReviewDecision.overrideFail:
        return 'OVERRIDE_FAIL';
      case ReviewDecision.reclassify:
        return 'RECLASSIFY';
    }
  }

  String get label {
    switch (this) {
      case ReviewDecision.confirm:
        return 'Confirm AI Detection';
      case ReviewDecision.overridePass:
        return 'Override to PASS';
      case ReviewDecision.overrideFail:
        return 'Override to FAIL';
      case ReviewDecision.reclassify:
        return 'Reclassify Defect';
    }
  }
}

/// Defect entity
class DefectItem {
  final String id;
  final String defectClass;
  final double confidence;
  final SeverityLevel severity;
  final double boxX1;
  final double boxY1;
  final double boxX2;
  final double boxY2;
  final String? status; // accepted, rejected, reclassified

  DefectItem({
    required this.id,
    required this.defectClass,
    required this.confidence,
    required this.severity,
    required this.boxX1,
    required this.boxY1,
    required this.boxX2,
    required this.boxY2,
    this.status,
  });

  factory DefectItem.fromJson(Map<String, dynamic> json) {
    final box = json['box_2d'] is List ? (json['box_2d'] as List) : null;
    return DefectItem(
      id: json['id']?.toString() ?? UniqueKey().toString(),
      defectClass: (json['class'] ?? json['cls'] ?? 'defect').toString(),
      confidence: (json['confidence'] is num) ? (json['confidence'] as num).toDouble() : 0.88,
      severity: SeverityLevelExt.fromString(json['severity']?.toString()),
      boxX1: (json['box_x1'] is num) ? (json['box_x1'] as num).toDouble() : (box != null && box.isNotEmpty ? (box[0] as num).toDouble() : 0.1),
      boxY1: (json['box_y1'] is num) ? (json['box_y1'] as num).toDouble() : (box != null && box.length > 1 ? (box[1] as num).toDouble() : 0.1),
      boxX2: (json['box_x2'] is num) ? (json['box_x2'] as num).toDouble() : (box != null && box.length > 2 ? (box[2] as num).toDouble() : 0.3),
      boxY2: (json['box_y2'] is num) ? (json['box_y2'] as num).toDouble() : (box != null && box.length > 3 ? (box[3] as num).toDouble() : 0.3),
      status: json['status']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'class': defectClass,
        'confidence': confidence,
        'severity': severity.value,
        'box_x1': boxX1,
        'box_y1': boxY1,
        'box_x2': boxX2,
        'box_y2': boxY2,
        'status': status,
      };

  DefectItem copyWith({
    String? defectClass,
    double? confidence,
    SeverityLevel? severity,
    String? status,
  }) {
    return DefectItem(
      id: id,
      defectClass: defectClass ?? this.defectClass,
      confidence: confidence ?? this.confidence,
      severity: severity ?? this.severity,
      boxX1: boxX1,
      boxY1: boxY1,
      boxX2: boxX2,
      boxY2: boxY2,
      status: status ?? this.status,
    );
  }
}

/// Audit Review record
class ReviewRecord {
  final String id;
  final String inspectionId;
  final String automatedResult;
  final String reviewDecision;
  final String finalResult;
  final String reviewerEmail;
  final String justification;
  final String? notes;
  final DateTime createdAt;

  ReviewRecord({
    required this.id,
    required this.inspectionId,
    required this.automatedResult,
    required this.reviewDecision,
    required this.finalResult,
    required this.reviewerEmail,
    required this.justification,
    this.notes,
    required this.createdAt,
  });

  factory ReviewRecord.fromJson(Map<String, dynamic> json) {
    return ReviewRecord(
      id: json['id']?.toString() ?? '',
      inspectionId: json['inspection_id']?.toString() ?? '',
      automatedResult: json['automated_result']?.toString() ?? 'FAIL',
      reviewDecision: json['review_decision']?.toString() ?? 'CONFIRM',
      finalResult: json['final_result']?.toString() ?? 'FAIL',
      reviewerEmail: json['reviewer_email']?.toString() ?? 'reviewer@example.com',
      justification: json['justification']?.toString() ?? '',
      notes: json['notes']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'inspection_id': inspectionId,
        'automated_result': automatedResult,
        'review_decision': reviewDecision,
        'final_result': finalResult,
        'reviewer_email': reviewerEmail,
        'justification': justification,
        'notes': notes,
        'created_at': createdAt.toIso8601String(),
      };
}

/// Complete inspection record
class InspectionRecord {
  final String id;
  final DateTime capturedAt;
  final String source;
  final String model;
  final InspectionStatus status;
  final String imageUrl;
  final String annotatedUrl;
  final String? goldenReferenceUrl;
  final String stationId;
  final String batchNumber;
  final String reviewStatus;
  final InspectionStatus finalStatus;
  final List<DefectItem> defects;
  final List<ReviewRecord> reviews;

  InspectionRecord({
    required this.id,
    required this.capturedAt,
    required this.source,
    required this.model,
    required this.status,
    required this.imageUrl,
    required this.annotatedUrl,
    this.goldenReferenceUrl,
    required this.stationId,
    required this.batchNumber,
    required this.reviewStatus,
    required this.finalStatus,
    required this.defects,
    required this.reviews,
  });

  factory InspectionRecord.fromJson(Map<String, dynamic> json) {
    final defectList = (json['defects'] as List<dynamic>?)
            ?.map((d) => DefectItem.fromJson(d as Map<String, dynamic>))
            .toList() ??
        [];

    final reviewList = (json['reviews'] as List<dynamic>?)
            ?.map((r) => ReviewRecord.fromJson(r as Map<String, dynamic>))
            .toList() ??
        [];

    final captured = json['captured_at'] != null
        ? DateTime.tryParse(json['captured_at']) ?? DateTime.now()
        : DateTime.now();

    return InspectionRecord(
      id: json['id']?.toString() ?? '',
      capturedAt: captured,
      source: json['source'] ?? json['source_image_name'] ?? 'capture.jpg',
      model: json['model'] ?? 'yolov8s-pcb',
      status: InspectionStatusExt.fromString(json['status']?.toString()),
      imageUrl: json['image_url'] ?? json['image_path'] ?? '',
      annotatedUrl: json['annotated_url'] ?? json['annotated_image_path'] ?? json['image_url'] ?? '',
      goldenReferenceUrl: json['golden_reference_url'] ?? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      stationId: json['station_id'] ?? 'STATION-01',
      batchNumber: json['batch_number'] ?? 'BATCH-2026-A1',
      reviewStatus: json['review_status'] ?? 'UNREVIEWED',
      finalStatus: InspectionStatusExt.fromString(json['final_status']?.toString() ?? json['status']?.toString()),
      defects: defectList,
      reviews: reviewList,
    );
  }

  InspectionRecord copyWith({
    InspectionStatus? finalStatus,
    String? reviewStatus,
    List<DefectItem>? defects,
    List<ReviewRecord>? reviews,
  }) {
    return InspectionRecord(
      id: id,
      capturedAt: capturedAt,
      source: source,
      model: model,
      status: status,
      imageUrl: imageUrl,
      annotatedUrl: annotatedUrl,
      goldenReferenceUrl: goldenReferenceUrl,
      stationId: stationId,
      batchNumber: batchNumber,
      reviewStatus: reviewStatus ?? this.reviewStatus,
      finalStatus: finalStatus ?? this.finalStatus,
      defects: defects ?? this.defects,
      reviews: reviews ?? this.reviews,
    );
  }
}

/// Aggregated system statistics
class DashboardStats {
  final int totalInspections;
  final int passCount;
  final int failCount;
  final double yieldRate;
  final double defectRate;
  final int totalDefects;
  final int criticalDefects;
  final int pendingReviews;
  final int activeAlerts;
  final Map<String, int> defectsByClass;
  final Map<String, int> defectsBySeverity;
  final List<TrendPoint> trendDaily;
  final List<TrendPoint> trendWeekly;
  final List<TrendPoint> trendMonthly;
  final List<DefectHeatmapPoint> heatmapPoints;
  final List<ConfidenceBin> confidenceDistribution;
  final ModelPerformanceMetrics modelMetrics;

  DashboardStats({
    required this.totalInspections,
    required this.passCount,
    required this.failCount,
    required this.yieldRate,
    required this.defectRate,
    required this.totalDefects,
    required this.criticalDefects,
    required this.pendingReviews,
    required this.activeAlerts,
    required this.defectsByClass,
    required this.defectsBySeverity,
    required this.trendDaily,
    required this.trendWeekly,
    required this.trendMonthly,
    required this.heatmapPoints,
    required this.confidenceDistribution,
    required this.modelMetrics,
  });
}

class TrendPoint {
  final String label;
  final int inspections;
  final int defects;
  final double defectRate;

  TrendPoint({
    required this.label,
    required this.inspections,
    required this.defects,
    required this.defectRate,
  });
}

class DefectHeatmapPoint {
  final double normX; // 0.0 to 1.0
  final double normY; // 0.0 to 1.0
  final double weight;
  final String defectClass;
  final SeverityLevel severity;

  DefectHeatmapPoint({
    required this.normX,
    required this.normY,
    required this.weight,
    required this.defectClass,
    required this.severity,
  });
}

class ConfidenceBin {
  final String rangeLabel; // e.g. "50-60%", "60-70%"
  final int count;
  final double percentage;

  ConfidenceBin({
    required this.rangeLabel,
    required this.count,
    required this.percentage,
  });
}

class ModelPerformanceMetrics {
  final double map50;
  final double map50_95;
  final double precision;
  final double recall;
  final double f1Score;
  final double inferenceLatencyMs;
  final String activeModel;

  ModelPerformanceMetrics({
    required this.map50,
    required this.map50_95,
    required this.precision,
    required this.recall,
    required this.f1Score,
    required this.inferenceLatencyMs,
    required this.activeModel,
  });
}

/// Helper key generator for mock IDs
class UniqueKey {
  static int _counter = 0;
  @override
  String toString() => 'item_${DateTime.now().millisecondsSinceEpoch}_${++_counter}';
}
