
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  status: 'Aktif' | 'Tidak Aktif';
}

export enum OrderStatus {
  WAITING = 'Menunggu Konfirmasi',
  CONFIRMED = 'Dikonfirmasi',
  REJECTED = 'Ditolak',
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  ktpPath: string;
  productId: number;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  orderDate: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}
