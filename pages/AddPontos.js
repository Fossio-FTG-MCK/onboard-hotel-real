// pages/AddPontos.js

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Ajuste o caminho conforme necessário
import './AddPontos.css'; // Para estilos específicos, se necessário

// Assuming supabaseClient is globally available from app.js
// const { createClient } = supabase; // From app.js
// const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY); // From app.js

async function fetchUsuarios(searchTerm) {
  if (!searchTerm || searchTerm.trim().length < 3) {
    return []; // Avoid searching for very short terms
  }
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('id, nome_usuario, email, cpf, telefone')
    .or(`nome_usuario.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  return data;
}

// New helper to fetch all users for name mapping
async function fetchAllUsuarios() {
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('id, nome_usuario');
  if (error) {
    console.error('Erro ao buscar todos usuários:', error);
    return [];
  }
  return data;
}

async function fetchPontos() {
  const { data, error } = await supabaseClient
    .from('add_pontos')
    .select('id, pontos, usuario_utilizador')
    .order('pontos', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pontos extras:', error);
    return [];
  }
  return data;
}

async function addPonto(usuarioId, pontosValue) {
  if (!usuarioId) {
    alert('Por favor, selecione um usuário.');
    return null;
  }
  if (isNaN(parseInt(pontosValue, 10)) || parseInt(pontosValue, 10) <= 0) {
    alert('Por favor, insira um valor de pontos válido.');
    return null;
  }

  const { error } = await supabaseClient
    .from('add_pontos')
    .insert([{ usuario_utilizador: usuarioId, pontos: parseInt(pontosValue, 10) }]);

  if (error) {
    console.error('Erro ao adicionar ponto extra:', error);
    alert('Erro ao adicionar ponto extra: ' + error.message);
    return null;
  }
  return true;
}

// Function to delete a "ponto extra" entry
async function deletePonto(pontoId) {
  const { error } = await supabaseClient
    .from('add_pontos')
    .delete()
    .match({ id: pontoId });

  if (error) {
    console.error('Erro ao deletar ponto extra:', error);
    alert('Erro ao deletar ponto extra: ' + error.message);
    return false;
  }
  return true;
}

// Function to update a "ponto extra" entry
async function updatePonto(pontoId, usuarioId, pontosValue) {
  if (!usuarioId) {
    alert('Por favor, selecione um usuário para atualizar.');
    return null;
  }
  if (isNaN(parseInt(pontosValue, 10)) || parseInt(pontosValue, 10) <= 0) {
    alert('Por favor, insira um valor de pontos válido para atualizar.');
    return null;
  }

  const { error } = await supabaseClient
    .from('add_pontos')
    .update({ usuario_utilizador: usuarioId, pontos: parseInt(pontosValue, 10) })
    .match({ id: pontoId });

  if (error) {
    console.error('Erro ao atualizar ponto extra:', error);
    alert('Erro ao atualizar ponto extra: ' + error.message);
    return null;
  }
  return true;
}

function renderPontosTable(pontosList, editCallback, deleteCallback) {
  if (!pontosList || pontosList.length === 0) {
    return '<p>Nenhum ponto extra encontrado.</p>';
  }
  let tableHtml = `
    <table class="main-table">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Pontos</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
  `;
  pontosList.forEach(ponto => {
    const usuarioNome = ponto.nome_usuario || 'Usuário não encontrado';
    tableHtml += `
      <tr data-id="${ponto.id}" data-usuario-id="${ponto.usuario_utilizador || ponto.usuario_id}" data-pontos="${ponto.pontos}">
        <td>${usuarioNome} (ID: ${ponto.usuario_id || ponto.usuario_utilizador})</td>
        <td>${ponto.pontos}</td>
        <td>
          <button class="btn-edit" data-id="${ponto.id}">Editar</button>
          <button class="btn-delete" data-id="${ponto.id}">Deletar</button>
        </td>
      </tr>
    `;
  });
  tableHtml += `
      </tbody>
    </table>
  `;
  return tableHtml;
}

const AddPontos = () => {
  const [pontosList, setPontosList] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [pontos, setPontos] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPontos = async () => {
    const { data, error } = await supabase
      .from('add_pontos')
      .select('*, usuarios(nome_usuario)')
      .order('usado', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      setError('Erro ao buscar pontos');
    } else {
      setPontosList(data);
    }
    setLoading(false);
  };

  const fetchUsuarios = async () => {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
      setError('Erro ao buscar usuários');
    } else {
      setUsuarios(data);
    }
  };

  useEffect(() => {
    fetchPontos();
    fetchUsuarios();
  }, []);

  const openAddModal = () => {
    resetForm(); // Reseta o formulário antes de abrir o modal
    setIsEditing(false); // Define que não está em modo de edição
  };

  const handleSave = async () => {
    if (!pontos || !selectedUsuario) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const newPonto = { pontos: parseInt(pontos), usuario_utilizador: selectedUsuario.id };

    if (isEditing) {
      const { error } = await supabase
        .from('add_pontos')
        .update(newPonto)
        .eq('id', currentId);
      if (error) {
        setError('Erro ao editar ponto');
      } else {
        setSuccess('Ponto editado com sucesso!');
      }
    } else {
      const { error } = await supabase.from('add_pontos').insert([newPonto]);
      if (error) {
        setError('Erro ao adicionar ponto');
      } else {
        setSuccess('Ponto adicionado com sucesso!');
      }
    }

    fetchPontos();
    resetForm();
  };

  const resetForm = () => {
    setPontos('');
    setSelectedUsuario(null);
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEdit = (ponto) => {
    setPontos(ponto.pontos);
    setSelectedUsuario(usuarios.find(user => user.id === ponto.usuario_utilizador));
    setIsEditing(true);
    setCurrentId(ponto.id);
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja remover?')) {
      const { error } = await supabase.from('add_pontos').delete().eq('id', id);
      if (error) {
        setError('Erro ao remover ponto');
      } else {
        setSuccess('Ponto removido com sucesso!');
        fetchPontos();
      }
    }
  };

  return (
    <div>
      <h1>Add Pontos</h1>
      {loading ? <p>Carregando...</p> : (
        <div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          
          {/* Botão para adicionar novos pontos */}
          <button onClick={openAddModal}>Adicionar Novo Ponto</button>

          <ul>
            {pontosList.map(ponto => (
              <li key={ponto.id}>
                {ponto.pontos} - {ponto.usuarios.nome_usuario}
                <button onClick={() => handleEdit(ponto)}>Editar</button>
                <button onClick={() => handleDelete(ponto.id)}>Remover</button>
              </li>
            ))}
          </ul>

          {/* Modal para adicionar/editar pontos */}
          <div className="modal">
            <h2>{isEditing ? 'Editar Ponto' : 'Adicionar Ponto'}</h2>
            <input
              type="number"
              value={pontos}
              onChange={(e) => setPontos(e.target.value)}
              placeholder="Pontos"
            />
            <input
              type="text"
              value={selectedUsuario ? selectedUsuario.nome_usuario : ''}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              placeholder="Buscar Usuário"
            />
            <button onClick={handleSave}>{isEditing ? 'Salvar Alterações' : 'Salvar'}</button>
            <button onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPontos; 