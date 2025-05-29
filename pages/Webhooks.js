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

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value) {
  if (value === null || value === undefined) return 'R$ 0,00';
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

// --- DATA ACCESS ---
async function fetchWebhooks() {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;

  const resp = await fetch(`${supabaseUrl}/rest/v1/v_detalhes_webhook_reservas?select=*&order=recebido_em.desc&limit=200`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  });
  if (!resp.ok) throw new Error('Erro ao carregar webhooks');
  return resp.json();
}

// --- UI TEMPLATES ---
function templateWebhooksPage() {
  return `
    <style>
      .webhooks-container {
        max-width: 100%;
        min-width: 80%;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        overflow-x: hidden; /* Evitar scroll lateral na página */
      }
      
      .webhooks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding: 20px 0;
        border-bottom: 2px solid #f0f0f0;
        min-width: 80%;
        max-width: 100%;
        box-sizing: border-box;
      }
      
      .webhooks-header h1 {
        margin: 0;
        color: #1A2950;
        font-size: 2rem;
        font-weight: 600;
      }
      
      .webhooks-info {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 15px 20px;
        border-radius: 8px;
        border-left: 4px solid #36a9f4;
        margin-bottom: 25px;
        min-width: 80%;
        max-width: 100%;
        box-sizing: border-box;
      }
      
      .webhooks-info p {
        margin: 0;
        color: #495057;
        font-size: 0.95rem;
      }
      
      .filters-section {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        margin-bottom: 25px;
        min-width: 80%;
        max-width: 100%;
        box-sizing: border-box;
        overflow: hidden; /* Evitar overflow dos filtros */
      }
      
      .filters-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .filters-header h3 {
        margin: 0;
        color: #1A2950;
        font-size: 1.2rem;
      }
      
      .btn-toggle-filters {
        background: #36a9f4;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
        flex-shrink: 0;
      }
      
      .btn-toggle-filters:hover {
        background: #2190d6;
      }
      
      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        transition: all 0.3s ease;
        min-width: 80%;
        max-width: 100%;
        box-sizing: border-box;
      }
      
      .filters-grid.collapsed {
        display: none;
      }
      
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        max-width: 100%;
      }
      
      .filter-group label {
        font-weight: 500;
        color: #1A2950;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .filter-group input,
      .filter-group select {
        padding: 8px 10px;
        border: 2px solid #e1e5e9;
        border-radius: 6px;
        font-size: 0.85rem;
        transition: border-color 0.2s;
        background: #f8f9fa;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
      }
      
      .filter-group input:focus,
      .filter-group select:focus {
        outline: none;
        border-color: #36a9f4;
        background: white;
      }
      
      .filter-actions {
        display: flex;
        gap: 10px;
        align-items: end;
        justify-content: flex-start;
        grid-column: 1 / -1;
        margin-top: 10px;
      }
      
      .btn-clear-filters {
        background: #6c757d;
        color: white;
        border: none;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .btn-clear-filters:hover {
        background: #5a6268;
      }
      
      .table-wrapper {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        min-width: 80%;
        max-width: 100%;
        box-sizing: border-box;
      }
      
      .table-header {
        background: #1A2950;
        color: white;
        padding: 20px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 80%;
        max-width: 100%;
        box-sizing: border-box;
      }
      
      .table-header h3 {
        margin: 0;
        font-size: 1.1rem;
      }
      
      .table-stats {
        font-size: 0.9rem;
        opacity: 0.9;
      }
      
      .table-scroll-container {
        min-width: 80%;
        max-width: 100%;
        overflow-x: auto;
        box-sizing: border-box;
      }
      
      /* Personalizar barra de scroll com cores da aplicação */
      .table-scroll-container::-webkit-scrollbar {
        height: 12px;
      }
      
      .table-scroll-container::-webkit-scrollbar-track {
        background: #f8f9fa;
        border-radius: 6px;
      }
      
      .table-scroll-container::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg, #1A2950 0%, #36a9f4 100%);
        border-radius: 6px;
        border: 2px solid #f8f9fa;
      }
      
      .table-scroll-container::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(90deg, #2d4065 0%, #2190d6 100%);
      }
      
      /* Firefox */
      .table-scroll-container {
        scrollbar-width: thin;
        scrollbar-color: #36a9f4 #f8f9fa;
      }
      
      .webhooks-table {
        max-width: 100%;
        min-width: 1000px; /* Largura mínima para garantir legibilidade */
        border-collapse: collapse;
        font-size: 0.9rem;
        table-layout: fixed;
      }
      
      .webhooks-table th {
        background: #f8f9fa;
        padding: 15px 12px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .webhooks-table td {
        padding: 15px 12px;
        border-bottom: 1px solid #eee;
        vertical-align: middle;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      /* Larguras específicas para as colunas */
      .webhooks-table th:nth-child(1),
      .webhooks-table td:nth-child(1) { width: 120px; } /* Reserva */
      .webhooks-table th:nth-child(2),
      .webhooks-table td:nth-child(2) { width: 120px; } /* Order ID */
      .webhooks-table th:nth-child(3),
      .webhooks-table td:nth-child(3) { width: 100px; } /* NSU */
      .webhooks-table th:nth-child(4),
      .webhooks-table td:nth-child(4) { width: 100px; } /* Valor */
      .webhooks-table th:nth-child(5),
      .webhooks-table td:nth-child(5) { width: 150px; } /* Cliente */
      .webhooks-table th:nth-child(6),
      .webhooks-table td:nth-child(6) { width: 180px; } /* E-mail */
      .webhooks-table th:nth-child(7),
      .webhooks-table td:nth-child(7) { width: 120px; } /* WhatsApp */
      .webhooks-table th:nth-child(8),
      .webhooks-table td:nth-child(8) { width: 100px; } /* Check-in */
      .webhooks-table th:nth-child(9),
      .webhooks-table td:nth-child(9) { width: 100px; } /* Check-out */
      .webhooks-table th:nth-child(10),
      .webhooks-table td:nth-child(10) { width: 140px; } /* Recebido em */
      
      .webhooks-table tbody tr:hover {
        background: #f8f9fa;
      }
      
      .webhook-id {
        font-family: monospace;
        background: #f8f9fa;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #495057;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }
      
      .webhook-status {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
        background: #28a745;
        color: white;
      }
      
      .webhook-value {
        font-weight: 600;
        color: #28a745;
        white-space: nowrap;
      }
      
      .webhook-date {
        color: #6c757d;
        font-size: 0.8rem;
        white-space: nowrap;
      }
      
      .no-data {
        text-align: center;
        padding: 40px 20px;
        color: #6c757d;
      }
      
      .loading {
        text-align: center;
        padding: 40px 20px;
        color: #36a9f4;
      }
      
      @media (max-width: 1200px) {
        .filters-grid {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        
        .filter-group input,
        .filter-group select {
          padding: 7px 9px;
          font-size: 0.8rem;
        }
      }
      
      @media (max-width: 768px) {
        .filters-grid {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        
        .filter-actions {
          justify-content: center;
          margin-top: 15px;
        }
        
        .webhooks-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 15px;
        }
        
        .webhooks-header h1 {
          font-size: 1.5rem;
        }
        
        .filters-section {
          padding: 15px;
        }
        
        .filters-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 15px;
        }
        
        .table-header {
          padding: 15px 20px;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }
        
        .table-header h3 {
          font-size: 1rem;
        }
        
        .webhooks-table {
          min-width: 1200px; /* Aumentar largura mínima em mobile para forçar scroll */
        }
        
        .webhooks-table th,
        .webhooks-table td {
          padding: 12px 8px;
          font-size: 0.85rem;
        }
        
        .webhook-id {
          font-size: 0.7rem;
          padding: 3px 5px;
        }
        
        .webhook-date {
          font-size: 0.75rem;
        }
      }
      
      @media (max-width: 480px) {
        .filters-grid {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .webhooks-container {
          padding: 0 10px;
        }
        
        .filters-section {
          padding: 12px;
          margin-bottom: 20px;
        }
        
        .webhooks-header {
          padding: 15px 0;
        }
        
        .table-header {
          padding: 12px 15px;
        }
        
        .webhooks-table th,
        .webhooks-table td {
          padding: 10px 6px;
          font-size: 0.8rem;
        }
        
        .filter-group input,
        .filter-group select {
          padding: 6px 8px;
          font-size: 0.75rem;
        }
        
        .filter-group label {
          font-size: 0.8rem;
        }
      }
      
      @media (max-width: 360px) {
        .filters-grid {
          grid-template-columns: 1fr;
        }
        
        .webhooks-container {
          padding: 0 5px;
        }
        
        .webhooks-header h1 {
          font-size: 1.3rem;
        }
      }
    </style>
    
    <div class="webhooks-container">
      <div class="webhooks-header">
        <h1>Webhooks Recebidos</h1>
      </div>
      
      <div class="webhooks-info">
        <p><i class="fas fa-info-circle" style="margin-right: 8px;"></i>Lista de webhooks recebidos após confirmação de pagamentos via InfinitePay. Os dados são atualizados automaticamente conforme novos pagamentos são processados.</p>
      </div>
      
      <div class="filters-section">
        <div class="filters-header">
          <h3><i class="fas fa-filter" style="margin-right: 8px;"></i>Filtros</h3>
          <button class="btn-toggle-filters" id="btnToggleFilters">
            <i class="fas fa-eye"></i> Ocultar Filtros
          </button>
        </div>
        
        <div class="filters-grid" id="filtersGrid">
          <div class="filter-group">
            <label for="filtro_reserva">Reserva ID</label>
            <input type="text" id="filtro_reserva" placeholder="Digite o ID da reserva">
          </div>
          
          <div class="filter-group">
            <label for="filtro_order">Order ID</label>
            <input type="text" id="filtro_order" placeholder="Digite o ID do pedido">
          </div>
          
          <div class="filter-group">
            <label for="filtro_nome">Nome do Cliente</label>
            <input type="text" id="filtro_nome" placeholder="Digite o nome">
          </div>
          
          <div class="filter-group">
            <label for="filtro_email">E-mail</label>
            <input type="email" id="filtro_email" placeholder="Digite o e-mail">
          </div>
          
          <div class="filter-group">
            <label for="filtro_valor_min">Valor Mínimo</label>
            <input type="number" id="filtro_valor_min" placeholder="0,00" step="0.01">
          </div>
          
          <div class="filter-group">
            <label for="filtro_valor_max">Valor Máximo</label>
            <input type="number" id="filtro_valor_max" placeholder="1000,00" step="0.01">
          </div>
          
          <div class="filter-group">
            <label for="filtro_checkin_ini">Check-in De</label>
            <input type="date" id="filtro_checkin_ini">
          </div>
          
          <div class="filter-group">
            <label for="filtro_checkin_fim">Check-in Até</label>
            <input type="date" id="filtro_checkin_fim">
          </div>
          
          <div class="filter-group">
            <label for="filtro_recebido_ini">Recebido De</label>
            <input type="date" id="filtro_recebido_ini">
          </div>
          
          <div class="filter-group">
            <label for="filtro_recebido_fim">Recebido Até</label>
            <input type="date" id="filtro_recebido_fim">
          </div>
          
          <div class="filter-actions">
            <button class="btn-clear-filters" id="btnClearFilters">
              <i class="fas fa-times"></i> Limpar
            </button>
          </div>
        </div>
      </div>
      
      <div class="table-wrapper">
        <div class="table-header">
          <h3><i class="fas fa-list" style="margin-right: 8px;"></i>Lista de Webhooks</h3>
          <div class="table-stats" id="tableStats">
            <i class="fas fa-chart-bar" style="margin-right: 5px;"></i>
            <span id="statsText">Carregando...</span>
          </div>
        </div>
        
        <div class="table-scroll-container">
          <table class="webhooks-table">
            <thead>
              <tr>
                <th>Reserva</th>
                <th>Order ID</th>
                <th>NSU</th>
                <th>Valor</th>
                <th>Cliente</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Recebido em</th>
              </tr>
            </thead>
            <tbody id="webhooksTableBody">
              <tr>
                <td colspan="10" class="loading">
                  <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
                  Carregando webhooks...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// --- MAIN LOGIC ---
let allWebhooks = [];
let filteredWebhooks = [];

function renderTable(webhooks) {
  const tbody = document.getElementById('webhooksTableBody');
  
  if (!webhooks || webhooks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="no-data">
          <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
          Nenhum webhook encontrado com os filtros aplicados.
        </td>
      </tr>
    `;
    updateStats(0);
    return;
  }
  
  tbody.innerHTML = webhooks.map(webhook => `
    <tr>
      <td>
        <div class="webhook-id">${escapeHTML(webhook.reserva_id || 'N/A')}</div>
      </td>
      <td>
        <div class="webhook-id">${escapeHTML(webhook.order_id || 'N/A')}</div>
      </td>
      <td>
        <div class="webhook-id">${escapeHTML(webhook.nsu || 'N/A')}</div>
      </td>
      <td>
        <div class="webhook-value">${formatCurrency(webhook.valor_total)}</div>
      </td>
      <td>${escapeHTML(webhook.cliente_nome || 'N/A')}</td>
      <td>${escapeHTML(webhook.cliente_email || 'N/A')}</td>
      <td>${escapeHTML(webhook.cliente_whatsapp || 'N/A')}</td>
      <td>${webhook.checkin ? new Date(webhook.checkin).toLocaleDateString('pt-BR') : 'N/A'}</td>
      <td>${webhook.checkout ? new Date(webhook.checkout).toLocaleDateString('pt-BR') : 'N/A'}</td>
      <td>
        <div class="webhook-date">${formatDate(webhook.recebido_em)}</div>
      </td>
    </tr>
  `).join('');
  
  updateStats(webhooks.length);
}

