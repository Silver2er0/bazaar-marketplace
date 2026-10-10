import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import Layout from './components/Layout'
import { useAuth } from './lib/store'
import type { Role } from './lib/types'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Cart from './pages/Cart'
import Home from './pages/Home'
import { OrderDetail, OrderList } from './pages/Orders'
import ProductDetail from './pages/ProductDetail'
import Products from './pages/Products'
import Seller from './pages/Seller'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
})

function Protected({ roles }: { roles?: Role[] }) {
  const user = useAuth((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="login" element={<Auth mode="login" />} />
            <Route path="register" element={<Auth mode="register" />} />
            <Route element={<Protected />}>
              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:id" element={<OrderDetail />} />
            </Route>
            <Route element={<Protected roles={['SELLER', 'ADMIN']} />}>
              <Route path="seller" element={<Seller />} />
            </Route>
            <Route element={<Protected roles={['ADMIN']} />}>
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
