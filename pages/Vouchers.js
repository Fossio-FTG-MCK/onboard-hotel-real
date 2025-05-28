// pages/Vouchers.js

const supabaseUrl = 'https://kpjwznuthdnodfqgnidk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwand6bnV0aGRub2RmcWduaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDcxMjcsImV4cCI6MjA1OTM4MzEyN30.8rtnknzowlYM393S_awylDyKHBG9P3cI2VrKgQwxqNU';

function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

// DATA FETCHERS
async function fetchVouchers() {
  // Get current user session token
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;

  // Buscar apenas os campos da tabela, sem joins, sem nullsLast!
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/vouchers?select=id,titulo,pontos,parceiro_id,usuario_id,status,usado_em&order=usado_em.desc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    }
  );
  if (!resp.ok) throw new Error("Erro ao acessar dados do Supabase");
  return resp.json();
}
async function fetchParceiros() {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;
  
  const resp = await fetch(`${supabaseUrl}/rest/v1/parceiros?select=id,nome`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) throw new Error("Erro ao buscar parceiros");
  return resp.json();
}
async function fetchUsuarios() {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;
  
  const resp = await fetch(`${supabaseUrl}/rest/v1/lista_usuarios_app?select=id,nome_usuario,email&order=nome_usuario.asc`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) throw new Error("Erro ao buscar usuários");
  return resp.json();
}

