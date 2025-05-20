// pages/Beneficios.js

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

// Renderiza corretamente o campo ícone (classe FA, SVG, URL ou vazio)
function renderIcone(icone) {
  if (!icone) return '';
  const val = icone.trim();
  if (val.startsWith('fa')) {
    // Ex: fas fa-bed
    return `<i class="${escapeHTML(val)}" style="font-size:1.28em;"></i>`;
  } else if (val.startsWith('<svg')) {
    return val;
  } else if (/^https?:\/\//.test(val)) {
    return `<img src="${escapeHTML(val)}" alt="Ícone" width="24" height="24" style="vertical-align:middle;" loading="lazy"/>`;
  } else if (/^[\u{1F300}-\u{1FAD6}\u2600-\u26FF]$/u.test(val)) {
    // Suporte mínimo para emoji
    return `<span style="font-size:1.6em;line-height:1;">${escapeHTML(val)}</span>`;
  }
  return '';
}

// --- DATA ACCESS ---

// Busca benefícios pela view (não traz id/categoria_id pois não estão disponíveis)
async function fetchBeneficios() {
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/v_beneficios_com_categorias?select=titulo,descricao,icone,pontos_necessarios,destaque,categoria_nome`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    }
  );
  if (!resp.ok) throw new Error('Erro ao acessar dados do Supabase');
  return resp.json();
}

// CRUD direto para tabela beneficios
async function fetchBeneficioByTitulo(titulo) {
  // NOT USEFUL since titulo is not unique, and view does not give id
  return null;
}

async function fetchCategorias() {
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/categorias_beneficios?select=id,nome`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    }
  );
  if (!resp.ok) throw new Error('Erro ao buscar categorias');
  return resp.json();
}

async function createBeneficio(b) {
  const resp = await fetch(`${supabaseUrl}/rest/v1/beneficios`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ ...b, pontos_necessarios: +b.pontos_necessarios }),
  });
  if (!resp.ok) {
    let json = await resp.json().catch(() => ({}));
    throw new Error(json?.message || 'Erro ao criar benefício');
  }
  return (await resp.json())[0];
}

async function updateBeneficio(id, changes) {
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/beneficios?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...changes, pontos_necessarios: +changes.pontos_necessarios }),
    }
  );
  if (!resp.ok) {
    let json = await resp.json().catch(() => ({}));
    throw new Error(json?.message || 'Erro ao atualizar benefício');
  }
  return (await resp.json())[0];
}

async function deleteBeneficio(id) {
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/beneficios?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );
  if (!resp.ok) throw new Error('Erro ao excluir benefício');
  return true;
}

// --- UI ---

// Tabela principal com botão Adicionar acima
function templateTable() {
  return `
    <div class="beneficios-top-bar">
      <h1>Benefícios</h1>
      <button class="btn-add-beneficio" id="btnAddBeneficio">
        <svg width="22" height="22" viewBox="0 0 22 22"><rect x="9.2" y="3.8" width="3.6" height="14.4" rx="1.4" fill="#fff"/><rect x="3.8" y="9.2" width="14.4" height="3.6" rx="1.4" fill="#fff"/><circle cx="11" cy="11" r="10" stroke="#36a9f4" stroke-width="2" fill="#36a9f4"/></svg>
        Adicionar Benefício
      </button>
    </div>
    <div class="beneficios-tablebox">
      <table class="main-table beneficios-table">
        <thead>
          <tr>
            <th class="icon-cell">Ícone</th>
            <th>Título</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Pontos</th>
            <th>Destaque</th>
            <th class="actions-cell"></th>
          </tr>
        </thead>
        <tbody id="beneficios-table-body">
          <tr>
            <td colspan="7">Carregando...</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div id="beneficio-drawer-root"></div>
  `;
}

