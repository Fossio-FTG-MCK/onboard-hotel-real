// pages/Parceiros.js

const supabaseUrl = 'https://kpjwznuthdnodfqgnidk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwand6bnV0aGRub2RmcWduaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDcxMjcsImV4cCI6MjA1OTM4MzEyN30.8rtnknzowlYM393S_awylDyKHBG9P3cI2VrKgQwxqNU';

// --- HELPERS ---
function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLogo(logo) {
  if (!logo) return '';
  // Accepts URL or base64
  return `<img src="${escapeHTML(logo)}" alt="Logo" style="width:38px;height:38px;object-fit:contain;max-width:60px;max-height:40px;border-radius:8px;background:#f3f5fa;border:1px solid #e6e9ef;" loading="lazy" />`;
}

// --- DATA ---
async function fetchParceiros() {
  const resp = await fetch(`${supabaseUrl}/rest/v1/parceiros?select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) throw new Error('Erro ao acessar dados do Supabase');
  return resp.json();
}

async function createParceiro(data) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/parceiros`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    let json = await resp.json().catch(() => ({}));
    throw new Error(json?.message || 'Erro ao cadastrar parceiro');
  }
  return (await resp.json())[0];
}

async function updateParceiro(id, data) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/parceiros?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    let json = await resp.json().catch(() => ({}));
    throw new Error(json?.message || 'Erro ao atualizar parceiro');
  }
  return (await resp.json())[0];
}

async function deleteParceiro(id) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/parceiros?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
  });
  if (!resp.ok) throw new Error('Erro ao excluir parceiro');
  return true;
}

// --- UI ---

function templateTable() {
  return `
    <div class="parceiros-top-bar">
      <h1>Parceiros</h1>
      <button class="btn-add-parceiro" id="btnAddParceiro">
        <svg width="22" height="22" viewBox="0 0 22 22"><rect x="9.2" y="3.8" width="3.6" height="14.4" rx="1.4" fill="#fff"/><rect x="3.8" y="9.2" width="14.4" height="3.6" rx="1.4" fill="#fff"/><circle cx="11" cy="11" r="10" stroke="#36a9f4" stroke-width="2" fill="#36a9f4"/></svg>
        Adicionar Parceiro
      </button>
    </div>
    <div class="parceiros-tablebox">
      <table class="main-table parceiros-table">
        <thead>
          <tr>
            <th class="icon-cell">Logo</th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>E-mail</th>
            <th class="actions-cell"></th>
          </tr>
        </thead>
        <tbody id="parceiros-table-body">
          <tr>
            <td colspan="5">Carregando...</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div id="parceiro-drawer-root"></div>
  `;
}

function templateDrawerParceiro({ mode, parceiro = {} }) {
  const {
    id = "", nome = "", logo = "", banner = "",
    descricao = "", telefone = "", email = "",
    endereco = "", site = "",
    instagram = "", facebook = "", twitter = "",
    novo = false
  } = parceiro || {};

  return `
    <div class="drawer-overlay" tabindex="-1">
      <aside class="drawer parceiro-drawer" role="dialog" aria-modal="true">
        <button class="drawer-close-btn" title="Fechar">&times;</button>
        <form autocomplete="off">
          <h2>${mode === 'edit' ? 'Editar Parceiro' : 'Novo Parceiro'}</h2>
          <div class="form-row">
            <label for="input-nome">Nome <span class="req">*</span></label>
            <input id="input-nome" name="nome" required maxlength="120" value="${escapeHTML(nome)}" />
          </div>
          <div class="form-row">
            <label for="input-logo">Logo <span style="color:#898;font-size:.93em">(URL ou base64)</span></label>
            <input id="input-logo" name="logo" maxlength="330" value="${escapeHTML(logo)}" />
            <div class="drawer-logo-preview">${renderLogo(logo)}</div>
          </div>
          <div class="form-row">
            <label for="input-banner">Banner <span style="color:#898;font-size:.93em">(URL ou base64)</span></label>
            <input id="input-banner" name="banner" maxlength="330" value="${escapeHTML(banner)}" />
            <!-- Banner preview (opcional, se quiser expandir experiência) -->
          </div>
          <div class="form-row">
            <label for="input-descricao">Descrição</label>
            <textarea id="input-descricao" name="descricao" maxlength="400">${escapeHTML(descricao)}</textarea>
          </div>
          <div class="form-row">
            <label for="input-telefone">Telefone</label>
            <input id="input-telefone" name="telefone" maxlength="48" value="${escapeHTML(telefone)}" />
          </div>
          <div class="form-row">
            <label for="input-email">E-mail</label>
            <input id="input-email" name="email" maxlength="160" value="${escapeHTML(email)}" />
          </div>
          <div class="form-row">
            <label for="input-endereco">Endereço</label>
            <input id="input-endereco" name="endereco" maxlength="210" value="${escapeHTML(endereco)}" />
          </div>
          <div class="form-row">
            <label for="input-site">Site</label>
            <input id="input-site" name="site" maxlength="160" value="${escapeHTML(site)}" />
          </div>
          <div class="form-row">
            <label for="input-instagram">Instagram</label>
            <input id="input-instagram" name="instagram" maxlength="160" value="${escapeHTML(instagram)}" />
          </div>
          <div class="form-row">
            <label for="input-facebook">Facebook</label>
            <input id="input-facebook" name="facebook" maxlength="160" value="${escapeHTML(facebook)}" />
          </div>
          <div class="form-row">
            <label for="input-twitter">Twitter</label>
            <input id="input-twitter" name="twitter" maxlength="160" value="${escapeHTML(twitter)}" />
          </div>
          <div class="form-row" style="align-items:center">
            <label>
              <input id="input-novo" name="novo" type="checkbox" ${novo ? 'checked' : ''} />
              Parceiro novo (destaque)
            </label>
          </div>
          <div class="drawer-error" style="display:none;color:#b00;background:#ffeeee;border-radius:6px;padding:7px 9px;"></div>
          <div class="drawer-actions">
            <button type="submit" class="btn-save">${mode === 'edit' ? 'Salvar alterações' : 'Cadastrar'}</button>
            ${
              mode === 'edit'
                ? `<button type="button" class="btn-delete" style="margin-left:auto;">Excluir</button>`
                : ''
            }
          </div>
        </form>
      </aside>
    </div>
  `;
}

