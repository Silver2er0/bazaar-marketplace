import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorBox, ProductCard, Spinner } from '../components/ui'
import { api } from '../lib/api'
import type { Category, Page, Product } from '../lib/types'

export default function Home() {
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/categories') })
  const featured = useQuery({ queryKey: ['featured'], queryFn: () => api.get<Page<Product>>('/products?limit=8') })

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-16 text-white">
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">Everything you need, from sellers you can trust.</h1>
        <p className="mt-4 max-w-xl text-lg text-indigo-100">Browse electronics, home, fashion and more. Become a seller in a minute and list your own products.</p>
        <div className="mt-8 flex gap-3">
          <Link to="/products" className="btn border-white bg-white !text-indigo-700 hover:bg-indigo-50">Shop now</Link>
          <Link to="/register" className="btn border-white/60 !text-white hover:bg-white/10">Start selling</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.data?.map((c) => (
            <Link key={c.id} to={`/products?category=${c.slug}`} className="card p-4 text-center font-medium transition hover:border-indigo-500 hover:shadow">
              {c.name}
              <span className="block text-xs font-normal text-zinc-500">{c._count?.products} items</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">New arrivals</h2>
        {featured.isPending && <Spinner />}
        {featured.error && <ErrorBox error={featured.error} />}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  )
}
