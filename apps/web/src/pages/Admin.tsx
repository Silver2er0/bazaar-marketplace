import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorBox, PageTitle, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { useAuth } from '../lib/store'
import type { Page, Product, User } from '../lib/types'

export default function Admin() {
  const queryClient = useQueryClient()
  const me = useAuth((s) => s.user)
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users') })
  const products = useQuery({ queryKey: ['admin-products'], queryFn: () => api.get<Page<Product>>('/products?limit=48') })
  const remove = useMutation({
    mutationFn: ({ kind, id }: { kind: 'users' | 'products'; id: string }) => api.del(`/${kind}/${id}`),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <div className="space-y-8">
      <PageTitle>Admin</PageTitle>
      {remove.error && <ErrorBox error={remove.error} />}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Users ({users.data?.length ?? 0})</h2>
        {users.isPending && <Spinner />}
        {users.error && <ErrorBox error={users.error} />}
        {users.data && <div className="card divide-y divide-zinc-200 dark:divide-zinc-800">
          {users.data.map((u) => (
            <div key={u.id} className="flex items-center gap-4 p-3 text-sm">
              <div className="min-w-0 flex-1"><p className="font-medium">{u.name}</p><p className="truncate text-zinc-500">{u.email}</p></div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">{u.role}</span>
              <span className="hidden text-zinc-500 sm:inline">{u.createdAt && formatDate(u.createdAt)}</span>
              <button className="btn btn-danger !py-1" disabled={u.id === me?.id} onClick={() => confirm(`Delete ${u.email}?`) && remove.mutate({ kind: 'users', id: u.id })}>Delete</button>
            </div>
          ))}
        </div>}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Products ({products.data?.total ?? 0})</h2>
        {products.isPending && <Spinner />}
        {products.data && <div className="card divide-y divide-zinc-200 dark:divide-zinc-800">
          {products.data.items.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-3 text-sm">
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.title}</p><p className="text-zinc-500">{p.seller.name} · {p.category.name}</p></div>
              <span>{formatPrice(p.priceCents)}</span>
              <button className="btn btn-danger !py-1" onClick={() => confirm(`Delete "${p.title}"?`) && remove.mutate({ kind: 'products', id: p.id })}>Delete</button>
            </div>
          ))}
        </div>}
      </section>
    </div>
  )
}
