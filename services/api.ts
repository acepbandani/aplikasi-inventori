import { Product, Order, OrderStatus, User } from '../types';

// --- Database dikembalikan ke localStorage untuk stabilitas ---
// Layanan npoint.io sedang tidak stabil dan menyebabkan error 500.
// Dengan localStorage, aplikasi akan selalu berjalan cepat dan andal,
// namun data hanya akan tersimpan di browser ini.

const DB_KEY = 'susu_uht_database';

interface Database {
    products: Product[];
    orders: Order[];
}

const initialProducts: Product[] = [
    {
        id: 1,
        name: 'Susu UHT Coklat 250ml',
        price: 5500,
        stock: 100,
        description: 'Susu UHT rasa coklat yang lezat dan bergizi, cocok untuk anak-anak dan dewasa.',
        image: 'https://images.tokopedia.net/img/cache/700/VqbcmM/2021/11/24/a859364b-2268-4ac4-958a-3e8f85f5736b.jpg',
        status: 'Aktif',
    },
    {
        id: 2,
        name: 'Susu UHT Stroberi 250ml',
        price: 5500,
        stock: 80,
        description: 'Kesegaran rasa stroberi asli dalam setiap tegukan. Kaya akan vitamin.',
        image: 'https://images.tokopedia.net/img/cache/700/hDjmkQ/2021/12/2/a75f1b8c-4c28-4f8a-9f93-1b9195f2694b.jpg',
        status: 'Aktif',
    },
    {
        id: 3,
        name: 'Susu UHT Full Cream 1L',
        price: 18000,
        stock: 50,
        description: 'Susu murni full cream, sumber kalsium dan protein untuk keluarga.',
        image: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//98/MTA-30232431/ultra_jaya_ultra_milk_susu_uht_full_cream_1000ml_full01_b532e8d1.jpg',
        status: 'Aktif',
    },
    {
        id: 4,
        name: 'Susu UHT Low Fat 1L',
        price: 20000,
        stock: 0,
        description: 'Pilihan lebih sehat dengan kandungan lemak lebih rendah, tetap nikmat.',
        image: 'https://d2qjkwm11akmwu.cloudfront.net/products/524859_22-4-2022_12-25-39.webp',
        status: 'Tidak Aktif',
    },
];


// Helper untuk mengambil seluruh database dari localStorage
const _getDb = (): Database => {
    try {
        const dbString = localStorage.getItem(DB_KEY);
        if (dbString) {
            return JSON.parse(dbString);
        }
    } catch (e) {
        console.error("Failed to parse DB from localStorage", e);
    }
    // Jika tidak ada data, inisialisasi dengan data awal
    const initialDb: Database = {
        products: initialProducts,
        orders: [],
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    return initialDb;
};

// Helper untuk menyimpan seluruh database ke localStorage
const _saveDb = (db: Database): void => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (error) {
        console.error("Failed to save DB to localStorage", error);
    }
};

const users: User[] = [
    { id: 1, name: 'Admin Susu', email: 'admin@susuuht.com' }
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
    // --- Login tetap lokal ---
    login: async (email: string, password: string): Promise<User> => {
        await simulateDelay(500);
        if (email === 'admin@susuuht.com' && password === 'password') {
            return users[0];
        }
        throw new Error('Email atau password salah');
    },

    // --- Semua fungsi CRUD sekarang berinteraksi dengan localStorage ---
    getProducts: async (): Promise<Product[]> => {
        const db = _getDb();
        return Promise.resolve(db.products);
    },

    addProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
        const db = _getDb();
        const newProduct: Product = { ...productData, id: Date.now() };
        db.products.push(newProduct);
        _saveDb(db);
        return Promise.resolve(newProduct);
    },
    
    updateProduct: async (productData: Product): Promise<Product> => {
        const db = _getDb();
        db.products = db.products.map(p => p.id === productData.id ? productData : p);
        _saveDb(db);
        return Promise.resolve(productData);
    },

    deleteProduct: async (productId: number): Promise<{ success: boolean }> => {
        const db = _getDb();
        db.products = db.products.filter(p => p.id !== productId);
        _saveDb(db);
        return Promise.resolve({ success: true });
    },

    getOrders: async (): Promise<Order[]> => {
        const db = _getDb();
        // Sorting tetap di client-side setelah data diterima
        return Promise.resolve([...db.orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    },
    
    submitOrder: async (orderData: Omit<Order, 'id' | 'status' | 'orderDate' | 'productName'>): Promise<Order> => {
        const db = _getDb();
        const product = db.products.find(p => p.id === orderData.productId);

        if (!product) throw new Error("Produk tidak ditemukan");
        if(product.stock < orderData.quantity) throw new Error("Stok tidak mencukupi");
        
        // Kurangi stok produk
        product.stock -= orderData.quantity;

        const newOrder: Order = {
            ...orderData,
            id: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(db.orders.length + 1).padStart(3, '0')}`,
            status: OrderStatus.WAITING,
            orderDate: new Date().toISOString(),
            productName: product.name,
        };
        db.orders.push(newOrder);
        
        _saveDb(db);
        return Promise.resolve(newOrder);
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
        const db = _getDb();
        let updatedOrder: Order | undefined;

        db.orders = db.orders.map(order => {
            if (order.id === orderId) {
                // Jika pesanan ditolak, kembalikan stoknya
                if (status === OrderStatus.REJECTED && order.status !== OrderStatus.REJECTED) {
                    const product = db.products.find(p => p.id === order.productId);
                    if (product) {
                        product.stock += order.quantity;
                    }
                }
                updatedOrder = { ...order, status };
                return updatedOrder;
            }
            return order;
        });

        if (!updatedOrder) {
            throw new Error("Pesanan tidak ditemukan");
        }
        
        _saveDb(db);
        return Promise.resolve(updatedOrder);
    },
};