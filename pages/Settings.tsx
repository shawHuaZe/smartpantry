import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { authAPI } from '../utils/api';

interface SettingsProps {
    onChangeView?: (view: ViewState) => void;
}

const Settings: React.FC<SettingsProps> = ({ onChangeView }) => {
    const [userInfo, setUserInfo] = useState<{ email: string; username: string } | null>(null);

    useEffect(() => {
        loadUserInfo();
    }, []);

    const loadUserInfo = async () => {
        try {
            const data = await authAPI.getProfile();
            setUserInfo(data.user);
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm('确定要退出登录吗？')) {
            authAPI.logout();
            if (onChangeView) {
                onChangeView(ViewState.LOGIN);
            } else {
                window.location.reload();
            }
        }
    };

    return (
        <div className="pb-28">
            <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">设置中心</h1>
                </div>
            </header>
            <main className="max-w-md mx-auto">
                <section className="p-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                        <div className="size-16 rounded-full overflow-hidden border-2 border-primary/20">
                            <img alt="User Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtm14Tj4BvWOgWLN1t047dgkOBZlpBxM4iNhA5OaIdo3eYK-Qnfqzno75prvU9bUvqnt9lQH-6crWmfQFhSg9M7EdZQGlC9j299zC-J3dJNeF9XdNwpN2KNBRrGsBNKkGe5qVqfF3CkVCy2iZGexI01LGq6ePlJK8FLAtlIfeaf51kuZsY7n2ON78iy7wtvsfLhPFFELpkqEBZWq8H2f63DFBvUite_GZ0p_UqK2mCXqABCbkSyNyAXoRLNtfZ7UqWdOQiXjLfObM" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{userInfo?.username || '加载中...'}</h2>
                            <p className="text-xs text-white/40 mt-1">{userInfo?.email || 'user@example.com'}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </div>
                </section>

                <section className="mt-2 px-4 space-y-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        {[
                            { icon: 'shield', color: 'text-blue-500', bg: 'bg-blue-500/10', label: '账号安全' },
                            { icon: 'notifications_active', color: 'text-orange-500', bg: 'bg-orange-500/10', label: '通知设置' },
                            { icon: 'cloud_upload', color: 'text-green-500', bg: 'bg-green-500/10', label: '数据备份' },
                            { icon: 'settings', color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: '设置' },
                            { icon: 'palette', color: 'text-purple-500', bg: 'bg-purple-500/10', label: '主题选择' },
                            { icon: 'info', color: 'text-slate-500', bg: 'bg-slate-500/10', label: '关于我们' },
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 text-left last:border-0">
                                <div className={`size-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                                </div>
                                <span className="flex-1 font-medium">{item.label}</span>
                                <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="mt-6 px-4">
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 text-red-500 font-bold bg-white/5 border border-white/10 rounded-2xl active:scale-95 transition-transform hover:bg-red-500/10"
                    >
                        退出登录
                    </button>
                    <p className="text-center text-[10px] opacity-40 mt-6 tracking-widest uppercase">Version 2.4.0 (2024)</p>
                </section>
            </main>
        </div>
    );
};

export default React.memo(Settings);