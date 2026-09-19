import React, { useState, useEffect } from 'react'
import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  Calendar, 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  LogOut, 
  User, 
  Briefcase 
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface Department {
  id: string
  name: string
  sort_order: number
}

interface Project {
  id: string
  name: string
  department_id: string | null
  category_name: string | null
  sort_order: number
}

interface UserProfile {
  id: string
  name: string | null
  role: string | null
  email: string | null
}

// Dados de fallback para demonstração e departamento de Marketing inicial
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-mkt', name: 'Marketing', sort_order: 1 },
  { id: 'dept-ti', name: 'Tecnologia & TI', sort_order: 2 },
  { id: 'dept-fin', name: 'Financeiro', sort_order: 3 },
]

const DEFAULT_PROJECTS: Project[] = [
  { id: 'proj-cognisafe-tp', name: 'Cognisafe', department_id: 'dept-mkt', category_name: 'Tráfego Pago', sort_order: 1 },
  { id: 'proj-cognisafe-care-tp', name: 'Cognisafe Care', department_id: 'dept-mkt', category_name: 'Tráfego Pago', sort_order: 2 },
  { id: 'proj-cognisafe-pc', name: 'Cognisafe', department_id: 'dept-mkt', category_name: 'Produção de Conteúdo', sort_order: 3 },
  { id: 'proj-cognisafe-care-pc', name: 'Cognisafe Care', department_id: 'dept-mkt', category_name: 'Produção de Conteúdo', sort_order: 4 },
  { id: 'proj-infra', name: 'Infraestrutura da Rede', department_id: 'dept-ti', category_name: null, sort_order: 1 },
]

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS)
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: 'user-admin',
    name: 'Administrador',
    role: 'administrador',
    email: 'admin@gestor.com'
  })

  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    'dept-mkt': true
  })
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'dept-mkt-Tráfego Pago': true,
    'dept-mkt-Produção de Conteúdo': true
  })

  useEffect(() => {
    fetchUserAndData()
  }, [])

  const fetchUserAndData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('hub_users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.name || session.user.email || 'Usuário',
            role: profile.role || 'colaborador',
            email: profile.email || session.user.email || ''
          })
        } else {
          setCurrentUser({
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'Usuário',
            role: 'administrador',
            email: session.user.email || ''
          })
        }
      }

      const { data: deptsData } = await supabase.from('departments').select('*').order('sort_order')
      if (deptsData && deptsData.length > 0) {
        setDepartments(deptsData)
      }

      const { data: projsData } = await supabase.from('projects').select('*').order('sort_order')
      if (projsData && projsData.length > 0) {
        setProjects(projsData)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  const toggleDept = (deptId: string) => {
    setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }))
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const isAdmin = currentUser?.role?.toLowerCase() === 'administrador' || currentUser?.role?.toLowerCase() === 'admin'

  const getHeaderTitle = () => {
    const path = location.pathname
    if (path === '/') return { title: 'Início', subtitle: 'Visão geral do sistema e indicadores centrais' }
    if (path === '/agenda') return { title: 'Agenda Corporativa', subtitle: 'Eventos, reuniões e compromissos agendados' }
    if (path.startsWith('/projects/')) return { title: 'Detalhes do Processo', subtitle: 'Acompanhamento de tarefas e progresso do projeto' }
    return { title: 'Painel Gestor', subtitle: 'Hub Operacional' }
  }

  const headerInfo = getHeaderTitle()

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Fixa à Esquerda */}
      <aside className="w-72 bg-[#0B132B] text-slate-200 flex flex-col fixed inset-y-0 left-0 z-30 shadow-xl border-r border-slate-800">
        {/* Topo da Sidebar */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-md text-white">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide leading-tight">Gestor</h1>
            <p className="text-xs text-slate-400 font-medium">Hub Operacional</p>
          </div>
        </div>

        {/* Navegação da Sidebar */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Links Principais */}
          <nav className="space-y-1">
            <Link
              to="/"
              activeProps={{ className: 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500' }}
              inactiveProps={{ className: 'text-slate-300 hover:bg-slate-800/60 hover:text-white' }}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Início</span>
            </Link>

            <Link
              to="/agenda"
              activeProps={{ className: 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500' }}
              inactiveProps={{ className: 'text-slate-300 hover:bg-slate-800/60 hover:text-white' }}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda</span>
            </Link>
          </nav>

          {/* Seção Departamentos */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Departamentos</span>
            </div>

            <div className="space-y-1.5">
              {departments.map((dept) => {
                const isDeptExpanded = !!expandedDepts[dept.id]
                const deptProjects = projects.filter(p => p.department_id === dept.id)
                
                // Agrupar projetos por categoria
                const categoriesMap: Record<string, Project[]> = {}
                const uncategorizedProjects: Project[] = []

                deptProjects.forEach(proj => {
                  if (proj.category_name) {
                    if (!categoriesMap[proj.category_name]) {
                      categoriesMap[proj.category_name] = []
                    }
                    categoriesMap[proj.category_name].push(proj)
                  } else {
                    uncategorizedProjects.push(proj)
                  }
                })

                const categoryNames = Object.keys(categoriesMap)

                return (
                  <div key={dept.id} className="rounded-lg overflow-hidden">
                    {/* Botão de Expansão do Departamento */}
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors font-medium text-left"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {isDeptExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{dept.name}</span>
                      </div>
                    </button>

                    {/* Conteúdo Expandido do Departamento */}
                    {isDeptExpanded && (
                      <div className="pl-4 mt-1 space-y-1 border-l border-slate-800 ml-3 py-1">
                        {/* Categorias / Subpastas */}
                        {categoryNames.map((catName) => {
                          const catKey = `${dept.id}-${catName}`
                          const isCatExpanded = !!expandedCategories[catKey]
                          const catProjects = categoriesMap[catName]

                          return (
                            <div key={catKey} className="space-y-1">
                              <button
                                onClick={() => toggleCategory(catKey)}
                                className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 rounded transition-colors text-left"
                              >
                                {isCatExpanded ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                ) : (
                                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                )}
                                <span className="font-medium text-slate-200 truncate">{catName}</span>
                              </button>

                              {/* Projetos dentro da Categoria */}
                              {isCatExpanded && (
                                <div className="pl-5 space-y-1 border-l border-slate-800 ml-3 py-0.5">
                                  {catProjects.map((proj) => (
                                    <Link
                                      key={proj.id}
                                      to={`/projects/$projectId`}
                                      params={{ projectId: proj.id }}
                                      activeProps={{ className: 'text-blue-400 font-semibold' }}
                                      inactiveProps={{ className: 'text-slate-400 hover:text-slate-200' }}
                                      className="block text-xs py-1 px-2 rounded hover:bg-slate-800/40 truncate transition-colors"
                                    >
                                      {proj.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* Processos/Projetos sem categoria */}
                        {uncategorizedProjects.map((proj) => (
                          <Link
                            key={proj.id}
                            to={`/projects/$projectId`}
                            params={{ projectId: proj.id }}
                            activeProps={{ className: 'text-blue-400 font-semibold' }}
                            inactiveProps={{ className: 'text-slate-400 hover:text-slate-200' }}
                            className="block text-xs py-1.5 px-2 rounded hover:bg-slate-800/40 truncate transition-colors"
                          >
                            {proj.name}
                          </Link>
                        ))}

                        {/* Botão Novo Processo para Administrador */}
                        {isAdmin && (
                          <button
                            onClick={() => alert(`Criar novo processo no departamento ${dept.name}`)}
                            className="flex items-center space-x-1.5 px-2 py-1.5 mt-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded transition-colors w-full text-left font-medium"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Novo processo</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Gestor Hub Operacional
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col ml-72 min-h-screen">
        {/* Barra Superior */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{headerInfo.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{headerInfo.subtitle}</p>
          </div>

          {/* Cartão do Usuário Logado */}
          <div className="flex items-center space-x-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 flex items-center space-x-3 shadow-xs">
              <div className="bg-slate-200 text-slate-700 p-2 rounded-full">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.name || 'Usuário Gestor'}
                </p>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded capitalize mt-0.5">
                  {currentUser?.role || 'Colaborador'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sair do sistema"
              className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Conteúdo das Páginas */}
        <main className="flex-1 p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
