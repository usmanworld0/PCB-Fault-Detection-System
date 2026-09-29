import 'package:http/http.dart' as http;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/models.dart';

class InspectionReportService {
  static Future<void> share(InspectionRecord inspection) async {
    final document = pw.Document();
    pw.MemoryImage? annotatedImage;
    try {
      final response = await http
          .get(Uri.parse(inspection.annotatedUrl))
          .timeout(const Duration(seconds: 20));
      if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
        annotatedImage = pw.MemoryImage(response.bodyBytes);
      }
    } catch (_) {
      // Keep the report usable when the image host is unavailable.
    }

    document.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(34),
        build: (context) => [
          pw.Text(
            'PCB Inspection Report',
            style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 14),
          _row('Inspection ID', inspection.id),
          _row('Source image', inspection.source),
          _row('Inspection date', inspection.capturedAt.toLocal().toString()),
          _row('Model', inspection.model),
          _row('Result', inspection.finalStatus.value),
          pw.SizedBox(height: 16),
          pw.Text(
            'Defects found (${inspection.defects.length})',
            style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 6),
          if (inspection.defects.isEmpty)
            pw.Text('No defects recorded for this inspection.')
          else
            ...inspection.defects.map(
              (defect) => pw.Container(
                padding: const pw.EdgeInsets.symmetric(vertical: 6),
                decoration: const pw.BoxDecoration(
                  border: pw.Border(
                    bottom: pw.BorderSide(color: PdfColors.grey300),
                  ),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      '${defect.defectClass} • ${defect.severity.value}',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                    pw.Text(
                      'Confidence: ${(defect.confidence * 100).toStringAsFixed(1)}%',
                    ),
                    pw.Text(
                      'Box: [${defect.boxX1}, ${defect.boxY1}, ${defect.boxX2}, ${defect.boxY2}]',
                    ),
                  ],
                ),
              ),
            ),
          if (annotatedImage != null) ...[
            pw.SizedBox(height: 18),
            pw.Text(
              'Annotated inspection image',
              style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 8),
            pw.Center(
              child: pw.Image(
                annotatedImage,
                height: 300,
                fit: pw.BoxFit.contain,
              ),
            ),
          ],
        ],
      ),
    );

    final safeId = inspection.id.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    await Printing.sharePdf(
      bytes: await document.save(),
      filename: 'inspection_$safeId.pdf',
    );
  }

  static pw.Widget _row(String label, String value) => pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 5),
    child: pw.RichText(
      text: pw.TextSpan(
        children: [
          pw.TextSpan(
            text: '$label: ',
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
          ),
          pw.TextSpan(text: value),
        ],
      ),
    ),
  );
}
