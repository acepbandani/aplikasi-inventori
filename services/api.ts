import { Product, Order, OrderStatus, User } from '../types';

// --- Database dipindahkan ke npoint.io untuk sinkronisasi antar perangkat ---
// Ini memungkinkan data menjadi terpusat dan dapat diakses oleh siapa saja.
// Setiap perubahan akan langsung terlihat oleh semua pengguna.

const API_URL = 'https://api.npoint.io/46f4a88f7b3c224b17f8';

interface Database {
    products: Product[];
    orders: Order[];
}

// Helper untuk mengambil seluruh database dari npoint.io
const _getDb = async (): Promise<Database> => {
    try {
        const response = await fetch(API_URL, {
            // Selalu ambil data terbaru dari server, jangan gunakan cache
            cache: 'no-cache',
        });
        if (!response.ok) {
            console.error("API Fetch Error:", response.status);
            throw new Error(`Gagal mengambil data dari server.`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch from API", error);
        throw new Error('Gagal mengambil data dari server.');
    }
};

// Helper untuk menyimpan seluruh database ke npoint.io
const _saveDb = async (db: Database): Promise<void> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(db),
        });
        if (!response.ok) {
            console.error("API Save Error:", response.status);
            throw new Error(`Gagal menyimpan data ke server.`);
        }
    } catch (error) {
        console.error("Failed to save to API", error);
        throw new Error('Gagal menyimpan data ke server.');
    }
};


const users: User[] = [
    { id: 1, name: 'Admin Susu', email: 'admin@susuuht.com' }
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
    // --- Login tetap lokal, tidak memerlukan database terpusat ---
    login: async (email: string, password: string): Promise<User> => {
        await simulateDelay(500);
        if (email === 'admin@susuuht.com' && password === 'password') {
            return users[0];
        }
        throw new Error('Email atau password salah');
    },

    // --- Semua fungsi CRUD sekarang berinteraksi dengan API ---
    getProducts: async (): Promise<Product[]> => {
        const db = await _getDb();
        return db.products;
    },

    addProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
        const db = await _getDb();
        const newProduct: Product = { ...productData, id: Date.now() };
        db.products.push(newProduct);
        await _saveDb(db);
        return newProduct;
    },
    
    updateProduct: async (productData: Product): Promise<Product> => {
        const db = await _getDb();
        db.products = db.products.map(p => p.id === productData.id ? productData : p);
        await _saveDb(db);
        return productData;
    },

    deleteProduct: async (productId: number): Promise<{ success: boolean }> => {
        const db = await _getDb();
        db.products = db.products.filter(p => p.id !== productId);
        await _saveDb(db);
        return { success: true };
    },

    getOrders: async (): Promise<Order[]> => {
        const db = await _getDb();
        // Sorting tetap di client-side setelah data diterima
        return [...db.orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    },
    
    submitOrder: async (orderData: Omit<Order, 'id' | 'status' | 'orderDate' | 'productName'>): Promise<Order> => {
        const db = await _getDb();
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
        
        await _saveDb(db);
        return newOrder;
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
        const db = await _getDb();
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
        
        await _saveDb(db);
        return updatedOrder;
    },
};