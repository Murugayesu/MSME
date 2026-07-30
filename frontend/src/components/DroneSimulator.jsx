import React, { useEffect, useState } from 'react';
import { Wind, Crosshair, Camera } from 'lucide-react';

export default function DroneSimulator({ onComplete, cropType }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // Generate a "mock" image URL for the completion
                    onComplete(`https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400&auto=format&fit=crop`);
                    return 100;
                }
                return prev + 1;
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center p-8 bg-slate-900 rounded-3xl h-full min-h-[400px] overflow-hidden group">
            {/* HUD Background grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Scanning Line Animation */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="w-full h-[2px] bg-green-500/50 shadow-[0_0_15px_#22c55e] absolute top-0 animate-[scan_2s_linear_infinite]"></div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}} />

            <div className="z-20 flex flex-col items-center">
                <div className="relative mb-8">
                    <div className="w-48 h-48 border-2 border-green-500/30 rounded-full flex items-center justify-center p-4">
                        <div className="w-full h-full border-2 border-green-500 rounded-full animate-pulse flex items-center justify-center relative">
                            <Crosshair size={48} className="text-green-500 opacity-50 absolute" />
                            <div className="w-1 h-32 bg-green-500/20 absolute rotate-45"></div>
                            <div className="w-1 h-32 bg-green-500/20 absolute -rotate-45"></div>
                        </div>
                    </div>
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>
                </div>

                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-500 font-mono text-sm tracking-widest">
                        <Camera size={16} className="animate-pulse" />
                        ACQUIRING {cropType.toUpperCase()} DATA
                    </div>

                    <div className="w-64 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-green-500 h-full transition-all duration-300 shadow-[0_0_10px_#22c55e]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <p className="text-slate-400 font-mono text-xs">
                        PROGRESS: {progress}% | LAT: 11.127 | LNG: 78.656
                    </p>
                </div>
            </div>

            {/* Bottom HUD elements */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[10px] font-mono text-green-500/50">
                <span>SIGNAL: STABLE</span>
                <span>ALT: 120M</span>
                <span>BAT: 84%</span>
            </div>
        </div>
    );
}
