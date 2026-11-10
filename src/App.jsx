import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus,
  GraduationCap, 
  Save, 
  CheckCircle 
} from 'lucide-react';

// --- MOCK DATABASE (Para carregar as matérias fixas do curso) ---
const initialMaterias = [
  { curso: 'TI', sigla: 'Eng_Req', professor: 1, nome: 'Engenharia de Requisitos' },
  { curso: 'TI', sigla: 'BD_II', professor: 1, nome: 'Banco de Dados II' },
  { curso: 'TI', sigla: 'POO_I', professor: 1, nome: 'Programação Orientada a Objetos I' },
  { curso: 'TI', sigla: 'ARQ_I', professor: 1, nome: 'Arquitetura de Computadores I' },
  { curso: 'TI', sigla: 'VIV_EXI', professor: 1, nome: 'Vivência de Extensão I' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('matricular');
  const [materias] = useState(initialMaterias);
  const [alunos, setAlunos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);

  // Carrega os dados do Supabase assim que o app abre
  useEffect(() => {
    const fetchDados = async () => {
    try {
      // Busca os alunos do banco real
      const { data: dataAlunos, error: errAlunos } = await supabase.from('alunos').select('*');
      if (errAlunos) throw errAlunos;
      setAlunos(dataAlunos || []);

      // Busca as matrículas do banco real
      const { data: dataMatriculas, error: errMatriculas } = await supabase.from('matricula').select('*');
      if (errMatriculas) throw errMatriculas;
      setMatriculas(dataMatriculas || []);
    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error.message);
    }
  };

  fetchDados();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <GraduationCap className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">EduManager</h1>
        </div>
        <nav className="flex-1 py-4">
          <button
            onClick={() => setActiveTab('matricular')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
              activeTab === 'matricular' ? 'bg-blue-600 border-r-4 border-blue-400' : 'hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>Matricular Aluno</span>
          </button>
          
          <button
            onClick={() => setActiveTab('alunos')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
              activeTab === 'alunos' ? 'bg-blue-600 border-r-4 border-blue-400' : 'hover:bg-slate-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Alunos Matriculados</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'matricular' && (
          <MatricularAluno 
            materias={materias} 
            alunos={alunos} 
            setAlunos={setAlunos} 
            matriculas={matriculas} 
            setMatriculas={setMatriculas} 
          />
        )}
        
        {activeTab === 'alunos' && (
          <ListaAlunos 
            alunos={alunos}
            matriculas={matriculas}
          />
        )}
      </main>
    </div>
  );
}

// --- TELA 1: MATRICULAR ALUNO ---
function MatricularAluno({ materias, alunos, setAlunos, matriculas, setMatriculas }) {
  const [nome, setNome] = useState('');
  const [curso, setCurso] = useState('');
  const [perLetivo, setPerLetivo] = useState(new Date().getFullYear());
  const [mensagem, setMensagem] = useState(null);

  const cursosDisponiveis = [...new Set(materias.map(m => m.curso))];

  const handleMatricular = async (e) => {
    e.preventDefault();
    if (!nome || !curso || !perLetivo) return;

    try {
      // 1. Inserir Aluno na tabela 'alunos' do Supabase
      const { data: alunoInserido, error: erroAluno } = await supabase
        .from('alunos')
        .insert([{ nome: nome }])
        .select()
        .single();

      if (erroAluno) throw erroAluno;

      const novoId = alunoInserido.id; // ID numérico gerado pelo Supabase

      // 2. Filtrar as matérias do curso escolhido
      const materiasDoCurso = materias.filter(m => m.curso === curso);
      
      // Mapeia para as colunas exatas da sua tabela 'matricula'
      // Mapeia EXATAMENTE para as colunas do seu banco SQL
      const novasMatriculas = materiasDoCurso.map((m) => ({
        matricula: novoId, // Aqui é apenas 'matricula' (chave estrangeira do aluno)
        curso: m.curso,
        materia: m.sigla,
        professor: m.professor,
        perletivo: parseInt(perLetivo), // Tudo minúsculo como no banco
        resultado: 'PENDENTE'
      }));

      // 3. Inserir as disciplinas associadas ao aluno na tabela 'matricula'
      const { data: matriculasInseridas, error: erroMatricula } = await supabase
        .from('matricula')
        .insert(novasMatriculas)
        .select();

      if (erroMatricula) throw erroMatricula;

      // Sincroniza o estado do React com o banco de dados
      setAlunos([...alunos, alunoInserido]);
      setMatriculas([...matriculas, ...(matriculasInseridas || [])]);
      
      setMensagem(`Aluno(a) ${nome} matriculado com sucesso no curso de ${curso}!`);
      setNome('');
      setCurso('');
      setTimeout(() => setMensagem(null), 4000);

    } catch (error) {
      console.error("Erro ao salvar no Supabase:", error.message);
      alert("Houve um erro ao salvar as informações: " + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Nova Matrícula</h2>
        <p className="text-slate-500 mt-2">Cadastre um novo aluno e vincule-o automaticamente às disciplinas do curso.</p>
      </header>

      {mensagem && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {mensagem}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
        <form onSubmit={handleMatricular} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Aluno</label>
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ex: João da Silva"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Curso</label>
              <select 
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                required
              >
                <option value="">Selecione um curso...</option>
                {cursosDisponiveis.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Período Letivo (Ano)</label>
              <input 
                type="number" 
                value={perLetivo}
                onChange={(e) => setPerLetivo(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-5 h-5" />
              Efetuar Matrícula
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- TELA 2: LISTA DE ALUNOS ---
function ListaAlunos({ alunos, matriculas }) {
  const alunosCompilados = alunos.map(aluno => {
    const matriculasDoAluno = matriculas.filter(m => m.matriculaAluno === aluno.id);
    return {
      ...aluno,
      curso: matriculasDoAluno.length > 0 ? matriculasDoAluno[0].curso : 'N/A',
      perLetivo: matriculasDoAluno.length > 0 ? matriculasDoAluno[0].perLetivo : 'N/A',
      totalDisciplinas: matriculasDoAluno.length
    };
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Alunos Matriculados</h2>
        <p className="text-slate-500 mt-2">Consulte a listagem geral de alunos salvos no banco de dados.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {alunosCompilados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium">Nenhum aluno cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Curso</th>
                  <th className="p-4">Ano Letivo</th>
                  <th className="p-4">Disciplinas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alunosCompilados.map(aluno => (
                  <tr key={aluno.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{aluno.id}</td>
                    <td className="p-4 font-medium text-slate-900">{aluno.nome}</td>
                    <td className="p-4 text-slate-600">{aluno.curso}</td>
                    <td className="p-4 text-slate-600">{aluno.perLetivo}</td>
                    <td className="p-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {aluno.totalDisciplinas}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}