// pages/AddPontos.js

const supabaseUrl = 'https://kpjwznuthdnodfqgnidk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwand6bnV0aGRub2RmcWduaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDcxMjcsImV4cCI6MjA1OTM4MzEyN30.8rtnknzowlYM393S_awylDyKHBG9P3cI2VrKgQwxqNU';

async function fetchPontos() {
  const resp = await fetch(`${supabaseUrl}/rest/v1/add_pontos?select=*,usuario:usuario_utilizador(id,nome_usuario)&order=usado.asc,id.asc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${window.CURRENT_USER?.session?.access_token}`,
      Accept: 'application/json'
    }
  });
  if (!resp.ok) throw new Error('Erro ao buscar pontos');
  return resp.json();
}

async function fetchUsuariosLike(term) {
  const query = encodeURIComponent(term);
  const resp = await fetch(`${supabaseUrl}/rest/v1/v_usuarios_filtrados?select=id,nome_usuario&or=(nome_usuario.ilike.*${query}*,email.ilike.*${query}*,telefone.ilike.*${query}*,cpf.ilike.*${query}*)&limit=10`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  if (!resp.ok) return [];
  return resp.json();
}

async function insertPonto(data) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/add_pontos`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${window.CURRENT_USER?.session?.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) throw new Error('Erro ao adicionar ponto');
  return (await resp.json())[0];
}

async function updatePonto(id, data) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/add_pontos?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) throw new Error('Erro ao atualizar ponto');
  return (await resp.json())[0];
}

async function deletePonto(id) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/add_pontos?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${window.CURRENT_USER?.session?.access_token}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!resp.ok) throw new Error('Erro ao excluir ponto');

  // Não tenta analisar a resposta como JSON, pois pode não haver corpo
  return resp.status === 204; // Retorna true se a exclusão foi bem-sucedida
}

async function openConfirmationModal(message, onConfirm) {
  const confirmationHtml = `
    <div class="confirmation-modal-overlay">
      <div class="confirmation-modal">
        <h2>Confirmação</h2>
        <p>${message}</p>
        <div class="confirmation-actions">
          <button id="confirmBtn" class="btn-confirm">Confirmar</button>
          <button id="cancelBtn" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', confirmationHtml);

  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  confirmBtn.onclick = () => {
    onConfirm();
    closeConfirmationModal();
  };

  cancelBtn.onclick = closeConfirmationModal;

  function closeConfirmationModal() {
    const overlay = document.querySelector('.confirmation-modal-overlay');
    if (overlay) overlay.remove();
  }
}

