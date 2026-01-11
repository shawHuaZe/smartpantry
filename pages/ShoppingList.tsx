import React, { useState, useEffect } from 'react';
import { shoppingAPI } from '../utils/api';

interface ShoppingListProps {
    onBack: () => void;
}

interface ShoppingItem {
    id: string;
    name: string;
    sub: string;
    count: number;
    category: string;
    icon: string;
    image: string;
    checked: boolean;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ onBack }) => {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadShoppingList();
    }, []);

    const loadShoppingList = async () => {
        try {
            setLoading(true);
            const data = await shoppingAPI.getAll();
            setItems(data.items || []);
        } catch (error) {
            console.error('加载购物清单失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        try {
            await shoppingAPI.update(id, { checked: !item.checked });
            setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
        } catch (error) {
            console.error('更新失败:', error);
        }
    };

    const clearItems = async () => {
        try {
            await shoppingAPI.clear();
            setItems([]);
        } catch (error) {
            console.error('清空失败:', error);
        }
    };

    const moveToInventory = async () => {
        const checkedItems = items.filter(i => i.checked);
        if (checkedItems.length === 0) {
            alert('请先选择要移入库存的物品');
            return;
        }

        try {
            await shoppingAPI.moveToInventory(checkedItems.map(i => i.id));
            // 重新加载列表
            await loadShoppingList();
        } catch (error) {
            console.error('移入库存失败:', error);
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

    const categories = Array.from(new Set(items.map(i => i.category)));

    return (
        <div className="pb-32 min-h-screen bg-background-dark">
            <div className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 pb-4 justify-between border-b border-white/5">
                <button onClick={onBack} className="text-white flex size-10 shrink-0 items-center cursor-pointer">
                    <span className="material-symbols-outlined text-white">arrow_back_ios</span>
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">购物清单</h2>
                <div className="flex size-10 items-center justify-end">
                    <button onClick={clearItems} className="text-white/60 text-sm font-medium hover:text-white">清空</button>
                </div>
            </div>

            <div className="max-w-md mx-auto">
                <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-background-dark cursor-pointer" type="checkbox" />
                        <span className="text-sm font-medium text-white/70 group-hover:text-white">全选</span>
                    </label>
                    <span className="text-xs text-white/40 font-medium">共 {items.length} 件待办</span>
                </div>

                {categories.map(cat => (
                    <div key={cat} className="mb-6">
                        <div className="px-4 py-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">{items.find(i => i.category === cat)?.icon}</span>
                            <h3 className="text-white font-bold tracking-wide">{cat}</h3>
                        </div>
                        <div className="space-y-1">
                            {items.filter(i => i.category === cat).map((item, idx) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${idx > 0 ? 'border-t border-white/5' : ''}`}
                                    onClick={() => toggleCheck(item.id)}
                                >
                                    <input
                                        checked={item.checked}
                                        onChange={() => toggleCheck(item.id)}
                                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-background-dark cursor-pointer"
                                        type="checkbox"
                                    />
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                        {item.img ? (
                                            <img alt={item.name} className="w-full h-full object-cover" src={item.img} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                <span className="material-symbols-outlined text-white/20">{item.iconData}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex-1 ${item.checked ? 'opacity-50' : ''}`}>
                                        <h4 className={`text-white font-medium text-base ${item.checked ? 'line-through' : ''}`}>{item.name}</h4>
                                        <p className="text-white/40 text-xs">{item.sub}</p>
                                    </div>
                                    <div className={`flex items-center gap-3 ${item.checked ? 'opacity-50' : ''}`}>
                                        <span className="text-primary font-bold">x{item.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <span className="material-symbols-outlined text-6xl mb-4">shopping_cart_off</span>
                        <p>清单是空的</p>
                    </div>
                )}
            </div>

            <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent pb-8 pointer-events-none">
                <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
                    <button onClick={clearItems} className="flex-1 bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-white/20">
                        <span className="material-symbols-outlined text-white/70">delete</span>
                        清空
                    </button>
                    <button onClick={moveToInventory} className="flex-[2] bg-primary text-background-dark font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-blue-400">
                        <span className="material-symbols-outlined icon-filled">inventory_2</span>
                        移入库存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ShoppingList);