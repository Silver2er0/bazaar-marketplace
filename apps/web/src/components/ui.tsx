import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { formatPrice } from '../lib/format'
import type { CartProduct } from '../lib/store'
import { useCart } from '../lib/store'
import type { Product } from '../lib/types'

export function Spinner() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  )
}

export function ErrorBox({ error }: { error: Error | null }) {
  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      {error?.message ?? 'Something went wrong'}
    </div>
  )
}

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating === null) return <span className="text-xs text-zinc-500">No reviews yet</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="text-amber-500">{'★'.repeat(Math.round(rating))}<span className="text-zinc-300 dark:text-zinc-700">{'★'.repeat(5 - Math.round(rating))}</span></span>
      {count !== undefined && <span className="text-xs text-zinc-500">({count})</span>}
    </span>
  )
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
      {action}
    </div>
  )
}

export const toCartProduct = (p: Product): CartProduct => ({
  id: p.id,
  title: p.title,
  priceCents: p.priceCents,
  stock: p.stock,
  image: p.images[0],
})

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add)
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:shadow-lg">
      <Link to={`/products/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.images[0] && (
          <img src={product.images[0]} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{product.category.name}</span>
        <Link to={`/products/${product.id}`} className="font-semibold leading-snug hover:underline">{product.title}</Link>
        <Stars rating={product.rating} count={product.reviewCount} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(product.priceCents)}</span>
          <button className="btn btn-primary !px-3 !py-1.5" disabled={product.stock === 0} onClick={() => add(toCartProduct(product))}>
            {product.stock === 0 ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
