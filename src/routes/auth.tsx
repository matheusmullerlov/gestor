import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Lock, Mail } from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha inválidos. Verifique suas credenciais.')
        } else {
          setError('Falha ao autenticar: ' + error.message)
        }
        return
      }

      // O auth listener em __root.tsx também cuidará do redirecionamento, 
      // mas garantimos uma ida direta pra home.
      navigate({ to: '/', replace: true })
    } catch (err: any) {
      setError('Ocorreu um erro inesperado ao tentar fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B132B] text-slate-200 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Linha decorativa de topo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gestor Cogni Cloud</h1>
          <p className="text-sm font-medium text-blue-400 uppercase tracking-widest mt-2 hidden sm:block">Hub Operacional</p>
          <p className="text-sm font-medium text-blue-400 uppercase tracking-widest mt-2 sm:hidden">Hub Operacional</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium text-center ">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">E-mail corporativo</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-500 shadow-sm"
                placeholder="voce@cognicloud.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">Senha de acesso</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-500 shadow-sm"
                placeholder="Coroa a sua entrada"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Entrar no sistema'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          Acesso restrito a colaboradores autorizados.<br />
          Protegido por autenticação segura e criptografada.
        </div>
      </div>
    </div>
  )
}
