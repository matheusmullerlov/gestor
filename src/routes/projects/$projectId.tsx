import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  FileText,
  Folder,
  GripVertical,
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
})

type Task = {
  id: string
  project_id: string | null
  name: string
  description: string | null
  status: string | null
  assigned_to: string | null
  created_by: string | null
  due_date: string | null
  priority: string | null
  tags: string[] | null
  checklist: ChecklistItem[] | null
}

type ChecklistItem = {
  id: string
  text: string
  completed: boolean
}

type Project = {
  id: string
  name: string
  category_name: string | null
  objective: string | null
}

type UserProfile = {
  id: string
  name: string | null
  email: string | null
}

type Comment = {
  id: string
  content: string
  created_at: string | null
  created_by: string | null
}

type Attachment = {
  id: string
  file_url: string
  created_by: string | null
}

const CONTENT_COLUMNS = [
  { value: 'briefing', label: 'Briefing', color: 'bg-slate-400' },
  { value: 'roteiro', label: 'Roteiro', color: 'bg-violet-500' },
  { value: 'producao', label: 'Produção', color: 'bg-blue-500' },
  { value: 'edicao', label: 'Edição', color: 'bg-cyan-500' },
  { value: 'revisao', label: 'Revisão', color: 'bg-amber-500' },
  { value: 'aprovacao', label: 'Aprovação', color: 'bg-orange-500' },
  { value: 'publicado', label: 'Publicado', color: 'bg-emerald-500' },
]

const GENERAL_STATUSES = [
  { value: 'pending', label: 'A Fazer', color: 'bg-amber-500' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-blue-500' },
  { value: 'completed', label: 'Concluído', color: 'bg-emerald-500' },
]

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  useEffect(() => {
    void loadProject()
  }, [projectId])

  async function loadProject() {
    setLoading(true)
    setError('')
    const [{ data: projectData, error: projectError }, { data: taskData, error: taskError }, { data: userData }] = await Promise.all([
      supabase.from('projects').select('id, name, category_name, objective').eq('id', projectId).maybeSingle(),
      supabase.from('tasks').select('id, project_id, name, description, status, assigned_to, created_by, due_date, priority, tags, checklist').eq('project_id', projectId).order('created_by'),
      supabase.from('hub_users').select('id, name, email').order('name'),
    ])

    if (projectError || taskError) {
      setError('Não foi possível carregar os dados deste processo.')
    }
    setProject(projectData as Project | null)
    setTasks((taskData || []) as Task[])
    setUsers((userData || []) as UserProfile[])
    setLoading(false)
  }

  async function moveTask(taskId: string, status: string) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task))
    const { error: updateError } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (updateError) {
      setError('Não foi possível atualizar o status da tarefa.')
      void loadProject()
    }
  }

  async function createTask() {
    const initialStatus = project?.category_name === 'Produção de Conteúdo' ? 'briefing' : 'pending'
    const { data, error: insertError } = await supabase.from('tasks').insert({
      project_id: projectId,
      name: 'Nova tarefa',
      status: initialStatus,
      tags: [],
      checklist: [],
    }).select('id, project_id, name, description, status, assigned_to, created_by, due_date, priority, tags, checklist').single()

    if (insertError || !data) {
      setError('Não foi possível criar a tarefa.')
      return
    }
    const task = data as Task
    setTasks((current) => [task, ...current])
    setSelectedTask(task)
    setIsCreating(false)
  }

  const isContentProduction = project?.category_name === 'Produção de Conteúdo'
  const columns = isContentProduction ? CONTENT_COLUMNS : GENERAL_STATUSES

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-500"><ClipboardList className="mr-3 h-5 w-5 animate-pulse" /> Carregando processo...</div>
  }

  if (!project) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><Folder className="mx-auto mb-3 h-10 w-10 text-slate-300" /><h1 className="text-lg font-bold text-slate-800">Processo não encontrado</h1><p className="mt-1 text-sm text-slate-500">{error || 'Este processo não está disponível.'}</p></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="mt-1 shrink-0 rounded-xl bg-blue-100 p-3 text-blue-700"><Folder className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{project.category_name || 'Processo operacional'} · {tasks.length} tarefa{tasks.length === 1 ? '' : 's'}</p>
            {project.objective && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{project.objective}</p>}
          </div>
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"><Plus className="h-4 w-4" /> Nova tarefa</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {isCreating && <NewTaskForm onCancel={() => setIsCreating(false)} onCreate={() => void createTask()} />}

      <div className={isContentProduction ? 'grid gap-4 overflow-x-auto pb-3 xl:grid-cols-7' : 'grid gap-5 md:grid-cols-3'}>
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => (task.status || 'pending') === column.value)
          return <TaskColumn key={column.value} column={column} tasks={columnTasks} users={users} onOpen={setSelectedTask} onDrop={(taskId) => void moveTask(taskId, column.value)} onDragStart={setDraggedTaskId} draggedTaskId={draggedTaskId} />
        })}
      </div>

      {selectedTask && <TaskModal task={selectedTask} users={users} columns={columns} onClose={() => setSelectedTask(null)} onSaved={(updated) => { setTasks((current) => current.map((task) => task.id === updated.id ? updated : task)); setSelectedTask(updated) }} onDeleted={(id) => { setTasks((current) => current.filter((task) => task.id !== id)); setSelectedTask(null) }} />}
    </div>
  )
}

