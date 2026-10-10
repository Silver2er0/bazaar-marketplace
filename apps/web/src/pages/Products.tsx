import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { ErrorBox, PageTitle, ProductCard, Spinner } from '../components/ui'
import { api } from '../lib/api'
import type { Category, Page, Product } from '../lib/types'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories') })
  const products = useQuery({
    queryKey: ['products', params.toString()],
    queryFn: () => api.get<Page<Product>>(`/products?${params}`),
    placeholderData: keepPreviousData,
  })

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const page = Number(params.get('page') ?? 1)
  const dollars = (key: string) => (e: React.FocusEvent<HTMLInputElement>) =>
    set(key, e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '')

  return (
    <>
      <PageTitle>{params.get('q') ? `Results for "${params.get('q')}"` : 'All products'}</PageTitle>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="card h-fit space-y-5 p-4">
          <div>
            <label className="label" htmlFor="sort">Sort by</label>
            <select id="sort" className="input" value={params.get('sort') ?? 'newest'} onChange={(e) => set('sort', e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={params.get('category') ?? ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.data?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <span className="label">Price (USD)</span>
            <div className="flex gap-2">
              <input className="input" type="number" min="0" placeholder="Min" aria-label="Minimum price" defaultValue={params.get('minPrice') ? Number(params.get('minPrice')) / 100 : ''} onBlur={dollars('minPrice')} />
              <input className="input" type="number" min="0" placeholder="Max" aria-label="Maximum price" defaultValue={params.get('maxPrice') ? Number(params.get('maxPrice')) / 100 : ''} onBlur={dollars('maxPrice')} />
            </div>
          </div>
          <button className="btn w-full" onClick={() => setParams({})}>Clear filters</button>
        </aside>

        <section>
          {products.isPending && <Spinner />}
          {products.error && <ErrorBox error={products.error} />}
          {products.data?.items.length === 0 && <p className="py-16 text-center text-zinc-500">No products match your filters.</p>}
          <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${products.isPlaceholderData ? 'opacity-60' : ''}`}>
            {products.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {products.data && products.data.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button className="btn" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>Previous</button>
              <span className="text-sm text-zinc-500">Page {page} of {products.data.pages}</span>
              <button className="btn" disabled={page >= products.data.pages} onClick={() => set('page', String(page + 1))}>Next</button>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
