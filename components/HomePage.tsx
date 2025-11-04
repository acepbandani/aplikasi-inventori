
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Product, Order } from '../types';
import { api } from '../services/api';
import { LoadingSpinner } from './Icons';

// Product Card Component
const ProductCard: React.FC<{ product: Product; onOrder: (product: Product) => void; }> = ({ product, onOrder }) => {
    const isAvailable = product.stock > 0 && product.status === 'Aktif';
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
            <img className="h-48 w-full object-cover" src={product.image} alt={product.name} />
            <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4 h-12 overflow-hidden">{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-2xl font-bold text-blue-600">Rp {product.price.toLocaleString('id-ID')}</p>
                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        Stok: {product.stock}
                    </span>
                </div>
                <button
                    onClick={() => onOrder(product)}
                    disabled={!isAvailable}
                    className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    Pesan Sekarang
                </button>
            </div>
        </div>
    );
};


// Order Modal Component
const OrderModal: React.FC<{ product: Product | null; onClose: () => void; onSubmit: (order: any, ktpFile: File) => void; loading: boolean; }> = ({ product, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        quantity: 1,
    });
    const [ktpFile, setKtpFile] = useState<File | null>(null);
    const [ktpPreview, setKtpPreview] = useState<string | null>(null);
    const [locationStatus, setLocationStatus] = useState<string>('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!product) return;
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [product, onClose]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? Math.max(1, parseInt(value)) : value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Ukuran file KTP tidak boleh lebih dari 2MB.');
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                setError('Format file KTP harus JPG atau PNG.');
                return;
            }
            setError('');
            setKtpFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setKtpPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation tidak didukung oleh browser ini.');
            return;
        }
        setLocationStatus('Mengambil lokasi...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                setLocationStatus(`Lokasi berhasil didapat!`);
            },
            () => {
                setLocationStatus('Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.');
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!product || !ktpFile || !formData.customerName || !formData.phone || !formData.address) {
            setError('Semua field wajib diisi dan KTP harus diupload.');
            return;
        }
        if (formData.quantity > product.stock) {
            setError('Jumlah pesanan melebihi stok yang tersedia.');
            return;
        }
        
        const orderData = {
            ...formData,
            productId: product.id,
            totalPrice: product.price * formData.quantity,
            ktpPath: ktpFile.name, // Mock path
        };
        onSubmit(orderData, ktpFile);
    };
    

    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Form Pemesanan: {product.name}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor HP</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                            <button type="button" onClick={handleShareLocation} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm">
                                Share Lokasi
                            </button>
                            {locationStatus && <p className="text-sm text-gray-600 mt-2">{locationStatus}</p>}
                            {formData.latitude && <p className="text-sm text-green-600 mt-1">Lat: {formData.latitude.toFixed(4)}, Lon: {formData.longitude?.toFixed(4)}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Upload KTP (JPG/PNG, max 2MB)</label>
                            <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
                            {ktpPreview && <img src={ktpPreview} alt="Preview KTP" className="mt-2 h-32 rounded-lg" />}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" max={product.stock} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                        </div>

                        <div className="pt-4 flex justify-end items-center space-x-4">
                           <div className="text-lg font-bold">Total: Rp {(product.price * formData.quantity).toLocaleString('id-ID')}</div>
                           <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Batal</button>
                           <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center">
                               {loading ? <LoadingSpinner /> : 'Kirim Pesanan'}
                           </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Main Home Page Component
const HomePage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleOrder = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    const handleOrderSubmit = async (orderData: Omit<Order, 'id' | 'status' | 'orderDate' | 'productName'>, ktpFile: File) => {
        setIsSubmitting(true);
        try {
            await api.submitOrder(orderData);
            setNotification({ message: 'Pesanan berhasil dikirim! Admin akan segera mengkonfirmasi.', type: 'success' });
            handleCloseModal();
            fetchProducts(); // Refresh products to show updated stock
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Gagal mengirim pesanan.";
            setNotification({ message: errorMessage, type: 'error' });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {notification && (
                <div className={`fixed top-20 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">Selamat Datang di Susu UHT</h1>
            <p className="text-lg text-center text-gray-600 mb-12">Pilih produk susu UHT favoritmu dan pesan sekarang juga!</p>
            
            {loading ? (
                <div className="text-center">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.filter(p => p.status === 'Aktif').map(product => (
                        <ProductCard key={product.id} product={product} onOrder={handleOrder} />
                    ))}
                </div>
            )}

            <OrderModal 
                product={selectedProduct} 
                onClose={handleCloseModal} 
                onSubmit={handleOrderSubmit}
                loading={isSubmitting}
            />
        </div>
    );
};

export default HomePage;
