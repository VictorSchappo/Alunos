import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus,
  GraduationCap, 
  Save, 
  CheckCircle,
  BookOpen,
  Pencil,
  Trash2,
  X
} from 'lucide-react';

const initialMaterias = [
  { curso: 'TI', sigla: 'Eng_Req', professor: 1, nome: 'Engenharia de Requisitos' },
  { curso: 'TI', sigla: 'BD_II', professor: 1, nome: 'Banco de Dados II' },
  { curso: 'TI', sigla: 'POO_I', professor: 1, nome: 'Programação Orientada a Objetos I' },
  { curso: 'TI', sigla: 'ARQ_I', professor: 1, nome: 'Arquitetura de Computadores I' },
  { curso: 'TI', sigla: 'VIV_EXI', professor: 1, nome: 'Vivência de Extensão I' }
];

const CARGA_HORARIA = 72;

export default function App() {
  const [activeTab, setActiveTab] = useState('matricular');
  const [materias] = useState(initialMaterias);
  const [alunos, setAlunos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const { data: dataAlunos, error: errAlunos } = await supabase
          .from('alunos')
          .select('*')
          .order('matricula', { ascending: true });
        if (errAlunos) throw errAlunos;
        setAlunos(dataAlunos || []);

        const { data: dataMatriculas, error: errMatriculas } = await supabase
          .from('matricula')
          .select('*');
        if (errMatriculas) throw errMatriculas;
        setMatriculas(dataMatriculas || []);
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error.message);
        alert("Erro ao carregar dados: " + error.message);
      }
    };

    fetchDados();
  }, []);

  const tabClass = (tab) =>
    `w-full flex items-center gap-3 px-6 py-3 transition-colors ${
      activeTab === tab ? 'bg-blue-600 border-r-4 border-blue-400' : 'hover:bg-slate-800'
    }`;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <GraduationCap className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">EduManager</h1>
        </div>
        <nav className="flex-1 py-4">
          <button onClick={() => setActiveTab('matricular')} className={tabClass('matricular')}>
            <UserPlus className="w-5 h-5" />
            <span>Matricular Aluno</span>
          </button>

          <button onClick={() => setActiveTab('notas')} className={tabClass('notas')}>
            <BookOpen className="w-5 h-5" />
            <span>Lançar Notas</span>
          </button>

          <button onClick={() => setActiveTab('alunos')} className={tabClass('alunos')}>
            <Users className="w-5 h-5" />
            <span>Alunos Matriculados</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'matricular' && (
          <MatricularAluno 
            materias={materias} 
            setAlunos={setAlunos} 
            setMatriculas={setMatriculas} 
          />
        )}

        {activeTab === 'notas' && (
          <LancarNotas 
            alunos={alunos} 
            matriculas={matriculas} 
            setMatriculas={setMatriculas} 
          />
        )}
        
        {activeTab === 'alunos' && (
          <ListaAlunos 
            alunos={alunos}
            matriculas={matriculas}
            setAlunos={setAlunos}
            setMatriculas={setMatriculas}
          />
        )}
      </main>
    </div>
  );
}

