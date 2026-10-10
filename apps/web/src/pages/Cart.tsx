import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { ErrorBox, PageTitle } from '../components/ui'
import { api } from '../lib/api'
import { formatPrice } from '../lib/format'
import { selectCartTotal, useAuth, useCart } from '../lib/store'

export default function Cart() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const { items, setQuantity, remove } = useCart()
  const total = useCart(selectCartTotal)

  const checkout = useMutation({
    mutationFn: () =>
      api.post<{ orderId: string; checkoutUrl: string | null }>('/orders', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      }),
    onSuccess: ({ orderId, checkoutUrl }) => {
      // The cart is cleared on the order page once payment is confirmed.
      if (checkoutUrl) window.location.href = checkoutUrl
      else navigate(`/orders/${orderId}?paid=1`)
    },
  })

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-zinc-500">Your cart is empty.</p>
        <Link to="/products" className="btn btn-primary">Browse products</Link>
      </div>
    )
  }

  return (
    <>
      <PageTitle>Your cart</PageTitle>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="card flex items-center gap-4 p-3">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {product.image && <img src={product.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/products/${product.id}`} className="font-medium hover:underline">{product.title}</Link>
                <p className="text-sm text-zinc-500">{formatPrice(product.priceCents)} each</p>
              </div>
              <input className="input !w-16" type="number" min={1} max={product.stock} value={quantity} aria-label={`Quantity for ${product.title}`} onChange={(e) => setQuantity(product.id, Number(e.target.value))} />
              <span className="w-24 text-right font-semibold">{formatPrice(product.priceCents * quantity)}</span>
              <button className="btn btn-danger !px-2 !py-1" onClick={() => remove(product.id)} aria-label={`Remove ${product.title}`}>✕</button>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-4 p-5">
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
          {checkout.error && <ErrorBox error={checkout.error} />}
          {user ? (
            <button className="btn btn-primary w-full" disabled={checkout.isPending} onClick={() => checkout.mutate()}>
              {checkout.isPending ? 'Redirecting...' : 'Checkout'}
            </button>
          ) : (
            <Link to="/login" state={{ from: '/cart' }} className="btn btn-primary w-full">Log in to checkout</Link>
          )}
          <p className="text-xs text-zinc-500">Test mode: pay with card 4242 4242 4242 4242, any future date and any CVC.</p>
        </aside>
      </div>
    </>
  )
}