// --- MAIN RENDER ---
export async function render({ main }) {
  if (!main) main = document.querySelector('.main-content');
  main.innerHTML = templateTable();

  // STYLE INJECTION (only once)
  if (!document.getElementById('parceiros-drawer-style')) {
    const st = document.createElement('style');
    st.id = 'parceiros-drawer-style';
    st.innerHTML = `
      .parceiros-top-bar {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 18px; flex-wrap: wrap; gap: 10px;
      }
      .parceiros-top-bar h1 { margin: 0; font-size: 1.34rem; font-weight: 700; color: #1a2950; letter-spacing: -.03em; }
      .btn-add-parceiro {
        display:flex; align-items:center; gap:7px; background:#36a9f4; color:#fff; font-weight:500; font-size:1.01rem;
        border:none; border-radius:6px; padding:9px 16px; cursor:pointer; box-shadow:0 2px 9px rgb(54 169 244 / 8%);
        transition:background .16s; outline:none;
      }
      .btn-add-parceiro svg {
        margin-right:6px; background:#2196f3; border-radius:55%; display:inline-block; vertical-align:middle;
      }
      .btn-add-parceiro:hover { background: #218de5; }
      .parceiros-tablebox { width: 100%; overflow-x: auto;}
      .parceiros-table { width: 100%;}
      .main-table .actions-cell { width:46px; text-align:center;}
      .main-table td, .main-table th { vertical-align:middle; }
      .main-table th { background:#f2f4fa; font-size:1.01em;font-weight:700;color:#223469;border-bottom:2px solid #e4e9f4;text-align:left;}
      .main-table td { border-bottom:1px solid #ecf2fa; font-size:.98em;}
      .main-table tbody tr:hover td { background:#f7fafd; }
      .parceiros-table img { display:inline-block;vertical-align:middle;background:#fcfcfe;}
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
      .parceiro-drawer h2 { margin:0 0 13px 0; font-size:1.19em; color:#1A2950; font-weight:600; letter-spacing:-.01em;}
      .parceiro-drawer form { display:flex; flex-direction:column; gap:12px; flex:1; overflow-y: auto; padding-right: 8px; }
      .parceiro-drawer label { color:#333a55; font-size:.96em; font-weight:500;}
      .parceiro-drawer input,
      .parceiro-drawer textarea {
        padding:7px 11px; border:1px solid #ccd8ee; border-radius:6px; font-size:.99em; background:#f8fbff; margin-top:2px;
      }
      .parceiro-drawer .form-row { display:flex; flex-direction:column; margin-bottom:0;}
      .parceiro-drawer textarea { resize:vertical; min-height:42px; max-height:110px;}
      .drawer-logo-preview {padding: 3px 0 2px 0; min-height: 1.5em;}
      .parceiro-drawer .req { color: #d90429; font-size:.92em;}
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

  function openDrawer({ mode, parceiro, onDone }) {
    const root = document.getElementById('parceiro-drawer-root');
    if (!root) return;
    root.innerHTML = '';

    root.innerHTML = templateDrawerParceiro({ mode, parceiro });

    setTimeout(() => {
      const overlay = root.querySelector('.drawer-overlay');
      overlay.focus();
    }, 60);

    // Drawer logic
    const overlay = root.querySelector('.drawer-overlay');
    const aside = overlay.querySelector('.drawer');
    const form = aside.querySelector('form');
    const errbox = aside.querySelector('.drawer-error');

    // Fechar
    overlay.onclick = e => { if (e.target === overlay) root.innerHTML = ''; };
    aside.querySelector('.drawer-close-btn').onclick = () => (root.innerHTML = '');

    // Logo preview
    const logoInput = aside.querySelector('#input-logo');
    logoInput.addEventListener('input', () => {
      aside.querySelector('.drawer-logo-preview').innerHTML = renderLogo(logoInput.value);
    });

    // Submit (Salvar/Criar)
    form.onsubmit = async e => {
      e.preventDefault();
      errbox.style.display = 'none';

      // Coleta os campos
      const data = {
        nome: form.nome.value.trim(),
        logo: form.logo.value.trim() || null,
        banner: form.banner.value.trim() || null,
        descricao: form.descricao.value.trim() || null,
        telefone: form.telefone.value.trim() || null,
        email: form.email.value.trim() || null,
        endereco: form.endereco.value.trim() || null,
        site: form.site.value.trim() || null,
        instagram: form.instagram.value.trim() || null,
        facebook: form.facebook.value.trim() || null,
        twitter: form.twitter.value.trim() || null,
        novo: form.novo.checked,
      };

      if (!data.nome) {
        errbox.innerHTML = 'O Nome do parceiro é obrigatório.';
        errbox.style.display = '';
        return;
      }
      form.querySelector('.btn-save').disabled = true;
      try {
        if (mode === 'edit') {
          if (!parceiro?.id) throw new Error('Objeto inválido para edição');
          await updateParceiro(parceiro.id, data);
        } else {
          await createParceiro(data);
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
        if (!parceiro?.id) return;
        if (!window.confirm('Deseja excluir este parceiro?')) return;
        btnDel.disabled = true;
        try {
          await deleteParceiro(parceiro.id);
          root.innerHTML = '';
          onDone && onDone();
        } catch (err) {
          errbox.innerHTML = escapeHTML(err.message || 'Erro ao excluir.');
          errbox.style.display = '';
        }
        btnDel.disabled = false;
      }
    }
  }

  // Atualiza a tabela
  async function refreshTable() {
    const tableBody = main.querySelector('#parceiros-table-body');
    tableBody.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;
    try {
      const list = await fetchParceiros();
      if (!Array.isArray(list) || list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">Nenhum parceiro cadastrado.</td></tr>`;
        return;
      }
      tableBody.innerHTML = list
        .map(
          (p, idx) => `
          <tr data-idx="${idx}">
            <td class="icon-cell">${renderLogo(p.logo)}</td>
            <td>${escapeHTML(p.nome || '')}${p.novo ? ' <span style="background:#ffe22c;color:#805f00;border-radius:10px;font-size:.91em;padding:1px 8px;margin-left:7px;">NOVO</span>' : ''}</td>
            <td>${escapeHTML(p.telefone || '')}</td>
            <td>${escapeHTML(p.email || '')}</td>
            <td class="actions-cell">
              <button class="action-edit-btn" title="Editar">
                <svg fill="none" width="20" height="20" viewBox="0 0 20 20"><rect x="4" y="14.1" width="12" height="2.2" rx="1.1" fill="#bcbcbc"/><path d="M13.8 4.8a1.25 1.25 0 0 1 1.77 0l.63.63a1.25 1.25 0 0 1 0 1.77l-6.12 6.12-2.4.34.34-2.4 6.12-6.12z" stroke="#367fe4" stroke-width="1.36" fill="#e5f0ff"/></svg>
              </button>
            </td>
          </tr>
        `
        )
        .join('');

      // Editar parceiro
      tableBody
        .querySelectorAll('.action-edit-btn')
        .forEach((btn, idx) => {
          btn.onclick = async () => {
            const p = list[idx];
            openDrawer({
              mode: 'edit',
              parceiro: p,
              onDone: () => refreshTable()
            });
          }
        });
    } catch (e) {
      tableBody.innerHTML = `<tr><td colspan="5" style="color:#B00;font-weight:bold;">Erro ao carregar: ${escapeHTML(e.message)}</td></tr>`;
    }
  }

  // Botão Adicionar Parceiro
  main.querySelector('#btnAddParceiro').addEventListener('click', () => {
    openDrawer({
      mode: 'new',
      parceiro: null,
      onDone: () => refreshTable()
    });
  });

  // Inicial
  refreshTable();
}