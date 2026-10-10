export type Role = 'BUYER' | 'SELLER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  _count?: { products: number }
}

export interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: { name: string }
}

export interface Product {
  id: string
  title: string
  description: string
  priceCents: number
  stock: number
  images: string[]
  category: Category
  seller: { id: string; name: string }
  rating: number | null
  reviewCount: number
  reviews?: Review[]
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export interface Order {
  id: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  totalCents: number
  createdAt: string
  items: { id: string; title: string; quantity: number; unitPriceCents: number; productId: string }[]
}

export interface Sale {
  id: string
  title: string
  quantity: number
  unitPriceCents: number
  order: { createdAt: string; user: { name: string } }
}

export interface Session {
  user: User
  accessToken: string
  refreshToken: string
}
