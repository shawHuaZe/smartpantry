const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 获取存储的 token
const getToken = (): string | null => {
  return localStorage.getItem('smartpantry_token');
};

// 保存 token
const saveToken = (token: string): void => {
  localStorage.setItem('smartpantry_token', token);
};

// 清除 token
const clearToken = (): void => {
  localStorage.removeItem('smartpantry_token');
};

// 通用请求函数
const request = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error: any) {
    console.error('API 请求错误:', endpoint, error);
    if (error.message === 'Failed to fetch') {
      throw new Error('无法连接到服务器，请检查网络连接');
    }
    if (error.message === '未提供认证令牌' || error.message === '无效的令牌') {
      // 清除无效的token
      clearToken();
      throw new Error('请先登录');
    }
    throw error;
  }
};

// ==================== 认证 API ====================
export const authAPI = {
  // 注册
  register: async (email: string, password: string, username?: string) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    if (data.token) {
      saveToken(data.token);
    }
    return data;
  },

  // 登录
  login: async (email: string, password: string) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      saveToken(data.token);
    }
    return data;
  },

  // 获取当前用户信息
  getProfile: async () => {
    return await request('/auth/me');
  },

  // 更新用户资料
  updateProfile: async (updates: { username?: string; avatar_url?: string }) => {
    return await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 登出
  logout: () => {
    clearToken();
  },

  isAuthenticated: (): boolean => {
    return !!getToken();
  },
};

// ==================== 物品 API ====================
export const itemsAPI = {
  // 获取所有物品
  getAll: async (params?: { category?: string; search?: string; expiring?: boolean }) => {
    const queryString = new URLSearchParams(params as any).toString();
    return await request(`/items${queryString ? `?${queryString}` : ''}`);
  },

  // 获取单个物品
  getById: async (id: string) => {
    return await request(`/items/${id}`);
  },

  // 创建物品
  create: async (item: {
    name: string;
    description?: string;
    quantity?: number;
    category?: string;
    expiry_date?: string;
    purchase_date?: string;
    image?: string;
    rating?: number;
    tags?: string[];
  }) => {
    return await request('/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // 更新物品
  update: async (id: string, updates: any) => {
    return await request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除物品
  delete: async (id: string) => {
    return await request(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  // 获取统计信息
  getStats: async () => {
    return await request('/items/stats/summary');
  },
};

// ==================== 购物清单 API ====================
export const shoppingAPI = {
  // 获取购物清单
  getAll: async () => {
    return await request('/shopping');
  },

  // 添加购物项
  add: async (item: {
    name: string;
    sub?: string;
    count?: number;
    category?: string;
    icon?: string;
    image?: string;
  }) => {
    return await request('/shopping', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // 更新购物项
  update: async (id: string, updates: any) => {
    return await request(`/shopping/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除购物项
  delete: async (id: string) => {
    return await request(`/shopping/${id}`, {
      method: 'DELETE',
    });
  },

  // 清空购物清单
  clear: async () => {
    return await request('/shopping/clear/all', {
      method: 'DELETE',
    });
  },

  // 移入库存
  moveToInventory: async (itemIds: string[]) => {
    return await request('/shopping/move-to-inventory', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    });
  },
};

// ==================== 分类 API ====================
export const categoriesAPI = {
  // 获取所有分类
  getAll: async () => {
    return await request('/categories');
  },

  // 创建分类
  create: async (category: { name: string; icon?: string; color?: string }) => {
    return await request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  // 更新分类
  update: async (id: string, updates: any) => {
    return await request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 删除分类
  delete: async (id: string, moveItems: boolean = false) => {
    return await request(`/categories/${id}?moveItems=${moveItems}`, {
      method: 'DELETE',
    });
  },
};

// ==================== 扫描 API ====================
export const scanAPI = {
  // 扫描小票
  scanReceipt: async (imageData: string) => {
    return await request('/scan/receipt', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  },

  // 保存到购物清单
  saveToShoppingList: async (items: any[]) => {
    return await request('/scan/save-to-shopping-list', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  // 保存到库存
  saveToInventory: async (items: any[]) => {
    return await request('/scan/save-to-inventory', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },
};

export default { authAPI, itemsAPI, shoppingAPI, categoriesAPI, scanAPI };
