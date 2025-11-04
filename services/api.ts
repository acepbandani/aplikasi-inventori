
import { Product, Order, OrderStatus, User } from '../types';

let products: Product[] = [
    { id: 1, name: 'Susu UHT Coklat 1L', price: 18000, stock: 150, description: 'Susu UHT rasa coklat, kaya akan kalsium dan vitamin.', image: 'https://picsum.photos/seed/milk1/400/300', status: 'Aktif' },
    { id: 2, name: 'Susu UHT Full Cream 1L', price: 17000, stock: 200, description: 'Susu UHT murni tanpa tambahan rasa, cocok untuk keluarga.', image: 'https://picsum.photos/seed/milk2/400/300', status: 'Aktif' },
    { id: 3, name: 'Susu UHT Stroberi 1L', price: 18500, stock: 120, description: 'Susu UHT dengan rasa stroberi segar yang disukai anak-anak.', image: 'https://picsum.photos/seed/milk3/400/300', status: 'Aktif' },
    { id: 4, name: 'Susu UHT Low Fat 1L', price: 19000, stock: 80, description: 'Susu UHT rendah lemak, pilihan sehat untuk diet Anda.', image: 'https://picsum.photos/seed/milk4/400/300', status: 'Aktif' },
    { id: 5, name: 'Susu UHT Vanilla 250ml', price: 5000, stock: 0, description: 'Susu UHT rasa vanilla dalam kemasan praktis.', image: 'https://picsum.photos/seed/milk5/400/300', status: 'Tidak Aktif' },
];

let orders: Order[] = [
    { id: 'INV-20251104-001', customerName: 'Budi Santoso', phone: '081234567890', address: 'Jl. Merdeka No. 10, Jakarta', productId: 2, productName: 'Susu UHT Full Cream 1L', quantity: 2, totalPrice: 34000, status: OrderStatus.CONFIRMED, orderDate: '2023-10-28', ktpPath: 'ktp_budi.jpg', latitude: -6.1754, longitude: 106.8272 },
    { id: 'INV-20251104-002', customerName: 'Ani Yudhoyono', phone: '082345678901', address: 'Jl. Sudirman No. 15, Bandung', productId: 1, productName: 'Susu UHT Coklat 1L', quantity: 3, totalPrice: 54000, status: OrderStatus.WAITING, orderDate: '2023-10-29', ktpPath: 'ktp_ani.jpg' },
    { id: 'INV-20251104-003', customerName: 'Citra Lestari', phone: '083456789012', address: 'Jl. Gajah Mada No. 20, Surabaya', productId: 3, productName: 'Susu UHT Stroberi 1L', quantity: 1, totalPrice: 18500, status: OrderStatus.REJECTED, orderDate: '2023-10-30', ktpPath: 'ktp_citra.jpg' },
];

const users: User[] = [
    { id: 1, name: 'Admin Susu', email: 'admin@susuuht.com' }
];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
    login: async (email: string, password: string): Promise<User> => {
        await simulateDelay(500);
        if (email === 'admin@susuuht.com' && password === 'password') {
            return users[0];
        }
        throw new Error('Email atau password salah');
    },

    getProducts: async (): Promise<Product[]> => {
        await simulateDelay(300);
        return [...products];
    },

    addProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
        await simulateDelay(500);
        const newProduct: Product = { ...productData, id: Date.now() };
        products.push(newProduct);
        return newProduct;
    },
    
    updateProduct: async (productData: Product): Promise<Product> => {
        await simulateDelay(500);
        products = products.map(p => p.id === productData.id ? productData : p);
        return productData;
    },

    deleteProduct: async (productId: number): Promise<{ success: boolean }> => {
        await simulateDelay(500);
        products = products.filter(p => p.id !== productId);
        return { success: true };
    },

    getOrders: async (): Promise<Order[]> => {
        await simulateDelay(300);
        return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    },
    
    submitOrder: async (orderData: Omit<Order, 'id' | 'status' | 'orderDate' | 'productName'>): Promise<Order> => {
        await simulateDelay(1000);
        const product = products.find(p => p.id === orderData.productId);
        if (!product) throw new Error("Produk tidak ditemukan");
        if(product.stock < orderData.quantity) throw new Error("Stok tidak mencukupi");
        
        product.stock -= orderData.quantity;

        const newOrder: Order = {
            ...orderData,
            id: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orders.length + 1).padStart(3, '0')}`,
            status: OrderStatus.WAITING,
            orderDate: new Date().toISOString().slice(0, 10),
            productName: product.name,
        };
        orders.push(newOrder);
        return newOrder;
    },

    updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
        await simulateDelay(500);
        const order = orders.find(o => o.id === orderId);
        if (!order) throw new Error("Pesanan tidak ditemukan");
        order.status = status;
        return order;
    },
};