function NewTaskForm({ onCancel, onCreate }: { onCancel: () => void; onCreate: () => void }) {
  return <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-4"><div><p className="font-semibold text-blue-900">Criar uma nova tarefa?</p><p className="text-sm text-blue-700">Ela será criada com o título “Nova tarefa” e poderá ser editada imediatamente.</p></div><div className="flex gap-2"><button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white">Cancelar</button><button onClick={onCreate} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Criar tarefa</button></div></div>
}

function TaskColumn({ column, tasks, users, onOpen, onDrop, onDragStart, draggedTaskId }: { column: { value: string; label: string; color: string }; tasks: Task[]; users: UserProfile[]; onOpen: (task: Task) => void; onDrop: (id: string) => void; onDragStart: (id: string) => void; draggedTaskId: string | null }) {
  return <section onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (draggedTaskId) onDrop(draggedTaskId) }} className="min-w-[230px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />{column.label}</div><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{tasks.length}</span></div><div className="space-y-3">{tasks.map((task) => <TaskCard key={task.id} task={task} users={users} onOpen={onOpen} onDragStart={onDragStart} />)}{tasks.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">Arraste tarefas para cá</div>}</div></section>
}

function TaskCard({ task, users, onOpen, onDragStart }: { task: Task; users: UserProfile[]; onOpen: (task: Task) => void; onDragStart: (id: string) => void }) {
  const assignee = users.find((user) => user.id === task.assigned_to)
  const completed = task.checklist?.filter((item) => item.completed).length || 0
  return <article draggable onDragStart={() => onDragStart(task.id)} onClick={() => onOpen(task)} className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"><div className="mb-2 flex items-start justify-between gap-2"><h3 className="text-sm font-semibold leading-5 text-slate-800">{task.name}</h3><GripVertical className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500" /></div>{task.description && <p className="mb-3 line-clamp-2 text-xs text-slate-500">{task.description}</p>}<div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">{task.priority && <span className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-700">{task.priority}</span>}{task.due_date && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</span>}{task.checklist && task.checklist.length > 0 && <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{completed}/{task.checklist.length}</span>}{assignee && <span className="ml-auto flex items-center gap-1"><User className="h-3 w-3" />{assignee.name || assignee.email}</span>}</div>{task.tags && task.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{task.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{tag}</span>)}</div>}</article>
}

