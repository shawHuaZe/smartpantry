import React, { useState, useEffect } from 'react';
import { itemsAPI, shoppingAPI } from '../utils/api';

interface ItemDetailProps {
    itemId: string | null;
    onBack: () => void;
}

interface Item {
    id: string;
    name: string;
    description: string;
    quantity: number;
    category: string;
    expiry_date: string;
    purchase_date: string;
    image: string;
    rating: number;
    tags: string[];
    is_recommended: boolean;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, onBack }) => {
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [reviewText, setReviewText] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [myRating, setMyRating] = useState(5.0);

    useEffect(() => {
        if (itemId) {
            loadItem();
        }
    }, [itemId]);

    const loadItem = async () => {
        if (!itemId) return;

        try {
            setLoading(true);
            const data = await itemsAPI.getById(itemId);
            setItem(data.item);
            setMyRating(data.item.rating || 5.0);
            setReviewText(data.item.description || "暂无评价");
        } catch (error) {
            console.error('加载物品详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!item) return;

        try {
            await shoppingAPI.add({
                name: item.name,
                sub: item.description,
                count: 1,
                category: item.category === 'Food' ? '食品' :
                         item.category === 'Medicine' ? '医药' :
                         item.category === 'Home' ? '日用品' : '其他',
                icon: item.category === 'Food' ? 'restaurant' :
                       item.category === 'Medicine' ? 'medical_services' :
                       item.category === 'Home' ? 'shopping_basket' : 'category',
                image: item.image
            });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        } catch (error) {
            console.error('添加到购物清单失败:', error);
        }
    };

    const handleRatingClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const x = e.clientX - rect.left;
        
        // If clicked on left half, set x.5, else set x+1
        if (x < width / 2) {
            setMyRating(index + 0.5);
        } else {
            setMyRating(index + 1);
        }
    };

    const renderStar = (index: number) => {
        let iconName = 'star'; // default full
        let isFilled = true;

        if (myRating >= index + 1) {
            iconName = 'star';
            isFilled = true;
        } else if (myRating >= index + 0.5) {
            iconName = 'star_half';
            isFilled = true;
        } else {
            iconName = 'star';
            isFilled = false;
        }

        return (
            <div 
                key={index} 
                className="relative cursor-pointer w-[18px] flex justify-center"
                onClick={(e) => handleRatingClick(e, index)}
            >
                <span className={`material-symbols-outlined text-[18px] ${isFilled ? 'icon-filled text-primary' : 'text-primary/30'}`}>
                    {iconName}
                </span>
            </div>
        );
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

    if (!item) {
        return (
            <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">未找到物品</p>
                    <button onClick={onBack} className="mt-4 px-6 py-2 bg-primary rounded-xl">返回</button>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return '未设置';
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const categoryMap: Record<string, string> = {
        'Food': '食品',
        'Medicine': '医药',
        'Home': '日用品',
        'Other': '其他'
    };

    return (
        <div className="pb-safe min-h-screen bg-background-dark relative">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-white/10">
                    <span className="material-symbols-outlined text-green-500 icon-filled">check_circle</span>
                    <span className="font-bold">已加入清单</span>
                </div>
            )}

            {/* Edit Review Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#1a2c38] w-full max-w-sm rounded-2xl p-5 border border-white/10 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-lg">编辑评价</h3>
                            <button onClick={() => setIsEditing(false)} className="size-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm font-bold text-slate-300">评分:</span>
                            <div className="flex gap-1 cursor-pointer">
                                {[0, 1, 2, 3, 4].map((i) => renderStar(i))}
                            </div>
                            <span className="text-sm font-bold text-primary ml-2">{myRating}</span>
                        </div>
                        <textarea 
                            value={reviewText} 
                            onChange={e => setReviewText(e.target.value)} 
                            className="w-full bg-black/20 text-white rounded-xl p-4 text-sm leading-relaxed min-h-[160px] outline-none border border-white/5 focus:border-primary/50 transition-colors resize-none"
                            placeholder="写下您的评价..."
                        />
                        <button 
                            onClick={() => setIsEditing(false)} 
                            className="w-full mt-4 bg-primary text-background-dark font-bold py-3.5 rounded-xl hover:brightness-110 transition-all active:scale-[0.98]"
                        >
                            保存修改
                        </button>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between">
                <button onClick={onBack} className="text-white flex size-12 shrink-0 items-center cursor-pointer">
                    <span className="material-symbols-outlined text-white text-3xl">chevron_left</span>
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">{categoryMap[item.category] || '物品'}详情</h2>
                <div className="flex w-12 items-center justify-end">
                    <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>

            <div className="max-w-md mx-auto pb-40">
                <div className="@container">
                    <div className="px-4 py-3">
                        <div className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-[#112214] rounded-xl min-h-80 relative shadow-2xl" style={{ backgroundImage: item.image ? `url("${item.image}")` : 'none', backgroundColor: !item.image ? '#1a2c38' : undefined }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-background-dark/20 to-transparent"></div>
                            <div className="relative p-6">
                                {item.is_recommended && (
                                    <span className="bg-primary text-background-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block shadow-lg">热销推荐</span>
                                )}
                                <h1 className="text-white tracking-tight text-[32px] font-black leading-tight">{item.name}</h1>
                                <p className="text-primary/90 text-sm font-bold leading-normal">{item.description || '暂无描述'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-6 pb-2">
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-background-dark icon-filled text-xl">thumb_up</span>
                            </div>
                            <div>
                                <p className="text-primary text-sm font-black tracking-wide leading-none">{item.is_recommended ? '强烈推荐' : '普通物品'}</p>
                                <p className="text-white/50 text-xs mt-1.5 font-medium">库存: {item.quantity} 件</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white text-3xl font-black leading-none tabular-nums">{item.rating || 5.0}</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-white/40">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">购买日期</span>
                        </div>
                        <p className="text-white font-bold text-sm">{formatDate(item.purchase_date)}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-white/40">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">分类</span>
                        </div>
                        <p className="text-white font-bold text-sm">{categoryMap[item.category] || '其他'}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 col-span-2 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-white/40">
                                <span className="material-symbols-outlined text-[18px]">event</span>
                                <span className="text-[12px] font-bold tracking-widest uppercase">过期日期</span>
                            </div>
                        </div>
                        <p className={`font-bold text-sm ${item.expiry_date && new Date(item.expiry_date) < new Date() ? 'text-red-400' : 'text-orange-400'}`}>
                            {item.expiry_date ? formatDate(item.expiry_date) : '无限期'}
                        </p>
                    </div>
                </div>

                <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-white/80 text-sm font-black tracking-widest">我的评价</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-1 text-primary">
                                {[0, 1, 2, 3, 4].map((i) => renderStar(i))}
                            </div>
                            <span className="text-white/30 text-[10px] font-medium tabular-nums">2023年10月15日</span>
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed font-medium">
                            “{reviewText}”
                        </p>
                        <div className="mt-4 border-t border-white/10 pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar flex-1">
                                {item.tags && item.tags.length > 0 ? (
                                    item.tags.map((tag, index) => (
                                        <span key={index} className="text-white/40 text-[10px] font-bold pr-3 py-1.5 whitespace-nowrap">#{tag}</span>
                                    ))
                                ) : (
                                    <span className="text-white/40 text-[10px] font-medium">暂无标签</span>
                                )}
                            </div>
                            <button onClick={() => setIsEditing(true)} className="text-[#339cff] text-[11px] font-black flex items-center gap-1 hover:brightness-110 transition-all ml-2 shrink-0">
                                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                                <span>编辑评价</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
                <button onClick={handleAdd} className="pointer-events-auto bg-gradient-to-br from-primary to-blue-600 w-32 h-10 rounded-full flex items-center justify-center gap-2 text-white font-black text-xs active:scale-95 transition-all duration-200 border border-white/20 hover:brightness-110">
                    <span className="material-symbols-outlined text-base">shopping_cart</span>
                    <span className="tracking-wide">加入清单</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(ItemDetail);