async function openNotificationModal(message, isSuccess) {
  const notificationHtml = `
    <div class="notification-modal-overlay">
      <div class="notification-modal ${isSuccess ? 'success' : 'error'}">
        <p>${message}</p>
        <button id="closeNotificationBtn" class="btn-close">Fechar</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', notificationHtml);

  const closeBtn = document.getElementById('closeNotificationBtn');
  closeBtn.onclick = closeNotificationModal;

  function closeNotificationModal() {
    const overlay = document.querySelector('.notification-modal-overlay');
    if (overlay) overlay.remove();
  }
}

export async function render({ main }) {
  if (!main) main = document.querySelector('.main-content');
  main.innerHTML = `
    <div class="top-bar">
      <h1>Pontuação Extra</h1>
      <button id="btnAddPonto" class="btn-add-beneficio-pontos">+ Adicionar</button>
    </div>
    <div class="beneficios-tablebox">
      <table class="main-table beneficios-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Pontos</th>
            <th>Usado</th>
            <th class="actions-cell"></th>
          </tr>
        </thead>
        <tbody id="pontos-table-body">
          <tr><td colspan="4">Carregando...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="ponto-modal-root"></div>
  `;

  const root = document.getElementById('ponto-modal-root');
  const btnAdd = main.querySelector('#btnAddPonto');

  async function load() {
    const body = main.querySelector('#pontos-table-body');
    body.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    try {
      const list = await fetchPontos();
      body.innerHTML = list.map(p => `
        <tr>
          <td>${p.usuario?.nome_usuario || '-'}</td>
          <td>${p.pontos}</td>
          <td>${p.usado ? '✅' : '❌'}</td>
          <td class="actions-cell">
            <button class="action-edit-btn" data-id="${p.id}" title="Editar">
              <svg fill="none" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="4.5" r="1.4" fill="#7986a0"/><circle cx="10" cy="10" r="1.4" fill="#7986a0"/><circle cx="10" cy="15.5" r="1.4" fill="#7986a0"/></svg>
            </button>
          </td>
        </tr>
      `).join('');

      body.querySelectorAll('.action-edit-btn').forEach(btn => {
        btn.onclick = () => openModal({ pontoId: btn.dataset.id, onDone: load });
      });

    } catch (e) {
      body.innerHTML = '<tr><td colspan="4" style="color:red;">Erro ao carregar</td></tr>';
    }
  }

  btnAdd.onclick = () => openModal({ onDone: load });

  async function openModal({ pontoId = null, onDone }) {
    let ponto = null;
    if (pontoId) {
      const list = await fetchPontos();
      ponto = list.find(p => p.id === pontoId);
    }

    const html = `
      <div class="login-modal-overlay">
        <div class="login-modal">
          <button class="login-close-btn" title="Fechar" id="closePontoModal">&times;</button>
          <h2>${ponto ? 'Editar' : 'Adicionar'} Ponto</h2>
          <form id="pontoForm">
            <div class="form-group">
              <label for="inputPontos">Pontos</label>
              <input 
                id="inputPontos" 
                name="pontos"
                type="number" 
                min="1" 
                value="${ponto?.pontos || ''}" 
                required
                class="input-pontos"
              />
            </div>
            <div class="form-group">
              <label for="inputUsuario">Usuário (busca por nome, email, telefone ou CPF)</label>
              <input 
                id="inputUsuario" 
                name="usuario"
                type="text" 
                placeholder="Digite nome, email, telefone ou CPF" 
                value="${ponto?.usuario?.nome_usuario || ''}" 
                required
              />
              <div class="search-results-dropdown" id="searchDropdown" style="display:none;"></div>
            </div>
            <div class="drawer-actions">
              <button type="button" class="btn-delete" id="deletePontoBtn">Excluir</button>
              <button type="submit" id="savePontoBtn" class="btn-save">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    root.innerHTML = html;

    const el = root.querySelector('.login-modal-overlay');
    const form = el.querySelector('#pontoForm');
    const close = el.querySelector('#closePontoModal');
    const inputUsuario = el.querySelector('#inputUsuario');
    const inputPontos = el.querySelector('#inputPontos');
    const dropdown = el.querySelector('#searchDropdown');

    let selectedUserId = ponto?.usuario_utilizador || null;

    close.onclick = () => (root.innerHTML = '');

    let searchTimeout;
    inputUsuario.oninput = async () => {
      const term = inputUsuario.value.trim();
      selectedUserId = null; // Reset selected user when input changes
      
      if (term.length < 2) {
        dropdown.style.display = 'none';
        return;
      }

      // Clear previous timeout
      if (searchTimeout) clearTimeout(searchTimeout);

      // Set new timeout to avoid too many requests
      searchTimeout = setTimeout(async () => {
        try {
          const results = await fetchUsuariosLike(term);
          if (results.length > 0) {
            dropdown.innerHTML = '<ul>' + results.map(u => 
              `<li data-id="${u.id}" data-nome="${u.nome_usuario}">${u.nome_usuario}</li>`
            ).join('') + '</ul>';
            dropdown.style.display = 'block';
            
            dropdown.querySelectorAll('li').forEach(li => {
              li.onclick = () => {
                selectedUserId = li.dataset.id;
                inputUsuario.value = li.dataset.nome;
                dropdown.style.display = 'none';
              };
            });
          } else {
            dropdown.innerHTML = '<ul><li>Nenhum usuário encontrado</li></ul>';
            dropdown.style.display = 'block';
          }
        } catch (error) {
          console.error('Erro ao buscar usuários:', error);
          dropdown.innerHTML = '<ul><li>Erro ao buscar usuários</li></ul>';
          dropdown.style.display = 'block';
        }
      }, 300);
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!inputUsuario.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      
      const pontos = parseInt(inputPontos.value.trim());
      if (!selectedUserId || isNaN(pontos) || pontos <= 0) {
        alert('Por favor, preencha todos os campos corretamente e selecione um usuário da lista.');
        return;
      }

      try {
        if (pontoId) {
          await updatePonto(pontoId, { usuario_utilizador: selectedUserId, pontos });
        } else {
          await insertPonto({ usuario_utilizador: selectedUserId, pontos });
        }
        root.innerHTML = '';
        onDone && onDone();
      } catch (e) {
        alert(e.message || 'Erro ao salvar.');
      }
    };

    // Adicionando o evento de clique para o botão de excluir
    const deleteBtn = el.querySelector('#deletePontoBtn');
    deleteBtn.onclick = () => {
      openConfirmationModal('Tem certeza que deseja excluir este ponto?', async () => {
        try {
          const success = await deletePonto(pontoId); // Chama a função de exclusão
          if (success) {
            openNotificationModal('Ponto excluído com sucesso!', true); // Mensagem de sucesso
            root.innerHTML = ''; // Limpa o modal
            onDone && onDone(); // Atualiza a lista
          }
        } catch (error) {
          openNotificationModal(error.message || 'Erro ao excluir o ponto.', false); // Mensagem de erro
        }
      });
    };
  }

  load();
}
