import { createFileRoute } from '@tanstack/react-router'
import { Calendar as CalendarIcon, Clock, Plus } from 'lucide-react'

export const Route = createFileRoute('/agenda')({
  component: AgendaPage,
})

function AgendaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda Corporativa</h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciamento de eventos e reuniões corporativas</p>
        </div>
        <button 
          onClick={() => alert('Novo Evento')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Evento</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 text-slate-700 font-semibold border-b border-slate-100 pb-4">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          <span>Próximos Compromissos</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm text-center min-w-[55px]">
                HOJE
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Alinhamento de Tráfego Pago - Cognisafe</h4>
                <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>14:00 - 15:00</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-md">
              Confirmado
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm text-center min-w-[55px]">
                AMANHÃ
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Revisão de Conteúdo - Cognisafe Care</h4>
                <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>10:30 - 11:30</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
              Agendado
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
