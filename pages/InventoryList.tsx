import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { itemsAPI } from '../utils/api';

interface InventoryListProps {
    onBack: () => void;
    onItemClick: (itemId: string) => void;
    onScan: () => void;
    categoryId: string;
}

interface InventoryItem {
    id: string;
    name: string;
    description: string;
    expiry_date: string;
    purchase_date: string;
    image: string;
    rating: number;
    quantity: number;
    tags?: string[];
    category: string;
}

// 分类配置
const CATEGORY_CONFIG: Record<string, {
    name: string;
    color: string;
    bgColor: string;
    tabs: string[];
    showProgress: boolean;
}> = {
    'Food': {
        name: '食物',
        color: '#339cff',
        bgColor: 'bg-blue-500/20',
        tabs: ['全部', '水果', '蔬菜', '肉类', '乳制品', '零食'],
        showProgress: false
    },
    'Medicine': {
        name: '药品',
        color: '#ff6b6b',
        bgColor: 'bg-red-500/20',
        tabs: ['全部', '感冒', '过敏', '止痛', '维生素'],
        showProgress: false
    },
    'Home': {
        name: '日用品',
        color: '#51cf66',
        bgColor: 'bg-green-500/20',
        tabs: ['全部', '洗护', '清洁', '纸品', '其他'],
        showProgress: true
    },
    'Other': {
        name: '其他',
        color: '#9775fa',
        bgColor: 'bg-purple-500/20',
        tabs: ['全部'],
        showProgress: false
    },
    'Expiring': {
        name: '即将过期',
        color: '#ff6b6b',
        bgColor: 'bg-orange-500/20',
        tabs: ['全部', '已过期', '7天内', '30天内'],
        showProgress: true
    }
};

const InventoryList: React.FC<InventoryListProps> = ({
    onBack,
    onItemClick,
    onScan,
    categoryId
}) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('全部');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    const config = CATEGORY_CONFIG[categoryId] || CATEGORY_CONFIG['Other'];

    useEffect(() => {
        loadItems();
    }, [categoryId]);

    const loadItems = async () => {
        try {
            setLoading(true);

            // 特殊处理过期物品列表
            if (categoryId === 'Expiring') {
                const data = await itemsAPI.getAll({ expiring: true });
                setItems(data.items || []);
            } else {
                const data = await itemsAPI.getAll({ category: categoryId });
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('加载物品列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const getExpiryInfo = (expiryDate: string) => {
        if (!expiryDate) return { text: '无限期', color: 'text-slate-400', barColor: 'bg-slate-400' };

        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: '已过期', color: 'text-red-400', barColor: 'bg-red-400' };
        if (diffDays <= 7) return { text: '即将过期', color: 'text-orange-400', barColor: 'bg-orange-400' };
        if (diffDays <= 30) return { text: `${diffDays}天后过期`, color: 'text-yellow-400', barColor: 'bg-yellow-400' };
        return { text: '新鲜', color: 'text-green-400', barColor: 'bg-green-400' };
    };

    const getProgressPercent = (item: InventoryItem) => {
        if (!item.expiry_date) return 100;
        const today = new Date();
        const purchase = item.purchase_date ? new Date(item.purchase_date) : today;
        const expiry = new Date(item.expiry_date);
        const totalDays = Math.ceil((expiry.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));
    };

    const getPrimaryTag = (item: InventoryItem) => {
        if (item.tags && item.tags.length > 0) {
            return item.tags[0];
        }
        return config.name.substring(0, 2);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));

        let matchesTab = true;

        // 特殊处理过期物品的标签过滤
        if (categoryId === 'Expiring') {
            if (activeTab === '全部') {
                matchesTab = true;
            } else if (activeTab === '已过期') {
                const today = new Date();
                const expiry = new Date(item.expiry_date);
                matchesTab = expiry < today;
            } else if (activeTab === '7天内') {
                const today = new Date();
                const expiry = new Date(item.expiry_date);
                const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                matchesTab = diffDays >= 0 && diffDays <= 7;
            } else if (activeTab === '30天内') {
                const today = new Date();
                const expiry = new Date(item.expiry_date);
                const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                matchesTab = diffDays >= 0 && diffDays <= 30;
            }
        } else {
            // 普通分类的标签过滤
            matchesTab = activeTab === '全部' ||
                (activeTab !== '全部' && item.tags && item.tags.some(tag => tag.includes(activeTab)));
        }

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
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center p-4 pb-2 justify-between max-w-md mx-auto">
                    <button onClick={onBack} className="flex size-12 shrink-0 items-center justify-start text-white">
                        <span className="material-symbols-outlined text-2xl cursor-pointer">arrow_back_ios</span>
                    </button>
                    <h2 className="text-xl font-bold leading-tight tracking-tight flex-1 text-center">{config.name}库存</h2>
                    <div className="flex w-12 items-center justify-end"></div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4">
                {/* Search Bar */}
                <div className="py-3">
                    <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm bg-white/5 border border-white/10">
                            <div className="text-slate-400 flex border-none items-center justify-center pl-4 rounded-l-xl">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-slate-500 px-4 pl-2 text-base font-normal"
                                placeholder={`搜索${config.name}名称`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 py-3 overflow-x-auto hide-scrollbar">
                    {config.tabs.map(tab => (
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

                {/* Items List */}
                <div className="space-y-4 mt-2">
                    {filteredItems.map(item => {
                        const expiryInfo = getExpiryInfo(item.expiry_date);
                        const progressPercent = config.showProgress ? getProgressPercent(item) : null;

                        return (
                            <div
                                key={item.id}
                                onClick={() => onItemClick(item.id)}
                                className="flex items-stretch justify-between gap-4 rounded-xl bg-white/5 p-4 shadow-sm border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex flex-[2_2_0px] flex-col justify-between gap-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs font-bold px-2 py-0.5 rounded"
                                                style={{
                                                    backgroundColor: config.bgColor,
                                                    color: config.color
                                                }}
                                            >
                                                {getPrimaryTag(item)}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                            <p className={`text-xs font-medium ${expiryInfo.color}`}>{expiryInfo.text}</p>
                                        </div>
                                        <p className="text-white text-lg font-bold leading-tight">{item.name}</p>
                                        <p className="text-slate-400 text-xs font-normal">
                                            {item.description || `数量: ${item.quantity || 1}`}
                                        </p>
                                        {item.purchase_date && (
                                            <p className="text-slate-500 text-xs">
                                                购入: {new Date(item.purchase_date).toLocaleDateString('zh-CN')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Progress Bar for Home category */}
                                    {config.showProgress && progressPercent !== null && (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">剩余使用</span>
                                                <span className="text-white font-medium">{Math.round(progressPercent)}%</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${expiryInfo.barColor} transition-all duration-300`}
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rating for Food category */}
                                    {categoryId === 'Food' && item.rating && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-sm text-yellow-400 icon-filled">star</span>
                                            <span className="text-xs font-bold text-yellow-400">{item.rating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Item Image */}
                                <div
                                    className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded-xl shrink-0 shadow-inner bg-white/10"
                                    style={{
                                        backgroundImage: item.image ? `url("${item.image}")` : 'none',
                                        backgroundColor: !item.image ? '#1a2c38' : undefined
                                    }}
                                ></div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-slate-600">inbox</span>
                            <p className="text-slate-500 mt-4">暂无{config.name}物品</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Button */}
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

export default React.memo(InventoryList);
