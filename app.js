// Roteador SPA simples para Hotel Real Onboard
const routes = {
  beneficios: () => import('./pages/Beneficios.js'),
  parceiros: () => import('./pages/Parceiros.js'),
  vouchers: () => import('./pages/Vouchers.js'),
  usuarios: () => import('./pages/Usuarios.js'),
};

function getCurrentPageFromHash() {
  // por padrão: #/beneficios, #/parceiros, etc. Fallback para 'beneficios'
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || 'beneficios';
}

function setActiveMenu(page) {
  document.querySelectorAll('.sidemenu a').forEach(a => {
    const href = a.getAttribute('href');
    // Links SPA: href="#/beneficios"
    if (href && href.replace(/^#\/?/, '') === page) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

// -------- LOGIN LOGIC ---------
const SUPABASE_URL = 'https://kpjwznuthdnodfqgnidk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtwand6bnV0aGRub2RmcWduaWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MDcxMjcsImV4cCI6MjA1OTM4MzEyN30.8rtnknzowlYM393S_awylDyKHBG9P3cI2VrKgQwxqNU';

// Simples "auth" state local (prototipo)
let CURRENT_USER = null;
function setCurrentUser(user) {
  CURRENT_USER = user;
  // Make it available globally
  window.CURRENT_USER = user;
  // Mostra no botão "Entrar" se está logado
  const btn = document.getElementById('openLoginModal');
  if (btn) {
    if (CURRENT_USER) {
      btn.innerHTML = `<svg width="23" height="23" viewBox="0 0 20 20" style="vertical-align:middle;"><circle cx="10" cy="6.5" r="4" fill="#36a9f4"/><ellipse cx="10" cy="15.5" rx="7" ry="3.2" fill="#36a9f4" opacity=".6"/></svg> <span>${CURRENT_USER.email || 'Minha conta'}</span>`;
    } else {
      btn.innerHTML = `<svg width="23" height="23" viewBox="0 0 20 20" style="vertical-align:middle;"><circle cx="10" cy="6.5" r="4" fill="#36a9f4"/><ellipse cx="10" cy="15.5" rx="7" ry="3.2" fill="#36a9f4" opacity=".6"/></svg> <span>Entrar</span>`;
    }
  }
}

// Supabase Auth endpoints
async function supaSignIn(email, password) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error_description || "Usuário e/ou senha inválidos.");
  }
  return data;
}
async function supaPasswordReset(email) {
  const urlRedirect = window.location.origin;
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const data = await resp.json().catch(()=>({}));
  if (!resp.ok) {
    throw new Error(data.error_description || "Erro ao solicitar redefinição de senha.");
  }
  return true;
}

// Modal logic
function createLoginModal(isPersistent = false) {
  const modalRoot = document.getElementById('login-modal-root');
  if (!modalRoot) return;
  modalRoot.innerHTML = ''; // remove previous (safety)
  const overlay = document.createElement('div');
  overlay.className = 'login-modal-overlay';
  overlay.innerHTML = getLoginModalHtml(isPersistent);
  modalRoot.appendChild(overlay);

  // Close modal only if not persistent
  if (!isPersistent) {
    overlay.querySelector(".login-close-btn").onclick = () => closeModal();
  }

  // Form logic
  const form = overlay.querySelector('form');
  const emailInput = overlay.querySelector('input[type="email"]');
  const passInput = overlay.querySelector('input[type="password"]');
  const passRevealBtn = overlay.querySelector('.pass-reveal-btn');
  const loginError = overlay.querySelector('.login-error');
  const loginSuccess = overlay.querySelector('.login-success');
  let loading = false;

  passRevealBtn.addEventListener('click', () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
    passRevealBtn.innerHTML = passInput.type === 'password'
      ? `<svg xmlns="http://www.w3.org/2000/svg" height="19" width="19" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="7" ry="5.3" fill="none" stroke="#132455" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" fill="none" stroke="#1ca6f9" stroke-width="1.4"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" height="19" width="19" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="7" ry="5.3" fill="none" stroke="#132455" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" fill="none" stroke="#1ca6f9" stroke-width="1.4"/><line x1="5" y1="15" x2="15" y2="5" stroke="#a3b8d8" stroke-width="1.6"/></svg>`;
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
    if (loading) return;
    loading = true;
    overlay.querySelector('button[type="submit"]').disabled = true;

    const email = emailInput.value;
    const pass = passInput.value;

    if (!email || !pass) {
      loginError.textContent = 'E-mail e senha obrigatórios.';
      loginError.style.display = '';
      loading = false;
      overlay.querySelector('button[type="submit"]').disabled = false;
      return;
    }

    try {
      const resp = await supaSignIn(email, pass);
      setCurrentUser({ email, session: resp });
      loginSuccess.textContent = "Login realizado!";
      loginSuccess.style.display = '';
      setTimeout(() => {
        closeModal();
      }, 1100);
    } catch (err) {
      loginError.textContent = err.message || "Não foi possível efetuar login.";
      loginError.style.display = '';
    }
    loading = false;
    overlay.querySelector('button[type="submit"]').disabled = false;
  };

  // Redefinir senha link - agora abre um modal próprio via JS (não usa prompt)
  overlay.querySelector('.login-link-btn[data-reset]').onclick = () => {
    openPasswordResetModal(emailInput.value);
  };

  // Logout
  const logoutBtn = overlay.querySelector('.login-link-btn[data-logout]');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      setCurrentUser(null);
      closeModal();
    };
  }

  // Acessibilidade: foca no campo email ao abrir
  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 120);
}