function TaskModal({ task, users, columns, onClose, onSaved, onDeleted }: { task: Task; users: UserProfile[]; columns: { value: string; label: string }[]; onClose: () => void; onSaved: (task: Task) => void; onDeleted: (id: string) => void }) {
  const [name, setName] = useState(task.name)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status || columns[0].value)
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [priority, setPriority] = useState(task.priority || '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [tags, setTags] = useState((task.tags || []).join(', '))
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist || [])
  const [newChecklist, setNewChecklist] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [comment, setComment] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'details' | 'activity'>('details')

  useEffect(() => { void loadRelated() }, [task.id])

  async function loadRelated() {
    const [{ data: commentData }, { data: attachmentData }] = await Promise.all([
      supabase.from('task_comments').select('id, content, created_at, created_by').eq('task_id', task.id).order('created_at', { ascending: false }),
      supabase.from('task_attachments').select('id, file_url, created_by').eq('task_id', task.id).order('id', { ascending: false }),
    ])
    setComments((commentData || []) as Comment[])
    setAttachments((attachmentData || []) as Attachment[])
  }

  async function save() {
    setSaving(true)
    const payload = { name: name.trim() || 'Nova tarefa', description: description || null, status, due_date: dueDate || null, priority: priority || null, assigned_to: assignedTo || null, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), checklist }
    const { data, error: saveError } = await supabase.from('tasks').update(payload).eq('id', task.id).select('id, project_id, name, description, status, assigned_to, created_by, due_date, priority, tags, checklist').single()
    setSaving(false)
    if (saveError || !data) return
    onSaved(data as Task)
  }

  async function addComment() {
    if (!comment.trim()) return
    const { data } = await supabase.from('task_comments').insert({ task_id: task.id, content: comment.trim() }).select('id, content, created_at, created_by').single()
    if (data) setComments((current) => [data as Comment, ...current])
    setComment('')
  }

  async function addAttachment() {
    if (!attachmentUrl.trim()) return
    const { data } = await supabase.from('task_attachments').insert({ task_id: task.id, file_url: attachmentUrl.trim() }).select('id, file_url, created_by').single()
    if (data) setAttachments((current) => [data as Attachment, ...current])
    setAttachmentUrl('')
  }

  async function deleteTask() {
    if (!window.confirm('Excluir esta tarefa?')) return
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id)
    if (!deleteError) onDeleted(task.id)
  }

  const addChecklistItem = () => { if (newChecklist.trim()) { setChecklist((current) => [...current, { id: crypto.randomUUID(), text: newChecklist.trim(), completed: false }]); setNewChecklist('') } }
  const completed = useMemo(() => checklist.filter((item) => item.completed).length, [checklist])

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 p-5"><div className="flex items-start gap-3"><div className="rounded-lg bg-blue-100 p-2 text-blue-700"><ClipboardList className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detalhes da tarefa</p><h2 className="mt-1 text-xl font-bold text-slate-900">{name || 'Nova tarefa'}</h2></div></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><div className="flex border-b border-slate-200 px-5"><button onClick={() => setTab('details')} className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Detalhes</button><button onClick={() => setTab('activity')} className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Atividade</button></div><div className="overflow-y-auto p-5">{tab === 'details' ? <div className="grid gap-6 lg:grid-cols-[1fr_280px]"><div className="space-y-5"><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Título</span><input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Descrição</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Adicione uma descrição..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><div><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Checklist <span className="font-normal text-slate-400">{completed}/{checklist.length}</span></span></div><div className="space-y-2">{checklist.map((item, index) => <div key={item.id} className="flex items-center gap-2"><button onClick={() => setChecklist((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, completed: !entry.completed } : entry))} className={`rounded border p-1 ${item.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3 w-3" /></button><input value={item.text} onChange={(event) => setChecklist((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, text: event.target.value } : entry))} className={`flex-1 border-b border-transparent bg-transparent py-1 text-sm outline-none focus:border-blue-300 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`} /><button onClick={() => setChecklist((current) => current.filter((_, entryIndex) => entryIndex !== index))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>)}</div><div className="mt-2 flex gap-2"><input value={newChecklist} onChange={(event) => setNewChecklist(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addChecklistItem() }} placeholder="Adicionar item" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /><button onClick={addChecklistItem} className="rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-200">Adicionar</button></div></div></div><aside className="space-y-4 rounded-xl bg-slate-50 p-4"><FieldLabel label="Status"><select value={status} onChange={(event) => setStatus(event.target.value)} className="field">{columns.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}</select></FieldLabel><FieldLabel label="Data de vencimento"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="field" /></FieldLabel><FieldLabel label="Prioridade"><select value={priority} onChange={(event) => setPriority(event.target.value)} className="field"><option value="">Sem prioridade</option><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></FieldLabel><FieldLabel label="Responsável"><select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="field"><option value="">Não atribuído</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email || user.id}</option>)}</select></FieldLabel><FieldLabel label="Etiquetas"><div className="relative"><Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="marketing, urgente" className="field pl-9" /></div><small className="mt-1 block text-[11px] text-slate-400">Separe as etiquetas por vírgula.</small></FieldLabel></aside></div> : <div className="grid gap-6 lg:grid-cols-2"><ActivityBox icon={<MessageSquare className="h-4 w-4" />} title="Comentários"><div className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Escreva um comentário..." className="field flex-1" /><button onClick={() => void addComment()} className="rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">Enviar</button></div><div className="mt-4 space-y-3">{comments.map((entry) => <div key={entry.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{entry.content}<p className="mt-1 text-[11px] text-slate-400">{entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : ''}</p></div>)}{comments.length === 0 && <p className="text-sm text-slate-400">Nenhum comentário ainda.</p>}</div></ActivityBox><ActivityBox icon={<Paperclip className="h-4 w-4" />} title="Anexos"><div className="flex gap-2"><input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="Cole a URL do anexo" className="field flex-1" /><button onClick={() => void addAttachment()} className="rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white">Adicionar</button></div><div className="mt-4 space-y-2">{attachments.map((entry) => <a key={entry.id} href={entry.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-blue-600 hover:bg-blue-50"><LinkIcon className="h-4 w-4" />{entry.file_url}</a>)}{attachments.length === 0 && <p className="text-sm text-slate-400">Nenhum anexo ainda.</p>}</div></ActivityBox></div>}</div><div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4"><button onClick={() => void deleteTask()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Excluir</button><div className="flex gap-2"><button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Fechar</button><button onClick={() => void save()} disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button></div></div></div></div>
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label> }
function ActivityBox({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">{icon}{title}</h3>{children}</section> }
