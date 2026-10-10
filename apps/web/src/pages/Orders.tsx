import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ErrorBox, PageTitle, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { useCart } from '../lib/store'
import type { Order } from '../lib/types'

const STATUS_STYLE = {
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CANCELLED: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

const Status = ({ status }: { status: Order['status'] }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
)

export function OrderList() {
  const { data, error, isPending } = useQuery({ queryKey: ['orders'], queryFn: () => api.get<Order[]>('/orders') })
  if (isPending) return <Spinner />
  if (error) return <ErrorBox error={error} />
  return (
    <>
      <PageTitle>Your orders</PageTitle>
      {data.length === 0 && <p className="text-zinc-500">You have not placed any orders yet.</p>}
      <ul className="space-y-3">
        {data.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="card flex items-center justify-between gap-4 p-4 transition hover:border-indigo-500">
              <div>
                <p className="font-medium">{o.items.map((i) => `${i.quantity}× ${i.title}`).join(', ')}</p>
                <p className="text-sm text-zinc-500">{formatDate(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4"><Status status={o.status} /><span className="font-semibold">{formatPrice(o.totalCents)}</span></div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const justPaid = useSearchParams()[0].has('paid')
  const clearCart = useCart((s) => s.clear)
  const { data, error, isPending } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    // Stripe may take a moment to confirm payment after the redirect.
    refetchInterval: (q) => (justPaid && q.state.data?.status === 'PENDING' ? 2000 : false),
  })
  const paid = data?.status === 'PAID'
  useEffect(() => {
    if (paid && justPaid) clearCart()
  }, [paid, justPaid, clearCart])

  if (isPending) return <Spinner />
  if (error) return <ErrorBox error={error} />
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle action={<Status status={data.status} />}>Order #{data.id.slice(-6).toUpperCase()}</PageTitle>
      {paid && justPaid && <p className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Thanks for your purchase! Your payment was received.</p>}
      {data.status === 'PENDING' && <p className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-700 dark:bg-amber-950 dark:text-amber-300">{justPaid ? 'Confirming your payment...' : 'Payment was not completed. Your cart is unchanged, so you can check out again.'}</p>}
      <div className="card divide-y divide-zinc-200 dark:divide-zinc-800">
        {data.items.map((i) => (
          <div key={i.id} className="flex justify-between p-4">
            <span>{i.quantity}× <Link className="hover:underline" to={`/products/${i.productId}`}>{i.title}</Link></span>
            <span>{formatPrice(i.unitPriceCents * i.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between p-4 font-bold"><span>Total</span><span>{formatPrice(data.totalCents)}</span></div>
      </div>
      <p className="mt-4 text-sm text-zinc-500">Placed on {formatDate(data.createdAt)}</p>
    </div>
  )
}
