import { createFileRoute, Link } from '@tanstack/react-router'
import { LayoutDashboard, Calendar, Folder, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="space-y-6">
      {/* Card de Boas-vindas */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-md border border-slate-700/50">
        <div className="max-w-2xl space-y-3">
          <span className="px-3 py-1 bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30 inline-block">
            Painel Principal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Bem-vindo ao Gestor Hub Operacional
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Selecione um processo na barra lateral para visualizar as tarefas vinculadas ou navegue pela agenda corporativa para acompanhar o cronograma dos projetos.
          </p>
        </div>
      </div>

      {/* Grid de Atalhos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Dashboard Operacional</h3>
            <p className="text-xs text-slate-500 mt-1">
              Visão resumida das métricas e andamento de projetos por departamento.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
            <span>Ambiente ativo</span>
          </div>
        </div>

        <Link to="/agenda" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">Agenda Corporativa</h3>
            <p className="text-xs text-slate-500 mt-1">
              Acompanhe reuniões, prazos e entregas corporativas registradas.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Ver eventos</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Departamentos & Processos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Explore o departamento de Marketing (Tráfego Pago, Produção de Conteúdo), Cognisafe e mais na barra lateral.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">
            <span>Acesse pela barra lateral</span>
          </div>
        </div>
      </div>
    </div>
  )
}