function MatricularAluno({ materias, setAlunos, setMatriculas }) {
  const [nome, setNome] = useState('');
  const [curso, setCurso] = useState('');
  const [perLetivo, setPerLetivo] = useState(new Date().getFullYear());
  const [mensagem, setMensagem] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const cursosDisponiveis = [...new Set(materias.map(m => m.curso))];

  const handleMatricular = async (e) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || !curso || !perLetivo || salvando) return;

    setSalvando(true);
    let novoId = null;

    try {
      const { data: alunoInserido, error: erroAluno } = await supabase
        .from('alunos')
        .insert([{ nome: nomeLimpo }])
        .select()
        .single();

      if (erroAluno) throw erroAluno;

      novoId = alunoInserido.matricula;
      const materiasDoCurso = materias.filter(m => m.curso === curso);
      
      const novasMatriculas = materiasDoCurso.map((m) => ({
        matricula: novoId, 
        curso: m.curso,
        materia: m.sigla,
        professor: m.professor,
        perletivo: parseInt(perLetivo, 10), 
        resultado: 'PENDENTE'
      }));

      const { data: matriculasInseridas, error: erroMatricula } = await supabase
        .from('matricula')
        .insert(novasMatriculas)
        .select();

      if (erroMatricula) throw erroMatricula;

      setAlunos(prev => [...prev, alunoInserido]);
      setMatriculas(prev => [...prev, ...(matriculasInseridas || [])]);
      
      setMensagem(`Aluno(a) ${nomeLimpo} matriculado(a) com sucesso no curso de ${curso}!`);
      setNome('');
      setCurso('');
      setTimeout(() => setMensagem(null), 4000);

    } catch (error) {
      console.error("Erro ao salvar no Supabase:", error.message);

      // Evita aluno "órfão": se o aluno foi criado mas as matrículas falharam, desfaz.
      if (novoId !== null) {
        await supabase.from('alunos').delete().eq('matricula', novoId);
      }

      alert("Houve um erro ao salvar as informações: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Nova Matrícula</h2>
        <p className="text-slate-500 mt-2">Cadastre um novo aluno e vincule-o às disciplinas do curso.</p>
      </header>
      {mensagem && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />{mensagem}
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleMatricular} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Aluno</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full p-2.5 border rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">Curso</label>
              <select value={curso} onChange={(e) => setCurso(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white" required>
                <option value="">Selecione...</option>
                {cursosDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ano Letivo</label>
              <input type="number" value={perLetivo} onChange={(e) => setPerLetivo(e.target.value)} className="w-full p-2.5 border rounded-lg" required />
            </div>
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2"
          >
            <Save className="w-5 h-5" /> {salvando ? 'Salvando...' : 'Efetuar Matrícula'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LancarNotas({ alunos, matriculas, setMatriculas }) {
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [materiaSelecionada, setMateriaSelecionada] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [salvando, setSalvando] = useState(false);
  
  const [notas, setNotas] = useState({ n1: '', n2: '', n3: '', n4: '' });
  const [faltas, setFaltas] = useState({ f1: '', f2: '', f3: '', f4: '' });

  const alunoId = alunoSelecionado ? parseInt(alunoSelecionado, 10) : null;
  const matriculasDoAluno = matriculas.filter(m => m.matricula === alunoId);

  const limparCampos = () => {
    setNotas({ n1: '', n2: '', n3: '', n4: '' });
    setFaltas({ f1: '', f2: '', f3: '', f4: '' });
  };

  const handleSelecionarAluno = (valor) => {
    setAlunoSelecionado(valor);
    setMateriaSelecionada('');
    limparCampos();
  };

  const handleSelecionarMateria = (sigla) => {
    setMateriaSelecionada(sigla);
    const mat = matriculas.find(
      m => m.matricula === alunoId && m.materia === sigla
    );
    if (mat) {
      // "??" preserva o valor 0 (com "||" uma nota 0 viraria campo vazio)
      setNotas({ n1: mat.n1 ?? '', n2: mat.n2 ?? '', n3: mat.n3 ?? '', n4: mat.n4 ?? '' });
      setFaltas({ f1: mat.f1 ?? '', f2: mat.f2 ?? '', f3: mat.f3 ?? '', f4: mat.f4 ?? '' });
    } else {
      limparCampos();
    }
  };

  const handleSalvarNotas = async (e) => {
    e.preventDefault();
    if (!alunoId || !materiaSelecionada || salvando) return;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    const n1 = clamp(parseFloat(notas.n1) || 0, 0, 10);
    const n2 = clamp(parseFloat(notas.n2) || 0, 0, 10);
    const n3 = clamp(parseFloat(notas.n3) || 0, 0, 10);
    const n4 = clamp(parseFloat(notas.n4) || 0, 0, 10);
    const f1 = Math.max(parseInt(faltas.f1, 10) || 0, 0);
    const f2 = Math.max(parseInt(faltas.f2, 10) || 0, 0);
    const f3 = Math.max(parseInt(faltas.f3, 10) || 0, 0);
    const f4 = Math.max(parseInt(faltas.f4, 10) || 0, 0);

    const media = (n1 + n2 + n3 + n4) / 4;
    const totalFaltas = f1 + f2 + f3 + f4;
    const percfreq = clamp(100 - ((totalFaltas * 100.0) / CARGA_HORARIA), 0, 100);

    // Só define o resultado final quando as 4 notas foram lançadas
    const todasNotas = ['n1', 'n2', 'n3', 'n4'].every(k => notas[k] !== '' && notas[k] !== null);

    let resultado = 'PENDENTE';
    if (todasNotas) {
      if (percfreq < 75) resultado = 'REPROVADO';
      else if (media >= 7) resultado = 'APROVADO';
      else resultado = 'EXAME';
    }

    const atualizacao = { 
      n1, n2, n3, n4, 
      f1, f2, f3, f4, 
      media, totalfaltas: totalFaltas, percfreq, resultado 
    };

    setSalvando(true);
    try {
      const { error } = await supabase
        .from('matricula')
        .update(atualizacao)
        .match({ matricula: alunoId, materia: materiaSelecionada });

      if (error) throw error;

      setMatriculas(prev => prev.map(m => 
        (m.matricula === alunoId && m.materia === materiaSelecionada)
          ? { ...m, ...atualizacao } : m
      ));

      setMensagem(`Notas e faltas salvas com sucesso! Resultado: ${resultado}`);
      setTimeout(() => setMensagem(null), 4000);
    } catch (error) {
      alert("Erro ao salvar notas: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Lançamento de Notas</h2>
        <p className="text-slate-500 mt-2">Atualize as notas e faltas dos alunos matriculados.</p>
      </header>

      {mensagem && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />{mensagem}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1">Selecione o Aluno</label>
            <select value={alunoSelecionado} onChange={(e) => handleSelecionarAluno(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white">
              <option value="">-- Escolha --</option>
              {alunos.map(a => <option key={a.matricula} value={a.matricula}>{a.nome} (ID: {a.matricula})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Disciplina</label>
            <select value={materiaSelecionada} onChange={(e) => handleSelecionarMateria(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white" disabled={!alunoSelecionado}>
              <option value="">-- Escolha a matéria --</option>
              {matriculasDoAluno.map(m => <option key={m.materia} value={m.materia}>{m.materia} (Curso: {m.curso})</option>)}
            </select>
          </div>
        </div>
      </div>

      {materiaSelecionada && (
        <form onSubmit={handleSalvarNotas} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-2 gap-10">
            <div>
              <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4">Notas (0 a 10)</h3>
              <div className="grid grid-cols-2 gap-4">
                {['n1', 'n2', 'n3', 'n4'].map(n => (
                  <div key={n}>
                    <label className="block text-sm text-slate-600 uppercase">{n}</label>
                    <input type="number" step="0.1" min="0" max="10" value={notas[n]} onChange={(e) => setNotas({...notas, [n]: e.target.value})} className="w-full p-2 border rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4">Faltas (Horas)</h3>
              <div className="grid grid-cols-2 gap-4">
                {['f1', 'f2', 'f3', 'f4'].map(f => (
                  <div key={f}>
                    <label className="block text-sm text-slate-600 uppercase">{f}</label>
                    <input type="number" min="0" value={faltas[f]} onChange={(e) => setFaltas({...faltas, [f]: e.target.value})} className="w-full p-2 border rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2"
            >
              <Save className="w-5 h-5" /> {salvando ? 'Salvando...' : 'Salvar Notas e Faltas'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Resultado geral do aluno considerando TODAS as disciplinas
function calcularStatusGeral(matriculasDoAluno) {
  if (matriculasDoAluno.length === 0) return 'PENDENTE';
  const resultados = matriculasDoAluno.map(m => m.resultado || 'PENDENTE');
  if (resultados.includes('REPROVADO')) return 'REPROVADO';
  if (resultados.includes('PENDENTE')) return 'PENDENTE';
  if (resultados.includes('EXAME')) return 'EXAME';
  return 'APROVADO';
}

function ListaAlunos({ alunos, matriculas, setAlunos, setMatriculas }) {
  const [editando, setEditando] = useState(null); // { matricula, nome, perLetivo }
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  const mostrarMensagem = (texto) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(null), 4000);
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    const nomeLimpo = editando.nome.trim();
    const ano = parseInt(editando.perLetivo, 10);
    if (!nomeLimpo || salvando) return;

    setSalvando(true);
    try {
      const { data: alunoAtualizado, error: erroAluno } = await supabase
        .from('alunos')
        .update({ nome: nomeLimpo })
        .eq('matricula', editando.matricula)
        .select();
      if (erroAluno) throw erroAluno;
      if (!alunoAtualizado || alunoAtualizado.length === 0) {
        throw new Error('Nenhum registro foi atualizado. Verifique as políticas (RLS) da tabela "alunos" no Supabase.');
      }

      if (ano) {
        const { error: erroMat } = await supabase
          .from('matricula')
          .update({ perletivo: ano })
          .eq('matricula', editando.matricula);
        if (erroMat) throw erroMat;
      }

      setAlunos(prev => prev.map(a =>
        a.matricula === editando.matricula ? { ...a, nome: nomeLimpo } : a
      ));
      if (ano) {
        setMatriculas(prev => prev.map(m =>
          m.matricula === editando.matricula ? { ...m, perletivo: ano } : m
        ));
      }

      setEditando(null);
      mostrarMensagem('Aluno atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar aluno:', error.message);
      alert('Erro ao editar aluno: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (aluno) => {
    const confirmou = window.confirm(
      `Excluir o aluno "${aluno.nome}" (matrícula ${aluno.matricula})?\n\nTodas as matrículas, notas e faltas dele também serão apagadas. Essa ação não pode ser desfeita.`
    );
    if (!confirmou) return;

    try {
      // Apaga primeiro as matrículas (disciplinas) para não violar a chave estrangeira
      const { error: erroMat } = await supabase
        .from('matricula')
        .delete()
        .eq('matricula', aluno.matricula);
      if (erroMat) throw erroMat;

      const { data: apagados, error: erroAluno } = await supabase
        .from('alunos')
        .delete()
        .eq('matricula', aluno.matricula)
        .select();
      if (erroAluno) throw erroAluno;
      if (!apagados || apagados.length === 0) {
        throw new Error('Nenhum registro foi excluído. Verifique as políticas (RLS) da tabela "alunos" no Supabase.');
      }

      setMatriculas(prev => prev.filter(m => m.matricula !== aluno.matricula));
      setAlunos(prev => prev.filter(a => a.matricula !== aluno.matricula));
      mostrarMensagem(`Aluno(a) ${aluno.nome} excluído(a) com sucesso!`);
    } catch (error) {
      console.error('Erro ao excluir aluno:', error.message);
      alert('Erro ao excluir aluno: ' + error.message);
    }
  };

  const alunosCompilados = alunos.map(aluno => {
    const matriculasDoAluno = matriculas.filter(m => m.matricula === aluno.matricula);
    return {
      ...aluno,
      curso: matriculasDoAluno.length > 0 ? matriculasDoAluno[0].curso : 'N/A',
      perLetivo: matriculasDoAluno.length > 0 ? matriculasDoAluno[0].perletivo : 'N/A',
      totalDisciplinas: matriculasDoAluno.length,
      statusGeral: calcularStatusGeral(matriculasDoAluno)
    };
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Alunos Matriculados</h2>
        <p className="text-slate-500 mt-2">Consulte, edite ou exclua os alunos salvos no banco de dados.</p>
      </header>

      {mensagem && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />{mensagem}
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSalvarEdicao} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Editar Aluno</h3>
              <button type="button" onClick={() => setEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matrícula</label>
              <input type="text" value={editando.matricula} disabled className="w-full p-2.5 border rounded-lg bg-slate-100 text-slate-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Aluno</label>
              <input
                type="text"
                value={editando.nome}
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ano Letivo</label>
              <input
                type="number"
                value={editando.perLetivo}
                onChange={(e) => setEditando({ ...editando, perLetivo: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditando(null)} className="flex-1 border border-slate-300 hover:bg-slate-50 font-medium py-2.5 rounded-lg">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg flex justify-center items-center gap-2">
                <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                  <th className="p-4">Matrícula</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Curso</th>
                  <th className="p-4">Disciplinas</th>
                  <th className="p-4">Status Geral</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alunosCompilados.map(aluno => (
                  <tr key={aluno.matricula} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{aluno.matricula}</td>
                    <td className="p-4 font-medium text-slate-900">{aluno.nome}</td>
                    <td className="p-4 text-slate-600">{aluno.curso} ({aluno.perLetivo})</td>
                    <td className="p-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {aluno.totalDisciplinas} matérias
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        aluno.statusGeral === 'APROVADO' ? 'bg-green-100 text-green-800' :
                        aluno.statusGeral === 'REPROVADO' ? 'bg-red-100 text-red-800' :
                        aluno.statusGeral === 'EXAME' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {aluno.statusGeral}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => setEditando({
                            matricula: aluno.matricula,
                            nome: aluno.nome,
                            perLetivo: aluno.perLetivo === 'N/A' ? '' : aluno.perLetivo
                          })}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          onClick={() => handleExcluir(aluno)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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