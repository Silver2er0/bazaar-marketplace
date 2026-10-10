import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, Session, User } from './types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (session: Session) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'bazaar-auth' },
  ),
)

export type CartProduct = Pick<Product, 'id' | 'title' | 'priceCents' | 'stock'> & { image?: string }

interface CartState {
  items: { product: CartProduct; quantity: number }[]
  add: (product: CartProduct, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity = 1) =>
        set(({ items }) => {
          const existing = items.find((i) => i.product.id === product.id)
          return {
            items: existing
              ? items.map((i) =>
                  i === existing ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i,
                )
              : [...items, { product, quantity: Math.min(quantity, product.stock) }],
          }
        }),
      setQuantity: (id, quantity) =>
        set(({ items }) => ({
          items: items.map((i) =>
            i.product.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.product.stock)) } : i,
          ),
        })),
      remove: (id) => set(({ items }) => ({ items: items.filter((i) => i.product.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'bazaar-cart' },
  ),
)

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0)
export const selectCartTotal = (s: CartState) => s.items.reduce((n, i) => n + i.quantity * i.product.priceCents, 0)
