import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';

interface ScanProps {
    onClose: () => void;
    onFinish: () => void;
}

const Scan: React.FC<ScanProps> = ({ onClose, onFinish }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 85) return 85;
                return prev + 1;
            });
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Background Camera Placeholder */}
            <div className="absolute inset-0 z-0">
                <img
                    alt="Scan Background"
                    className="w-full h-full object-cover opacity-60"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR4DYNfmXF8Mm-udoKVXMEtSeSDvUyB7bmSIVqyuRvhtiEYh3T86C1dkqTFOFFhkRkdW5p9s9nT7aN-kndDn0p5IMDz-Rr2fgXuVVm98v0NEdSOsU8J0p11hmoY5fw0ktlC82lS7ayj3sc9rq-lBeWSyX5QYdfcP8-Epj0OfTlzCRtXQRMIRHyfuQxAxLXO86rkAvbqfqk35WT6ZXWxshT6W82dwmcHRzmKoTi6x0wr9qU86U3U9i5vP6wGPoe65gzloP90jcpmzg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#102213]/60 via-transparent to-[#102213]/90"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4">
                <button onClick={onClose} className="flex size-12 shrink-0 items-center justify-center bg-black/30 rounded-full backdrop-blur-md text-white hover:bg-black/50 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h2 className="text-white text-lg font-bold">小票智能识别</h2>
                <button className="flex size-12 shrink-0 items-center justify-center bg-black/30 rounded-full backdrop-blur-md text-white hover:bg-black/50 transition-colors">
                    <span className="material-symbols-outlined">flashlight_on</span>
                </button>
            </div>

            {/* Scanning Area */}
            <div className="flex-1 relative flex items-center justify-center p-8">
                <div className="w-full aspect-[3/4] border-2 border-primary/40 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>

                    {/* Scanning Line Animation */}
                    <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[#13ec37] to-transparent shadow-[0_0_15px_#13ec37] animate-[scan_2s_ease-in-out_infinite]" style={{ top: '40%' }}></div>
                    <style>{`
                        @keyframes scan {
                            0% { top: 10%; opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { top: 90%; opacity: 0; }
                        }
                    `}</style>
                </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 flex items-center justify-center gap-6 p-4 pb-8">
                <button className="flex size-12 items-center justify-center rounded-full bg-black/40 text-white border border-white/10 backdrop-blur-md">
                    <span className="material-symbols-outlined">photo_library</span>
                </button>
                <button className="flex size-20 items-center justify-center rounded-full bg-white/20 border-4 border-white p-1">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-background-dark">
                        <span className="material-symbols-outlined text-[32px] icon-filled">camera</span>
                    </div>
                </button>
                <button className="flex size-12 items-center justify-center rounded-full bg-black/40 text-white border border-white/10 backdrop-blur-md">
                    <span className="material-symbols-outlined">history</span>
                </button>
            </div>

            {/* Result Panel (Sliding Up) */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end pointer-events-none">
                <div className="bg-[#102213]/85 backdrop-blur-xl border-t border-white/10 w-full rounded-t-3xl pointer-events-auto flex flex-col max-h-[60%]">
                    <div className="flex h-6 w-full items-center justify-center shrink-0">
                        <div className="h-1.5 w-12 rounded-full bg-primary/40"></div>
                    </div>
                    <div className="px-4 pt-2">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-primary text-xs font-bold uppercase tracking-wider">AI 识别进度</p>
                            <p className="text-white text-xs font-medium">{progress}% 已完成</p>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <h3 className="text-white tracking-tight text-xl font-bold leading-tight px-4 pt-4 pb-4">正在处理小票...</h3>
                    <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-6 hide-scrollbar">
                        {/* Detected Items */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">nutrition</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">红富士苹果 (6个装)</p>
                                    <p className="text-white/50 text-xs">分类: 食品</p>
                                </div>
                            </div>
                            <button className="text-primary/80 text-xs font-bold border border-primary/30 px-3 py-1.5 rounded-lg bg-primary/5">修改</button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">medical_services</span>
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">阿司匹林 500mg</p>
                                    <p className="text-white/50 text-xs">分类: 药品</p>
                                </div>
                            </div>
                            <button className="text-primary/80 text-xs font-bold border border-primary/30 px-3 py-1.5 rounded-lg bg-primary/5">修改</button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center text-white/40">
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                </div>
                                <div>
                                    <p className="text-white/60 font-bold text-sm italic">正在识别物品...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-background-dark/80 backdrop-blur-md border-t border-white/5 flex gap-3">
                        <button
                            onClick={onFinish}
                            className="flex-1 bg-primary text-background-dark h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(51,156,255,0.4)] hover:bg-blue-400 transition-colors"
                        >
                            <span className="material-symbols-outlined icon-filled">check_circle</span>
                            确认并保存 (2)
                        </button>
                    </div>
                    <div className="h-4"></div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Scan);