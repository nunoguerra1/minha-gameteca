import { useEffect, useState } from 'react'
import axios from 'axios'

interface Jogo {
  id: number;
  titulo: string;
  plataforma: string;
  genero: string;
}

interface Biblioteca {
  id: number;
  nome: string;
  email: string;
  jogos: Jogo[];
}

function App() {
  const [biblioteca, setBiblioteca] = useState<Biblioteca | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/biblioteca/1')
      .then(response => {
        setBiblioteca(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.error || 'Erro ao conectar com o servidor da biblioteca.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="animate-pulse text-xl font-semibold text-blue-400">Carregando sua Gameteca...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
        <div className="rounded-xl border border-red-500 bg-red-950/40 p-6 text-center max-w-md w-full shadow-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Ops! Ocorreu um problema</h2>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 antialiased selection:bg-blue-500/30">
      <div className="mx-auto max-w-5xl px-4 py-12">

        <header className="mb-10 flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-slate-800 bg-slate-800/50 p-6 shadow-xl backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-2xl font-black text-white shadow-md shadow-blue-500/20">
            {biblioteca?.nome.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Gameteca de {biblioteca?.nome}
            </h1>
            <p className="text-sm font-medium text-slate-400">{biblioteca?.email}</p>
          </div>
        </header>

        <main>
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              Meus Jogos
            </h2>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-blue-400 border border-slate-700">
              {biblioteca?.jogos.length || 0} cadastrados
            </span>
          </div>

          {biblioteca?.jogos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
              <p className="text-slate-500">Nenhum jogo vinculado a esta biblioteca ainda.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {biblioteca?.jogos.map(jogo => (
                <div
                  key={jogo.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-800/40 p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div>
                    <h3 className="mb-4 text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {jogo.titulo}
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 border border-slate-900/20">
                        <span className="font-semibold text-slate-500">Plataforma</span>
                        <span className="font-medium text-slate-300">{jogo.plataforma}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 border border-slate-900/20">
                        <span className="font-semibold text-slate-500">Gênero</span>
                        <span className="font-medium text-slate-300">{jogo.genero}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  )
}

export default App