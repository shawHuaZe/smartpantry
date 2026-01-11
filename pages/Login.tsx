import React, { useState } from 'react';
import { ViewState } from '../types';
import { authAPI } from '../utils/api';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await authAPI.register(email, password, username);
            } else {
                await authAPI.login(email, password);
            }
            onLogin();
        } catch (err: any) {
            setError(err.message || '操作失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-[0.05] pointer-events-none">
                <span className="material-symbols-outlined text-[240px]">inventory_2</span>
            </div>

            <div className="w-full max-w-md mt-12 flex flex-col items-center mb-12">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl icon-filled">package_2</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">欢迎回来</h1>
                <p className="text-slate-400 text-sm">管理您的长期物品，掌控品质生活</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {isRegister && (
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">badge</span>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm text-white placeholder-slate-500"
                                placeholder="用户名（可选）"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm text-white placeholder-slate-500"
                            placeholder="邮箱"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm text-white placeholder-slate-500"
                            placeholder="请输入密码（至少6位）"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="button" className="text-xs text-primary font-medium hover:underline">忘记密码？</button>
                </div>

                <div className="pt-4 space-y-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '处理中...' : isRegister ? '注册' : '登录'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                        }}
                        className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform hover:bg-white/10"
                    >
                        {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
                    </button>
                </div>
            </form>

            <div className="w-full max-w-md pb-8 mt-auto">
                <div className="flex items-center gap-4 mb-6 mt-8">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">其他登录方式</span>
                    <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <div className="flex justify-center gap-6">
                    <button className="size-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                        <svg className="size-6 text-[#12B7F5]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 12.51c-.2.32-.44.67-.71 1.02-.37.47-.78.92-1.22 1.34-1.2 1.13-2.6 1.77-4.14 1.83-1.07.05-2.1-.21-3.05-.73-.2-.11-.4-.22-.59-.35-.45-.3-.85-.66-1.2-1.08-.27-.32-.51-.66-.71-1.03-.66-1.18-.89-2.48-.68-3.8.19-1.2.73-2.26 1.58-3.13.88-.91 1.95-1.5 3.16-1.74 1.21-.24 2.41-.12 3.53.37 1.02.45 1.87 1.14 2.53 2.01.66.88 1.05 1.88 1.17 2.97.13 1.15-.1 2.27-.67 3.3z"></path>
                        </svg>
                    </button>
                    <button className="size-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-green-500 text-2xl">chat</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Login);