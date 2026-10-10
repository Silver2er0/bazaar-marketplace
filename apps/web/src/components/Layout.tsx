import { useState, type SubmitEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { selectCartCount, useAuth, useCart } from '../lib/store'

const toggleTheme = () => {
  const dark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

export default function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const cartCount = useCart(selectCartCount)
  const [q, setQ] = useState('')

  const search = (e: SubmitEvent) => {
    e.preventDefault()
    navigate(`/products?q=${encodeURIComponent(q.trim())}`)
  }
  const link = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">Bazaar</Link>
          <form onSubmit={search} className="order-last w-full sm:order-none sm:max-w-md sm:flex-1" role="search">
            <input className="input" type="search" placeholder="Search products..." aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <nav className="ml-auto flex items-center gap-4">
            <NavLink to="/products" className={link}>Shop</NavLink>
            {user && <NavLink to="/orders" className={link}>Orders</NavLink>}
            {(user?.role === 'SELLER' || user?.role === 'ADMIN') && <NavLink to="/seller" className={link}>Sell</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin" className={link}>Admin</NavLink>}
            <NavLink to="/cart" className={link}>Cart{cartCount > 0 && <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{cartCount}</span>}</NavLink>
            {user ? (
              <button className="btn !py-1" onClick={() => { logout(); navigate('/') }}>Logout ({user.name.split(' ')[0]})</button>
            ) : (
              <Link to="/login" className="btn btn-primary !py-1">Login</Link>
            )}
            <button className="btn !px-2 !py-1" onClick={toggleTheme} aria-label="Toggle dark mode">◐</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Bazaar is a portfolio demo. Payments run in Stripe test mode, so no real money is charged.
      </footer>
    </div>
  )
}
