import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { LayoutDashboard, CheckCircle, Clock, AlertCircle, BarChart3, Users, Building, Activity, Search } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) setCurrentUser(session.user)

      const [tasksRes, usersRes, deptsRes, projRes] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('hub_users').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('projects').select('*')
      ])

      setTasks(tasksRes.data || [])
      setUsers(usersRes.data || [])
      setDepartments(deptsRes.data || [])
      setProjects(projRes.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await supabase.from('tasks').update({ status }).eq('id', taskId)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t))
    } catch (e) {
      console.error('Erro ao atualizar status', e)
    }
  }

  // KPIs
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done').length
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'todo').length
  const inProgressTasks = totalTasks - completedTasks - pendingTasks

  // Minhas Tarefas com Filtro
  const myTasks = tasks
    .filter(t => t.assigned_to === currentUser?.id)
    .filter(t => 
      t.name?.toLowerCase().includes(taskFilter.toLowerCase()) || 
      t.priority?.toLowerCase().includes(taskFilter.toLowerCase()) ||
      t.status?.toLowerCase().includes(taskFilter.toLowerCase())
    )

  // Carga de trabalho (top 5 com mais tarefas pendentes/em progresso)
  const workload = users.map(user => {
    const activeTasksCount = tasks.filter(t => t.assigned_to === user.id && t.status !== 'completed' && t.status !== 'done').length
    return { name: user.name || 'Sem nome', count: activeTasksCount }
  }).filter(u => u.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)
  const maxWorkload = workload.length > 0 ? Math.max(...workload.map(w => w.count)) : 1;

  // Distribuição por departamento
  const deptCounts: Record<string, number> = {}
  tasks.forEach(t => {
    if (!t.project_id) return
    const proj = projects.find(p => p.id === t.project_id)
    if (proj?.department_id) {
      const dept = departments.find(d => d.id === proj.department_id)
      const dName = dept?.name || 'Depto. Desconhecido'
      deptCounts[dName] = (deptCounts[dName] || 0) + 1
    }
  })
  const deptLabels = Object.keys(deptCounts)
  const maxDept = deptLabels.length > 0 ? Math.max(...Object.values(deptCounts)) : 1;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-500">Carregando indicadores...</div></div>

  return (
    <div className="space-y-6">
      {/* Welcome / Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Dashboard Operacional
          </h1>
          <p className="text-slate-500 text-sm mt-1">Visão analítica de performance e acompanhamento das suas demandas.</p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total de Tarefas</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{totalTasks}</h3>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><LayoutDashboard className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pendentes</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{pendingTasks}</h3>
            </div>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertCircle className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Em Progresso</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{inProgressTasks}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Clock className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Concluídas</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{completedTasks}</h3>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carga de Trabalho */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-500" />
            Carga de Trabalho (Ativas)
          </h3>
          <div className="space-y-4">
            {workload.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma tarefa ativa atribuída no momento.</p>
            ) : workload.map((w, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{w.name}</span>
                  <span className="text-slate-500 font-bold">{w.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(w.count / maxWorkload) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Departamentos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-sky-500" />
            Volume por Departamento
          </h3>
          <div className="space-y-4">
            {deptLabels.length === 0 ? (
              <p className="text-sm text-slate-500">Sem dados de departamentos.</p>
            ) : deptLabels.map((dName, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{dName}</span>
                  <span className="text-slate-500 font-bold">{deptCounts[dName]} tfs</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${(deptCounts[dName] / maxDept) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Minhas Tarefas Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Minhas Tarefas
          </h3>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Filtrar tarefas..." 
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full bg-slate-50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="py-3 px-6 font-semibold">Tarefa</th>
                <th className="py-3 px-6 font-semibold">Prioridade</th>
                <th className="py-3 px-6 font-semibold">Prazo</th>
                <th className="py-3 px-6 font-semibold">Status Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nenhuma tarefa encontrada.
                  </td>
                </tr>
              ) : (
                myTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-800">{task.name}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${task.priority === 'High' || task.priority === 'alta' ? 'bg-rose-100 text-rose-700' : task.priority === 'Medium' || task.priority === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {task.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-500">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-6">
                      <select 
                        value={task.status || 'pending'}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 outline-none"
                      >
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Progresso</option>
                        <option value="done">Concluída</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
