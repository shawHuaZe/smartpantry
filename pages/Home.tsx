import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { itemsAPI, categoriesAPI, authAPI } from '../utils/api';

interface HomeProps {
    onChangeView: (view: ViewState, itemId?: string) => void;
}

interface Item {
    id: string;
    name: string;
    description: string;
    expiry_date: string;
    image: string;
    rating: number;
    is_expiring_soon: boolean;
}

interface CategoryData {
    id: string;
    name: string;
    icon: string;
    count: number;
    color: string;
}

const Home: React.FC<HomeProps> = ({ onChangeView }) => {
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('category');

    const [recentItems, setRecentItems] = useState<Item[]>([]);
    const [stats, setStats] = useState({ total: 0, expiring: 0, byCategory: {} as Record<string, number> });
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentCategoryPage, setCurrentCategoryPage] = useState(0);
    const categoryScrollRef = React.useRef<HTMLDivElement>(null);

    const availableIcons = [
        'category', 'restaurant', 'home', 'pill', 'checkroom', 'pets',
        'sports_esports', 'school', 'directions_car', 'fitness_center', 'work', 'flight'
    ];

    const availableColors = [
        '#339cff', '#ff6b6b', '#51cf66', '#9775fa', '#ff922b',
        '#ff6b9d', '#ffd43b', '#69db7c', '#748ffc', '#ffa94d'
    ];

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            alert('请输入分类名称');
            return;
        }

        try {
            const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            await categoriesAPI.create({
                name: newCategoryName.trim(),
                icon: selectedIcon,
                color: randomColor
            });

            // 重新加载数据
            await loadData();

            // 重置表单
            setNewCategoryName('');
            setSelectedIcon('category');
            setIsCreateCategoryOpen(false);
        } catch (error: any) {
            alert(error.message || '创建分类失败');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 监听滚动更新指示器
    useEffect(() => {
        const scrollContainer = categoryScrollRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const scrollLeft = scrollContainer.scrollLeft;
            const cardWidth = 112; // min-w-[100px] + gap-3 (12px)
            const page = Math.round(scrollLeft / cardWidth);
            setCurrentCategoryPage(page);
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [categories]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [allItemsData, statsData, categoriesData] = await Promise.all([
                itemsAPI.getAll(),
                itemsAPI.getStats(),
                categoriesAPI.getAll()
            ]);

            setRecentItems(allItemsData.items || []);
            setStats(statsData || { total: 0, expiring: 0, byCategory: {} });

            // 处理分类数据 - 与InventoryCategories保持一致
            const categoryMap: Record<string, CategoryData> = {
                'Food': {
                    id: 'Food',
                    name: '食物',
                    icon: 'restaurant',
                    count: statsData.byCategory?.Food || 0,
                    color: '#339cff'
                },
                'Medicine': {
                    id: 'Medicine',
                    name: '药品',
                    icon: 'pill',
                    count: statsData.byCategory?.Medicine || 0,
                    color: '#ff6b6b'
                },
                'Home': {
                    id: 'Home',
                    name: '日用品',
                    icon: 'home',
                    count: statsData.byCategory?.Home || 0,
                    color: '#51cf66'
                },
                'Other': {
                    id: 'Other',
                    name: '其他',
                    icon: 'category',
                    count: statsData.byCategory?.Other || 0,
                    color: '#9775fa'
                }
            };

            // 添加自定义分类
            categoriesData.categories?.forEach((cat: any) => {
                categoryMap[cat.id] = {
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    count: cat.items?.[0]?.count || 0,
                    color: cat.color
                };
            });

            // 按使用频率（物品数量）排序分类
            const sortedCategories = Object.values(categoryMap).sort((a, b) => b.count - a.count);

            setCategories(sortedCategories);
        } catch (error: any) {
            console.error('加载数据失败:', error);
            setError(error.message || '加载数据失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return '已过期';
        if (diffDays === 0) return '今天过期';
        if (diffDays <= 7) return `${diffDays}天后过期`;
        return date.toLocaleDateString('zh-CN');
    };

    const getItemStatus = (item: Item) => {
        if (!item.expiry_date) {
            return { text: '无限期', color: 'text-slate-400', bg: 'bg-slate-400/20' };
        }

        if (item.is_expiring_soon) {
            return { text: '即将', color: 'text-orange-400', bg: 'bg-orange-400/20' };
        }

        const expiryDate = new Date(item.expiry_date);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: '已过期', color: 'text-red-400', bg: 'bg-red-400/20' };
        } else if (diffDays <= 14) {
            return { text: '新鲜', color: 'text-green-400', bg: 'bg-green-400/20' };
        } else {
            return { text: '安全', color: 'text-primary', bg: 'bg-primary/20' };
        }
    };

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

    if (error) {
        return (
            <div className="min-h-screen bg-background-dark text-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
                    <p className="text-xl font-bold mb-2">加载失败</p>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-6 py-3 bg-primary rounded-xl font-bold hover:bg-blue-400 transition-colors"
                    >
                        重试
                    </button>
                    {error.includes('登录') && (
                        <p className="text-slate-500 text-sm mt-4">请先登录以继续使用</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="pb-28 relative">
            {/* Create Category Modal */}
            {isCreateCategoryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#1a2c38] w-full max-w-sm rounded-2xl p-5 border border-white/10 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-white text-lg mb-4">创建新分类</h3>
                        
                        <div className="mb-4">
                            <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">分类名称</label>
                            <input 
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full bg-black/20 text-white rounded-xl p-4 text-sm outline-none border border-white/5 focus:border-primary/50 transition-colors"
                                placeholder="例如: 运动器材"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                             <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">选择图标</label>
                             <div className="grid grid-cols-6 gap-2">
                                 {availableIcons.map(icon => (
                                     <button 
                                        key={icon}
                                        onClick={() => setSelectedIcon(icon)}
                                        className={`aspect-square rounded-lg flex items-center justify-center transition-colors ${selectedIcon === icon ? 'bg-primary text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                     >
                                         <span className="material-symbols-outlined text-xl">{icon}</span>
                                     </button>
                                 ))}
                             </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreateCategoryOpen(false)}
                                className="flex-1 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreateCategory}
                                className="flex-1 py-3.5 bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-colors shadow-lg shadow-primary/20"
                            >
                                创建
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center justify-between p-4 pb-2">
                    <button
                        onClick={() => onChangeView(ViewState.SETTINGS)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 overflow-hidden active:scale-95 transition-transform hover:bg-primary/20"
                        title="设置"
                    >
                        <img alt="用户头像" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtm14Tj4BvWOgWLN1t047dgkOBZlpBxM4iNhA5OaIdo3eYK-Qnfqzno75prvU9bUvqnt9lQH-6crWmfQFhSg9M7EdZQGlC9j299zC-J3dJNeF9XdNwpN2KNBRrGsBNKkGe5qVqfF3CkVCy2iZGexI01LGq6ePlJK8FLAtlIfeaf51kuZsY7n2ON78iy7wtvsfLhPFFELpkqEBZWq8H2f63DFBvUite_GZ0p_UqK2mCXqABCbkSyNyAXoRLNtfZ7UqWdOQiXjLfObM" />
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">库存概览</h1>
                    <div className="flex w-10 items-center justify-end"></div>
                </div>
            </header>

            <main className="max-w-md mx-auto">
                {/* Stats Cards */}
                <section className="p-4">
                    <div className="flex gap-4">
                        <button
                            onClick={() => onChangeView(ViewState.INVENTORY_LIST, 'Expiring')}
                            className="flex flex-1 flex-col gap-1 rounded-xl p-5 border border-primary/30 bg-primary/5 relative overflow-hidden group active:scale-95 transition-transform cursor-pointer"
                        >
                             <div className="absolute -right-4 -top-4 bg-primary/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <p className="text-sm font-medium opacity-80">即将过期</p>
                                <span className="material-symbols-outlined text-orange-400 text-lg">warning</span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-1 relative z-10">
                                <p className="text-3xl font-black tracking-tight">{stats.expiring}</p>
                                <p className="text-orange-400 text-xs font-bold">需注意</p>
                            </div>
                        </button>
                        <div className="flex flex-1 flex-col gap-1 rounded-xl p-5 border border-white/10 bg-white/5 relative overflow-hidden group">
                             <div className="absolute -left-4 -bottom-4 bg-white/5 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                            <p className="text-sm font-medium opacity-80 relative z-10">物品总数</p>
                            <div className="flex items-baseline gap-2 mt-1 relative z-10">
                                <p className="text-3xl font-black tracking-tight">{stats.total}</p>
                                <p className="text-primary text-xs font-bold">库存中</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section className="mt-2">
                    <div className="flex items-center justify-between px-4 mb-4">
                        <h2 className="text-xl font-bold tracking-tight">分类</h2>
                        <button
                            onClick={() => setIsCreateCategoryOpen(true)}
                            className="text-primary text-sm font-bold hover:opacity-80 transition-opacity"
                        >
                            创建新分类
                        </button>
                    </div>
                    {/* 横向滚动的分类列表 */}
                    <div
                        ref={categoryScrollRef}
                        className="flex gap-3 px-4 overflow-x-auto pb-2 snap-x snap-mandatory"
                    >
                        {categories.map((cat, index) => (
                            <button
                                key={cat.id}
                                onClick={() => onChangeView(ViewState.INVENTORY_LIST, cat.id)}
                                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 shadow-sm active:scale-95 transition-transform hover:bg-white/10 min-w-[100px] shrink-0 snap-start"
                            >
                                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className={`material-symbols-outlined`} style={{ color: cat.color }}>{cat.icon}</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">{cat.name}</p>
                                    <p className="text-[10px] opacity-60 uppercase tracking-wider">{cat.count} 件</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 分类轮播指示器 */}
                    <div className="flex justify-center gap-1.5 mt-3 px-4">
                        {categories.length > 0 && categories.map((_, index) => (
                            <div
                                key={index}
                                className={`rounded-full transition-all ${
                                    index === currentCategoryPage
                                        ? 'bg-primary w-2 h-2'
                                        : 'bg-white/20 w-1.5 h-1.5'
                                }`}
                            />
                        ))}
                    </div>
                </section>

                {/* Recently Added */}
                <section className="mt-8">
                    <div className="flex items-center justify-between px-4 mb-4">
                        <h2 className="text-xl font-bold tracking-tight">最近添加</h2>
                    </div>
                    <div className="space-y-3 px-4 pb-4">
                        {recentItems.map((item) => {
                            const status = getItemStatus(item);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onChangeView(ViewState.ITEM_DETAIL, item.id)}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    <div className="size-14 rounded-lg bg-white/10 overflow-hidden shrink-0">
                                        {item.image ? (
                                            <img alt={item.name} className="w-full h-full object-cover" src={item.image} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white/20">inventory_2</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{item.name}</p>
                                        <p className="text-xs opacity-60">{item.description || formatDate(item.expiry_date)}</p>
                                        <div className="flex items-center gap-1 mt-1 text-primary">
                                            <span className="material-symbols-outlined text-sm icon-filled">star</span>
                                            <span className="text-[10px] font-bold">{item.rating || 5.0}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.color}`}>{status.text}</span>
                                        <p className="text-[10px] opacity-40">{item.description ? '最近添加' : ''}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <button
                onClick={() => onChangeView(ViewState.BATCH_ENTRY)}
                className="fixed bottom-24 right-6 size-14 rounded-full bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center active:scale-90 transition-transform z-50 hover:bg-blue-400"
            >
                <span className="material-symbols-outlined text-2xl font-bold">add</span>
            </button>
        </div>
    );
};

export default React.memo(Home);