"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Zap, Target, Gauge, RefreshCw, BarChart2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getModels } from "@/lib/api/models";
import { ModelMetric } from "@/types/models";
import { DEFECT_LABELS } from "@/lib/constants/defects";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelMetric | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModels();
      setModels(data);
      if (data.length > 0) setSelectedModel(data[0]);
    } catch (err: any) {
      setError(err.message || "Failed to load model registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
                Model Registry & Benchmark Telemetry
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[8px] bg-gray-100 text-[#2D3748]">
                EVALUATION BENCHMARK
              </span>
            </div>
            <p className="text-xs font-semibold text-[#A0AEC0] mt-0.5">
              Accuracy scores and inference latency for detection models.
            </p>
          </div>
          <button
            onClick={fetchModels}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold text-[#2D3748] bg-white hover:bg-gray-50 border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#4FD1C5] ${loading ? "animate-spin" : ""}`} />
            <span>REFRESH</span>
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchModels} />
        ) : loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-[15px]" />
              ))}
            </div>
            <Skeleton className="h-80 w-full rounded-[15px]" />
          </div>
        ) : models.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No models found in registry"
            description="Registered models will appear here."
          />
        ) : (
          <div className="space-y-5">
            {/* Model Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {models.map((m) => {
                const isSelected = selectedModel?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer rounded-[15px] border p-5 transition-all ${
                      isSelected
                        ? "bg-white border-[#4FD1C5] ring-2 ring-[#4FD1C5]/30 shadow-md"
                        : "bg-white border-gray-200/70 hover:border-gray-300 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">{m.name}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-[8px] bg-[#E6FFFA] text-[#319795]">
                        {m.arch}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-[#A0AEC0]">mAP@50:</span>
                      <span className="text-xl font-bold text-[#2D3748]">
                        {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-xs font-semibold text-[#A0AEC0]">Inference:</span>
                      <span className="text-xs font-bold text-[#319795]">
                        {m.cpu_ms ? `${m.cpu_ms.toFixed(1)} ms` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Benchmark Comparison Table */}
            <div className="bg-white border border-gray-200/70 rounded-[15px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#2D3748] tracking-tight">Model Benchmarks</h3>
                  <p className="text-xs text-[#A0AEC0] font-semibold mt-0.5">
                    Performance comparison across detection models.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">
                      <th className="py-3.5 px-4 font-bold">Model Name</th>
                      <th className="py-3.5 px-4 font-bold">Architecture</th>
                      <th className="py-3.5 px-4 font-bold">Dataset</th>
                      <th className="py-3.5 px-4 font-bold">mAP@50</th>
                      <th className="py-3.5 px-4 font-bold">mAP@50:95</th>
                      <th className="py-3.5 px-4 font-bold">Precision</th>
                      <th className="py-3.5 px-4 font-bold">Recall</th>
                      <th className="py-3.5 px-4 font-bold">F1 Score</th>
                      <th className="py-3.5 px-4 font-bold">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {models.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedModel(m)}
                        className={`cursor-pointer transition-colors ${
                          selectedModel?.id === m.id ? "bg-teal-50/30" : "hover:bg-gray-50/60"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#2D3748]">{m.name}</td>
                        <td className="py-3.5 px-4 text-[#718096] font-medium">{m.arch}</td>
                        <td className="py-3.5 px-4 text-[#718096]">{m.dataset || "DeepPCB"}</td>
                        <td className="py-3.5 px-4 font-bold text-[#2D3748]">
                          {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#718096] font-semibold">
                          {m.map50_95 ? `${(m.map50_95 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#718096] font-semibold">
                          {m.precision ? `${(m.precision * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#718096] font-semibold">
                          {m.recall ? `${(m.recall * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#718096] font-semibold">
                          {m.f1 ? `${(m.f1 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#319795] font-bold">
                          {m.cpu_ms ? `${m.cpu_ms.toFixed(1)} ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Model Per-Class Metrics Details */}
            {selectedModel && selectedModel.metrics_json?.per_class_map50_95 && (
              <div className="bg-white border border-gray-200/70 rounded-[15px] p-5 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#2D3748]">
                      Per-Class Accuracy Breakdown: {selectedModel.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[8px] bg-gray-100 text-[#2D3748]">
                      mAP@50:95
                    </span>
                  </div>
                  <p className="text-xs text-[#A0AEC0] font-semibold mt-0.5">
                    Granular detection fidelity across the individual PCB defect categories
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(selectedModel.metrics_json.per_class_map50_95).map(
                    ([cls, score]: [string, any]) => (
                      <div key={cls} className="p-3.5 rounded-[12px] border border-gray-200/70 bg-[#F8F9FA]">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#A0AEC0]">
                          {DEFECT_LABELS[cls.toLowerCase()] || cls}
                        </div>
                        <div className="mt-1 text-base font-bold text-[#2D3748]">
                          {(Number(score) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
