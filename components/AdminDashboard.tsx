import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useAuth } from '../App';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Product, Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { DashboardIcon, ProductIcon, OrderIcon, ReportIcon, LogoutIcon, LoadingSpinner } from './Icons';
import { generateInvoicePdf, generateSalesReportPdf } from '../utils/pdfGenerator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';


// --- SUB-COMPONENTS for AdminDashboard ---

// StatCard Component
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// Main Dashboard View Component
const DashboardView: React.FC<{ products: Product[], orders: Order[], onNavigate: (view: string) => void }> = ({ products, orders, onNavigate }) => {
    const totalOrders = orders.length;
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);
    const totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    const salesData = orders
        .filter(o => o.status === OrderStatus.CONFIRMED)
        .reduce((acc, order) => {
            const month = new Date(order.orderDate).toLocaleString('default', { month: 'short' });
            if (!acc[month]) acc[month] = { name: month, Penjualan: 0, Pesanan: 0 };
            acc[month].Penjualan += order.totalPrice;
            acc[month].Pesanan += 1;
            return acc;
        }, {} as { [key: string]: { name: string, Penjualan: number, Pesanan: number } });

    const chartData = Object.values(salesData);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Produk" value={products.length} icon={<ProductIcon className="w-6 h-6 text-blue-500" />} />
                <StatCard title="Total Pesanan" value={totalOrders} icon={<OrderIcon className="w-6 h-6 text-blue-500" />} />
                <StatCard title="Pesanan Dikonfirmasi" value={confirmedOrders.length} icon={<OrderIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} icon={<ReportIcon className="w-6 h-6 text-yellow-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Grafik Penjualan Bulanan</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                            <Legend />
                            <Bar dataKey="Penjualan" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Grafik Pesanan Bulanan</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Pesanan" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

             <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-lg font-semibold mb-4">Tombol Cepat</h3>
                 <div className="flex flex-wrap gap-4">
                     <button onClick={() => onNavigate('produk')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Tambah Produk</button>
                     <button onClick={() => onNavigate('pesanan')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Konfirmasi Pesanan</button>
                     <button onClick={() => onNavigate('laporan')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">Lihat Laporan</button>
                 </div>
             </div>
        </div>
    );
};

// Products Management View
const ProductsView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formState, setFormState] = useState<Omit<Product, 'id'>>({ name: '', price: 0, stock: 0, description: '', image: '', status: 'Aktif' });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        if (product) {
            setFormState(product);
        } else {
            setFormState({ name: '', price: 0, stock: 0, description: '', image: '', status: 'Aktif' });
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value }));
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                // When reading is finished, set the image in formState to the Base64 data URL
                setFormState(prev => ({ ...prev, image: reader.result as string }));
            };
            // Read the file as a data URL (Base64 encoded)
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const apiCall = editingProduct ? api.updateProduct({ ...formState, id: editingProduct.id }) : api.addProduct(formState);
        try {
            await apiCall;
            fetchProducts();
            closeModal();
        } catch (error) {
            console.error("Failed to save product", error);
        }
    }

    const handleDelete = async (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
            try {
                await api.deleteProduct(id);
                fetchProducts();
            } catch (error) {
                console.error("Failed to delete product", error);
            }
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Manajemen Produk</h2>
                <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Tambah Produk</button>
            </div>
            {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Gambar</th>
                        <th scope="col" className="px-6 py-3">Nama Produk</th>
                        <th scope="col" className="px-6 py-3">Harga</th>
                        <th scope="col" className="px-6 py-3">Stok</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                    <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4"><img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded"/></td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                        <td className="px-6 py-4">Rp {p.price.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">{p.stock}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span></td>
                        <td className="px-6 py-4 space-x-2">
                            <button onClick={() => openModal(p)} className="font-medium text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="font-medium text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                 <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                     <form onSubmit={handleSubmit} className="p-6 space-y-4">
                         <h3 className="text-lg font-semibold">{editingProduct ? 'Edit' : 'Tambah'} Produk</h3>
                         <input name="name" value={formState.name} onChange={handleChange} placeholder="Nama Produk" className="w-full p-2 border rounded" required />
                         <input name="price" type="number" value={formState.price} onChange={handleChange} placeholder="Harga" className="w-full p-2 border rounded" required />
                         <input name="stock" type="number" value={formState.stock} onChange={handleChange} placeholder="Stok" className="w-full p-2 border rounded" required />
                         <textarea name="description" value={formState.description} onChange={handleChange} placeholder="Deskripsi" className="w-full p-2 border rounded" required />
                         <select name="status" value={formState.status} onChange={handleChange} className="w-full p-2 border rounded">
                             <option value="Aktif">Aktif</option>
                             <option value="Tidak Aktif">Tidak Aktif</option>
                         </select>
                         <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                         {formState.image && <img src={formState.image} alt="preview" className="w-24 h-24 object-cover rounded mt-2"/>}
                         <div className="flex justify-end space-x-2 pt-4">
                             <button type="button" onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded">Batal</button>
                             <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">Simpan</button>
                         </div>
                     </form>
                 </div>
                 </div>
            )}
        </div>
    );
};

