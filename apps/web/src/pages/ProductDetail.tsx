import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type SubmitEvent } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorBox, Spinner, Stars, toCartProduct } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { useAuth, useCart } from '../lib/store'
import type { Product } from '../lib/types'

export default function ProductDetail() {
  const { id } = useParams()
  const user = useAuth((s) => s.user)
  const add = useCart((s) => s.add)
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const { data: product, error, isPending } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<Product>(`/products/${id}`),
  })
  const review = useMutation({
    mutationFn: () => api.post(`/products/${id}/reviews`, { rating, comment }),
    onSuccess: () => {
      setComment('')
      return queryClient.invalidateQueries({ queryKey: ['product', id] })
    },
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorBox error={error} />

  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    review.mutate()
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card aspect-[4/3] overflow-hidden">
          {product.images[0] && <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />}
        </div>
        <div className="space-y-4">
          <Link to={`/products?category=${product.category.slug}`} className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{product.category.name}</Link>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          <Stars rating={product.rating} count={product.reviewCount} />
          <p className="text-3xl font-bold">{formatPrice(product.priceCents)}</p>
          <p className="text-zinc-600 dark:text-zinc-400">{product.description}</p>
          <p className="text-sm text-zinc-500">Sold by {product.seller.name} · {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          <div className="flex items-center gap-3">
            <input className="input !w-20" type="number" min={1} max={product.stock} value={quantity} aria-label="Quantity" onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
            <button className="btn btn-primary" disabled={product.stock === 0} onClick={() => add(toCartProduct(product), quantity)}>Add to cart</button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">Reviews</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <ul className="space-y-4">
            {product.reviews?.length === 0 && <li className="text-zinc-500">Be the first to review this product.</li>}
            {product.reviews?.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-center justify-between"><Stars rating={r.rating} /><span className="text-xs text-zinc-500">{formatDate(r.createdAt)}</span></div>
                <p className="mt-2">{r.comment}</p>
                <p className="mt-1 text-sm text-zinc-500">{r.user.name}</p>
              </li>
            ))}
          </ul>
          {user ? (
            <form onSubmit={submit} className="card h-fit space-y-3 p-4">
              <h3 className="font-semibold">Write a review</h3>
              <select className="input" value={rating} aria-label="Rating" onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
              <textarea className="input" rows={3} minLength={3} required placeholder="What did you think?" value={comment} onChange={(e) => setComment(e.target.value)} />
              {review.error && <ErrorBox error={review.error} />}
              <button className="btn btn-primary" disabled={review.isPending}>Submit review</button>
            </form>
          ) : (
            <p className="card h-fit p-4 text-zinc-500"><Link className="text-indigo-600 underline" to="/login">Log in</Link> to write a review.</p>
          )}
        </div>
      </section>
    </div>
  )
}
