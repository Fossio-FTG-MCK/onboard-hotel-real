// pages/AddPontos.js

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

export async function render({ main }) {
  main.innerHTML = `
    <div class="page-header">
      <h2>Adicionar Pontos Extras</h2>
    </div>
    <div class="page-content">
      <div class="form-container" style="margin-bottom: 20px;">
        <h3 id="formTitle">Adicionar Novo Ponto</h3>
        <form id="addPontoForm">
          <input type="hidden" id="editingPontoId" name="editingPontoId">
          <div class="form-group">
            <label for="userInput">Buscar Usuário (Nome, Email, CPF, Telefone):</label>
            <input type="text" id="userInput" name="userInput" placeholder="Digite para buscar..." autocomplete="off" />
            <div id="userSearchResults" class="search-results-dropdown" style="display:none;"></div>
            <input type="hidden" id="selectedUserId" name="selectedUserId" required />
            <p id="selectedUserInfo" style="margin-top: 5px; font-style: italic;"></p>
          </div>
          <div class="form-group">
            <label for="pontosInput">Pontos:</label>
            <input type="number" id="pontosInput" name="pontos" required min="1" />
          </div>
          <button type="submit" class="btn-primary" id="submitPontoBtn">Adicionar Ponto</button>
          <button type="button" class="btn-secondary" id="cancelEditBtn" style="display:none;">Cancelar Edição</button>
        </form>
      </div>
      <h3>Pontos Existentes</h3>
      <div id="pontosListContainer">
        <p>Carregando pontos...</p>
      </div>
    </div>
  `;

  const pontosListContainer = main.querySelector('#pontosListContainer');
  const addPontoForm = main.querySelector('#addPontoForm');
  const userInput = main.querySelector('#userInput');
  const userSearchResultsContainer = main.querySelector('#userSearchResults');
  const selectedUserIdInput = main.querySelector('#selectedUserId');
  const selectedUserInfo = main.querySelector('#selectedUserInfo');
  const pontosInput = main.querySelector('#pontosInput');
  const editingPontoIdInput = main.querySelector('#editingPontoId');
  const formTitle = main.querySelector('#formTitle');
  const submitPontoBtn = main.querySelector('#submitPontoBtn');
  const cancelEditBtn = main.querySelector('#cancelEditBtn');

  let searchTimeout;

  userInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    userSearchResultsContainer.style.display = 'none';
    userSearchResultsContainer.innerHTML = '';
    const searchTerm = userInput.value;

    if (searchTerm.length < 3) {
      selectedUserIdInput.value = ''; // Clear selected user if search term is too short
      selectedUserInfo.textContent = '';
      return;
    }

    searchTimeout = setTimeout(async () => {
      const users = await fetchUsuarios(searchTerm);
      userSearchResultsContainer.innerHTML = ''; // Clear previous results
      if (users.length > 0) {
        const ul = document.createElement('ul');
        users.forEach(user => {
          const li = document.createElement('li');
          li.textContent = `${user.nome_usuario} (${user.email || user.cpf || user.telefone})`;
          li.dataset.userId = user.id;
          li.dataset.userName = user.nome_usuario;
          li.addEventListener('click', () => {
            selectedUserIdInput.value = user.id;
            userInput.value = `${user.nome_usuario} (${user.email || user.cpf || user.telefone})`; // Fill input for user feedback
            selectedUserInfo.textContent = `Usuário selecionado: ${user.nome_usuario} (ID: ${user.id})`;
            userSearchResultsContainer.style.display = 'none';
            userSearchResultsContainer.innerHTML = '';
          });
          ul.appendChild(li);
        });
        userSearchResultsContainer.appendChild(ul);
        userSearchResultsContainer.style.display = 'block';
      } else {
        userSearchResultsContainer.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        userSearchResultsContainer.style.display = 'block';
      }
    }, 300); // Debounce search
  });
  
  // Hide search results if clicked outside
  document.addEventListener('click', function(event) {
    if (!userInput.contains(event.target) && !userSearchResultsContainer.contains(event.target)) {
        userSearchResultsContainer.style.display = 'none';
    }
  });


  async function loadAndRenderPontos() {
    pontosListContainer.innerHTML = '<p>Carregando pontos...</p>';
    const rawPontos = await fetchPontos();
    // Map user id column back to usuario_id for consistency
    const mappedPontos = rawPontos.map(p => ({
      id: p.id,
      pontos: p.pontos,
      usuario_id: p.usuario_utilizador,
      usuario_utilizador: p.usuario_utilizador
    }));
    // Get all users to map names
    const usuariosAll = await fetchAllUsuarios();
    const userMap = Object.fromEntries(usuariosAll.map(u => [u.id, u.nome_usuario]));
    // Attach nome_usuario
    const pontosComNome = mappedPontos.map(ponto => ({
      ...ponto,
      nome_usuario: userMap[ponto.usuario_utilizador]
    }));
    pontosListContainer.innerHTML = renderPontosTable(pontosComNome, handleEditPonto, handleDeletePonto);

    // Add event listeners for edit and delete buttons
    pontosListContainer.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const pontoId = e.target.dataset.id;
            const row = e.target.closest('tr');
            const usuarioId = row.dataset.usuarioId;
            const pontos = row.dataset.pontos;
            const userName = row.cells[0].textContent.split(' (ID:')[0]; // Extract user name

            handleEditPonto(pontoId, usuarioId, pontos, userName);
        });
    });
    pontosListContainer.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const pontoId = e.target.dataset.id;
            handleDeletePonto(pontoId);
        });
    });
  }

  function resetForm() {
    addPontoForm.reset();
    selectedUserIdInput.value = '';
    selectedUserInfo.textContent = '';
    userInput.value = '';
    editingPontoIdInput.value = '';
    formTitle.textContent = 'Adicionar Novo Ponto';
    submitPontoBtn.textContent = 'Adicionar Ponto';
    cancelEditBtn.style.display = 'none';
    submitPontoBtn.disabled = false;
  }

  function handleEditPonto(pontoId, usuarioId, pontos, userName) {
    formTitle.textContent = 'Editar Ponto Extra';
    editingPontoIdInput.value = pontoId;
    selectedUserIdInput.value = usuarioId;
    userInput.value = userName; // Display user name in search, not ideal but simple for now
    selectedUserInfo.textContent = `Editando para: ${userName} (ID: ${usuarioId})`;
    pontosInput.value = pontos;
    submitPontoBtn.textContent = 'Salvar Alterações';
    cancelEditBtn.style.display = 'inline-block';
    window.scrollTo(0, 0); // Scroll to top to see the form
  }

  cancelEditBtn.addEventListener('click', () => {
    resetForm();
  });

  async function handleDeletePonto(pontoId) {
    if (confirm('Tem certeza que deseja deletar este registro de pontos?')) {
        const success = await deletePonto(pontoId);
        if (success) {
            await loadAndRenderPontos();
        }
    }
  }

  addPontoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const usuarioId = selectedUserIdInput.value;
    const pontosValue = pontosInput.value;
    const currentPontoId = editingPontoIdInput.value;
    
    submitPontoBtn.disabled = true;
    submitPontoBtn.textContent = currentPontoId ? 'Salvando...' : 'Adicionando...';

    let result;
    if (currentPontoId) { // Editing existing ponto
        result = await updatePonto(currentPontoId, usuarioId, pontosValue);
    } else { // Adding new ponto
        result = await addPonto(usuarioId, pontosValue);
    }

    if (result) {
      resetForm();
      await loadAndRenderPontos(); // Refresh the list
    }
    
    submitPontoBtn.disabled = false;
    // Text content will be reset by resetForm if successful, or needs to be manually set on error
    if (!result) {
        submitPontoBtn.textContent = currentPontoId ? 'Salvar Alterações' : 'Adicionar Ponto';
    }
  });

  await loadAndRenderPontos(); // Initial load
} 