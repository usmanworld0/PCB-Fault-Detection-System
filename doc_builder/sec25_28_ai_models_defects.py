# -*- coding: utf-8 -*-
"""Section 25 - 28: Computer Vision Pipeline, ML Models Deep Dive, Evaluation Metrics, Defect Classes."""

CONTENT = """## 25. Computer Vision & Inference Pipeline

The core inference engine (`core/detector.py`) executes an optimized, end-to-end computer vision pipeline from raw image ingestion to the final board pass/fail verdict.

```
====================================================================================================
                             INFERENCE PIPELINE ARCHITECTURE
====================================================================================================

 [ STAGE 1: INGESTION ]
   Raw PCB Image (Industrial Camera / File)
          │
          ▼
 [ STAGE 2: ADAPTIVE PRE-PROCESSING ]
   ├── Dimensions Analysis -> Dynamic Tiling if Aspect Ratio > 1.5
   ├── Letterbox Resize -> 640 x 640 px (aspect ratio preserved)
   ├── Color Space Conversion -> BGR to RGB
   └── Normalization -> Division by 255.0 to float32 [0.0, 1.0]
          │
          ▼
 [ STAGE 3: FORWARD PASS INFERENCE ]
   Input Tensor [1, 3, 640, 640]
          │
          ▼
   OpenCV DNN Engine (`cv2.dnn.readNetFromONNX`) / ONNX Runtime
   Model Weights: `models/yolov8s.onnx`
          │
          ▼
   Output Raw Predictions: Tensor [1, 10, 8400]
   (8400 candidate anchor boxes: 4 bbox coordinates [cx, cy, w, h] + 6 class probabilities)
          │
          ▼
 [ STAGE 4: POST-PROCESSING & FILTERING ]
   ├── Transpose & Reshape -> [8400, 10]
   ├── Confidence Thresholding -> Discard predictions where max(class_prob) < 0.25
   ├── Class-Aware Non-Maximum Suppression (NMS) -> `cv2.dnn.NMSBoxes()`
   │     - IoU Threshold: 0.45
   │     - Class Isolation: Multi-class offset projection ensures bounding boxes of different
   │       defect classes do not suppress each other
   └── Coordinate Remapping -> Un-pad & scale normalized coordinates back to original image size
          │
          ▼
 [ STAGE 5: SEVERITY CLASSIFICATION (`core/severity.py`) ]
   For each localized defect:
   ├── IF class in {'open', 'short'}:
   │     severity = 'Critical' if confidence >= 0.60 else 'Moderate'
   ├── IF class in {'mousebite', 'spur'}:
   │     severity = 'Moderate' if confidence >= 0.60 else 'Minor'
   └── IF class in {'copper', 'pinhole'}:
         severity = 'Moderate' if confidence >= 0.70 else 'Minor'
          │
          ▼
 [ STAGE 6: FINAL BOARD VERDICT ]
   ├── Total Defect Count = len(defects)
   ├── Overall Verdict = 'FAIL' if Total Defect Count > 0 else 'PASS'
   └── Persistence -> Commit to SQLite (`station.db`) and emit UI signals
====================================================================================================
```

### Class-Aware Non-Maximum Suppression (NMS)
In standard NMS, if two bounding boxes with different predicted classes overlap with an IoU exceeding 0.45, the box with lower confidence is eliminated.
- **The Defect Co-Occurrence Problem**: In PCB manufacturing, complex defects often appear together. For instance, a `mousebite` (edge notch) may co-occur directly adjacent to a `spur` or broken trace (`open`). Standard NMS would erroneously suppress one of these real defects.
- **Our Solution**: We implement class-aware NMS by adding a large spatial offset ($C \times 4096$) to each bounding box's coordinates based on its class ID $C$ before running `cv2.dnn.NMSBoxes()`. This ensures candidate boxes of different defect classes occupy distinct coordinate spaces, guaranteeing that NMS suppresses only duplicate detections of the *same* defect.

---

## 26. ML Models Deep Dive

The repository contains implementations and evaluation benchmarks for four distinct deep-learning object detection architectures:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Model Comparison Matrix                                   │
├────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬───────────┤
│ Architecture       │ Framework   │ mAP@0.5 (%) │ Latency(ms) │ Params (M)  │ Role      │
├────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼───────────┤
│ **YOLOv8s**        │ ONNX/PyTorch│ **87.60%**  │ **10.1 ms** │ 11.2 M      │ Primary   │
│ **YOLOv8n**        │ ONNX/PyTorch│ **86.70%**  │ **3.7 ms**  │ 3.2 M       │ Edge Light│
│ **Faster R-CNN**   │ PyTorch     │ **92.77%**  │ **114.2 ms**│ 41.5 M      │ Benchmark │
│ **RetinaNet**      │ PyTorch     │ **92.41%**  │ **55.1 ms** │ 34.0 M      │ Benchmark │
└────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴───────────┘
```

### 1. YOLOv8s (Small) — Primary Production Model
- **Why it is the Default**: Delivers the best balance between speed (10.1 ms $\approx$ 99 FPS) and accuracy (87.60% mAP50). It easily meets the real-time requirements of SMT conveyor lines moving at 2-3 boards per second while maintaining high localization accuracy on micro-defects.
- **Architecture**: Single-stage anchor-free detector with a modified CSPDarknet53 backbone, C2f (Cross-Stage Partial with 2 convolutions) feature aggregation blocks, and a decoupled head separating classification and bounding box regression.

### 2. YOLOv8n (Nano) — Ultra-Lightweight Edge Model
- **Role**: Engineered for constrained edge hardware (e.g., Raspberry Pi 4/5, low-power industrial IPCs lacking dedicated GPUs).
- **Attributes**: Minimal 3.2M parameter footprint, 3.7 ms forward pass, retaining an impressive 86.70% mAP50.

### 3. Faster R-CNN (ResNet-50-FPN) — Academic Benchmark
- **Role**: High-precision reference model.
- **Attributes**: Two-stage detector utilizing a Region Proposal Network (RPN) and RoI Align. Achieves the highest mAP50 (92.77%), but its 114.2 ms latency (less than 9 FPS) causes conveyor belt bottlenecks, making it unsuitable for real-time edge deployment.

### 4. RetinaNet (ResNet-50-FPN) — Dense Detector Benchmark
- **Role**: Dense single-stage reference model utilizing **Focal Loss** to handle extreme class imbalance between foreground defects and background copper ground planes.
- **Attributes**: 92.41% mAP50 at 55.1 ms latency.

### Architectural Note: Removal of YOLOv8m
*During recent codebase optimization, `yolov8m` (medium) was formally deprecated and removed from active model registries. YOLOv8m provided only a marginal accuracy gain over YOLOv8s (+0.8% mAP) while doubling parameter count (25.9M) and doubling inference latency (22 ms). Removing YOLOv8m streamlined deployment containers and reduced runtime memory consumption.*

---

## 27. Model Evaluation & Benchmarking

### Core Evaluation Metrics

1. **Intersection over Union (IoU)**:
   $$\text{IoU} = \frac{\text{Area of Overlap}}{\text{Area of Union}} = \frac{B_p \cap B_{gt}}{B_p \cup B_{gt}}$$
   Measures the spatial overlap between predicted bounding box $B_p$ and ground truth annotation $B_{gt}$. An IoU threshold of 0.5 is the industrial standard for evaluating true positives.

2. **Precision & Recall**:
   $$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}, \quad \text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}$$
   - **Precision**: Percentage of detected defects that are actual defects (low precision = high false alarms).
   - **Recall**: Percentage of actual defects successfully detected (low recall = escaped defects entering customer devices).

3. **Mean Average Precision (mAP@0.5)**:
   The mean area under the Precision-Recall curve across all 6 defect classes evaluated at an IoU threshold of 0.5:
   $$\text{mAP} = \frac{1}{N} \sum_{k=1}^N \text{AP}_k$$

### Industrial Confusion Matrix Analysis
In industrial PCB manufacturing, the cost of errors is asymmetric:

```
                      Industrial Cost Matrix
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Metric                  │ Actual Defect (Positive)│ Actual Good (Negative)  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ **Predicted Defect**    │ **True Positive (TP)**  │ **False Positive (FP)** │
│                         │ Correctly rejected      │ Unnecessary manual QA   │
│                         │ board. Cost: $0.        │ reinspection. Cost: $0.5│
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ **Predicted Good**      │ **False Negative (FN)** │ **True Negative (TN)**  │
│                         │ CATASTROPHIC ESCAPE!    │ Correctly passed board. │
│                         │ Field failure: $1000+   │ Cost: $0.               │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

- **Why We Prioritize Recall in Industrial AOI**: A False Positive costs a quality engineer 5 seconds to glance at the board and confirm it's clean. A False Negative (an undetected open circuit or short) escapes to an automotive or medical customer, causing catastrophic field failure and warranty liabilities. Our model confidence threshold is calibrated to 0.25 to maximize recall and eliminate defect escapes.

---

## 28. Defect Classes Deep Dive

The system is trained and calibrated to localize and classify the six fundamental bare-board manufacturing defect classes defined by the IPC-A-600 standard.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Defect Classes Taxonomy                                   │
├─────────────┬──────────────┬───────────────────────────────┬───────────────────────────┤
│ Defect Class│ Severity     │ Physical Mechanism / Cause    │ Electrical Impact         │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **open**    │ **Critical** │ Complete break in copper trace│ Total circuit failure,    │
│             │              │ from dust, scratch, over-etch │ open loop, dead device    │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **short**   │ **Critical** │ Unintended copper bridge      │ Power-to-ground short,    │
│             │              │ between traces from under-etch│ burned IC, fire hazard    │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│**mousebite**│ **Moderate** │ Irregular bite-like notch at  │ Increased current density,│
│             │              │ trace edge from rough breakout│ localized trace burnout   │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **spur**    │ **Moderate** │ Pointed copper protrusion     │ High electric field,      │
│             │              │ extending outward from trace  │ arc-over, potential short │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **copper**  │ **Moderate** │ Isolated stray copper flake   │ High risk of shorting if  │
│             │              │ or residual un-etched island  │ solder bridges during SMT │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **pinhole** │ **Minor**    │ Microscopic circular void in  │ High resistance via,      │
│             │              │ copper ground plane or via    │ cracked barrel in thermal │
└─────────────┴──────────────┴───────────────────────────────┴───────────────────────────┘
```

### Detailed Fabrication Root Causes

1. **Open Circuit (`open`)**:
   - **Root Cause**: Airborne airborne dust particles landing on photoresist before UV exposure, deep physical scratches from mechanical handling, or over-etching in the acid cupric chloride bath.
   - **Visual Profile**: Discontinuous copper line with clear substrate exposed between trace endpoints.

2. **Short Circuit (`short`)**:
   - **Root Cause**: Contaminated developer chemistry leaving residual un-polymerized photoresist, inadequate chemical etching time, or mechanical copper burrs dragged across traces.
   - **Visual Profile**: Abnormal copper bridge connecting two traces that should maintain dielectric clearance.

3. **Mousebite (`mousebite`)**:
   - **Root Cause**: Excessive router feed rate during panel break-away de-paneling, or air bubbles trapped under dry film resist during lamination.
   - **Visual Profile**: Concave indentation into the sidewall of a conductor trace.

4. **Spur (`spur`)**:
   - **Root Cause**: Pinhole defects in the photoresist artwork film, allowing UV light bleed that polymerizes unwanted copper spurs extending out from traces.
   - **Visual Profile**: Pointed triangular or horn-like protrusion extending into trace isolation channels.

5. **Spurious Copper (`copper`)**:
   - **Root Cause**: Incomplete etching in low-fluidity stagnant zones of the spray etching chamber, or detached resist flakes redepositing onto the board surface.
   - **Visual Profile**: Isolated islands of conductor metal sitting on bare dielectric laminate.

6. **Pinhole (`pinhole` / `missing_hole`)**:
   - **Root Cause**: Minute gas bubbles trapped during copper electroplating baths, or drilling anomalies resulting in missed hole drilling operations.
   - **Visual Profile**: Microscopic circular void exposing substrate laminate inside a solid copper ground plane or via pad.
"""
