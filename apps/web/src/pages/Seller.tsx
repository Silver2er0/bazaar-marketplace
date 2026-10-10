import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type SubmitEvent } from 'react'
import { ErrorBox, PageTitle, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import type { Category, Product, Sale } from '../lib/types'

type Draft = { id?: string; title: string; description: string; price: string; stock: string; categoryId: string; image: string }
const EMPTY: Draft = { title: '', description: '', price: '', stock: '1', categoryId: '', image: '' }

function ProductForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(initial)
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories') })
  const field = (key: keyof Draft) => ({
    value: draft[key] ?? '',
    onChange: (e: { target: { value: string } }) => setDraft({ ...draft, [key]: e.target.value }),
  })

  const upload = useMutation({
    mutationFn: api.upload,
    onSuccess: ({ url }) => setDraft((d) => ({ ...d, image: url })),
  })
  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: draft.title,
        description: draft.description,
        priceCents: Math.round(Number(draft.price) * 100),
        stock: Number(draft.stock),
        categoryId: draft.categoryId,
        images: draft.image ? [draft.image] : [],
      }
      return draft.id ? api.patch(`/products/${draft.id}`, body) : api.post('/products', body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-products'] })
      onDone()
    },
  })
  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={submit} className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">{draft.id ? 'Edit product' : 'New product'}</h2>
      <div className="sm:col-span-2"><label className="label" htmlFor="title">Title</label><input id="title" className="input" required minLength={3} {...field('title')} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="description">Description</label><textarea id="description" className="input" rows={3} required minLength={10} {...field('description')} /></div>
      <div><label className="label" htmlFor="price">Price (USD)</label><input id="price" className="input" type="number" min="0.01" step="0.01" required {...field('price')} /></div>
      <div><label className="label" htmlFor="stock">Stock</label><input id="stock" className="input" type="number" min="0" required {...field('stock')} /></div>
      <div>
        <label className="label" htmlFor="categoryId">Category</label>
        <select id="categoryId" className="input" required {...field('categoryId')}>
          <option value="">Select...</option>
          {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="image">Image URL or upload</label>
        <div className="flex gap-2">
          <input id="image" className="input" type="url" placeholder="https://..." {...field('image')} />
          <label className="btn shrink-0">
            {upload.isPending ? '...' : 'Upload'}
            <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
          </label>
        </div>
      </div>
      {(save.error || upload.error) && <div className="sm:col-span-2"><ErrorBox error={save.error ?? upload.error} /></div>}
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn btn-primary" disabled={save.isPending}>Save product</button>
        <button type="button" className="btn" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

export default function Seller() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Draft | null>(null)
  const products = useQuery({ queryKey: ['my-products'], queryFn: () => api.get<Product[]>('/products/mine') })
  const sales = useQuery({ queryKey: ['sales'], queryFn: () => api.get<Sale[]>('/orders/sales') })
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-products'] }),
  })
  const revenue = sales.data?.reduce((n, s) => n + s.quantity * s.unitPriceCents, 0) ?? 0

  return (
    <>
      <PageTitle action={!editing && <button className="btn btn-primary" onClick={() => setEditing(EMPTY)}>New product</button>}>Seller dashboard</PageTitle>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[['Products', products.data?.length ?? 0], ['Items sold', sales.data?.reduce((n, s) => n + s.quantity, 0) ?? 0], ['Revenue', formatPrice(revenue)]].map(([label, value]) => (
          <div key={label} className="card p-4"><p className="text-sm text-zinc-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
        ))}
      </div>

      {editing && <ProductForm key={editing.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />}
      {remove.error && <ErrorBox error={remove.error} />}

      <h2 className="mb-3 text-lg font-semibold">Your products</h2>
      {products.isPending && <Spinner />}
      {products.data && <div className="card mb-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {products.data.length === 0 && <p className="p-4 text-zinc-500">No products yet. Create your first one.</p>}
        {products.data.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-3">
            <img src={p.images[0]} alt="" className="h-12 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{p.title}</p><p className="text-sm text-zinc-500">{formatPrice(p.priceCents)} · {p.stock} in stock</p></div>
            <button className="btn !py-1" onClick={() => setEditing({ id: p.id, title: p.title, description: p.description, price: String(p.priceCents / 100), stock: String(p.stock), categoryId: p.category.id, image: p.images[0] ?? '' })}>Edit</button>
            <button className="btn btn-danger !py-1" onClick={() => confirm(`Delete "${p.title}"?`) && remove.mutate(p.id)}>Delete</button>
          </div>
        ))}
      </div>}

      <h2 className="mb-3 text-lg font-semibold">Recent sales</h2>
      {sales.data && <div className="card divide-y divide-zinc-200 dark:divide-zinc-800">
        {sales.data.length === 0 && <p className="p-4 text-zinc-500">No sales yet.</p>}
        {sales.data.map((s) => (
          <div key={s.id} className="flex justify-between gap-4 p-3 text-sm">
            <span>{s.quantity}× {s.title} <span className="text-zinc-500">to {s.order.user.name}</span></span>
            <span className="shrink-0">{formatPrice(s.quantity * s.unitPriceCents)} · {formatDate(s.order.createdAt)}</span>
          </div>
        ))}
      </div>}
    </>
  )
}
