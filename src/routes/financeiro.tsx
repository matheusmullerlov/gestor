import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar as CalendarIcon
} from 'lucide-react'

export const Route = createFileRoute('/financeiro')({
  component: FinanceiroView,
})

interface Transaction {
  id: string
  description: string
  amount: number
  transaction_date: string
  type: string
  category: string | null
  created_by: string | null
}

function FinanceiroView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_date: getLocalDateString(),
    type: 'entrada',
    category: ''
  })
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    checkAdmin()
    fetchTransactions()
  }, [currentDate])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase
        .from('hub_users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      if (data && (data.role?.toLowerCase() === 'administrador' || data.role?.toLowerCase() === 'admin')) {
        setIsAdmin(true)
      }
    }
  }

  const fetchTransactions = async () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    
    const nextMonthDate = new Date(year, month, 1)
    nextMonthDate.setDate(0)
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true })

    if (error) {
      console.error('Error fetching transactions:', error)
    } else {
      setTransactions(data || [])
    }
  }

  const previousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { description, amount, transaction_date, type, category } = formData
    
    const { error } = await supabase
      .from('financial_transactions')
      .insert([{
        description,
        amount: parseFloat(amount),
        transaction_date,
        type,
        category: category || null
      }])

    if (error) {
      alert('Erro ao salvar lançamento: ' + error.message)
    } else {
      setIsFormOpen(false)
      setFormData({
        description: '',
        amount: '',
        transaction_date: getLocalDateString(),
        type: 'entrada',
        category: ''
      })
      fetchTransactions()
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) return
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return
    
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      fetchTransactions()
    }
  }

  const handleDarBaixa = async (id: string) => {
    const { error } = await supabase
      .from('financial_transactions')
      .update({
        type: 'saída',
        transaction_date: getLocalDateString()
      })
      .eq('id', id)

    if (error) {
      alert('Erro ao dar baixa: ' + error.message)
    } else {
      fetchTransactions()
    }
  }

  const exportCSV = () => {
    if (transactions.length === 0) {
      alert('Sem dados para exportar neste mês.')
      return
    }

    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']
    const rows = transactions.map(t => [
      formatDate(t.transaction_date),
      t.type,
      t.category || '',
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount
    ])

    const csvContent = 
      headers.join(',') + '\n' + 
      rows.map(e => e.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `fluxo_de_caixa_${currentDate.getFullYear()}_${String(currentDate.getMonth()+1).padStart(2, '0')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const entradas = transactions.filter(t => t.type === 'entrada')
  const saidas = transactions.filter(t => t.type === 'saída')
  const provisoes = transactions.filter(t => t.type === 'provisão')

  const totalEntradas = entradas.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalSaidas = saidas.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const saldoAtual = totalEntradas - totalSaidas

  const currentMonthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={previousMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 capitalize w-48 text-center">{currentMonthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Mensal</span>
          </div>
          <div className="mt-2">
            <h3 className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              {formatCurrency(saldoAtual)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entradas</span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalEntradas)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saídas</span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSaidas)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Entradas</span>
            </h3>
            <span className="text-sm font-medium text-emerald-600">{entradas.length} itens</span>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  {isAdmin && <th className="px-4 py-3 font-medium w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {entradas.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-slate-500">Nenhuma entrada este mês</td></tr>
                ) : (
                  entradas.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(t.transaction_date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{t.description}</div>
                        {t.category && <div className="text-xs text-slate-500">{t.category}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(t.amount)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-600 transition-colors inline-block">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span>Saídas</span>
              </h3>
              <span className="text-sm font-medium text-red-600">{saidas.length} itens</span>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium text-right">Valor</th>
                    {isAdmin && <th className="px-4 py-3 font-medium w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {saidas.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-slate-500">Nenhuma saída este mês</td></tr>
                  ) : (
                    saidas.map(t => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(t.transaction_date)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{t.description}</div>
                          {t.category && <div className="text-xs text-slate-500">{t.category}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(t.amount)}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-600 transition-colors inline-block">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-amber-600" />
                <span>Próximos Pagamentos (Provisões)</span>
              </h3>
              <span className="text-sm font-medium text-amber-600">{provisoes.length} itens</span>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Previsto para</th>
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium text-right">Valor</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {provisoes.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Nenhuma provisão este mês</td></tr>
                  ) : (
                    provisoes.map(t => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-amber-600 font-medium">{formatDate(t.transaction_date)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{t.description}</div>
                          {t.category && <div className="text-xs text-slate-500">{t.category}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-amber-600">{formatCurrency(t.amount)}</td>
                        <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                          <button 
                            onClick={() => handleDarBaixa(t.id)}
                            title="Dar Baixa (Converter em Saída Hoje)"
                            className="text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">Baixar</span>
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Novo Lançamento</h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Lançamento</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="entrada">Entrada</option>
                  <option value="saída">Saída</option>
                  <option value="provisão">Provisão (Próximo Pagamento)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ex: Pagamento fornecedor, Mensalidade..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Opcional)</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Ex: Software, Folha, Marketing..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Salvar Lançamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
