import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Hub de Projetos e Tarefas
        </h1>
        <p className="text-gray-600">
          Infraestrutura inicializada com sucesso. O sistema está pronto para a integração com departamentos, usuários e banco de dados.
        </p>
      </div>
    </div>
  )
}
