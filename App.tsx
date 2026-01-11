import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { ViewState } from './types';
import Login from './pages/Login';
import Home from './pages/Home';
import Scan from './pages/Scan';
import ShoppingList from './pages/ShoppingList';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import ItemDetail from './pages/ItemDetail';
import MedicineList from './pages/MedicineList';
import InventoryCategories from './pages/InventoryCategories';
import InventoryList from './pages/InventoryList';
import BatchEntry from './pages/BatchEntry';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
    const [previousView, setPreviousView] = useState<ViewState>(ViewState.HOME);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [scanSource, setScanSource] = useState<ViewState | null>(null);
    const currentViewRef = useRef<ViewState>(currentView);

    // 更新ref
    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    // 检查登录状态
    useEffect(() => {
        const token = localStorage.getItem('smartpantry_token');
        if (token) {
            setCurrentView(ViewState.HOME);
        }
    }, []);

    // 处理 Android 返回键
    useEffect(() => {
        const setupBackButton = async () => {
            if (!Capacitor.isNativePlatform()) return;

            await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                if (canGoBack) {
                    // 如果可以返回，返回上一页
                    handleBack();
                } else {
                    // 如果不能返回，退出应用
                    CapacitorApp.exitApp();
                }
            });
        };

        setupBackButton();

        return () => {
            // 清理监听器
            CapacitorApp.removeAllListeners();
        };
    }, [currentView]);

    const handleNavigate = useCallback((view: ViewState, itemId?: string) => {
        const currentViewValue = currentViewRef.current;

        // Track where we came from when going to detail pages
        if (view === ViewState.ITEM_DETAIL && itemId) {
            setSelectedItemId(itemId);
            setPreviousView(currentViewValue);
        }
        // Track category for inventory list
        else if (view === ViewState.INVENTORY_LIST && itemId) {
            setSelectedCategoryId(itemId);
            setPreviousView(currentViewValue);
        }
        // Track scan source
        else if (view === ViewState.SCAN) {
            setScanSource(currentViewValue);
        }

        setCurrentView(view);
    }, []);

    // 处理返回操作
    const handleBack = useCallback(() => {
        const view = currentViewRef.current;

        switch (view) {
            case ViewState.ITEM_DETAIL:
                setCurrentView(previousView);
                break;
            case ViewState.INVENTORY_LIST:
                setCurrentView(ViewState.INVENTORY_CATEGORIES);
                break;
            case ViewState.BATCH_ENTRY:
            case ViewState.SCAN:
                setCurrentView(ViewState.HOME);
                break;
            case ViewState.LOGIN:
                // 登录页按返回键不做任何操作
                break;
            default:
                // 其他页面返回首页
                if (view !== ViewState.HOME) {
                    setCurrentView(ViewState.HOME);
                }
                break;
        }
    }, [previousView]);

    // Determines if the bottom nav should be visible
    const showBottomNav = useMemo(() => [
        ViewState.HOME,
        ViewState.STATISTICS,
        ViewState.SETTINGS,
        ViewState.SHOPPING_LIST,
        ViewState.MEDICINE_LIST,
        ViewState.INVENTORY_CATEGORIES
    ].includes(currentView), [currentView]);

    return (
        <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary/30">
            {currentView === ViewState.LOGIN && (
                <Login onLogin={() => handleNavigate(ViewState.HOME)} />
            )}

            {currentView === ViewState.HOME && (
                <Home onChangeView={handleNavigate} />
            )}

            {currentView === ViewState.INVENTORY_CATEGORIES && (
                <InventoryCategories onChangeView={handleNavigate} />
            )}

            {currentView === ViewState.INVENTORY_LIST && (
                <InventoryList
                    categoryId={selectedCategoryId || 'Other'}
                    onBack={() => setCurrentView(ViewState.INVENTORY_CATEGORIES)}
                    onItemClick={(itemId) => handleNavigate(ViewState.ITEM_DETAIL, itemId)}
                    onScan={() => handleNavigate(ViewState.BATCH_ENTRY)}
                />
            )}

            {currentView === ViewState.STATISTICS && (
                <Statistics onChangeView={handleNavigate} />
            )}

            {currentView === ViewState.SETTINGS && (
                <Settings onChangeView={handleNavigate} />
            )}

            {currentView === ViewState.SHOPPING_LIST && (
                <ShoppingList onBack={() => handleNavigate(ViewState.HOME)} />
            )}

            {currentView === ViewState.MEDICINE_LIST && (
                <MedicineList
                    onBack={() => handleNavigate(ViewState.HOME)}
                    onItemClick={(itemId) => handleNavigate(ViewState.ITEM_DETAIL, itemId)}
                    onScan={() => handleNavigate(ViewState.BATCH_ENTRY)}
                />
            )}

            {currentView === ViewState.ITEM_DETAIL && (
                <ItemDetail
                    itemId={selectedItemId}
                    onBack={() => setCurrentView(previousView)}
                />
            )}

            {currentView === ViewState.BATCH_ENTRY && (
                <BatchEntry
                    onBack={() => handleNavigate(ViewState.HOME)}
                    onScan={() => handleNavigate(ViewState.SCAN)}
                />
            )}

            {currentView === ViewState.SCAN && (
                <Scan
                    onClose={() => handleNavigate(scanSource || ViewState.HOME)}
                    onFinish={() => handleNavigate(
                        scanSource === ViewState.BATCH_ENTRY
                            ? ViewState.BATCH_ENTRY
                            : ViewState.SHOPPING_LIST
                    )}
                />
            )}

            {/* Bottom Navigation */}
            {showBottomNav && (
                <BottomNav activeView={currentView} onChangeView={handleNavigate} />
            )}
        </div>
    );
};

export default App;