function updateStats(count) {
  const statsText = document.getElementById('statsText');
  const total = allWebhooks.length;
  
  if (count === total) {
    statsText.innerHTML = `${total} webhook${total !== 1 ? 's' : ''}`;
  } else {
    statsText.innerHTML = `${count} de ${total} webhook${total !== 1 ? 's' : ''}`;
  }
}

function applyFilters() {
  const filters = {
    reserva: document.getElementById('filtro_reserva').value.toLowerCase().trim(),
    order: document.getElementById('filtro_order').value.toLowerCase().trim(),
    nome: document.getElementById('filtro_nome').value.toLowerCase().trim(),
    email: document.getElementById('filtro_email').value.toLowerCase().trim(),
    valorMin: parseFloat(document.getElementById('filtro_valor_min').value) || 0,
    valorMax: parseFloat(document.getElementById('filtro_valor_max').value) || Infinity,
    checkinIni: document.getElementById('filtro_checkin_ini').value,
    checkinFim: document.getElementById('filtro_checkin_fim').value,
    recebidoIni: document.getElementById('filtro_recebido_ini').value,
    recebidoFim: document.getElementById('filtro_recebido_fim').value,
  };
  
  filteredWebhooks = allWebhooks.filter(webhook => {
    const matchReserva = !filters.reserva || (webhook.reserva_id || '').toLowerCase().includes(filters.reserva);
    const matchOrder = !filters.order || (webhook.order_id || '').toLowerCase().includes(filters.order);
    const matchNome = !filters.nome || (webhook.cliente_nome || '').toLowerCase().includes(filters.nome);
    const matchEmail = !filters.email || (webhook.cliente_email || '').toLowerCase().includes(filters.email);
    const matchValor = (webhook.valor_total || 0) >= filters.valorMin && (webhook.valor_total || 0) <= filters.valorMax;
    
    const checkinDate = webhook.checkin ? webhook.checkin : '';
    const matchCheckinIni = !filters.checkinIni || checkinDate >= filters.checkinIni;
    const matchCheckinFim = !filters.checkinFim || checkinDate <= filters.checkinFim;
    
    const recebidoDate = webhook.recebido_em ? webhook.recebido_em.slice(0, 10) : '';
    const matchRecebidoIni = !filters.recebidoIni || recebidoDate >= filters.recebidoIni;
    const matchRecebidoFim = !filters.recebidoFim || recebidoDate <= filters.recebidoFim;
    
    return matchReserva && matchOrder && matchNome && matchEmail && matchValor && 
           matchCheckinIni && matchCheckinFim && matchRecebidoIni && matchRecebidoFim;
  });
  
  renderTable(filteredWebhooks);
}