// Drawer (side menu) para beneficiário (Edição/Cadastro)
function templateBeneficioDrawer({ mode, beneficio = {}, categorias = [] }) {
  // Default values for blank form (new)
  const {
    id = '',
    icone = '',
    titulo = '',
    descricao = '',
    categoria_id = '',
    pontos_necessarios = '',
    destaque = false,
  } = beneficio || {};

  return `
  <div class="drawer-overlay" tabindex="-1">
    <aside class="drawer beneficio-drawer" role="dialog" aria-modal="true">
      <button class="drawer-close-btn" title="Fechar">&times;</button>
      <form autocomplete="off">
        <h2>${mode === 'edit' ? 'Editar Benefício' : 'Novo Benefício'}</h2>
        <div class="form-row">
          <label for="input-icone">Ícone</label>
          <input id="input-icone" name="icone" placeholder="Classe FA, Emoji, SVG ou URL" value="${escapeHTML(icone)}" maxlength="200" />
          <div class="drawer-icon-preview">${renderIcone(icone)}</div>
        </div>
        <div class="form-row">
          <label for="input-titulo">Título <span class="req">*</span></label>
          <input id="input-titulo" name="titulo" required maxlength="120" value="${escapeHTML(titulo)}" />
        </div>
        <div class="form-row">
          <label for="input-descricao">Descrição</label>
          <textarea id="input-descricao" name="descricao" maxlength="400">${escapeHTML(descricao)}</textarea>
        </div>
        <div class="form-row">
          <label for="input-categoria">Categoria</label>
          <select id="input-categoria" name="categoria_id">
            <option value="">-- Nenhuma --</option>
            ${categorias
              .map(
                c =>
                  `<option value="${escapeHTML(c.id)}" ${
                    c.id === categoria_id ? 'selected' : ''
                  }>${escapeHTML(c.nome)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-row">
          <label for="input-pontos">Pontos Necessários <span class="req">*</span></label>
          <input id="input-pontos" name="pontos_necessarios" required type="number" min="0" max="100000" value="${escapeHTML(
            pontos_necessarios
          )}" />
        </div>
        <div class="form-row" style="align-items:center">
          <label>
            <input id="input-destaque" name="destaque" type="checkbox" ${destaque ? 'checked' : ''} />
            Destaque
          </label>
        </div>
        <div class="drawer-error" style="display:none;color:#b00; background:#ffeeee; border-radius:6px; padding:7px 9px;"></div>
        <div class="drawer-actions">
          <button type="submit" class="btn-save">${mode === 'edit' ? 'Salvar Alterações' : 'Cadastrar'}</button>
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

  // STYLE: Benefits page visual enhancements (only once in DOM)
  if (!document.getElementById('beneficios-drawer-style')) {
    const st = document.createElement('style');
    st.id = 'beneficios-drawer-style';
    st.innerHTML = `
    .beneficios-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .beneficios-top-bar h1 {
      margin: 0;
      font-size: 1.34rem;
      font-weight: 700;
      color: #1a2950;
      letter-spacing: -.03em;
    }
    .btn-add-beneficio {
      display: flex;
      align-items: center;
      gap: 7px;
      background: #36a9f4;
      color: #fff;
      font-weight: 500;
      font-size: 1.01rem;
      border: none;
      border-radius: 6px;
      padding: 9px 16px;
      cursor: pointer;
      box-shadow: 0 2px 9px rgb(54 169 244 / 8%);
      transition: background .16s;
      outline: none;
    }
    .btn-add-beneficio svg {
      margin-right: 6px;
      background: #2196f3;
      border-radius:55%;
      display: inline-block;
      vertical-align: middle;
    }
    .btn-add-beneficio:hover {
      background: #218de5;
    }
    .beneficios-tablebox { width: 100%; overflow-x: auto; }
    .beneficios-table { width: 100%; }
    .main-table th,
    .main-table td {
      vertical-align: middle;
    }
    .main-table .icon-cell { width:52px;text-align:center;font-size:1.45em;}
    .main-table .actions-cell { width:46px; text-align:center; }
    .main-table th {
      background: #f2f4fa;
      font-size: 1.01em;
      font-weight:700;
      color: #223469;
      border-bottom: 2px solid #e4e9f4;
    }
    .main-table td {
      border-bottom: 1px solid #ecf2fa;
      font-size: .98em;
    }
    .main-table tbody tr.beneficio-destaque { background: #fffbe5 !important; font-weight: 500; }
    .main-table tbody tr.beneficio-destaque td { background: #fffbe5 !important;}
    .main-table tbody tr:hover td { background: #f7fafd; }
    .action-edit-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      color: #757aa5;
      transition: background .14s;
      font-size: 1.13em;
      vertical-align:middle;
    }
    .action-edit-btn:hover { background: #e4f3ff; color: #1a91db;}
    .drawer-overlay {
      z-index: 1050;
      position: fixed;
      right: 0; top: 0; left:0; bottom:0;
      background: rgba(24,34,61,0.21);
      display: flex;
      justify-content: flex-end;
      align-items: stretch;
      animation: fadeIn .22s;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .drawer {
      width: 365px;
      max-width: 97vw;
      height: 100vh;
      background: #fff;
      box-shadow: -9px 0 32px rgba(32,50,100,.08);
      border-radius: 18px 0 0 18px;
      display: flex;
      flex-direction: column;
      padding: 22px 28px 10px 24px;
      position: relative;
      animation: drawerSlideIn .33s;
    }
    @keyframes drawerSlideIn {
      from { transform: translateX(120px); opacity:0 }
      to   { transform: translateX(0); opacity:1 }
    }
    .drawer-close-btn {
      position: absolute;
      top: 12px; right: 19px;
      background: none;
      border: none;
      font-size: 2rem;
      color: #6989c7;
      cursor: pointer;
      transition:.17s;
    }
    .drawer-close-btn:hover { color: #d90429;}
    .beneficio-drawer h2 {
      margin: 0 0 13px 0;
      font-size: 1.19em;
      color: #1A2950;
      font-weight: 600;
      letter-spacing: -.01em;
    }
    .beneficio-drawer form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .beneficio-drawer label { color: #333a55;font-size:.96em;font-weight:500;}
    .beneficio-drawer input, .beneficio-drawer select, .beneficio-drawer textarea {
      padding: 7px 11px;
      border: 1px solid #ccd8ee;
      border-radius: 6px;
      font-size: .99em;
      background: #f8fbff;
      margin-top: 2px;
    }
    .beneficio-drawer .form-row { display: flex; flex-direction: column; margin-bottom: 0;}
    .beneficio-drawer textarea { resize: vertical; min-height:42px; max-height:110px;}
    .drawer-icon-preview {
      padding: 4px 0 3px 0;
      font-size: 1.36em;
      min-height:1.5em;
    }
    .beneficio-drawer .req { color: #d90429; font-size:.92em;}
    .drawer-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 20px;
    }
    .btn-save {
      background: #36a9f4;
      color: #fff;
      font-weight: 500;
      border: none;
      padding: 10px 17px;
      font-size: 1.04em;
      border-radius: 6px;
      cursor: pointer;
      transition: background .17s;
      box-shadow:0 2px 8px #acefff15;
    }
    .btn-save:hover { background: #2196f3; }
    .btn-delete {
      background: #fff0f5;
      color: #ca2650;
      font-weight: 500;
      border: 1px solid #e793c1;
      padding: 10px 15px;
      font-size: .99em;
      border-radius: 6px;
      cursor: pointer;
      margin-left: auto;
      transition: background .14s, color .14s;
    }
    .btn-delete:hover { background: #fbe2ee; color: #bb1048;}
    /* FA/FontAwesome: tamanho e alinhamento básico na tabela para ícones renderizados */
    .main-table .icon-cell i[class^=fa] {
      font-size:1.23em;
      vertical-align:middle;
      color: #4973ac;
    }
    .main-table .icon-cell img {
      display: inline-block;
      vertical-align: middle;
    }
    @media (max-width: 700px) {
      .drawer {
        width:98vw; border-radius:0;
        padding-right: 11vw;
        min-width: unset;
      }
    }
    `;
    document.head.appendChild(st);
  }

  // Função auxiliar: Busca benefício da tabela "beneficios" a partir do título para edição real
  async function findBenefitFromRow(rowData) {
    // Busca pelo título (comp), mas poderia ser aprimorado com mais campos.
    // ATENÇÃO: Não há id disponível pela view, então só é possível buscar por título.
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/beneficios?select=*,categoria_id&titulo=eq.${encodeURIComponent(rowData.titulo)}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json'
        }
      }
    );
    if (!resp.ok) return null;
    const list = await resp.json();
    // Se houver mais de um, pegue o melhor match, de preferencia igual todos os campos...
    return (list && list.length === 1) ? list[0] : null;
  }

  function openDrawer({ mode, beneficio, onDone }) {
    let categorias = [];
    const root = document.getElementById('beneficio-drawer-root');
    if (!root) return;
    root.innerHTML = '';

    // Carrega categorias, depois exibe drawer
    fetchCategorias()
      .then(cats => {
        categorias = cats;
        root.innerHTML = templateBeneficioDrawer({ mode, beneficio, categorias });
        setTimeout(() => {
          const overlay = root.querySelector('.drawer-overlay');
          overlay.focus();
        }, 50);

        // -- Drawer Logic
        const overlay = root.querySelector('.drawer-overlay');
        const aside = overlay.querySelector('.drawer');
        const form = aside.querySelector('form');
        const errbox = aside.querySelector('.drawer-error');

        // Fechar
        overlay.onclick = e => {
          if (e.target === overlay) root.innerHTML = '';
        };
        aside.querySelector('.drawer-close-btn').onclick = () => (root.innerHTML = '');

        // Live preview ícone
        const iconeInput = aside.querySelector('#input-icone');
        iconeInput.addEventListener('input', () => {
          aside.querySelector('.drawer-icon-preview').innerHTML = renderIcone(iconeInput.value);
        });

        // Submit (Salvar/Criar)
        form.onsubmit = async e => {
          e.preventDefault();
          errbox.style.display = 'none';

          // Gather fields
          const data = {
            icone: form.icone.value.trim(),
            titulo: form.titulo.value.trim(),
            descricao: form.descricao.value.trim(),
            categoria_id: form.categoria_id.value || null,
            pontos_necessarios: form.pontos_necessarios.value,
            destaque: form.destaque.checked,
          };

          // Validação mínima
          if (!data.titulo || !data.pontos_necessarios) {
            errbox.innerHTML = 'Título e Pontos Necessários são obrigatórios.';
            errbox.style.display = '';
            return;
          }
          form.querySelector('.btn-save').disabled = true;

          try {
            if (mode === 'edit') {
              // OBRIGATÓRIO: id do benefício original!
              if (!beneficio?.id) throw new Error('Edição só disponível para benefícios cadastrados diretamente na tabela.');
              await updateBeneficio(beneficio.id, data);
            } else {
              await createBeneficio(data);
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
            if (!beneficio?.id) return;
            if (!window.confirm('Deseja realmente excluir este benefício?')) return;
            btnDel.disabled = true;
            try {
              await deleteBeneficio(beneficio.id);
              root.innerHTML = '';
              onDone && onDone();
            } catch (err) {
              errbox.innerHTML = escapeHTML(err.message || 'Erro ao excluir.');
              errbox.style.display = '';
            }
            btnDel.disabled = false;
          };
        }
      })
      .catch(err => {
        root.innerHTML = `<div style="color:#c00;padding:17px;">Erro ao carregar categorias: ${escapeHTML(
          err.message
        )}</div>`;
      });
  }

  // Refresh da tabela
  async function refreshTable() {
    const tableBody = main.querySelector('#beneficios-table-body');
    tableBody.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;
    try {
      const list = await fetchBeneficios();
      if (!Array.isArray(list) || list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">Nenhum benefício cadastrado.</td></tr>`;
        return;
      }
      tableBody.innerHTML = list
        .map(
          (b, idx) => `
        <tr${b.destaque ? ' class="beneficio-destaque"' : ''} data-idx="${idx}">
          <td class="icon-cell"><span class="icone-renderizada">${renderIcone(b.icone)}</span></td>
          <td>${escapeHTML(b.titulo || '')}</td>
          <td>${escapeHTML(b.descricao || '')}</td>
          <td>${escapeHTML(b.categoria_nome || '')}</td>
          <td style="text-align:right;">${b.pontos_necessarios != null ? escapeHTML(b.pontos_necessarios) : ''}</td>
          <td>
             ${b.destaque ? '<span class="destaque-label">Destaque</span>' : ''}
          </td>
          <td class="actions-cell">
            <button class="action-edit-btn" title="Editar">
              <svg fill="none" width="21" height="21" viewBox="0 0 20 20"><rect x="4" y="14.1" width="12" height="2.2" rx="1.1" fill="#bcbcbc"/><path d="M13.8 4.8a1.25 1.25 0 0 1 1.77 0l.63.63a1.25 1.25 0 0 1 0 1.77l-6.12 6.12-2.4.34.34-2.4 6.12-6.12z" stroke="#367fe4" stroke-width="1.36" fill="#e5f0ff"/></svg>
            </button>
          </td>
        </tr>
      `
        )
        .join('');

      // Editar beneficio
      tableBody
        .querySelectorAll('.action-edit-btn')
        .forEach((btn, idx) => {
          btn.onclick = async () => {
            // Para edição, é necessário um id.
            const b = list[idx];
            // Tenta buscar id do benefício real pela tabela com base em título.
            // (Só vai funcionar se benefício não foi removido/manualmente alterado na view)
            const beneficioRaw = await (async () => {
              // Busca apenas para admin: lê beneficio da tabela direto (igual título).
              // Tenta matchar não só pelo título, mas também outros campos.
              const resp = await fetch(
                `${supabaseUrl}/rest/v1/beneficios?select=*,categoria_id&titulo=eq.${encodeURIComponent(b.titulo || '')}`,
                {
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    Accept: 'application/json'
                  }
                }
              );
              if (!resp.ok) return null;
              const arr = await resp.json();
              // Em caso de múltiplos, tenta matchar melhor
              if (!Array.isArray(arr) || arr.length === 0) return null;
              if (arr.length === 1) return arr[0];
              // Match melhor: considera pontos e categoria
              return arr.find(a =>
                  a.pontos_necessarios == b.pontos_necessarios &&
                  (a.descricao || '') === (b.descricao || '')
                ) || arr[0];
            })();
            if (!beneficioRaw || !beneficioRaw.id) {
              // Não achou o beneficio na tabela para editar
              alert('Não é possível editar: este benefício é proveniente apenas da view e não foi encontrado na tabela original. Edite ou adicione benefícios pelo botão "Adicionar Benefício".');
            } else {
              openDrawer({
                mode: 'edit',
                beneficio: beneficioRaw,
                onDone: () => refreshTable(),
              });
            }
          };
        });
    } catch (e) {
      tableBody.innerHTML = `<tr><td colspan="7" style="color:#B00;font-weight:bold;">Erro ao carregar: ${escapeHTML(
        e.message
      )}</td></tr>`;
    }
  }

  // Botão Adicionar Benefício
  main.querySelector('#btnAddBeneficio').addEventListener('click', () => {
    openDrawer({
      mode: 'new',
      beneficio: null,
      onDone: () => refreshTable(),
    });
  });

  // Inicial
  refreshTable();
}