import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { ViewState } from '../types';
import { itemsAPI } from '../utils/api';

interface StatisticsProps {
    onChangeView?: (view: ViewState, itemId?: string) => void;
}

interface FrequentItem {
    id: string;
    name: string;
    image: string;
    purchaseDays: number;
}

const Statistics: React.FC<StatisticsProps> = ({ onChangeView }) => {
    const [timeRange, setTimeRange] = useState<'6M' | '1Y'>('6M');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        expiring: 0,
        byCategory: {} as Record<string, number>
    });
    const [frequentItems, setFrequentItems] = useState<FrequentItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const statsData = await itemsAPI.getStats();
            setStats(statsData || { total: 0, expiring: 0, byCategory: {} });

            // 获取所有物品，找出复购频率高的物品（这里简化处理，显示最近添加的物品）
            const itemsData = await itemsAPI.getAll();

            // 计算每个物品的复购天数（简化版：如果有多个同名的物品）
            const itemGroups: Record<string, any[]> = {};
            itemsData.items?.forEach((item: any) => {
                if (!itemGroups[item.name]) {
                    itemGroups[item.name] = [];
                }
                itemGroups[item.name].push(item);
            });

            const frequent: FrequentItem[] = Object.entries(itemGroups)
                .filter(([_, items]) => items.length > 1)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 4)
                .map(([name, items]: [string, any]) => ({
                    id: items[0].id,
                    name,
                    image: items[0].image,
                    purchaseDays: 14 + Math.floor(Math.random() * 30) // 模拟数据
                }));

            setFrequentItems(frequent);
        } catch (error) {
            console.error('加载统计数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 构建饼图数据
    const pieData = [
        { name: '食物', value: stats.byCategory?.Food || 0, color: '#339cff' },
        { name: '日用品', value: stats.byCategory?.Home || 0, color: '#fb923c' },
        { name: '药品', value: stats.byCategory?.Medicine || 0, color: '#34d399' },
        { name: '其他', value: stats.byCategory?.Other || 0, color: '#9775fa' },
    ].filter(item => item.value > 0);

    // 计算总支出（模拟数据）
    const totalExpense = stats.total * 15; // 假设平均每件物品15元

    // 模拟月度趋势数据
    const barData6M = [
        { name: '10月', val: Math.floor(stats.total * 0.3) },
        { name: '11月', val: Math.floor(stats.total * 0.4) },
        { name: '12月', val: Math.floor(stats.total * 0.5) },
        { name: '1月', val: Math.floor(stats.total * 0.45) },
        { name: '2月', val: Math.floor(stats.total * 0.6) },
        { name: '3月', val: stats.total || 1 },
    ];

    const barData1Y = [
        { name: '4月', val: Math.floor(stats.total * 0.2) },
        { name: '5月', val: Math.floor(stats.total * 0.3) },
        { name: '6月', val: Math.floor(stats.total * 0.35) },
        { name: '7月', val: Math.floor(stats.total * 0.3) },
        { name: '8月', val: Math.floor(stats.total * 0.4) },
        { name: '9月', val: Math.floor(stats.total * 0.35) },
        { name: '10月', val: Math.floor(stats.total * 0.3) },
        { name: '11月', val: Math.floor(stats.total * 0.4) },
        { name: '12月', val: Math.floor(stats.total * 0.5) },
        { name: '1月', val: Math.floor(stats.total * 0.45) },
        { name: '2月', val: Math.floor(stats.total * 0.6) },
        { name: '3月', val: stats.total || 1 },
    ];

    const currentBarData = timeRange === '6M' ? barData6M : barData1Y;

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
        <div className="pb-28">
            <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 overflow-hidden">
                        <img alt="用户头像" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtm14Tj4BvWOgWLN1t047dgkOBZlpBxM4iNhA5OaIdo3eYK-Qnfqzno75prvU9bUvqnt9lQH-6crWmfQFhSg9M7EdZQGlC9j299zC-J3dJNeF9XdNwpN2KNBRrGsBNKkGe5qVqfF3CkVCy2iZGexI01LGq6ePlJK8FLAtlIfeaf51kuZsY7n2ON78iy7wtvsfLhPFFELpkqEBZWq8H2f63DFBvUite_GZ0p_UqK2mCXqABCbkSyNyAXoRLNtfZ7UqWdOQiXjLfObM" />
                    </div>
                    <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">统计分析</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-2">
                {/* Expense Analysis */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold tracking-tight">支出分析</h2>
                        <span className="text-xs opacity-50">本月累计</span>
                    </div>
                    {pieData.length > 0 ? (
                        <div className="flex items-center gap-8">
                            <div className="relative size-32 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={35}
                                            outerRadius={50}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={6} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs opacity-60">总支出</span>
                                    <span className="text-sm font-bold">¥{(totalExpense / 1000).toFixed(1)}k</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 flex-1">
                                {pieData.map((item) => {
                                    const percent = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                                    return (
                                        <div key={item.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-sm opacity-80">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold">{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">暂无数据</p>
                        </div>
                    )}
                </div>

                {/* Monthly Trend */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-sm mt-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold tracking-tight">月度购买趋势</h2>
                        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                            <button
                                onClick={() => setTimeRange('6M')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md shadow-sm transition-all ${timeRange === '6M' ? 'bg-white/20 text-white' : 'opacity-40 hover:opacity-100'}`}
                            >
                                6个月
                            </button>
                            <button
                                onClick={() => setTimeRange('1Y')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md shadow-sm transition-all ${timeRange === '1Y' ? 'bg-white/20 text-white' : 'opacity-40 hover:opacity-100'}`}
                            >
                                1年
                            </button>
                        </div>
                    </div>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentBarData}>
                                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                    {currentBarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === currentBarData.length - 1 ? '#339cff' : 'rgba(51, 156, 255, 0.2)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between px-2 mt-2">
                            {currentBarData.length <= 6 ? (
                                currentBarData.map((d, i) => (
                                    <span key={i} className={`text-[10px] ${i === currentBarData.length - 1 ? 'font-bold text-white' : 'opacity-40'}`}>{d.name}</span>
                                ))
                            ) : (
                                <>
                                    <span className="text-[10px] opacity-40">{currentBarData[0].name}</span>
                                    <span className="text-[10px] opacity-40">...</span>
                                    <span className="text-[10px] font-bold text-white">{currentBarData[currentBarData.length - 1].name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* High Frequency */}
                <section className="mt-8 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold tracking-tight">高频复购物品</h2>
                        <button className="text-primary text-sm font-bold">更多</button>
                    </div>
                    {frequentItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {frequentItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onChangeView?.(ViewState.ITEM_DETAIL, item.id)}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
                                >
                                    <div className="size-16 rounded-lg overflow-hidden mb-3">
                                        {item.image ? (
                                            <img alt={item.name} className="w-full h-full object-cover" src={item.image} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/10">
                                                <span className="material-symbols-outlined text-white/20">inventory_2</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold mb-1 truncate w-full">{item.name}</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-primary icon-filled">repeat</span>
                                        <span className="text-[10px] opacity-60">每{item.purchaseDays}天购买</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-slate-600">repeat</span>
                            <p className="text-slate-500 mt-4">暂无复购数据</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default React.memo(Statistics);
