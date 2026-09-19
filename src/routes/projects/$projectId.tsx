import { createFileRoute } from '@tanstack/react-router'
import { CheckSquare, ListTodo, Plus, Folder } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()

  const projectNames: Record<string, string> = {
    'proj-cognisafe-tp': 'Cognisafe (Tráfego Pago)',
    'proj-cognisafe-care-tp': 'Cognisafe Care (Tráfego Pago)',
    'proj-cognisafe-pc': 'Cognisafe (Produção de Conteúdo)',
    'proj-cognisafe-care-pc': 'Cognisafe Care (Produção de Conteúdo)',
    'proj-infra': 'Infraestrutura da Rede'
  }

  const projectName = projectNames[projectId] || `Processo #${projectId.slice(0, 8)}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{projectName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">ID: {projectId}</p>
          </div>
        </div>
        <button 
          onClick={() => alert('Adicionar Tarefa')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between font-bold text-sm text-slate-700 pb-2 border-b border-slate-100">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>A Fazer</span>
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 font-semibold">1</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Definir orçamento da campanha</h4>
            <p className="text-xs text-slate-500">Elaborar a proposta com o limite de gastos diários.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between font-bold text-sm text-slate-700 pb-2 border-b border-slate-100">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Em Andamento</span>
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 font-semibold">1</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Criar peças publicitárias</h4>
            <p className="text-xs text-slate-500">Desenvolvimento de artes e copys para veiculação.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between font-bold text-sm text-slate-700 pb-2 border-b border-slate-100">
            <span className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Concluído</span>
            </span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 font-semibold">0</span>
          </div>
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Nenhuma tarefa concluída ainda.
          </div>
        </div>
      </div>
    </div>
  )
}
