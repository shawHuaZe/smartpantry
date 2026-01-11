export enum ViewState {
    LOGIN = 'LOGIN',
    HOME = 'HOME',
    SCAN = 'SCAN',
    SHOPPING_LIST = 'SHOPPING_LIST',
    STATISTICS = 'STATISTICS',
    SETTINGS = 'SETTINGS',
    ITEM_DETAIL = 'ITEM_DETAIL',
    MEDICINE_LIST = 'MEDICINE_LIST',
    INVENTORY_CATEGORIES = 'INVENTORY_CATEGORIES',
    INVENTORY_LIST = 'INVENTORY_LIST',
    BATCH_ENTRY = 'BATCH_ENTRY'
}

export interface Item {
    id: string;
    name: string;
    description: string;
    quantity: number;
    category: 'Food' | 'Medicine' | 'Home' | 'Other';
    expiryDate?: string;
    purchaseDate?: string;
    image: string;
    rating?: number;
    tags?: string[];
    isExpiringSoon?: boolean;
}

export interface ShoppingItem extends Item {
    checked: boolean;
}

export interface CategoryData {
    id: string;
    name: string;
    icon: string;
    count: number;
    color: string;
}