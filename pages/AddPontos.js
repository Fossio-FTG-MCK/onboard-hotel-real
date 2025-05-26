
// pages/AddPontos.js

const supabaseUrl = 'https://kpjwznuthdnodfqgnidk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwand6bnV0aGRub2RmcWduaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDcxMjcsImV4cCI6MjA1OTM4MzEyN30.8rtnknzowlYM393S_awylDyKHBG9P3cI2VrKgQwxqNU';

async function fetchPontos() {
  const resp = await fetch(`${supabaseUrl}/rest/v1/add_pontos?select=*,usuarios(id,nome_usuario,email,telefone)&order=usado.asc,id.asc`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/json'
    }
  });
  if (!resp.ok) throw new Error('Erro ao buscar pontos');
  return resp.json();
}

async function fetchUsuariosLike(term) {
  const query = encodeURIComponent(term);
  const resp = await fetch(`${supabaseUrl}/rest/v1/usuarios?select=id,nome_usuario,email,telefone&or=(nome_usuario.ilike.*${query}*,email.ilike.*${query}*,telefone.ilike.*${query}*)&limit=10`, {
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
      Authorization: `Bearer ${supabaseKey}`,
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
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  if (!resp.ok) throw new Error('Erro ao remover ponto');
  return true;
}

export async function render({ main }) {
  if (!main) main = document.querySelector('.main-content');
  main.innerHTML = `
    <div class="top-bar">
      <h1>Adicionar Pontos</h1>
      <button id="btnAddPonto" class="btn-add-beneficio">+ Adicionar</button>
    </div>
    <div class="beneficios-tablebox">
      <table class="main-table beneficios-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Email</th>
            <th>Pontos</th>
            <th>Usado</th>
            <th class="actions-cell"></th>
          </tr>
        </thead>
        <tbody id="pontos-table-body">
          <tr><td colspan="5">Carregando...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="ponto-modal-root"></div>
  `;

  const root = document.getElementById('ponto-modal-root');
  const btnAdd = main.querySelector('#btnAddPonto');

  async function load() {
    const body = main.querySelector('#pontos-table-body');
    body.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    try {
      const list = await fetchPontos();
      body.innerHTML = list.map(p => `
        <tr>
          <td>${p.usuarios?.nome_usuario || '-'}</td>
          <td>${p.usuarios?.email || '-'}</td>
          <td>${p.pontos}</td>
          <td>${p.usado ? '✅' : '❌'}</td>
          <td class="actions-cell">
            <button class="action-edit-btn" data-id="${p.id}">✏️</button>
          </td>
        </tr>
      `).join('');

      body.querySelectorAll('.action-edit-btn').forEach(btn => {
        btn.onclick = () => openModal({ pontoId: btn.dataset.id, onDone: load });
      });

    } catch (e) {
      body.innerHTML = '<tr><td colspan="5" style="color:red;">Erro ao carregar</td></tr>';
    }
  }

  btnAdd.onclick = () => openModal({ onDone: load });

  async function openModal({ pontoId = null, onDone }) {
    let ponto = null;
    if (pontoId) {
      const list = await fetchPontos();
      ponto = list.find(p => p.id === pontoId);
    }

    const usuarioNome = ponto?.usuarios?.nome_usuario || '';
    const html = `
      <div class="login-modal-overlay">
        <div class="login-modal">
          <button class="login-close-btn" title="Fechar" id="closePontoModal">&times;</button>
          <h2>${ponto ? 'Editar' : 'Adicionar'} Ponto</h2>
          <div class="form-group">
            <label>Pontos</label>
            <input id="inputPontos" type="number" min="1" value="${ponto?.pontos || ''}" />
          </div>
          <div class="form-group">
            <label>Usuário (busca)</label>
            <input id="inputUsuario" type="text" placeholder="Nome, email ou telefone" value="${usuarioNome}" />
            <div class="search-results-dropdown" id="searchDropdown" style="display:none;"></div>
          </div>
          <div class="drawer-actions">
            <button id="savePontoBtn" class="btn-save">Salvar</button>
          </div>
        </div>
      </div>
    `;

    root.innerHTML = html;

    const el = root.querySelector('.login-modal-overlay');
    const close = el.querySelector('#closePontoModal');
    const inputUsuario = el.querySelector('#inputUsuario');
    const inputPontos = el.querySelector('#inputPontos');
    const dropdown = el.querySelector('#searchDropdown');
    const btnSave = el.querySelector('#savePontoBtn');

    let selectedUserId = ponto?.usuario_utilizador || null;

    close.onclick = () => (root.innerHTML = '');

    inputUsuario.oninput = async () => {
      const term = inputUsuario.value.trim();
      if (term.length < 2) {
        dropdown.style.display = 'none';
        return;
      }
      const results = await fetchUsuariosLike(term);
      if (!results.length) {
        dropdown.innerHTML = '<ul><li>Nenhum resultado</li></ul>';
        dropdown.style.display = 'block';
        return;
      }
      dropdown.innerHTML = '<ul>' + results.map(u => `<li data-id="${u.id}">${u.nome_usuario} - ${u.email}</li>`).join('') + '</ul>';
      dropdown.style.display = 'block';
      dropdown.querySelectorAll('li').forEach(li => {
        li.onclick = () => {
          selectedUserId = li.dataset.id;
          inputUsuario.value = li.textContent;
          dropdown.style.display = 'none';
        };
      });
    };

    btnSave.onclick = async () => {
      const pontos = parseInt(inputPontos.value.trim());
      if (!selectedUserId || isNaN(pontos) || pontos <= 0) {
        alert('Preencha os campos corretamente.');
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
  }

  load();
}