// Novo: Modal de redefinição de senha
function openPasswordResetModal(prefilledEmail = "") {
  const modalRoot = document.getElementById('login-modal-root');
  if (!modalRoot) return;
  modalRoot.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'login-modal-overlay';
  overlay.innerHTML = `
    <div class="login-modal" style="gap:14px">
      <button class="login-close-btn" title="Fechar">&times;</button>
      <h2>Redefinir senha</h2>
      <form autocomplete="on" style="display:flex;flex-direction:column;gap:14px;">
        <div class="login-error" style="display:none;"></div>
        <div class="login-success" style="display:none;"></div>
        <label for="reset-email">Informe seu e-mail para redefinir a senha:</label>
        <input id="reset-email" required type="email" inputmode="email" autocomplete="username" placeholder="seu@email.com" value="${prefilledEmail ? String(prefilledEmail).replace(/"/g, "&quot;") : ""}" />
        <button type="submit">Enviar e-mail de redefinição</button>
      </form>
    </div>
  `;
  modalRoot.appendChild(overlay);

  overlay.querySelector(".login-close-btn").onclick = () => closeModal();
  const form = overlay.querySelector('form');
  const emailInput = overlay.querySelector('#reset-email');
  const loginError = overlay.querySelector('.login-error');
  const loginSuccess = overlay.querySelector('.login-success');

  form.onsubmit = async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';

    const mail = emailInput.value.trim();
    if (!mail || !mail.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      loginError.textContent = "Digite um e-mail válido para redefinir a senha.";
      loginError.style.display = '';
      return;
    }
    form.querySelector('button[type="submit"]').disabled = true;
    try {
      await supaPasswordReset(mail);
      loginSuccess.textContent = "E-mail de redefinição enviado! Verifique sua caixa de entrada.";
      loginSuccess.style.display = '';
      setTimeout(() => {
        closeModal();
      }, 1700);
    } catch (err) {
      loginError.textContent = err.message || "Erro ao solicitar redefinição.";
      loginError.style.display = '';
    }
    form.querySelector('button[type="submit"]').disabled = false;
  };

  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 120);
}

function getLoginModalHtml(isPersistent) {
  const closeButton = isPersistent ? '' : '<button class="login-close-btn" title="Fechar">&times;</button>';
  if (CURRENT_USER)
    return `
      <div class="login-modal">
        ${closeButton}
        <h2>Bem-vindo!</h2>
        <div class="login-success" style="display:block;">Login realizado como <b>${CURRENT_USER.email}</b></div>
        <div class="login-links" style="margin: 0;">
          <button class="login-link-btn" data-logout>Sair</button>
        </div>
      </div>
    `;
  return `
    <div class="login-modal">
      ${closeButton}
      <h2>Entrar</h2>
      <form autocomplete="on">
        <div class="login-error" style="display:none;"></div>
        <div class="login-success" style="display:none;"></div>
        <label for="login-email">E-mail</label>
        <input id="login-email" required type="email" inputmode="email" autocomplete="username" placeholder="seu@email.com" />
        <label for="login-password">Senha</label>
        <div class="input-row">
          <input id="login-password" required type="password" autocomplete="current-password" placeholder="Sua senha" />
          <button type="button" class="pass-reveal-btn" tabindex="-1" aria-label="Exibir/ocultar senha">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="7" ry="5.3" fill="none" stroke="#132455" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" fill="none" stroke="#1ca6f9" stroke-width="1.4"/></svg>
          </button>
        </div>
        <button type="submit">Entrar</button>
        <div class="login-links">
          <button class="login-link-btn" data-reset type="button">Redefinir senha</button>
        </div>
      </form>
    </div>
  `;
}

function openLoginModal() {
  createLoginModal(true); // Passa true para tornar o modal persistente
  const layoutEl = document.querySelector('.layout');
  if (layoutEl) layoutEl.classList.add('blurred'); // Adiciona a classe de desfoque ao layout
}

function closeModal() {
  const modalRoot = document.getElementById('login-modal-root');
  if (modalRoot) modalRoot.innerHTML = '';
  const layoutEl = document.querySelector('.layout');
  if (layoutEl) layoutEl.classList.remove('blurred'); // Remove o desfoque do layout
}

function enableLoginModalMenu() {
  // Adiciona listener ao botão menu de login
  document.getElementById('openLoginModal')?.addEventListener('click', (e) => {
    e.preventDefault();
    openLoginModal();
  });
}

// --------- END LOGIN ---------

export async function loadPage(page) {
  // Limpa área principal
  const main = document.querySelector('.main-content');
  if (main) main.innerHTML = '<p>Carregando...</p>';

  setActiveMenu(page);

  if (routes[page]) {
    try {
      const module = await routes[page]();
      if (module && typeof module.render === 'function') {
        await module.render({ main });
      } else {
        main.innerHTML = '<p>Página inválida.</p>';
      }
    } catch (e) {
      main.innerHTML = `<p style="color:#c00;font-weight:bold;">Erro ao carregar página: ${e.message}</p>`;
    }
  } else {
    if (main) main.innerHTML = '<p>Página não encontrada.</p>';
  }
}

// Inicialização do SPA
function onNavigate() {
  const page = getCurrentPageFromHash();
  loadPage(page);
}

// SPA: Intercepta links sidemenu para usar SPA ao invés de page reload
function enableSpaLinks() {
  document.querySelectorAll('.sidemenu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      a.addEventListener('click', function (evt) {
        evt.preventDefault();
        window.location.hash = href;
      });
    }
  });
}

// Inicialização global ao load
window.addEventListener('DOMContentLoaded', () => {
  enableSpaLinks();
  onNavigate();
  enableLoginModalMenu();
  
  // Verifica se o usuário está logado e abre o modal se não estiver
  if (!CURRENT_USER) {
    openLoginModal(); // Abre o modal de login se o usuário não estiver logado
  }
});

window.addEventListener('hashchange', onNavigate);