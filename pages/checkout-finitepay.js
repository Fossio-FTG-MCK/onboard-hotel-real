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

// --- DATA ACCESS ---
async function fetchSuites() {
  const session = window.CURRENT_USER?.session;
  const authToken = session?.access_token || supabaseKey;

  const resp = await fetch(`${supabaseUrl}/rest/v1/suites?select=*`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  });
  if (!resp.ok) throw new Error('Erro ao carregar suítes');
  return resp.json();
}

// --- UI TEMPLATE ---
function templateCheckoutInfinitepay() {
  return `
    <style>
      .checkout-infinitepay-container {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .checkout-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 30px 0;
        background: linear-gradient(135deg, #1A2950 0%, #36a9f4 100%);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }
      
      .checkout-header h1 {
        margin: 0;
        font-size: 2.2rem;
        font-weight: 600;
      }
      
      .checkout-wrapper {
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        margin-bottom: 30px;
      }
      
      .checkout-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        align-items: start;
      }
      
      .form-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .form-group label {
        font-weight: 600;
        color: #1A2950;
        font-size: 0.95rem;
      }
      
      .form-group input,
      .form-group select {
        padding: 12px 16px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: #f8f9fa;
      }
      
      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #36a9f4;
        box-shadow: 0 0 0 3px rgba(54, 169, 244, 0.1);
        background: white;
      }
      
      .valor-info {
        background: #f0f8ff;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #36a9f4;
        margin: 20px 0;
      }
      
      .valor-info strong {
        color: #1A2950;
        font-size: 1.1rem;
      }
      
      .btn-montar-link {
        background: #36a9f4;
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        margin-top: 10px;
      }
      
      .btn-montar-link:hover {
        background: #2190d6;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(54, 169, 244, 0.3);
      }
      
      .preview-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .link-result {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .link-input-group {
        display: flex;
        gap: 10px;
      }
      
      .link-input-group input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        background: #f8f9fa;
        font-family: monospace;
        font-size: 0.9rem;
      }
      
      .btn-copy {
        background: #6c757d;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        white-space: nowrap;
      }
      
      .btn-copy:hover {
        background: #5a6268;
      }
      
      .btn-whatsapp {
        background: #25d366;
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        text-decoration: none;
        text-align: center;
        display: block;
      }
      
      .btn-whatsapp:hover {
        background: #20c653;
        color: white;
        text-decoration: none;
      }
      
      .qr-container {
        text-align: center;
        padding: 30px;
        background: #f8f9fa;
        border-radius: 12px;
        border: 2px dashed #dee2e6;
      }
      
      .qr-code-wrapper {
        width: 300px;
        height: 300px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .qr-placeholder {
        color: #6c757d;
        font-size: 1rem;
        text-align: center;
        padding: 20px;
      }
      
      #qr-code {
        max-width: 100%;
        max-height: 100%;
      }
      
      @media (max-width: 768px) {
        .checkout-row {
          grid-template-columns: 1fr;
          gap: 30px;
        }
        
        .checkout-wrapper {
          padding: 20px;
        }
        
        .checkout-header h1 {
          font-size: 1.8rem;
        }
        
        .qr-code-wrapper {
          width: 250px;
          height: 250px;
        }
      }
    </style>
    
    <div class="checkout-infinitepay-container">
      <div class="checkout-header">
        <h1>Checkout InfinitePay</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Gere links de pagamento para reservas do hotel</p>
      </div>
      
      <div class="checkout-wrapper">
        <form id="checkout-form">
          <div class="checkout-row">
            <div class="form-section">
              <div class="form-group">
                <label for="suite">Suíte *</label>
                <select id="suite" required>
                  <option value="">Carregando suítes...</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="checkin">Check-in *</label>
                <input type="date" id="checkin" required>
              </div>
              
              <div class="form-group">
                <label for="checkout">Check-out *</label>
                <input type="date" id="checkout" required>
              </div>
              
              <div class="form-group">
                <label for="customerName">Nome do Cliente *</label>
                <input type="text" id="customerName" required placeholder="Nome completo do cliente">
              </div>
              
              <div class="form-group">
                <label for="email">E-mail</label>
                <input type="email" id="email" placeholder="email@exemplo.com">
              </div>
              
              <div class="form-group">
                <label for="whatsapp">WhatsApp do Cliente</label>
                <input type="tel" id="whatsapp" placeholder="(11) 99999-9999">
              </div>
              
              <div class="valor-info">
                <div><strong>Valor por diária: R$ <span id="valor-diaria">0,00</span></strong></div>
                <div style="margin-top: 8px;"><strong>Valor total: R$ <span id="total-value">0,00</span></strong></div>
              </div>
              
              <button type="submit" class="btn-montar-link">
                <i class="fas fa-link" style="margin-right: 8px;"></i>
                Montar Link de Pagamento
              </button>
            </div>
            
            <div class="preview-section">
              <div class="link-result">
                <div class="form-group">
                  <label>Link de Pagamento:</label>
                  <div class="link-input-group">
                    <input type="text" id="checkoutLink" readonly placeholder="O link será gerado após preencher o formulário">
                    <button type="button" class="btn-copy" onclick="copyLink()">
                      <i class="fas fa-copy"></i> Copiar
                    </button>
                  </div>
                </div>
                
                <a href="#" id="whatsappLink" target="_blank" class="btn-whatsapp" style="display: none;">
                  <i class="fab fa-whatsapp" style="margin-right: 8px;"></i>
                  Enviar via WhatsApp
                </a>
              </div>
              
              <div class="qr-container">
                <h3 style="margin-top: 0; color: #1A2950;">QR Code</h3>
                <div class="qr-code-wrapper">
                  <div class="qr-placeholder" id="qr-placeholder">
                    <i class="fas fa-qrcode" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                    O QR Code será gerado após montar o link
                  </div>
                  <canvas id="qr-code" style="display: none;"></canvas>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
}

// --- MAIN LOGIC ---
let selectedData = null;

function calcularDias(checkinStr, checkoutStr) {
  const checkin = new Date(checkinStr);
  const checkout = new Date(checkoutStr);
  const diff = (checkout - checkin) / (1000 * 60 * 60 * 24);
  return isNaN(diff) || diff < 1 ? 1 : diff;
}

function atualizarValores() {
  if (!selectedData) return;
  
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');
  const diariaSpan = document.getElementById('valor-diaria');
  const totalSpan = document.getElementById('total-value');
  
  const checkin = checkinInput.value;
  const checkout = checkoutInput.value;
  const dias = calcularDias(checkin, checkout);
  const valorTotal = (selectedData.valor || 0) * dias;
  
  diariaSpan.textContent = selectedData.valor.toFixed(2).replace('.', ',');
  totalSpan.textContent = valorTotal.toFixed(2).replace('.', ',');
}

async function carregarSuites() {
  try {
    const suites = await fetchSuites();
    const suiteSelect = document.getElementById('suite');
    
    suiteSelect.innerHTML = '<option value="">Selecione a suíte</option>';
    suites.forEach(suite => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({
        id: suite.id,
        valor: suite.valor_base
      });
      opt.textContent = `${suite.nome} - ${suite.disponivel ? 'Disponível' : 'Indisponível'}`;
      if (!suite.disponivel) opt.disabled = true;
      suiteSelect.appendChild(opt);
    });
  } catch (error) {
    console.error('Erro ao carregar suítes:', error);
    document.getElementById('suite').innerHTML = '<option value="">Erro ao carregar suítes</option>';
  }
}

function setupEventListeners() {
  const suiteSelect = document.getElementById('suite');
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');
  const form = document.getElementById('checkout-form');
  
  // Suite selection
  suiteSelect.addEventListener('change', function() {
    selectedData = this.value ? JSON.parse(this.value) : null;
    atualizarValores();
  });
  
  // Date changes
  checkinInput.addEventListener('change', atualizarValores);
  checkoutInput.addEventListener('change', atualizarValores);
  
  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('email').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const checkin = checkinInput.value;
    const checkout = checkoutInput.value;
    
    if (!selectedData || !selectedData.id || !selectedData.valor) {
      alert('Selecione uma suíte válida.');
      return;
    }
    
    const dias = calcularDias(checkin, checkout);
    const valorTotal = (selectedData.valor || 0) * dias;
    
    // Generate unique reservation ID
    const dataNow = new Date();
    const timePart = dataNow.getTime().toString().slice(-5);
    const reservaId = `reserva_${dataNow.toISOString().split('T')[0].replace(/-/g, '')}_${timePart}`;
    
    // Build InfinitePay URL
    const baseUrl = new URL('https://infinitepay.io/pay');
    baseUrl.searchParams.set('suite_id', selectedData.id);
    baseUrl.searchParams.set('reserva_id', reservaId);
    baseUrl.searchParams.set('value', valorTotal.toFixed(2));
    baseUrl.searchParams.set('nome', name);
    
    if (email) baseUrl.searchParams.set('email', email);
    if (whatsapp) baseUrl.searchParams.set('whats', whatsapp);
    if (checkin) baseUrl.searchParams.set('checkin', checkin);
    if (checkout) baseUrl.searchParams.set('checkout', checkout);
    
    const finalUrl = baseUrl.toString();
    
    // Update UI
    document.getElementById('checkoutLink').value = finalUrl;
    
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsapp) {
      const whatsappNumber = whatsapp.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá! Segue seu link de pagamento para a reserva: ${finalUrl}`);
      whatsappLink.href = `https://wa.me/55${whatsappNumber}?text=${message}`;
      whatsappLink.style.display = 'block';
    } else {
      whatsappLink.style.display = 'none';
    }
    
    // Generate QR Code
    generateQRCode(finalUrl);
  });
  
  // Set default check-in date to today
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];
  checkinInput.value = hojeStr;
}

