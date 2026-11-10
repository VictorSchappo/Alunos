import { useState } from 'react';
import { 
  Users, 
  UserPlus,
  GraduationCap, 
  Save, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Clock
} from 'lucide-react';

// --- MOCK DATABASE ---
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

          <button
            onClick={() => setActiveTab('notas')}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
              activeTab === 'notas' ? 'bg-blue-600 border-r-4 border-blue-400' : 'hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Notas e Faltas</span>
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

        {activeTab === 'notas' && (
          <GestaoNotas 
            matriculas={matriculas} 
            setMatriculas={setMatriculas} 
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

  const handleMatricular = (e) => {
    e.preventDefault();
    if (!nome || !curso || !perLetivo) return;

    // 1. Inserir Aluno (Gerar ID)
    const novoId = alunos.length > 0 ? Math.max(...alunos.map(a => a.id)) + 1 : 1;
    const novoAluno = { id: novoId, nome };
    setAlunos([...alunos, novoAluno]);

    // 2. Criar matrículas para as disciplinas do curso escolhido
    const materiasDoCurso = materias.filter(m => m.curso === curso);
    const novasMatriculas = materiasDoCurso.map((m, index) => ({
      id: Date.now() + index, // ID único para a matrícula
      matriculaAluno: novoId,
      nomeAluno: nome,
      curso: m.curso,
      materia: m.sigla,
      nomeMateria: m.nome,
      professor: m.professor,
      perLetivo: parseInt(perLetivo),
      n1: '', n2: '', n3: '', n4: '',
      f1: '', f2: '', f3: '', f4: '',
      exame: '',
      media: null, totalFaltas: null, percFreq: null, mediaFinal: null,
      resultado: 'PENDENTE'
    }));

    setMatriculas([...matriculas, ...novasMatriculas]);
    
    setMensagem(`Aluno(a) ${nome} matriculado com sucesso no curso de ${curso}!`);
    setNome('');
    setCurso('');
    setTimeout(() => setMensagem(null), 4000);
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
  // Compila os dados únicos por aluno cruzando com a tabela de matrículas
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
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Alunos Matriculados</h2>
          <p className="text-slate-500 mt-2">Consulte a listagem geral de alunos ativos no sistema.</p>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {alunosCompilados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium">Nenhum aluno cadastrado.</p>
            <p className="text-sm">Os alunos aparecerão aqui após serem matriculados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-4">Matrícula (ID)</th>
                  <th className="p-4">Nome do Aluno</th>
                  <th className="p-4">Curso</th>
                  <th className="p-4">Ano Letivo</th>
                  <th className="p-4 text-center">Disciplinas Vinculadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alunosCompilados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-500">
                      #{String(aluno.id).padStart(4, '0')}
                    </td>
                    <td className="p-4 font-medium text-slate-800">{aluno.nome}</td>
                    <td className="p-4 text-slate-700">{aluno.curso}</td>
                    <td className="p-4 text-slate-700">{aluno.perLetivo}</td>
                    <td className="p-4 text-center text-slate-700 font-medium">
                      {aluno.totalDisciplinas}
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

// --- TELA 3: GESTÃO DE NOTAS E FALTAS ---
function GestaoNotas({ matriculas, setMatriculas }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState(null);

  const openModal = (mat) => {
    setSelectedMatricula(mat);
    setModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'APROVADO': return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Aprovado</span>;
      case 'REPROVADO': return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> Reprovado</span>;
      case 'EXAME': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3"/> Exame</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pendente</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Lançamento de Notas e Faltas</h2>
          <p className="text-slate-500 mt-2">Gerencie o rendimento acadêmico dos alunos matriculados.</p>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {matriculas.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium">Nenhuma matrícula encontrada.</p>
            <p className="text-sm">Cadastre alunos na aba "Matricular Aluno" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-4">Aluno</th>
                  <th className="p-4">Curso / Matéria</th>
                  <th className="p-4 text-center">Média</th>
                  <th className="p-4 text-center">Freq. (%)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matriculas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{m.nomeAluno}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{m.nomeMateria} ({m.materia})</div>
                      <div className="text-xs text-slate-500">{m.curso} - {m.perLetivo}</div>
                    </td>
                    <td className="p-4 text-center font-medium">
                      {m.mediaFinal !== null ? m.mediaFinal.toFixed(1) : (m.media !== null ? m.media.toFixed(1) : '-')}
                    </td>
                    <td className="p-4 text-center">
                      {m.percFreq !== null ? `${m.percFreq.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-4 flex justify-center">
                      <StatusBadge status={m.resultado} />
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => openModal(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-sm font-medium text-slate-700 rounded-md hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Lançar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ModalNotas 
          matricula={selectedMatricula} 
          onClose={() => setModalOpen(false)} 
          matriculas={matriculas}
          setMatriculas={setMatriculas}
        />
      )}
    </div>
  );
}

// --- MODAL DE LANÇAMENTO ---
function ModalNotas({ matricula, onClose, matriculas, setMatriculas }) {
  const [notas, setNotas] = useState({
    n1: matricula.n1, n2: matricula.n2, n3: matricula.n3, n4: matricula.n4,
    f1: matricula.f1, f2: matricula.f2, f3: matricula.f3, f4: matricula.f4,
    exame: matricula.exame
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNotas(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const parseNum = (val) => val === '' || val === null ? 0 : parseFloat(val);
    const parseIntNum = (val) => val === '' || val === null ? 0 : parseInt(val, 10);

    const vN1 = parseNum(notas.n1), vN2 = parseNum(notas.n2), vN3 = parseNum(notas.n3), vN4 = parseNum(notas.n4);
    const vF1 = parseIntNum(notas.f1), vF2 = parseIntNum(notas.f2), vF3 = parseIntNum(notas.f3), vF4 = parseIntNum(notas.f4);

    const media = (vN1 + vN2 + vN3 + vN4) / 4;
    const totalFaltas = vF1 + vF2 + vF3 + vF4;
    const percFreq = 100 - (totalFaltas * 100.0 / 72);

    let resultado = '';
    let mediaFinal = null;
    const notaExame = notas.exame;

    if (media >= 7 && percFreq >= 75) {
      resultado = 'APROVADO';
    } else if (media < 7 && percFreq >= 75) {
      resultado = 'EXAME';
    } else {
      resultado = 'REPROVADO';
    }

    if (notaExame !== '' && notaExame !== null) {
      const vExame = parseNum(notaExame);
      mediaFinal = (media + vExame) / 2;
      
      if (mediaFinal >= 5) {
        resultado = 'APROVADO';
      } else {
        resultado = 'REPROVADO';
      }
    }

    const matriculasAtualizadas = matriculas.map(m => 
      m.id === matricula.id ? {
        ...m, 
        ...notas,
        media, totalFaltas, percFreq, resultado, mediaFinal
      } : m
    );

    setMatriculas(matriculasAtualizadas);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Lançamento: {matricula.nomeMateria}</h3>
            <p className="text-sm text-slate-300 mt-1">Aluno(a): {matricula.nomeAluno}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Notas (Bimestrais)</h4>
            <div className="grid grid-cols-4 gap-4">
              {['n1', 'n2', 'n3', 'n4'].map(n => (
                <div key={n}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{n.toUpperCase()}</label>
                  <input 
                    type="number" step="0.1" min="0" max="10" name={n}
                    value={notas[n]} onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Faltas (Quantidade)</h4>
            <div className="grid grid-cols-4 gap-4">
              {['f1', 'f2', 'f3', 'f4'].map(f => (
                <div key={f}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{f.toUpperCase()}</label>
                  <input 
                    type="number" min="0" name={f}
                    value={notas[f]} onChange={handleChange}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2">Nota de Exame</h4>
            <p className="text-xs text-yellow-700 mb-3">Preencha apenas se o aluno estiver em exame.</p>
            <div className="w-1/4">
              <input 
                type="number" step="0.1" min="0" max="10" name="exame"
                value={notas.exame} onChange={handleChange}
                placeholder="Exame"
                className="w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Salvar e Calcular
          </button>
        </div>
      </div>
    </div>
  );
}