import { useMutation } from '@tanstack/react-query'
import { useState, type SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ErrorBox } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/store'
import type { Session } from '../lib/types'

const DEMO = [
  ['Buyer', 'buyer@bazaar.dev', 'Buyer123!'],
  ['Seller', 'seller@bazaar.dev', 'Seller123!'],
  ['Admin', 'admin@bazaar.dev', 'Admin123!'],
] as const

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const setSession = useAuth((s) => s.setSession)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'BUYER' })
  const isLogin = mode === 'login'

  const auth = useMutation({
    mutationFn: (body: object) => api.post<Session>(`/auth/${mode}`, body),
    onSuccess: (session) => {
      setSession(session)
      navigate(from, { replace: true })
    },
  })
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  })
  const submit = (e: SubmitEvent) => {
    e.preventDefault()
    auth.mutate(isLogin ? { email: form.email, password: form.password } : form)
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        {!isLogin && (
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" required minLength={2} {...field('name')} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" required autoComplete="email" {...field('email')} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} {...field('password')} />
        </div>
        {!isLogin && (
          <div>
            <label className="label" htmlFor="role">I want to</label>
            <select id="role" className="input" {...field('role')}>
              <option value="BUYER">Buy products</option>
              <option value="SELLER">Sell products</option>
            </select>
          </div>
        )}
        {auth.error && <ErrorBox error={auth.error} />}
        <button className="btn btn-primary w-full" disabled={auth.isPending}>{isLogin ? 'Log in' : 'Sign up'}</button>
        <p className="text-center text-sm text-zinc-500">
          {isLogin ? 'New here?' : 'Already registered?'}{' '}
          <Link className="text-indigo-600 underline" to={isLogin ? '/register' : '/login'} state={{ from }}>{isLogin ? 'Create an account' : 'Log in'}</Link>
        </p>
      </form>
      {isLogin && (
        <div className="card p-4 text-sm">
          <p className="mb-2 font-medium">Try a demo account</p>
          <div className="flex gap-2">
            {DEMO.map(([label, email, password]) => (
              <button key={label} type="button" className="btn flex-1 !py-1" onClick={() => auth.mutate({ email, password })}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
