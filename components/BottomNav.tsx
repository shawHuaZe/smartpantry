import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
    activeView: ViewState;
    onChangeView: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onChangeView }) => {
    const navItems = [
        { view: ViewState.HOME, icon: 'home', label: '首页' },
        { view: ViewState.INVENTORY_CATEGORIES, icon: 'inventory_2', label: '库存' },
        { view: ViewState.SHOPPING_LIST, icon: 'shopping_cart', label: '清单' },
        { view: ViewState.STATISTICS, icon: 'analytics', label: '统计' },
        { view: ViewState.SETTINGS, icon: 'person', label: '我的' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0f1923]/95 backdrop-blur-xl border-t border-white/5 pb-6 pt-3 z-40">
            <div className="flex items-center justify-between max-w-md mx-auto px-6">
                {navItems.map((item) => {
                    const isActive = activeView === item.view;
                    return (
                        <button
                            key={item.view}
                            onClick={() => onChangeView(item.view)}
                            className={`flex flex-col items-center gap-1 transition-colors ${
                                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${isActive ? 'icon-filled' : ''}`}>
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;