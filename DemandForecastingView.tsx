import React from 'react';
import { DemandForecast } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  BarChart, 
  Package, 
  Cpu 
} from 'lucide-react';

interface DemandForecastingViewProps {
  forecasts: DemandForecast[];
  onPrepositionStock: (forecast: DemandForecast) => void;
}

export const DemandForecastingView: React.FC<DemandForecastingViewProps> = ({
  forecasts,
  onPrepositionStock,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                AI Predictive Healthcare Demand & Supply Optimization
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              72-Hour Predictive Modeling • Weather-Correlated Injury Spikes & Automated Aerial Supply Buffering
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Prediction Accuracy: 94.2%
            </span>
          </div>
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forecasts.map((f, idx) => (
          <div
            key={idx}
            className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700 uppercase font-bold">
                  {f.category.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Confidence: {f.confidenceScore}%
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-100 font-tech">
                {f.categoryLabel}
              </h3>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-3 pt-3 border-t border-slate-800/80">
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block">CURRENT STOCK</span>
                  <span className="text-slate-100 font-bold">{f.currentStock} Units</span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block">72H FORECAST</span>
                  <span className="text-teal-300 font-bold">{f.predictedUsageNext72h} Units</span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                  <span className="text-[10px] text-slate-500 block">SPIKE PROBABILITY</span>
                  <span className={`font-bold ${f.spikeProbabilityPct > 70 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {f.spikeProbabilityPct}%
                  </span>
                </div>
              </div>

              {/* Reasoning Driver */}
              <div className="mt-3 text-xs font-mono bg-slate-950/50 p-3 rounded-xl border border-slate-850 space-y-1">
                <span className="text-[10px] text-teal-400 block font-bold">PREDICTIVE FACTOR:</span>
                <p className="text-slate-300">{f.driverReason}</p>
              </div>

              {/* Action Recommendation */}
              <div className="mt-2 text-xs font-mono bg-teal-500/10 p-3 rounded-xl border border-teal-500/30 space-y-1">
                <span className="text-[10px] text-teal-300 block font-bold">AI STRATEGY:</span>
                <p className="text-teal-100">{f.actionRecommendation}</p>
              </div>
            </div>

            {/* Preposition Action */}
            <div className="pt-3 border-t border-slate-800/80">
              <button
                onClick={() => {
                  soundFx.playTelemetryBeep();
                  onPrepositionStock(f);
                }}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Schedule Proactive Aerial Pre-positioning Sortie
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
