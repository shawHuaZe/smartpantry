import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { itemsAPI } from '../utils/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

// 正确的 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api';

interface BatchEntryProps {
    onBack: () => void;
    onScan: () => void;
}

interface RecognizedItem {
    id: string;
    name: string;
    price: number;
    category: string;
    quantity: string;
    quantityNumber: number;
    expiryDate?: string;
    image?: string;
    isProcessing?: boolean;
    isGeneratingImage?: boolean;
}

const BatchEntry: React.FC<BatchEntryProps> = ({ onBack, onScan }) => {
    const { showToast } = useToast();
    const { showConfirm } = useConfirm();

    const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);
    const [textInput, setTextInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [editingItem, setEditingItem] = useState<RecognizedItem | null>(null);
    const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
    const [photoType, setPhotoType] = useState<'item' | 'receipt'>('receipt'); // 拍照类型
    const [editForm, setEditForm] = useState({
        name: '',
        price: 0,
        category: 'Other',
        quantityNumber: 1,
        quantityUnit: '个',
        expiryDate: ''
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editImageInputRef = useRef<HTMLInputElement>(null);

    // 图片压缩函数
    const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // 计算缩放比例
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('无法获取canvas上下文'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // 压缩并转换为base64
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = () => reject(new Error('图片加载失败'));
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
        });
    };

    // 调用AI识别文本
    const handleTextInput = async () => {
        if (!textInput.trim()) return;

        setIsProcessing(true);

        // 添加处理中的占位项
        const placeholderId = `placeholder-${Date.now()}`;
        setRecognizedItems(prev => [...prev, {
            id: placeholderId,
            name: '',
            price: 0,
            category: '',
            quantity: '',
            quantityNumber: 0,
            isProcessing: true
        }]);

        try {
            const response = await fetch(`${API_BASE_URL}/ai/understand-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('smartpantry_token')}`
                },
                body: JSON.stringify({ text: textInput })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '识别失败');
            }

            const data = await response.json();

            if (data.success && data.items) {
                const newItems = data.items.map((item: any, index: number) => {
                    // 解析数量字符串，提取数字和单位
                    const quantityMatch = item.quantity?.match(/(\d+)(.*)/);
                    const quantityNumber = quantityMatch ? parseInt(quantityMatch[1]) : 1;
                    const quantityUnit = quantityMatch?.[2]?.trim() || '个';

                    return {
                        id: `ai-${Date.now()}-${index}`,
                        name: item.name,
                        price: item.price,
                        category: item.category,
                        quantity: item.quantity,
                        quantityNumber,
                        expiryDate: ''
                    };
                });

                // 移除占位项，添加真实结果
                setRecognizedItems(prev => {
                    const withoutPlaceholder = prev.filter(item => item.id !== placeholderId);
                    return [...withoutPlaceholder, ...newItems];
                });

                setTextInput('');
            }
        } catch (error: any) {
            console.error('AI识别失败:', error);
            showToast(`识别失败: ${error.message}`, 'error');
            // 移除占位项
            setRecognizedItems(prev => prev.filter(item => item.id !== placeholderId));
        } finally {
            setIsProcessing(false);
        }
    };

    // 为物品生成图片
    const generateImageForItem = async (item: RecognizedItem): Promise<string> => {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('smartpantry_token')}`
                },
                body: JSON.stringify({
                    name: item.name,
                    category: item.category
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '图片生成失败');
            }

            const data = await response.json();
            if (data.success && data.imageUrl) {
                return data.imageUrl;
            }

            throw new Error('未能获取生成的图片');
        } catch (error) {
            console.error('图片生成失败:', error);
            throw error;
        }
    };

    // 手动生成图片（在编辑弹窗中使用）- 异步版本
    const handleGenerateImage = async () => {
        if (!editingItem) return;

        setGeneratingImageId(editingItem.id);
        try {
            // 使用异步API，立即返回
            const response = await fetch(`${API_BASE_URL}/ai/generate-image-async`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('smartpantry_token')}`
                },
                body: JSON.stringify({
                    itemId: editingItem.id,
                    name: editingItem.name,
                    category: editingItem.category
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '图片生成任务提交失败');
            }

            const data = await response.json();
            if (data.success) {
                // 标记为生成中
                setRecognizedItems(prev => prev.map(item => {
                    if (item.id === editingItem.id) {
                        return { ...item, isGeneratingImage: true };
                    }
                    return item;
                }));

                // 关闭编辑弹窗
                setEditingItem(null);

                showToast('图片生成任务已提交，将在后台处理，稍后可在库存中查看', 'success');
            }
        } catch (error: any) {
            showToast(`图片生成任务提交失败: ${error.message}`, 'error');
        } finally {
            setGeneratingImageId(null);
        }
    };

    // 处理编辑弹窗中的图片上传
    const handleEditImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !editingItem) return;

        try {
            // 压缩图片
            const compressedImage = await compressImage(file, 1024, 0.7);

            // 更新编辑物品的图片
            setEditingItem({
                ...editingItem,
                image: compressedImage
            });

            // 更新列表中的物品
            setRecognizedItems(prev => prev.map(item => {
                if (item.id === editingItem.id) {
                    return { ...item, image: compressedImage };
                }
                return item;
            }));
        } catch (error) {
            console.error('图片上传失败:', error);
            showToast('图片上传失败，请重试', 'error');
        }

        // 重置input
        event.target.value = '';
    };

    // 处理拍照
    const handleCamera = () => {
        // 弹出选择框：拍实物还是拍小票
        showConfirm({
            title: '选择拍照类型',
            message: '请选择拍照类型：\n\n• 拍实物照片 - 保存照片到物品\n• 拍小票/发票 - 不保存照片，AI自动生成',
            confirmText: '拍实物',
            cancelText: '拍小票',
            type: 'info',
            onConfirm: () => {
                setPhotoType('item');
                fileInputRef.current?.click();
            },
            onCancel: () => {
                setPhotoType('receipt');
                fileInputRef.current?.click();
            }
        });
    };

    // 处理图片上传
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);

        // 添加处理中的占位项
        const placeholderId = `placeholder-${Date.now()}`;
        setRecognizedItems(prev => [...prev, {
            id: placeholderId,
            name: '',
            price: 0,
            category: '',
            quantity: '',
            quantityNumber: 0,
            isProcessing: true
        }]);

        try {
            // 压缩图片
            const compressedImage = await compressImage(file, 1024, 0.7);

            const response = await fetch(`${API_BASE_URL}/ai/recognize-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('smartpantry_token')}`
                },
                body: JSON.stringify({ image: compressedImage })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '识别失败');
            }

            const data = await response.json();

            if (data.success && data.items) {
                const newItems = data.items.map((item: any, index: number) => {
                    // 解析数量字符串，提取数字和单位
                    const quantityMatch = item.quantity?.match(/(\d+)(.*)/);
                    const quantityNumber = quantityMatch ? parseInt(quantityMatch[1]) : 1;
                    const quantityUnit = quantityMatch?.[2]?.trim() || '个';

                    return {
                        id: `ai-${Date.now()}-${index}`,
                        name: item.name,
                        price: item.price,
                        category: item.category,
                        quantity: item.quantity,
                        quantityNumber,
                        expiryDate: '',
                        // 如果是实物照片就保存，如果是小票就不保存（后续AI生成）
                        image: photoType === 'item' ? compressedImage : undefined
                    };
                });

                // 移除占位项，添加真实结果
                setRecognizedItems(prev => {
                    const withoutPlaceholder = prev.filter(item => item.id !== placeholderId);
                    return [...withoutPlaceholder, ...newItems];
                });
            }
        } catch (error: any) {
            console.error('图片识别失败:', error);
            showToast(`识别失败: ${error.message}`, 'error');
            setRecognizedItems(prev => prev.filter(item => item.id !== placeholderId));
        } finally {
            setIsProcessing(false);
        }

        // 重置input，允许重复上传同一文件
        event.target.value = '';
    };

    // 处理语音输入
    const handleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        // 启动浏览器语音识别（如果支持）
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'zh-CN';
                recognition.continuous = false;
                recognition.interimResults = false;

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setTextInput(transcript);
                    setIsListening(false);
                };

                recognition.onerror = (event: any) => {
                    console.error('语音识别错误:', event.error);
                    setIsListening(false);
                    showToast('语音识别失败，请重试', 'error');
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.start();
                return;
            }
        }

        // 浏览器不支持语音识别
        showToast('您的浏览器不支持语音识别，请使用Chrome浏览器', 'warning');
    };

    // 打开编辑弹窗
    const handleEditItem = (item: RecognizedItem) => {
        setEditingItem(item);
        setEditForm({
            name: item.name,
            price: item.price,
            category: item.category,
            quantityNumber: item.quantityNumber || 1,
            quantityUnit: item.quantity?.replace(/[0-9]/g, '') || '个',
            expiryDate: item.expiryDate || ''
        });
    };

    // 保存编辑
    const handleSaveEdit = () => {
        if (!editingItem) return;

        setRecognizedItems(prev => prev.map(item => {
            if (item.id === editingItem.id) {
                return {
                    ...item,
                    name: editForm.name,
                    price: editForm.price,
                    category: editForm.category,
                    quantityNumber: editForm.quantityNumber,
                    quantity: `${editForm.quantityNumber}${editForm.quantityUnit}`,
                    expiryDate: editForm.expiryDate
                };
            }
            return item;
        }));

        setEditingItem(null);
    };

    // 处理确认入库
    const handleConfirmBatch = async () => {
        if (recognizedItems.length === 0) {
            showToast('请先添加物品', 'warning');
            return;
        }

        try {
            // 批量创建物品（不等待图片生成）
            let successCount = 0;
            const itemsToGenerateImages: Array<{ id: string; name: string; category: string }> = [];

            for (const item of recognizedItems) {
                if (item.isProcessing) continue;

                // 直接创建物品，不等待图片生成
                const createdItem = await itemsAPI.create({
                    name: item.name,
                    description: `价格: ¥${item.price.toFixed(2)}`,
                    quantity: item.quantityNumber,
                    category: item.category,
                    expiry_date: item.expiryDate || undefined,
                    image: item.image, // 如果有图片就用，没有就为空
                    rating: 5.0
                });

                successCount++;

                // 如果没有图片，记录下来后续生成
                if (!item.image && createdItem.item?.id) {
                    itemsToGenerateImages.push({
                        id: createdItem.item.id,
                        name: item.name,
                        category: item.category
                    });
                }
            }

            // 后台提交图片生成任务（不阻塞）
            for (const item of itemsToGenerateImages) {
                fetch(`${API_BASE_URL}/ai/generate-image-async`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('smartpantry_token')}`
                    },
                    body: JSON.stringify({
                        itemId: item.id,
                        name: item.name,
                        category: item.category
                    })
                }).then(response => {
                    if (response.ok) {
                        console.log(`图片生成任务已提交: ${item.name}`);
                    }
                }).catch(error => {
                    console.error(`图片生成任务提交失败: ${item.name}`, error);
                });
            }

            // 成功后返回首页
            const imageMessage = itemsToGenerateImages.length > 0
                ? `，${itemsToGenerateImages.length} 张图片将在后台生成`
                : '';
            showToast(`成功入库 ${successCount} 件物品！${imageMessage}`, 'success');
            onBack();
        } catch (error) {
            console.error('批量入库失败:', error);
            showToast('入库失败，请重试', 'error');
        }
    };

    // 清空列表
    const handleClearList = () => {
        if (recognizedItems.length === 0) return;

        showConfirm({
            title: '清空列表',
            message: '确定要清空所有已识别的物品吗？',
            confirmText: '清空',
            cancelText: '取消',
            type: 'warning',
            onConfirm: () => {
                setRecognizedItems([]);
            }
        });
    };

    // 删除单项
    const handleRemoveItem = (id: string) => {
        setRecognizedItems(prev => prev.filter(item => item.id !== id));
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Food': 'restaurant',
            'Medicine': 'medication',
            'Home': 'cleaning_services',
            'Other': 'inventory_2'
        };
        return icons[category] || 'inventory_2';
    };

    const getCategoryName = (category: string) => {
        const names: Record<string, string> = {
            'Food': '食物',
            'Medicine': '药品',
            'Home': '日用品',
            'Other': '其他'
        };
        return names[category] || '其他';
    };

    return (
        <div className="pb-32 bg-background-dark min-h-screen flex flex-col">
            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />

            {/* Header */}
            <header className="flex-none bg-background-dark/90 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center p-4 justify-between max-w-md mx-auto">
                    <button onClick={onBack} className="flex size-10 items-center justify-start cursor-pointer active:opacity-50">
                        <span className="material-symbols-outlined text-2xl text-slate-400">arrow_back_ios</span>
                    </button>
                    <h1 className="text-[17px] font-bold tracking-tight flex-1 text-center">批量智能录入</h1>
                    <div className="flex w-10 items-center justify-end">
                        <button className="flex size-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-2xl">history</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col max-w-md mx-auto w-full relative">
                {/* 识别结果列表 */}
                <section className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">识别结果</span>
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {recognizedItems.filter(i => !i.isProcessing).length} 项已就绪
                            </span>
                        </div>
                        {recognizedItems.length > 0 && (
                            <button
                                onClick={handleClearList}
                                className="text-xs text-slate-500 hover:text-primary transition-colors"
                            >
                                清空列表
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {recognizedItems.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-6xl text-slate-600">shopping_bag</span>
                                <p className="text-slate-500 mt-4">暂无识别结果</p>
                                <p className="text-slate-600 text-sm mt-2">拍照或输入文字开始识别</p>
                            </div>
                        ) : (
                            recognizedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="glass-card p-4 rounded-2xl flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center border border-white/5">
                                        {item.isProcessing ? (
                                            <span className="material-symbols-outlined text-primary text-xl animate-spin" style={{ animationDuration: '3s' }}>
                                                sync
                                            </span>
                                        ) : item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-400">
                                                {getCategoryIcon(item.category)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="font-bold text-sm text-white truncate pr-2">{item.name}</h3>
                                            {!item.isProcessing && (
                                                <span className="text-primary font-bold text-sm flex-shrink-0">¥{item.price.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {!item.isProcessing ? (
                                                <>
                                                    <span className="text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
                                                        {getCategoryName(item.category)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">数量: {item.quantity}</span>
                                                    {item.expiryDate && (
                                                        <span className="text-[10px] text-orange-400">
                                                            {item.expiryDate} 过期
                                                        </span>
                                                    )}
                                                    {item.isGeneratingImage ? (
                                                        <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs animate-spin" style={{ animationDuration: '2s' }}>sync</span>
                                                            正在生成图片...
                                                        </span>
                                                    ) : !item.image && (
                                                        <span className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                                            待生成图片
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-slate-500">AI正在识别中...</span>
                                            )}
                                        </div>
                                    </div>
                                    {!item.isProcessing && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="p-2 text-slate-400 hover:text-primary active:text-primary transition-colors"
                                                title="编辑"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="p-2 text-slate-500 hover:text-red-400 active:text-red-400 transition-colors"
                                                title="删除"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* 快速录入区域 */}
                <section className="flex-none px-5 pt-4 pb-6 bg-gradient-to-t from-background-dark/80 to-transparent">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            快速录入
                        </label>
                        <div className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-primary"></span>
                            <span className="text-[10px] text-slate-400">AI 辅助</span>
                        </div>
                    </div>
                    <div className="relative group">
                        <textarea
                            ref={textareaRef}
                            className="w-full h-[90px] p-4 rounded-2xl bg-slate-900/90 border border-slate-700/50 text-base leading-relaxed placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none shadow-inner"
                            placeholder="描述购买的物品，如：超市买菜花了45元..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            disabled={isProcessing}
                        />
                        <div className="absolute bottom-2.5 right-2.5">
                            <button
                                onClick={handleTextInput}
                                disabled={!textInput.trim() || isProcessing}
                                className="bg-primary text-white p-2.5 rounded-xl active:scale-90 transition-transform shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-xl">keyboard_return</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* 底部操作栏 */}
            <footer className="flex-none p-5 pb-10 bg-slate-900/95 border-t border-white/5 backdrop-blur-2xl">
                <div className="max-w-md mx-auto grid grid-cols-[auto_auto_1fr] gap-3">
                    <button
                        onClick={handleCamera}
                        disabled={isProcessing}
                        className="size-14 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all border border-white/5 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-2xl">photo_camera</span>
                        <span className="text-[9px] mt-0.5 font-bold uppercase tracking-tighter">拍照</span>
                    </button>
                    <button
                        onClick={handleVoiceInput}
                        disabled={isProcessing}
                        className={`size-14 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all border relative disabled:opacity-50 ${
                            isListening
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-white/5'
                        }`}
                    >
                        <span className="material-symbols-outlined text-2xl">mic</span>
                        <span className="text-[9px] mt-0.5 font-bold uppercase tracking-tighter">语音</span>
                        {isListening && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleConfirmBatch}
                        disabled={recognizedItems.length === 0 || isProcessing}
                        className="h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/25 flex items-center justify-between px-5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-xs opacity-80 font-medium">确认入库</span>
                            <span className="text-sm">共 {recognizedItems.filter(i => !i.isProcessing).length} 件物品</span>
                        </div>
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </button>
                </div>
            </footer>

            {/* 编辑弹窗 */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white mb-6">编辑物品信息</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">物品名称</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="输入物品名称"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">价格</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">分类</label>
                                        <select
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="Food">食物</option>
                                            <option value="Medicine">药品</option>
                                            <option value="Home">日用品</option>
                                            <option value="Other">其他</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">数量</label>
                                        <input
                                            type="number"
                                            value={editForm.quantityNumber}
                                            onChange={(e) => setEditForm({ ...editForm, quantityNumber: parseInt(e.target.value) || 1 })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">单位</label>
                                        <select
                                            value={editForm.quantityUnit}
                                            onChange={(e) => setEditForm({ ...editForm, quantityUnit: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="个">个</option>
                                            <option value="盒">盒</option>
                                            <option value="袋">袋</option>
                                            <option value="瓶">瓶</option>
                                            <option value="包">包</option>
                                            <option value="箱">箱</option>
                                            <option value="斤">斤</option>
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">过期日期（可选）</label>
                                    <input
                                        type="date"
                                        value={editForm.expiryDate}
                                        onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                {/* 图片预览和生成 */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">物品图片</label>
                                    <div className="flex items-start gap-3">
                                        {editingItem.image ? (
                                            <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden border border-white/10 relative group">
                                                <img
                                                    src={editingItem.image}
                                                    alt={editingItem.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-600 text-3xl">image</span>
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col gap-2">
                                            <button
                                                onClick={handleGenerateImage}
                                                disabled={generatingImageId === editingItem.id}
                                                className="w-full py-2 px-4 rounded-xl bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {generatingImageId === editingItem.id ? (
                                                    <>
                                                        <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                                                        <span>生成中...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-xl">auto_awesome</span>
                                                        <span>AI生成图片</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => editImageInputRef.current?.click()}
                                                className="w-full py-2 px-4 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-xl">upload</span>
                                                <span>上传图片</span>
                                            </button>
                                        </div>
                                    </div>
                                    {/* 隐藏的文件输入 */}
                                    <input
                                        ref={editImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleEditImageUpload}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-medium active:scale-[0.98] transition-transform"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 py-3 rounded-xl bg-primary text-white font-medium active:scale-[0.98] transition-transform"
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 全局样式 */}
            <style>{`
                .glass-card {
                    background: rgba(30, 41, 59, 0.4);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
            `}</style>
        </div>
    );
};

export default React.memo(BatchEntry);