function generateQRCode(url) {
  const qrCanvas = document.getElementById('qr-code');
  const qrPlaceholder = document.getElementById('qr-placeholder');
  
  // Load QR code library if not already loaded
  if (typeof QRCode === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';
    script.onload = () => {
      QRCode.toCanvas(qrCanvas, url, { width: 280 }, function(error) {
        if (!error) {
          qrPlaceholder.style.display = 'none';
          qrCanvas.style.display = 'block';
        }
      });
    };
    document.head.appendChild(script);
  } else {
    QRCode.toCanvas(qrCanvas, url, { width: 280 }, function(error) {
      if (!error) {
        qrPlaceholder.style.display = 'none';
        qrCanvas.style.display = 'block';
      }
    });
  }
}

// Global function for copy button
window.copyLink = function() {
  const input = document.getElementById('checkoutLink');
  input.select();
  input.setSelectionRange(0, 99999); // For mobile devices
  
  // Try modern API first
  if (navigator.clipboard) {
    navigator.clipboard.writeText(input.value).then(() => {
      showNotification('Link copiado com sucesso!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      document.execCommand('copy');
      showNotification('Link copiado com sucesso!', 'success');
    });
  } else {
    // Fallback for older browsers
    document.execCommand('copy');
    showNotification('Link copiado com sucesso!', 'success');
  }
};

function showNotification(message, type = 'success') {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-weight: 500;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// --- EXPORT ---
export async function render({ main }) {
  if (!main) return;
  
  main.innerHTML = templateCheckoutInfinitepay();
  
  // Initialize functionality
  await carregarSuites();
  setupEventListeners();
}