async function createVoucher(data) {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;
  
  const resp = await fetch(`${supabaseUrl}/rest/v1/vouchers`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    let json = await resp.json().catch(() => ({}));
    throw new Error(json?.message || "Erro ao criar voucher");
  }
  return (await resp.json())[0];
}
async function updateVoucher(id, data) {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;
  
  const resp = await fetch(`${supabaseUrl}/rest/v1/vouchers?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    let json = await resp.json().catch(() => ({}));
    throw new Error(json?.message || "Erro ao atualizar voucher");
  }
  return (await resp.json())[0];
}
async function deleteVoucher(id) {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;
  
  const resp = await fetch(`${supabaseUrl}/rest/v1/vouchers?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${authToken}`,
    }
  });
  if (!resp.ok) throw new Error("Erro ao excluir voucher");
  return true;
}

// TABLE TEMPLATE
function templateTable() {
  return `
    <div class="vouchers-top-bar">
      <h1>Vouchers</h1>
      <button class="btn-add-voucher" id="btnAddVoucher">
        <svg width="22" height="22" viewBox="0 0 22 22"><rect x="9.2" y="3.8" width="3.6" height="14.4" rx="1.4" fill="#fff"/><rect x="3.8" y="9.2" width="14.4" height="3.6" rx="1.4" fill="#fff"/><circle cx="11" cy="11" r="10" stroke="#36a9f4" stroke-width="2" fill="#36a9f4"/></svg>
        Adicionar Voucher
      </button>
    </div>
    <div class="vouchers-tablebox">
      <table class="main-table vouchers-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Parceiro</th>
            <th>Usuário</th>
            <th class="pontos-cell">Pontos</th>
            <th>Status</th>
            <th>Usado em</th>
            <th class="actions-cell"></th>
          </tr>
        </thead>
        <tbody id="vouchers-table-body">
          <tr><td colspan="7">Carregando...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="voucher-drawer-root"></div>
  `;
}

function templateDrawerVoucher({ mode, voucher = {}, parceiros = [], usuarios = [] }) {
  const {
    id = '', titulo = '', pontos = '', parceiro_id = '', usuario_id = '', status = 'ativo', usado_em = ''
  } = voucher || {};

  return `
    <div class="drawer-overlay" tabindex="-1">
      <aside class="drawer voucher-drawer" role="dialog" aria-modal="true">
        <button class="drawer-close-btn" title="Fechar">&times;</button>
        <form autocomplete="off">
          <h2>${mode === "edit" ? "Editar Voucher" : "Novo Voucher"}</h2>
          <div class="form-row">
            <label for="input-titulo">Título <span class="req">*</span></label>
            <input id="input-titulo" name="titulo" required maxlength="140" value="${escapeHTML(titulo)}" />
          </div>
          <div class="form-row">
            <label for="input-pontos">Pontos <span class="req">*</span></label>
            <input id="input-pontos" name="pontos" required type="number" min="0" max="10000000" value="${escapeHTML(pontos)}" />
          </div>
          <div class="form-row">
            <label for="input-parceiro">Parceiro</label>
            <select id="input-parceiro" name="parceiro_id">
              <option value="">-- Nenhum --</option>
              ${parceiros.map(p => `<option value="${escapeHTML(p.id)}"${p.id === parceiro_id ? ' selected' : ''}>${escapeHTML(p.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label for="input-usuario">Usuário</label>
            <select id="input-usuario" name="usuario_id">
              <option value="">-- Nenhum (voucher livre) --</option>
              ${usuarios.map(u => `
                <option value="${escapeHTML(u.id)}"${u.id === usuario_id ? ' selected' : ''}>
                  ${escapeHTML(u.nome_usuario || u.email)}
                </option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label for="input-status">Status</label>
            <select id="input-status" name="status">
              <option value="ativo"${status === 'ativo' ? ' selected' : ''}>Ativo</option>
              <option value="usado"${status === 'usado' ? ' selected' : ''}>Usado</option>
            </select>
          </div>
          ${
            status === 'usado' && usado_em
              ? `<div class="form-row"><label>Usado em</label><div class="voucher-usadoem">${formatDate(usado_em)}</div></div>`
              : ''
          }
          <div class="drawer-error" style="display:none;color:#b00;background:#ffeeee;border-radius:6px;padding:7px 9px;"></div>
          <div class="drawer-actions">
            <button type="submit" class="btn-save">${mode === "edit" ? "Salvar alterações" : "Cadastrar"}</button>
            ${mode === "edit" ? `<button type="button" class="btn-delete" style="margin-left:auto;">Excluir</button>` : ""}
          </div>
        </form>
      </aside>
    </div>
  `;
}

export async function render({ main }) {
  if (!main) main = document.querySelector('.main-content');
  main.innerHTML = templateTable();

  if (!document.getElementById('vouchers-drawer-style')) {
    const st = document.createElement('style');
    st.id = 'vouchers-drawer-style';
    st.innerHTML = `
      .vouchers-top-bar {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 18px; flex-wrap: wrap; gap: 10px;
      }
      .vouchers-top-bar h1 { margin: 0; font-size: 1.34rem; font-weight: 700; color: #1a2950; letter-spacing: -.03em; }
      .btn-add-voucher {
        display:flex; align-items:center; gap:7px; background:#36a9f4; color:#fff; font-weight:500; font-size:1.01rem;
        border:none; border-radius:6px; padding:9px 16px; cursor:pointer; box-shadow:0 2px 9px rgb(54 169 244 / 8%);
        transition:background .16s; outline:none;
      }
      .btn-add-voucher svg {
        margin-right:6px; background:#2196f3; border-radius:55%; display:inline-block; vertical-align:middle;
      }
      .btn-add-voucher:hover { background: #218de5; }
      .vouchers-tablebox { width: 100%; overflow-x: auto;}
      .vouchers-table { width: 100%;}
      .main-table .actions-cell { width:46px; text-align:center;}
      .main-table td, .main-table th { vertical-align:middle; }
      .main-table th { background:#f2f4fa; font-size:1.01em;font-weight:700;color:#223469;border-bottom:2px solid #e4e9f4;text-align:left;}
      .main-table td { border-bottom:1px solid #ecf2fa; font-size:.98em;}
      .main-table tbody tr:hover td { background:#f7fafd; }
      .main-table .actions-cell button { background:none; border:none; cursor:pointer; padding:6px; border-radius:6px; color:#757aa5; transition:background .14s; font-size:1.13em; vertical-align:middle;}
      .main-table .actions-cell button:hover { background:#e4f3ff; color:#1a91db; }
      .drawer-overlay {
        z-index:1050; position:fixed; right:0;top:0;left:0;bottom:0;
        background:rgba(24,34,61,0.21); display:flex; justify-content:flex-end; align-items:stretch; animation:fadeIn .22s;
      }
      @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
      .drawer {
        width: 390px; max-width: 99vw; height:100vh;
        background:#fff; box-shadow:-9px 0 32px rgba(32,50,100,.10); border-radius:18px 0 0 18px;
        display:flex; flex-direction:column; padding:22px 28px 10px 24px;
        position:relative; animation:drawerSlideIn .33s; overflow-y: auto;
      }
      @keyframes drawerSlideIn {
        from { transform: translateX(160px); opacity:0; }
        to { transform: translateX(0); opacity:1; }
      }
      .drawer-close-btn { position:absolute; top:12px; right:19px; background:none; border:none; font-size:2rem; color:#6989c7; cursor:pointer; transition:.17s;}
      .drawer-close-btn:hover { color: #d90429;}
      .voucher-drawer h2 { margin:0 0 13px 0; font-size:1.19em; color:#1A2950; font-weight:600; letter-spacing:-.01em;}
      .voucher-drawer form { display:flex; flex-direction:column; gap:12px; flex:1; overflow-y: auto; padding-right: 8px; }
      .voucher-drawer label { color:#333a55; font-size:.96em; font-weight:500;}
      .voucher-drawer input,
      .voucher-drawer select {
        padding:7px 11px; border:1px solid #ccd8ee; border-radius:6px; font-size:.99em; background:#f8fbff; margin-top:2px;
      }
      .voucher-drawer .form-row { display:flex; flex-direction:column; margin-bottom:0;}
      .drawer-error { transition:.17s; }
      .voucher-drawer .req { color: #d90429; font-size:.92em;}
      .voucher-usadoem { background:#f6f6f9; border-radius:4px; padding:6px 9px; color:#666; font-size:.99em; }
      .drawer-actions { display:flex; gap:10px; align-items:center; margin-top: 20px;}
      .btn-save { background:#36a9f4; color:#fff; font-weight:500; border:none; padding:10px 17px; font-size:1.04em; border-radius:6px; cursor:pointer; transition:background .17s; box-shadow:0 2px 8px #acefff15;}
      .btn-save:hover { background:#2196f3;}
      .btn-delete { background:#fff0f5; color:#ca2650; font-weight:500; border:1px solid #e793c1; padding:10px 15px; font-size:.99em; border-radius:6px; cursor:pointer; margin-left:auto;transition:background .14s, color .14s; }
      .btn-delete:hover { background: #f5d4e7; color: #bb1048; }
      @media (max-width: 700px) {
        .drawer { width: 99vw; border-radius:0; padding-right:11vw; min-width:unset; overflow-y: auto;}
      }
    `;
    document.head.appendChild(st);
  }

  // Drawer logic
  function openDrawer({ mode, voucher, onDone, parceiros = [], usuarios = [] }) {
    const root = document.getElementById('voucher-drawer-root');
    if (!root) return;
    root.innerHTML = '';

    // Se parceiros/usuarios não vieram por argumento, buscar
    const renderDrawerWithData = (parceirosList, usuariosList) => {
      root.innerHTML = templateDrawerVoucher({ mode, voucher, parceiros: parceirosList, usuarios: usuariosList });

      setTimeout(() => {
        const overlay = root.querySelector('.drawer-overlay');
        overlay.focus();
      }, 60);

      // Drawer events
      const overlay = root.querySelector('.drawer-overlay');
      const aside = overlay.querySelector('.drawer');
      const form = aside.querySelector('form');
      const errbox = aside.querySelector('.drawer-error');

      overlay.onclick = e => { if (e.target === overlay) root.innerHTML = ''; };
      aside.querySelector('.drawer-close-btn').onclick = () => (root.innerHTML = '');

      // Atualiza visualização de usado_em ao mudar o status
      const statusSel = aside.querySelector('#input-status');
      if (statusSel) {
        statusSel.onchange = () => {
          const usadoEmDiv = aside.querySelector('.voucher-usadoem');
          if (statusSel.value === 'usado') {
            if (voucher && voucher.usado_em) {
              if (!usadoEmDiv) {
                const fr = document.createElement('div');
                fr.className = "form-row";
                fr.innerHTML = `<label>Usado em</label><div class="voucher-usadoem">${formatDate(voucher.usado_em)}</div>`;
                form.insertBefore(fr, form.querySelector('.drawer-error'));
              }
            }
          } else {
            if (usadoEmDiv) usadoEmDiv.parentElement?.remove();
          }
        }
      }

      // Salvar
      form.onsubmit = async e => {
        e.preventDefault();
        errbox.style.display = 'none';
        const data = {
          titulo: form.titulo.value.trim(),
          pontos: form.pontos.value ? +form.pontos.value : null,
          parceiro_id: form.parceiro_id.value || null,
          usuario_id: form.usuario_id.value || null,
          status: form.status.value
        };

        if (!data.titulo || !data.pontos) {
          errbox.innerHTML = "Os campos Título e Pontos são obrigatórios.";
          errbox.style.display = '';
          return;
        }

        form.querySelector('.btn-save').disabled = true;
        try {
          if (mode === "edit") {
            if (!voucher?.id) throw new Error("Objeto inválido para edição");
            await updateVoucher(voucher.id, data);
          } else {
            await createVoucher(data);
          }
          root.innerHTML = '';
          onDone && onDone();
        } catch (err) {
          errbox.innerHTML = escapeHTML(err.message || 'Erro ao salvar.');
          errbox.style.display = '';
        } finally {
          form.querySelector('.btn-save').disabled = false;
        }
      };

      // Excluir
      const btnDel = aside.querySelector('.btn-delete');
      if (btnDel) {
        btnDel.onclick = async () => {
          if (!voucher?.id) return;
          if (!window.confirm("Deseja excluir este voucher?")) return;
          btnDel.disabled = true;
          try {
            await deleteVoucher(voucher.id);
            root.innerHTML = '';
            onDone && onDone();
          } catch (err) {
            errbox.innerHTML = escapeHTML(err.message || 'Erro ao excluir.');
            errbox.style.display = '';
          }
          btnDel.disabled = false;
        };
      }
    };

    if (parceiros.length && usuarios.length) {
      renderDrawerWithData(parceiros, usuarios);
    } else {
      Promise.all([fetchParceiros(), fetchUsuarios()]).then(([parceirosList, usuariosList]) => {
        renderDrawerWithData(parceirosList, usuariosList);
      });
    }
  }

  // TABLE REFRESH
  async function refreshTable() {
    const tableBody = main.querySelector('#vouchers-table-body');
    tableBody.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;

    try {
      // Carrega todos os dados necessários
      // --------------- CORREÇÃO: retorna arrays vazios se não tiver resultados, para garantir .find() não dá erro
      const [list, parceiros, usuarios] = await Promise.all([
        fetchVouchers().then(x => Array.isArray(x) ? x : []),
        fetchParceiros().then(x => Array.isArray(x) ? x : []),
        fetchUsuarios().then(x => Array.isArray(x) ? x : [])
      ]);
      // Funções para resolver nomes
      const getParceiroNome = (id) => parceiros.find(p => p.id === id)?.nome || '';
      const getUsuarioNome = (id) => {
        const u = usuarios.find(uu => uu.id === id);
        return u ? (u.nome_usuario || u.email) : '';
      };

      if (!Array.isArray(list) || list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">Nenhum voucher cadastrado.</td></tr>`;
        return;
      }
      // FILTRO: exibir apenas vouchers que tenham título E pontos (campos obrigatórios)
      tableBody.innerHTML = list
        .filter(v => v && (typeof v.titulo === "string" && v.titulo.trim()) && (v.pontos !== undefined && v.pontos !== null))
        .map((v, idx) => `
        <tr data-idx="${idx}">
          <td>${escapeHTML(v.titulo)}</td>
          <td>${getParceiroNome(v.parceiro_id)}</td>
          <td>${getUsuarioNome(v.usuario_id)}</td>
          <td class="pontos-cell">${(v.pontos != null && v.pontos !== "") ? escapeHTML(v.pontos) : ''}</td>
          <td>${v.status ? escapeHTML(v.status) : ''}</td>
          <td>${v.usado_em ? formatDate(v.usado_em) : ''}</td>
          <td class="actions-cell">
            <button class="action-edit-btn" title="Editar">
              <svg fill="none" width="20" height="20" viewBox="0 0 20 20"><rect x="4" y="14.1" width="12" height="2.2" rx="1.1" fill="#bcbcbc"/><path d="M13.8 4.8a1.25 1.25 0 0 1 1.77 0l.63.63a1.25 1.25 0 0 1 0 1.77l-6.12 6.12-2.4.34.34-2.4 6.12-6.12z" stroke="#367fe4" stroke-width="1.36" fill="#e5f0ff"/></svg>
            </button>
          </td>
        </tr>
      `).join('');

      // Caso não haja dados após filtro, mostrar mensagem apropriada
      if (!tableBody.innerHTML.trim()) {
        tableBody.innerHTML = `<tr><td colspan="7">Nenhum voucher cadastrado.</td></tr>`;
        return;
      }

      // Edição
      tableBody.querySelectorAll('.action-edit-btn').forEach((btn, idx) => {
        btn.onclick = async () => {
          // CUIDADO: precisa pegar o mesmo índice do array filtrado, não do array original!
          // Então usar querySelectorAll('tr[data-idx]') em vez de idx direto.
          // Mas como o idx aqui corresponde ao filtro/map, está ok.
          const filteredList = list.filter(v => v && (typeof v.titulo === "string" && v.titulo.trim()) && (v.pontos !== undefined && v.pontos !== null));
          const v = filteredList[idx];
          openDrawer({
            mode: "edit",
            voucher: v,
            parceiros,
            usuarios,
            onDone: () => refreshTable()
          });
        };
      });
    } catch (e) {
      tableBody.innerHTML = `<tr><td colspan="7" style="color:#B00;font-weight:bold;">Erro ao carregar: ${escapeHTML(e.message)}</td></tr>`;
    }
  }

  // Botão Adicionar Voucher
  main.querySelector('#btnAddVoucher').addEventListener('click', async () => {
    // Busca combos só uma vez para o drawer
    const [parceiros, usuarios] = await Promise.all([fetchParceiros(), fetchUsuarios()]);
    openDrawer({
      mode: "new",
      voucher: null,
      parceiros,
      usuarios,
      onDone: () => refreshTable()
    });
  });

  // Inicial
  refreshTable();
}