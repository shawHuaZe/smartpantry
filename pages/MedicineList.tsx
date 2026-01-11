import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../utils/api';

interface MedicineListProps {
    onBack: () => void;
    onItemClick: (itemId: string) => void;
    onScan: () => void;
}

interface MedicineItem {
    id: string;
    name: string;
    description: string;
    tags: string[];
    expiry_date: string;
    purchase_date: string;
    is_recommended: boolean;
    image: string;
}

const MedicineList: React.FC<MedicineListProps> = ({ onBack, onItemClick, onScan }) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('全部');
    const [items, setItems] = useState<MedicineItem[]>([]);
    const [loading, setLoading] = useState(true);

    const tabs = ['全部', '感冒', '过敏', '止痛', '维生素'];

    useEffect(() => {
        loadMedicines();
    }, []);

    const loadMedicines = async () => {
        try {
            setLoading(true);
            const data = await itemsAPI.getAll({ category: 'Medicine' });
            setItems(data.items || []);
        } catch (error) {
            console.error('加载药品列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRecommend = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const item = items.find(i => i.id === id);
        if (!item) return;

        try {
            await itemsAPI.update(id, { is_recommended: !item.is_recommended });
            setItems(items.map(i => i.id === id ? { ...i, is_recommended: !i.is_recommended } : i));
        } catch (error) {
            console.error('更新失败:', error);
        }
    };

    const getExpiryInfo = (expiryDate: string) => {
        if (!expiryDate) return { text: '无限期', color: 'text-slate-400' };

        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: '已过期', color: 'text-red-400' };
        if (diffDays <= 7) return { text: '即将过期', color: 'text-red-400' };
        if (diffDays <= 30) return { text: `${Math.floor(diffDays / 7)}周后过期`, color: 'text-orange-400' };
        return { text: `有效期: ${expiry.getFullYear()}/${String(expiry.getMonth() + 1).padStart(2, '0')}`, color: 'text-slate-400' };
    };

    const getPrimaryTag = (item: MedicineItem) => {
        if (item.tags && item.tags.length > 0) {
            return item.tags[0];
        }
        return '药品';
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
        const matchesTab = activeTab === '全部' ||
            (activeTab !== '全部' && item.tags && item.tags.some(tag => tag.includes(activeTab)));
        return matchesSearch && matchesTab;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-400">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-32 bg-background-dark min-h-screen">
             <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center p-4 pb-2 justify-between max-w-md mx-auto">
                    <button onClick={onBack} className="flex size-12 shrink-0 items-center justify-start text-white">
                        <span className="material-symbols-outlined text-2xl cursor-pointer">arrow_back_ios</span>
                    </button>
                    <h2 className="text-xl font-bold leading-tight tracking-tight flex-1 text-center">药品库存</h2>
                    <div className="flex w-12 items-center justify-end"></div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4">
                <div className="py-3">
                    <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm bg-white/5 border border-white/10">
                            <div className="text-slate-400 flex border-none items-center justify-center pl-4 rounded-l-xl">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-slate-500 px-4 pl-2 text-base font-normal"
                                placeholder="搜索名称或关联症状"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                <div className="flex gap-3 py-3 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-colors ${
                                activeTab === tab
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white/5 border border-white/10 text-slate-300'
                            }`}
                        >
                            <p className="text-sm font-bold">{tab}</p>
                        </button>
                    ))}
                </div>

                <div className="space-y-4 mt-2">
                    {filteredItems.map(item => {
                        const expiryInfo = getExpiryInfo(item.expiry_date);
                        return (
                            <div
                                key={item.id}
                                onClick={() => onItemClick(item.id)}
                                className="flex items-stretch justify-between gap-4 rounded-xl bg-white/5 p-4 shadow-sm border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex flex-[2_2_0px] flex-col justify-between gap-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary">{getPrimaryTag(item)}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                            <p className={`text-xs font-medium ${expiryInfo.color}`}>{expiryInfo.text}</p>
                                        </div>
                                        <p className="text-white text-lg font-bold leading-tight">{item.name}</p>
                                        <p className="text-slate-400 text-xs font-normal">购入时间: {item.purchase_date || '未知'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div
                                            onClick={(e) => toggleRecommend(e, item.id)}
                                            className={`flex items-center justify-center rounded-lg h-8 px-3 gap-1.5 text-xs font-bold transition-colors ${
                                                item.is_recommended
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/10 text-slate-300'
                                            }`}
                                        >
                                            <span className={`material-symbols-outlined text-base ${item.is_recommended ? 'icon-filled' : ''}`}>star</span>
                                            <span>{item.is_recommended ? '已推荐' : '标记推荐'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded-xl shrink-0 shadow-inner bg-white/10" style={{ backgroundImage: item.image ? `url("${item.image}")` : 'none', backgroundColor: !item.image ? '#1a2c38' : undefined }}></div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <div className="fixed bottom-28 right-6 z-40">
                <button
                    onClick={onScan}
                    className="flex items-center justify-center rounded-full h-14 w-14 bg-primary text-white shadow-lg shadow-primary/40 active:scale-95 transition-transform hover:bg-blue-400"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(MedicineList);