function clearFilters() {
  document.getElementById('filtro_reserva').value = '';
  document.getElementById('filtro_order').value = '';
  document.getElementById('filtro_nome').value = '';
  document.getElementById('filtro_email').value = '';
  document.getElementById('filtro_valor_min').value = '';
  document.getElementById('filtro_valor_max').value = '';
  document.getElementById('filtro_checkin_ini').value = '';
  document.getElementById('filtro_checkin_fim').value = '';
  document.getElementById('filtro_recebido_ini').value = '';
  document.getElementById('filtro_recebido_fim').value = '';
  
  filteredWebhooks = [...allWebhooks];
  renderTable(filteredWebhooks);
}

function setupEventListeners() {
  // Toggle filters
  const btnToggle = document.getElementById('btnToggleFilters');
  const filtersGrid = document.getElementById('filtersGrid');
  
  btnToggle.addEventListener('click', () => {
    const isCollapsed = filtersGrid.classList.contains('collapsed');
    filtersGrid.classList.toggle('collapsed');
    btnToggle.innerHTML = isCollapsed 
      ? '<i class="fas fa-eye"></i> Ocultar Filtros'
      : '<i class="fas fa-eye-slash"></i> Mostrar Filtros';
  });
  
  // Filter inputs
  const filterInputs = [
    'filtro_reserva', 'filtro_order', 'filtro_nome', 'filtro_email',
    'filtro_valor_min', 'filtro_valor_max', 'filtro_checkin_ini', 
    'filtro_checkin_fim', 'filtro_recebido_ini', 'filtro_recebido_fim'
  ];
  
  filterInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', applyFilters);
      input.addEventListener('change', applyFilters);
    }
  });
  
  // Clear filters button
  document.getElementById('btnClearFilters').addEventListener('click', clearFilters);
}

async function loadWebhooks() {
  try {
    const webhooks = await fetchWebhooks();
    allWebhooks = webhooks;
    filteredWebhooks = [...webhooks];
    renderTable(filteredWebhooks);
  } catch (error) {
    console.error('Erro ao carregar webhooks:', error);
    const tbody = document.getElementById('webhooksTableBody');
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="color: #dc3545; text-align: center; padding: 40px 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
          <strong>Erro ao carregar webhooks:</strong><br>
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
    updateStats(0);
  }
}

// --- EXPORT ---
export async function render({ main }) {
  if (!main) return;
  
  main.innerHTML = templateWebhooksPage();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load initial data
  await loadWebhooks();
} 