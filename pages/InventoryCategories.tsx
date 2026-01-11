import React, { useState, useEffect, useRef } from 'react';
import { ViewState, CategoryData } from '../types';
import { itemsAPI, categoriesAPI } from '../utils/api';

interface InventoryCategoriesProps {
    onChangeView: (view: ViewState, categoryId?: string) => void;
}

interface StatCard {
    title: string;
    value: number;
    unit: string;
    icon: string;
    color: string;
    bgColor: string;
}

const InventoryCategories: React.FC<InventoryCategoriesProps> = ({ onChangeView }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ total: 0, expiring: 0, byCategory: {} as Record<string, number> });
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryData | null>(null);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('category');

    const availableIcons = [
        'category', 'restaurant', 'home', 'pill', 'checkroom', 'pets',
        'sports_esports', 'school', 'directions_car', 'fitness_center', 'work', 'flight'
    ];

    const availableColors = [
        '#339cff', '#ff6b6b', '#51cf66', '#9775fa', '#ff922b',
        '#ff6b9d', '#ffd43b', '#69db7c', '#748ffc', '#ffa94d'
    ];

    const statCards: StatCard[] = [
        {
            title: '即将过期',
            value: stats.expiring,
            unit: '件需注意',
            icon: 'warning',
            color: 'text-orange-400',
            bgColor: 'bg-orange-400/20'
        },
        {
            title: '物品总数',
            value: stats.total,
            unit: '件在库',
            icon: 'inventory_2',
            color: 'text-primary',
            bgColor: 'bg-primary/20'
        }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, categoriesData] = await Promise.all([
                itemsAPI.getStats(),
                categoriesAPI.getAll()
            ]);

            setStats(statsData || { total: 0, expiring: 0, byCategory: {} });

            // 构建分类数据
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

            setCategories(Object.values(categoryMap));
        } catch (error) {
            console.error('加载分类数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (moveItems: boolean) => {
        if (!deleteConfirm) return;

        try {
            await categoriesAPI.delete(deleteConfirm.id, moveItems);
            await loadData(); // 重新加载数据
            setDeleteConfirm(null);
        } catch (error: any) {
            alert(error.message || '删除分类失败');
        }
    };

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

    // 长按开始
    const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent, category: CategoryData) => {
        // 阻止默认右键菜单
        if (e.type === 'contextmenu') {
            e.preventDefault();
        }

        // 只有自定义分类可以删除（内置分类Food, Medicine, Home, Other不可删除）
        if (['Food', 'Medicine', 'Home', 'Other'].includes(category.id)) {
            return;
        }

        const timer = setTimeout(() => {
            setDeleteConfirm(category);
        }, 500); // 500ms长按

        setLongPressTimer(timer);
    };

    // 长按结束
    const handleLongPressEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCategoryImage = (categoryId: string) => {
        const images: Record<string, string> = {
            'Food': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
            'Medicine': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
            'Home': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
            'Other': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
        };
        return images[categoryId] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';
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

    return (
        <div className="pb-28 bg-background-dark min-h-screen">
            {/* 删除确认弹窗 */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-[#1a2c38] w-full max-w-sm rounded-2xl p-5 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-3xl text-red-400">delete</span>
                            <h3 className="text-xl font-bold text-white">删除分类</h3>
                        </div>

                        <p className="text-white/80 text-sm mb-4">
                            确定要删除分类 <span className="text-primary font-bold">"{deleteConfirm.name}"</span> 吗？
                            {deleteConfirm.count > 0 && (
                                <span className="block mt-2 text-orange-400">
                                    该分类下有 {deleteConfirm.count} 件物品
                                </span>
                            )}
                        </p>

                        {deleteConfirm.count > 0 && (
                            <div className="bg-white/5 rounded-xl p-4 mb-4">
                                <p className="text-xs text-white/60 mb-3">请选择物品处理方式：</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleDelete(true)}
                                        className="w-full py-3 px-4 bg-primary/20 text-primary rounded-xl font-bold hover:bg-primary/30 transition-colors text-left flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">folder_move</span>
                                        <div>
                                            <div className="text-sm">保留物品</div>
                                            <div className="text-xs opacity-70">移动到"其他"分类</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(false)}
                                        className="w-full py-3 px-4 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-colors text-left flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">delete_forever</span>
                                        <div>
                                            <div className="text-sm">删除物品</div>
                                            <div className="text-xs opacity-70">同时删除分类下的所有物品</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                            >
                                取消
                            </button>
                            {deleteConfirm.count === 0 && (
                                <button
                                    onClick={() => handleDelete(false)}
                                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    确认删除
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                <div className="flex items-center justify-between p-4 pb-2 max-w-md mx-auto">
                    <button
                        onClick={() => onChangeView(ViewState.SETTINGS)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 overflow-hidden active:scale-95 transition-transform hover:bg-primary/20"
                        title="设置"
                    >
                        <img alt="用户头像" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtm14Tj4BvWOgWLN1t047dgkOBZlpBxM4iNhA5OaIdo3eYK-Qnfqzno75prvU9bUvqnt9lQH-6crWmfQFhSg9M7EdZQGlC9j299zC-J3dJNeF9XdNwpN2KNBRrGsBNKkGe5qVqfF3CkVCy2iZGexI01LGq6ePlJK8FLAtlIfeaf51kuZsY7n2ON78iy7wtvsfLhPFFELpkqEBZWq8H2f63DFBvUite_GZ0p_UqK2mCXqABCbkSyNyAXoRLNtfZ7UqWdOQiXjLfObM" />
                    </button>
                    <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">库存分类</h1>
                    <div className="flex w-10 items-center justify-end"></div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4">
                {/* Search Bar */}
                <div className="py-4">
                    <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm bg-white/5 border border-white/10">
                            <div className="text-slate-400 flex border-none items-center justify-center pl-4 rounded-l-xl">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-slate-500 px-4 pl-2 text-base font-normal"
                                placeholder="搜索分类"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4 mb-6">
                    {statCards.map((stat, index) => (
                        <div key={index} className={`flex flex-1 flex-col gap-1 rounded-xl p-5 border border-white/10 bg-white/5 relative overflow-hidden group`}>
                            <div className="absolute -right-4 -top-4 bg-white/5 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <p className="text-sm font-medium opacity-80">{stat.title}</p>
                                <span className={`material-symbols-outlined ${stat.color} text-lg`}>{stat.icon}</span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-1 relative z-10">
                                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                                <p className={`text-xs font-bold ${stat.color}`}>{stat.unit}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {filteredCategories.map((category) => {
                        const isCustomCategory = !['Food', 'Medicine', 'Home', 'Other'].includes(category.id);
                        return (
                            <div
                                key={category.id}
                                className="relative group/category"
                                onContextMenu={(e) => handleLongPressStart(e, category)}
                                onMouseDown={(e) => handleLongPressStart(e, category)}
                                onMouseUp={handleLongPressEnd}
                                onMouseLeave={handleLongPressEnd}
                                onTouchStart={(e) => handleLongPressStart(e, category)}
                                onTouchEnd={handleLongPressEnd}
                            >
                                <button
                                    onClick={() => onChangeView(ViewState.INVENTORY_LIST, category.id)}
                                    className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-0 transition-all active:scale-95 hover:bg-white/10 w-full"
                                >
                                    <div className="absolute inset-0">
                                        <img
                                            src={getCategoryImage(category.id)}
                                            alt={category.name}
                                            className="w-full h-full object-cover opacity-30 group-hover/category:opacity-40 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                    </div>
                                    <div className="relative p-5 flex flex-col items-start gap-3 h-44 justify-end">
                                        <div className="size-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <span className="material-symbols-outlined" style={{ color: category.color }}>
                                                {category.icon}
                                            </span>
                                        </div>
                                        <div className="w-full">
                                            <p className="text-white text-lg font-bold text-left">{category.name}</p>
                                            <p className="text-white/60 text-xs font-medium text-left mt-1">
                                                {category.count} 件物品
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* 删除提示 */}
                                {isCustomCategory && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/category:opacity-100 transition-opacity">
                                        <div className="bg-black/60 backdrop-blur-md rounded-full p-1.5">
                                            <span className="material-symbols-outlined text-white/60 text-sm">
                                                delete
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add Category Button */}
                <button
                    onClick={() => setIsCreateCategoryOpen(true)}
                    className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-white/10 text-slate-400 font-bold hover:bg-white/5 hover:border-white/20 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined align-middle mr-2">add</span>
                    创建新分类
                </button>

                {/* 长按提示 */}
                <div className="text-center mt-6">
                    <p className="text-xs text-white/30">长按自定义分类可删除</p>
                </div>
            </main>

            {/* 浮动添加按钮 */}
            <button
                onClick={() => onChangeView(ViewState.BATCH_ENTRY)}
                className="fixed bottom-24 right-6 size-14 rounded-full bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center active:scale-90 transition-transform z-50 hover:bg-blue-400"
            >
                <span className="material-symbols-outlined text-2xl font-bold">add</span>
            </button>
        </div>
    );
};

export default React.memo(InventoryCategories);
