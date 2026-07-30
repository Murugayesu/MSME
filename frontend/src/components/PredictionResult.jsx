import React from 'react';
import { CheckCircle2, AlertCircle, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export default function PredictionResult({ result }) {
    if (!result) return null;

    const isHealthy = result.health_status === 'healthy';

    return (
        <div className="animate-fade-in space-y-6">
            <div className={`p-6 rounded-3xl border-2 transition-all duration-500 bg-white shadow-xl ${isHealthy ? 'border-green-100 shadow-green-100/50' : 'border-red-100 shadow-red-100/50'
                }`}>
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isHealthy ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Diagnosis Result</h3>
                            <p className="text-slate-500 text-sm">AI analysis complete</p>
                        </div>
                    </div>
                    {isHealthy && <Sparkles className="text-yellow-400" size={20} />}
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isHealthy ? 'bg-green-500 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-200'
                            }`}>
                            {isHealthy ? 'Healthy' : 'Disease Detected'}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2">
                        {result.prediction}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Confidence Score</span>
                        <span className="text-sm font-bold text-green-600">
                            {typeof result.confidence === 'number' && !isNaN(result.confidence)
                                ? (result.confidence * 100).toFixed(2)
                                : '0.00'}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 px-0.5 py-0.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${isHealthy ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
                            style={{ width: `${(result.confidence || 0) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {!isHealthy && (
                <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldAlert size={80} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="flex items-center gap-2 font-bold mb-3 text-red-400">
                            Expert Recommendation
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed mb-6">
                            {result.recommendation || "Our AI recommends immediate consultation with a plant pathologist. Avoid excessive watering until further assessment."}
                        </p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all">
                            View Detailed Treatment <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
