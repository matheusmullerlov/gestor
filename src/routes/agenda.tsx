import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, Plus, Video, Users, AlignLeft, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/agenda')({
  component: AgendaPage,
})

function AgendaPage() {
  const [events, setEvents] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    start_time: '',
    end_time: '',
    meeting_link: '',
    guests: '',
    notes: ''
  })

  // Calendário Info
  const today = new Date()
  const currentMonthStr = today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    fetchAgenda()
  }, [])

  async function fetchAgenda() {
    setLoading(true)
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        supabase.from('calendar_events').select('*').order('event_date', { ascending: true }),
        supabase.from('tasks').select('*').not('due_date', 'is', null)
      ])
      setEvents(eventsRes.data || [])
      setTasks(tasksRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const insertData: any = {
        title: formData.title,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : new Date().toISOString(),
        meeting_link: formData.meeting_link,
        notes: formData.notes,
      }
      // Ajuste para TimeZone se as horas tiverem sido preenchidas
      if (formData.event_date && formData.start_time) {
        insertData.start_time = new Date(`${formData.event_date}T${formData.start_time}`).toISOString();
      }
      if (formData.event_date && formData.end_time) {
        insertData.end_time = new Date(`${formData.event_date}T${formData.end_time}`).toISOString();
      }
      if (formData.guests) {
        insertData.guests = formData.guests.split(',').map(s => s.trim()).filter(Boolean)
      }

      await supabase.from('calendar_events').insert([insertData])
      setIsModalOpen(false)
      setFormData({ title: '', event_date: '', start_time: '', end_time: '', meeting_link: '', guests: '', notes: '' })
      fetchAgenda()
    } catch (error) {
      console.error('Erro ao salvar evento', error)
    }
  }

  // Unificando eventos e tarefas (prazos) para a lista cronológica
  const combinedItems = [
    ...events.map(ev => ({ 
      ...ev, 
      type: 'event', 
      sortDate: new Date(ev.start_time || ev.event_date) 
    })),
    ...tasks.map(t => ({ 
      ...t, 
      title: `Prazo: ${t.name}`, 
      type: 'task', 
      sortDate: new Date(t.due_date) 
    }))
  ].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime()) // ordenar por data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Agenda Corporativa
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciamento de eventos, reuniões corporativas e prazos combinados</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Compromisso</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Calendário (Esquerda) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit">
          <h3 className="font-bold text-slate-800 text-lg capitalize mb-4 text-center">{currentMonthStr}</h3>
          {/* Simulação de Calendário visual simples */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
             {/* Renderização basica de 31 dias para contexto visual */}
             {Array.from({length: 31}).map((_, i) => {
               const day = i + 1;
               // highlight se tiver evento neste dia
               const hasEvent = events.some(e => new Date(e.event_date).getDate() === day)
               const hasTask = tasks.some(t => new Date(t.due_date).getDate() === day)
               
               return (
                 <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer ${hasEvent ? 'bg-blue-100 text-blue-700 font-bold' : hasTask ? 'bg-rose-100 text-rose-700 font-bold' : 'hover:bg-slate-100 text-slate-600'}`}>
                   <span>{day}</span>
                   <div className="flex flex-row gap-0.5 mt-0.5">
                    {hasEvent && <span className="w-1 h-1 bg-blue-500 rounded-full"></span>}
                    {hasTask && <span className="w-1 h-1 bg-rose-500 rounded-full"></span>}
                   </div>
                 </div>
               )
             })}
          </div>
          <div className="mt-6 flex flex-col gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span><span>Reuniões/Eventos</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-rose-500 rounded-full"></span><span>Prazos de Tarefas</span></div>
          </div>
        </div>

        {/* Lista de Compromissos (Direita) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3 text-slate-700 font-semibold border-b border-slate-100 pb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Próximos Itens</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-500 text-sm text-center py-6">Carregando agenda...</p>
            ) : combinedItems.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Nenhum compromisso ou prazo adicionado.</p>
            ) : (
              combinedItems.map((item, idx) => {
                const isTask = item.type === 'task';
                const itemDate = item.sortDate.toLocaleDateString('pt-BR');
                
                return (
                  <div key={idx} className={`p-4 rounded-xl border ${isTask ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50 border-slate-100'} flex flex-col gap-3`}>
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-4">
                        <div className={`p-3 rounded-xl font-bold text-sm text-center min-w-[65px] flex flex-col justify-center ${isTask ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.sortDate.getDate()}
                          <span className="text-xs font-normal uppercase">{item.sortDate.toLocaleString('pt-BR', { month: 'short' })}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                          
                          <p className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>{itemDate}</span>
                            
                            {!isTask && item.start_time && (
                              <>
                                <span>•</span>
                                <Clock className="w-3.5 h-3.5 ml-1" />
                                <span>
                                  {new Date(item.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                  {item.end_time && ` - ${new Date(item.end_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isTask ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {isTask ? 'Prazo' : 'Evento'}
                      </span>
                    </div>

                    {/* Metadados Extras do Evento */}
                    {!isTask && (item.meeting_link || (item.guests && item.guests.length > 0) || item.notes) && (
                      <div className="ml-[81px] bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                        {item.meeting_link && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Video className="w-3.5 h-3.5" />
                            <a href={item.meeting_link} target="_blank" rel="noreferrer" className="hover:underline">Acessar Sala (Link)</a>
                          </div>
                        )}
                        {item.guests && item.guests.length > 0 && (
                          <div className="flex items-start gap-2 text-slate-600">
                            <Users className="w-3.5 h-3.5 mt-0.5" />
                            <span>Convidados: {item.guests.join(', ')}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="flex items-start gap-2 text-slate-600">
                            <AlignLeft className="w-3.5 h-3.5 mt-0.5" />
                            <span className="italic">{item.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação de Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Novo Compromisso</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título do Evento *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ex: Reunião de Pauta" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                  <input required type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Link da Reunião</label>
                  <input type="url" value={formData.meeting_link} onChange={e => setFormData({...formData, meeting_link: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="https://meet..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora de Início</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Final</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Convidados (separados por vírgula)</label>
                <input type="text" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="joao@hub.com, maria@hub.com" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anotações / Descrição</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 h-20 resize-none" placeholder="Detalhes adicionais da reunião..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Salvar Compromisso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
