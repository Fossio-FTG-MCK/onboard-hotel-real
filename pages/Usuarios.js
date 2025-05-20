// pages/Usuarios.js
const supabaseUrl = 'https://kpjwznuthdnodfqgnidk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwand6bnV0aGRub2RmcWduaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDcxMjcsImV4cCI6MjA1OTM4MzEyN30.8rtnknzowlYM393S_awylDyKHBG9P3cI2VrKgQwxqNU';

// Helper: escapa HTML básico
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Helper: formata data "YYYY-MM-DDTHH:mm:ss.sssZ" => "DD/MM/YYYY HH:mm"
function formatDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

// Busca segura dos usuários da view lista_usuarios_app
async function fetchUsuarios() {
  const resp = await fetch(`${supabaseUrl}/rest/v1/lista_usuarios_app?select=*&order=criado_em.desc`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/json'
    }
  });
  if (!resp.ok) throw new Error("Erro ao acessar dados do Supabase");
  return resp.json();
}

function templateTable() {
  return `
    <div class="usuarios-top-bar">
      <h1>Usuários</h1>
    </div>
    <div class="usuarios-tablebox">
      <table class="main-table usuarios-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Nível</th>
            <th>Tipo de Usuário</th>
            <th style="text-align: right;">Criado em</th>
          </tr>
        </thead>
        <tbody id="usuarios-table-body">
          <tr><td colspan="6">Carregando...</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

export async function render({ main }) {
  if (!main) main = document.querySelector('.main-content');
  main.innerHTML = templateTable();

  // Estilo visual igual ao da tela de Parceiros
  if (!document.getElementById('usuarios-table-parceiros-style')) {
    const st = document.createElement('style');
    st.id = 'usuarios-table-parceiros-style';
    st.innerHTML = `
      .usuarios-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
        flex-wrap: wrap;
        gap: 10px;
      }
      .usuarios-top-bar h1 {
        margin: 0;
        font-size: 1.34rem;
        font-weight: 700;
        color: #1a2950;
        letter-spacing: -.03em;
      }
      .usuarios-tablebox { width: 100%; overflow-x: auto; }
      .usuarios-table { width: 100%; }
      .main-table.usuarios-table th,
      .main-table.usuarios-table td {
        vertical-align: middle;
        padding-top: 13px;
        padding-bottom: 13px;
        padding-left: 16px;
        padding-right: 16px;
        font-size: 1rem;
      }
      .main-table.usuarios-table th {
        background: #f2f4fa;
        font-size: 1.02em;
        font-weight: 600;
        color: #2b2b2b;
        border-bottom: 2px solid #e4e9f4;
        letter-spacing: -.01em;
      }
      .main-table.usuarios-table td {
        border-bottom: 1px solid #ecf2fa;
        font-size: 14px;
        color: #222;
        background: #fff;
      }
      .main-table.usuarios-table tbody tr:hover td {
        background: #f7fafd !important;
      }
      .main-table.usuarios-table td:not(:last-child),
      .main-table.usuarios-table th:not(:last-child) {
        /* extra espaço entre colunas não-final */
        /* padding-right extra só para direita */
        padding-right: 22px;
      }
      .main-table.usuarios-table th,
      .main-table.usuarios-table td {
        text-align: left;
      }
      .main-table.usuarios-table td:last-child,
      .main-table.usuarios-table th:last-child {
        text-align: right;
        white-space: nowrap;
      }
      .main-table.usuarios-table th:nth-child(2),
      .main-table.usuarios-table td:nth-child(2) {
        min-width: 170px;
        max-width: 240px;
        word-break: break-word;
      }
      .main-table.usuarios-table th:nth-child(3),
      .main-table.usuarios-table td:nth-child(3) {
        min-width: 110px;
        max-width: 180px;
        word-break: break-word;
      }
      .main-table.usuarios-table th:nth-child(5),
      .main-table.usuarios-table td:nth-child(5) {
        min-width: 120px;
        max-width: 180px;
        word-break: break-word;
      }
      .main-table.usuarios-table th:nth-child(1),
      .main-table.usuarios-table td:nth-child(1) {
        min-width: 110px;
        max-width: 190px;
        word-break: break-word;
      }
      /* Aumenta altura do cabeçalho conforme parceiro */
      .main-table.usuarios-table thead tr {
        height: 48px;
      }
      /* Responsivo - igual Parceiros */
      @media (max-width: 900px) {
        .main-table.usuarios-table th:nth-child(3),
        .main-table.usuarios-table td:nth-child(3) {
          display: none;
        }
      }
      @media (max-width: 700px) {
        .main-table.usuarios-table th,
        .main-table.usuarios-table td {
          font-size: 0.95em;
          padding-left: 8px;
          padding-right: 8px;
        }
        .main-table.usuarios-table th:nth-child(6),
        .main-table.usuarios-table td:nth-child(6) {
          font-size: 0.94em;
          white-space: normal;
        }
      }
    `;
    document.head.appendChild(st);
  }

  const tableBody = main.querySelector('#usuarios-table-body');
  try {
    const list = await fetchUsuarios();
    if (!Array.isArray(list) || list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6">Nenhum usuário disponível.</td></tr>`;
      return;
    }
    tableBody.innerHTML = list.map(u => `
      <tr>
        <td>${escapeHTML(u.nome_usuario || "")}</td>
        <td>${escapeHTML(u.email || "")}</td>
        <td>${escapeHTML(u.telefone || "")}</td>
        <td>${escapeHTML(u.nivel || "")}</td>
        <td>${escapeHTML(u.tipo_usuario || "")}</td>
        <td style="text-align:right;">${formatDate(u.criado_em)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tableBody.innerHTML = `<tr><td colspan="6" style="color:#B00;font-weight:bold;">Erro ao carregar: ${escapeHTML(e.message)}</td></tr>`;
  }
}