// Orders Management View
const OrdersView: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        try {
            await api.updateOrderStatus(orderId, status);
            fetchOrders();
        } catch (error) {
            console.error("Failed to update order status", error);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.CONFIRMED: return 'bg-green-100 text-green-800';
            case OrderStatus.REJECTED: return 'bg-red-100 text-red-800';
            case OrderStatus.WAITING: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Manajemen Pesanan</h2>
        {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">ID Pesanan</th>
                        <th className="px-6 py-3">Pelanggan</th>
                        <th className="px-6 py-3">Produk</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                    <tr key={o.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono">{o.id}</td>
                        <td className="px-6 py-4">{o.customerName}<br/><span className="text-xs text-gray-500">{o.phone}</span></td>
                        <td className="px-6 py-4">{o.productName} (x{o.quantity})</td>
                        <td className="px-6 py-4">Rp {o.totalPrice.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(o.status)}`}>{o.status}</span></td>
                        <td className="px-6 py-4">
                            {o.status === OrderStatus.WAITING && (
                            <div className="flex space-x-2">
                                <button onClick={() => handleStatusChange(o.id, OrderStatus.CONFIRMED)} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded">Konfirmasi</button>
                                <button onClick={() => handleStatusChange(o.id, OrderStatus.REJECTED)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded">Tolak</button>
                            </div>
                            )}
                             {o.status === OrderStatus.CONFIRMED && (
                                <button onClick={() => generateInvoicePdf(o)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded">Invoice PDF</button>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
        </div>
    );
};

// Reports View
const ReportsView: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        api.getOrders().then(data => {
            setOrders(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 
        const filtered = orders.filter(o => {
            const orderDate = new Date(o.orderDate);
            return orderDate >= start && orderDate <= end;
        });
        setFilteredOrders(filtered);
    }, [startDate, endDate, orders]);

    const handlePrintReport = () => {
        generateSalesReportPdf(filteredOrders, startDate, endDate);
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Laporan Penjualan</h2>
            <div className="flex flex-wrap gap-4 items-center mb-4">
                <div>
                    <label className="text-sm">Dari Tanggal:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded ml-2" />
                </div>
                <div>
                    <label className="text-sm">Sampai Tanggal:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded ml-2" />
                </div>
                <button onClick={handlePrintReport} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded">Cetak Laporan PDF</button>
            </div>
             {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">ID Pesanan</th>
                        <th className="px-6 py-3">Tanggal</th>
                        <th className="px-6 py-3">Pelanggan</th>
                        <th className="px-6 py-3">Total</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map(o => (
                    <tr key={o.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{o.id}</td>
                        <td className="px-6 py-4">{new Date(o.orderDate).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4">{o.customerName}</td>
                        <td className="px-6 py-4">Rp {o.totalPrice.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">{o.status}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
        </div>
    );
};


// --- MAIN AdminDashboard Component ---
const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Determine active view from URL hash, fallback to dashboard
    const getActiveView = () => {
        const hash = location.hash.replace('#', '');
        return ['dashboard', 'produk', 'pesanan', 'laporan'].includes(hash) ? hash : 'dashboard';
    };
    
    const [activeView, setActiveView] = useState(getActiveView());

    useEffect(() => {
        api.getProducts().then(setProducts);
        api.getOrders().then(setOrders);
    }, []);

    useEffect(() => {
        setActiveView(getActiveView());
    }, [location.hash]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'produk': return <ProductsView />;
            case 'pesanan': return <OrdersView />;
            case 'laporan': return <ReportsView />;
            case 'dashboard':
            default:
                return <DashboardView products={products} orders={orders} onNavigate={(view) => navigate(`/admin#${view}`)} />;
        }
    };
    
    const NavLink: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode }> = ({ to, icon, children }) => (
        <Link 
            to={`/admin#${to}`} 
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeView === to ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-blue-100'}`}
        >
            {icon}
            <span className="font-medium">{children}</span>
        </Link>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white shadow-xl z-50 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                <div className="flex items-center justify-center h-20 border-b">
                    <h1 className="text-2xl font-bold text-blue-600">🥛 Admin Panel</h1>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink to="dashboard" icon={<DashboardIcon />}>Dashboard</NavLink>
                    <NavLink to="produk" icon={<ProductIcon />}>Produk</NavLink>
                    <NavLink to="pesanan" icon={<OrderIcon />}>Pesanan</NavLink>
                    <NavLink to="laporan" icon={<ReportIcon />}>Laporan</NavLink>
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t">
                     <button onClick={handleLogout} className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-600">
                         <LogoutIcon />
                         <span className="font-medium">Logout</span>
                     </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white border-b md:justify-end">
                     <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 focus:outline-none md:hidden">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                     </button>
                    <div className="text-right">
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {renderActiveView()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;