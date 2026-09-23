// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:pcb_vision/main.dart';

void main() {
  testWidgets('PCBVisionApp smoke test renders login when unauthenticated', (WidgetTester tester) async {
    await tester.pumpWidget(const PCBVisionApp());
    await tester.pumpAndSettle();

    expect(find.text('PCB-Vision'), findsWidgets);
    expect(find.text('Sign In'), findsWidgets);
  });
}
