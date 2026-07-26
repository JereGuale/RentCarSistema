// ==================== APP STATE & CONFIG ====================
const CHECKLIST_ITEMS = [
  'Matrícula','Revisión vehicular','Nivel de aceite del motor','Nivel de refrigerante',
  'Nivel de electrolitos batería','Neumáticos (labrado)','Neumáticos (presión)','Encendido',
  'Tablero de a bordo','Aire acondicionado','Luces','Direccionales','Espejos',
  'Asientos, tapizado y alfombras','Condiciones interiores generales','Encendedor eléctrico',
  'Radio','Botiquín','Rueda de repuesto','Caja de herramientas','Condiciones exteriores generales'
];

let S = {
  page: 'dashboard',
  arrendadores: [],
  vehiculos: [],
  clientes: [],
  contratos: [],
  imageCache: {}
};

// Image caching with localStorage (keeps frontend rendering fast)
try {
  const cached = localStorage.getItem('fc_image_cache');
  if (cached) S.imageCache = JSON.parse(cached);
} catch(e) {}

function saveImageCache() {
  try {
    localStorage.setItem('fc_image_cache', JSON.stringify(S.imageCache));
  } catch(e) {}
}

const API_BASE = ''; // Relative path because they are hosted on the same origin

// ==================== THEME MANAGEMENT ====================
function initTheme() {
  const savedTheme = localStorage.getItem('fc_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  updateThemeUI(savedTheme);
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const theme = isLight ? 'light' : 'dark';
  localStorage.setItem('fc_theme', theme);
  updateThemeUI(theme);
}

function updateThemeUI(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  const icon = document.getElementById('theme-icon');
  const text = document.getElementById('theme-text');
  if (!btn || !icon || !text) return;

  if (theme === 'light') {
    icon.setAttribute('data-lucide', 'moon');
    text.textContent = 'Modo Oscuro';
  } else {
    icon.setAttribute('data-lucide', 'sun');
    text.textContent = 'Modo Claro';
  }
  if (window.lucide) window.lucide.createIcons();
}

// ==================== API FETCHING ====================
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) options.body = JSON.stringify(data);
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Algo salió mal');
  }
  return response.json();
}

async function loadAllData() {
  try {
    const [arrendadores, vehiculos, clientes, contratos] = await Promise.all([
      apiCall('/api/arrendadores'),
      apiCall('/api/vehiculos'),
      apiCall('/api/clientes'),
      apiCall('/api/contratos')
    ]);
    S.arrendadores = arrendadores;
    S.vehiculos = vehiculos;
    S.clientes = clientes;
    S.contratos = contratos;
  } catch (err) {
    toast(`Error al cargar datos: ${err.message}`, false);
  }
}

// ==================== NAVIGATION ====================
function goPage(pageName) {
  S.page = pageName;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('nb-' + pageName);
  if (activeBtn) activeBtn.classList.add('active');
  renderPage();
}

async function renderPage() {
  await loadAllData();
  const container = document.getElementById('main-content');
  
  const pages = {
    dashboard: renderDashboard,
    contratos: renderContratos,
    clientes: renderClientes,
    vehiculos: renderVehiculos,
    arrendadores: renderArrendadores
  };
  
  container.innerHTML = (pages[S.page] || renderDashboard)();
  
  if (S.page === 'contratos') {
    calcDev();
  } else if (S.page === 'vehiculos') {
    loadVehicleThumbnails();
  } else if (S.page === 'dashboard') {
    loadDashboardThumbnails();
  }

  // Automatically parse Lucide Icon tags
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==================== IA VEHICLE IMAGES ====================
const COLOR_MAP = {
  CELESTE:'light sky blue', AZUL:'blue', ROJO:'red', NEGRO:'black', BLANCO:'white',
  GRIS:'gray', PLATA:'silver', VERDE:'green', AMARILLO:'yellow', NARANJA:'orange',
  CAFE:'brown', VINO:'burgundy', DORADO:'gold', BEIGE:'beige', NEGRA: 'black'
};

function vehImageKey(v, angle) {
  return `${(v.marca||'').toUpperCase()}_${(v.modelo||'').toUpperCase()}_${v.año||''}_${(v.color||'').toUpperCase()}_${angle}`;
}

function colorToEnglish(color) {
  const c = (color||'').toUpperCase().trim();
  return COLOR_MAP[c] || c.toLowerCase();
}

function detectVehicleType(v) {
  const modelo = (v.modelo || '').toUpperCase();
  const marca = (v.marca || '').toUpperCase();

  const pickups = ['RICH 6','RICH6','RICH 5','RICH5','RICH 3','RICH3','D-MAX','DMAX','D MAX','RANGER','HILUX','FRONTIER','AMAROK','NAVARA','L200','TRITON','COLORADO','SILVERADO','F-150','F150','TUNDRA','RAM 1500','RODEO','BT-50','BT50','MIGHTY-X','MIGHTYX','POER','CANNON','WOLF', 'TERRALORD'];
  const suvs = ['TIGGO 2','TIGGO2','TIGGO 3','TIGGO3','TIGGO 4','TIGGO4','TIGGO 5','TIGGO5','TIGGO 7','TIGGO7','TIGGO 8','TIGGO8','TIGGO 9','TIGGO9','TIGGO 2 PRO','TIGGO 4 PRO','TIGGO 8 PRO','OMODA','ARRIZO','HAVAL H2','HAVAL H6','HAVAL','JOLION','DUSTER','CAPTUR','KADJAR','KWID','TERRANO','RAV4','CR-V','CRV','HR-V','HRV','PILOT','PASSPORT','TUCSON','SANTA FE','KONA','VENUE','CRETA','IX35','FORESTER','OUTBACK','XV','CROSSTREK','ECOSPORT','ESCAPE','EDGE','EXPLORER','BRONCO','TRAILBLAZER','EQUINOX','TRAVERSE','BLAZER','SPORTAGE','SORENTO','SELTOS','STONIC','TELLURIDE','C-HR','CHR','RAV','PRADO','4RUNNER','TERRACROSS','GRAND VITARA','VITARA','ATOS','MG ZS','ZS','MG HS','HS','MG RX5','CHANGAN CS35','CS35','CHANGAN CS55','CS55','CHANGAN CS75','CS75','GEELY COOLRAY','COOLRAY','EMGRAND X7','JUKE','QASHQAI','KICKS','PATHFINDER','MURANO','ROGUE','S500','AX7','AX5','AX4','T-ROC','TROC','TIGUAN','TOUAREG','RX','NX','UX','GX','LX','X1','X3','X5','X6','X7','GLC','GLE','GLA','GLB','Q3','Q5','Q7'];
  const vans = ['SIENNA','ODYSSEY','CARNIVAL','SEDONA','VOYAGER','TRANSPORTER','CARAVELLE','MULTIVAN','TRANSIT','EXPRESS','HIACE','H-1','H1','STAREX'];
  const hatches = ['SPARK','AVEO','SAIL','ONIX','HB20','SWIFT','ALTO','BALENO','CELERIO','IGNIS','FIESTA','FOCUS','POLO','GOLF','GETZ','YARIS HB','MARCH','TIIDA','VERSA NOTE','i10','i20','208','308','205','206','207','A1','A2','A3 SPORTBACK','UP'];

  for (const p of pickups) { if (modelo.includes(p)) return 'pickup truck'; }
  for (const s of suvs) { if (modelo.includes(s)) return 'SUV crossover'; }
  for (const va of vans) { if (modelo.includes(va)) return 'minivan'; }
  for (const h of hatches) { if (modelo.includes(h)) return 'hatchback'; }
  if (['DONGFENG','FOTON','JMC','JAC','ISUZU'].includes(marca) && (modelo.includes('RICH') || modelo.includes('TERRALORD'))) {
    return 'pickup truck';
  }
  return 'sedan';
}

function buildImagePrompt(v, angle) {
  const year = v.año || '2020';
  const brand = v.marca || 'car';
  const model = v.modelo || '';
  const color = colorToEnglish(v.color);
  const bodyType = detectVehicleType(v);
  const view = angle === 'rear'
    ? 'rear three quarter view showing back and tail lights'
    : 'three quarter front view showing front grille and side profile';
  return `Professional automotive studio photograph, ${year} ${brand} ${model} ${bodyType}, ${color} paint color, ${view}, clean white studio background, realistic high quality car photo, sharp details, no people, no text, no watermark`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fetchVehicleImage(v, angle = 'front') {
  const key = vehImageKey(v, angle);
  if (S.imageCache[key]) return S.imageCache[key];
  const prompt = encodeURIComponent(buildImagePrompt(v, angle));
  const seed = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `https://image.pollinations.ai/prompt/${prompt}?width=800&height=450&nologo=true&seed=${seed}`;
}

async function fetchVehicleImages(v) {
  const img1 = v.img1 || fetchVehicleImage(v, 'front');
  const img2 = v.img2 || fetchVehicleImage(v, 'rear');
  return { img1, img2 };
}

// ==================== VEHICLE THUMBNAILS LOADING ====================
function loadVehicleThumbnails() {
  for (const v of S.vehiculos) {
    const img = document.getElementById('thumb_' + v.id);
    if (!img) continue;
    img.onload = img.onerror = () => {
      img.parentElement.classList.remove('skeleton');
    };
    img.src = v.img1 || fetchVehicleImage(v, 'front');
    if (img.complete) {
      img.parentElement.classList.remove('skeleton');
    }
  }
}

function loadDashboardThumbnails() {
  for (const v of S.vehiculos) {
    const img = document.getElementById('dash_thumb_' + v.id);
    if (!img) continue;
    img.onload = img.onerror = () => {
      img.parentElement.classList.remove('skeleton');
    };
    img.src = v.img1 || fetchVehicleImage(v, 'front');
    if (img.complete) {
      img.parentElement.classList.remove('skeleton');
    }
  }
}

// ==================== INTERACTIVE LOADING / TOASTS ====================
function showLoading(msg) {
  document.getElementById('loading-overlay')?.remove();
  const el = document.createElement('div');
  el.id = 'loading-overlay';
  el.className = 'loading-overlay';
  el.innerHTML = `<div class="spinner"></div><p>${msg}</p>`;
  document.body.appendChild(el);
}

function hideLoading() {
  document.getElementById('loading-overlay')?.remove();
}

function toast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderColor = ok ? 'var(--green)' : '#ef4444';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(20px)';
    setTimeout(() => t.remove(), 400);
  }, 3200);
}

// Check if a vehicle is currently rented by checking if there's an active contract
function isVehicleRented(placa) {
  return S.contratos.some(c => c.placa === placa);
}

// ==================== DASHBOARD VIEW (UPGRADED) ====================
function renderDashboard() {
  const totalIngresos = S.contratos.reduce((s, c) => s + (parseFloat(c.precio || 0) * parseInt(c.dias || 1)), 0);
  
  // Format clean list of contracts
  const contratosHTML = S.contratos.length === 0 
    ? `<div class="empty">
         <i data-lucide="inbox"></i>
         <p>Sin contratos registrados.<br>Crea uno nuevo para iniciar las operaciones.</p>
       </div>`
    : `<div style="overflow-x:auto;">
         <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
           <thead>
             <tr style="border-bottom:1px solid var(--border); color:var(--text-secondary);">
               <th style="padding:12px 8px; font-weight:600;">Cliente</th>
               <th style="padding:12px 8px; font-weight:600;">Vehículo</th>
               <th style="padding:12px 8px; font-weight:600;">Fecha</th>
               <th style="padding:12px 8px; font-weight:600; text-align:right;">Monto</th>
             </tr>
           </thead>
           <tbody>
             ${S.contratos.slice(0, 5).map(c => `
               <tr style="border-bottom:1px solid var(--border); transition: var(--transition);" class="table-row-hover">
                 <td style="padding:12px 8px; font-weight:600; color:#fff;">${c.cliente}</td>
                 <td style="padding:12px 8px; color:var(--text-muted);">${c.marca} ${c.modelo} · <span class="badge badge-placa">${c.placa}</span></td>
                 <td style="padding:12px 8px; color:var(--text-secondary);">${c.fecha}</td>
                 <td style="padding:12px 8px; font-weight:700; text-align:right; color:var(--green);">$${parseFloat(c.precio) * parseInt(c.dias)}</td>
               </tr>
             `).join('')}
           </tbody>
         </table>
       </div>`;

  return `
  <!-- Metrics Grid -->
  <div class="stats">
    <div class="stat">
      <div class="stat-icon-wrap"><i data-lucide="file-text"></i></div>
      <div class="stat-data">
        <div class="stat-num">${S.contratos.length}</div>
        <div class="stat-label">Contratos</div>
      </div>
    </div>
    <div class="stat">
      <div class="stat-icon-wrap"><i data-lucide="users"></i></div>
      <div class="stat-data">
        <div class="stat-num">${S.clientes.length}</div>
        <div class="stat-label">Clientes</div>
      </div>
    </div>
    <div class="stat">
      <div class="stat-icon-wrap"><i data-lucide="car"></i></div>
      <div class="stat-data">
        <div class="stat-num">${S.vehiculos.length}</div>
        <div class="stat-label">Vehículos</div>
      </div>
    </div>
    <div class="stat">
      <div class="stat-icon-wrap"><i data-lucide="dollar-sign"></i></div>
      <div class="stat-data">
        <div class="stat-num">$${totalIngresos.toLocaleString()}</div>
        <div class="stat-label">Ingresos Est.</div>
      </div>
    </div>
  </div>
  
  <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
    <!-- Recent Contracts Card -->
    <div class="card" style="margin-bottom:0;">
      <div class="card-header"><div class="card-title"><i data-lucide="clock"></i> Contratos Recientes</div></div>
      ${contratosHTML}
    </div>
    
    <!-- Quick Actions Card -->
    <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; gap:16px;">
      <div class="card-header"><div class="card-title"><i data-lucide="zap"></i> Acciones Rápidas</div></div>
      <p style="font-size:13.5px; color:var(--text-muted); line-height:1.5; margin-bottom:8px;">
        Accede directamente a los módulos principales para registrar clientes, vehículos o emitir un nuevo contrato.
      </p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:auto;">
        <button class="btn btn-primary btn-lg" onclick="goPage('contratos')">
          <i data-lucide="file-plus"></i> Nuevo Contrato
        </button>
        <button class="btn btn-secondary btn-lg" onclick="goPage('vehiculos')">
          <i data-lucide="plus"></i> Registrar Vehículo
        </button>
      </div>
    </div>
  </div>
  
  <!-- Fleet Vehicles Redesigned Grid -->
  <div class="card">
    <div class="card-header"><div class="card-title"><i data-lucide="layers"></i> Flota de Vehículos</div></div>
    <div class="vehicle-grid">
      ${S.vehiculos.map(v => {
        const rented = isVehicleRented(v.placa);
        const statusBadge = rented 
          ? `<span class="badge badge-inactive">Alquilado</span>` 
          : `<span class="badge badge-active">Disponible</span>`;
        return `
          <div class="vehicle-card">
            <div class="vehicle-card-img-wrap skeleton">
              <img id="dash_thumb_${v.id}" class="vehicle-card-img" alt="${v.marca} ${v.modelo}" src="data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'110\'><rect fill=\'transparent\' width=\'200\' height=\'110\'/></svg>')}">
              <div class="vehicle-card-overlay">
                <div class="vehicle-card-overlay-title">${v.marca} ${v.modelo}</div>
              </div>
              <div class="vehicle-card-badge-wrap">
                <span class="badge badge-placa">${v.placa}</span>
                ${statusBadge}
              </div>
            </div>
            <div class="vehicle-card-content">
              <div class="vehicle-card-info-row">
                <span>Color</span>
                <span style="font-weight:600; color:var(--text-main);">${v.color}</span>
              </div>
              <div class="vehicle-card-info-row">
                <span>Año</span>
                <span style="font-weight:600; color:var(--text-main);">${v.año}</span>
              </div>
              <div class="vehicle-card-info-row">
                <span>Motor</span>
                <span style="font-weight:600; color:var(--text-main);">${v.motor || 'N/A'}</span>
              </div>
            </div>
            <div class="vehicle-card-footer">
              <button class="btn btn-secondary btn-block" onclick="goPage('vehiculos')">
                <i data-lucide="info"></i> Ver Detalles
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>`;
}

// ==================== CONTRATOS VIEW ====================
function renderContratos() {
  const dOpts = S.arrendadores.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
  const cListOpts = S.clientes.map(c => `<option value="${c.nombres} (${c.cedula})"></option>`).join('');
  const vOpts = `<option value="">— Seleccione Vehículo —</option>` + S.vehiculos.map(v => `<option value="${v.id}">${v.marca} ${v.modelo} · ${v.placa}</option>`).join('');
  const today = new Date().toISOString().split('T')[0];
  const ckHtml = CHECKLIST_ITEMS.map(it => `
    <div class="ck-row">
      <span>${it}</span>
      <select class="ck-item" data-name="${it}">
        <option value="OK">✓ OK</option>
        <option value="NO">✗ NO</option>
        <option value="N/A">N/A</option>
      </select>
    </div>`).join('');

  return `
  <div class="page-header">
    <div class="page-title"><i data-lucide="file-text" style="width:24px; height:24px; vertical-align:middle; margin-right:8px; stroke-width:2.5px;"></i>Generación de Contratos</div>
    <div class="page-sub">Rellena la información del arriendo vehicular</div>
  </div>
  <div style="display:grid;grid-template-columns:1.20fr 0.80fr;gap:24px;">
    <div>
      <div class="card">
        <div class="card-header-with-sub">
          <div class="card-title"><i data-lucide="file-plus"></i> Detalles del Contrato</div>
          <span class="card-subtitle">Complete la información para generar el contrato.</span>
        </div>
        
        <div class="form-grid-layout">
          <!-- Row 1 -->
          <div class="form-group">
            <label><i data-lucide="building" class="form-label-icon"></i> Arrendador (Dueño)</label>
            <select id="c_due">${dOpts}</select>
          </div>
          <div class="form-group">
            <label><i data-lucide="user" class="form-label-icon"></i> Cliente (Arrendatario)</label>
            <input type="text" id="c_cli_autocomplete" list="clientes-list" placeholder="Escriba nombre o cédula..." oninput="onClientAutocomplete(this.value)">
            <datalist id="clientes-list">${cListOpts}</datalist>
            <input type="hidden" id="c_cli" value="">
          </div>
          
          <!-- Row 2 -->
          <div class="form-group">
            <label><i data-lucide="car" class="form-label-icon"></i> Vehículo</label>
            <select id="c_veh">${vOpts}</select>
          </div>
          <div class="form-group">
            <label><i data-lucide="dollar-sign" class="form-label-icon"></i> Precio / Día ($)</label>
            <input type="number" id="c_precio" value="80" min="1">
          </div>
          
          <!-- Row 3 -->
          <div class="form-group">
            <label><i data-lucide="calendar-days" class="form-label-icon"></i> Días de Alquiler</label>
            <input type="number" id="c_dias" value="2" min="1" oninput="calcDev()">
          </div>
          <div class="form-group">
            <label><i data-lucide="milestone" class="form-label-icon"></i> Km Salida</label>
            <input type="number" id="c_km" placeholder="Km">
          </div>
          
          <!-- Row 4 -->
          <div class="form-group">
            <label><i data-lucide="calendar" class="form-label-icon"></i> Fecha Salida</label>
            <input type="date" id="c_fecha" value="${today}" onchange="calcDev()">
          </div>
          <div class="form-group">
            <label><i data-lucide="clock" class="form-label-icon"></i> Hora Salida</label>
            <input type="time" id="c_hora" value="08:00" onchange="calcDev()">
          </div>
          
          <!-- Dev Box -->
          <div class="dev-box" style="grid-column: span 2;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; color:var(--gold); font-weight:700; font-size:13px;">
              <i data-lucide="calendar" style="width:15px; height:15px;"></i>
              <span>Fecha y Hora de Devolución Estimada</span>
            </div>
            <div class="grid-2">
              <div class="form-group" style="margin:0"><label>Fecha</label><input type="date" id="c_fecha_dev" readonly></div>
              <div class="form-group" style="margin:0"><label>Hora</label><input type="time" id="c_hora_dev" readonly></div>
            </div>
          </div>
          
          <!-- Combustible -->
          <div class="form-group">
            <label><i data-lucide="fuel" class="form-label-icon"></i> Combustible Salida</label>
            <select id="c_fuel">
              <option value="E">E – Vacío</option>
              <option value="1/4">1/4</option>
              <option value="1/2" selected>1/2</option>
              <option value="3/4">3/4</option>
              <option value="F">F – Lleno</option>
            </select>
          </div>
          
          <!-- Daños / Golpes Button Selector -->
          <div class="form-group" style="grid-column: span 2;">
            <label><i data-lucide="shield-alert" class="form-label-icon"></i> Daños/Golpes Observados</label>
            <div class="damage-selector-wrap">
              <button type="button" class="damage-opt-btn active" data-val="Sin daños" onclick="selectDamage(this)">
                <i data-lucide="check-circle-2"></i> Sin daños
              </button>
              <button type="button" class="damage-opt-btn" data-val="Rayones" onclick="selectDamage(this)">
                <i data-lucide="alert-circle"></i> Rayones
              </button>
              <button type="button" class="damage-opt-btn" data-val="Golpe leve" onclick="selectDamage(this)">
                <i data-lucide="alert-octagon"></i> Golpe leve
              </button>
              <button type="button" class="damage-opt-btn" data-val="Otro" onclick="selectDamage(this)">
                <i data-lucide="edit-3"></i> Otro
              </button>
            </div>
            <input type="hidden" id="c_golpes" value="Sin daños">
            <div id="damage-custom-wrap" style="display:none; margin-top:10px;">
              <textarea id="c_golpes_custom" rows="2" placeholder="Escriba detalladamente los rayones, abolladuras o golpes observados..."></textarea>
            </div>
          </div>
          
          <!-- Observaciones -->
          <div class="form-group" style="grid-column: span 2; margin-bottom: 0;">
            <label><i data-lucide="message-square" class="form-label-icon"></i> Observaciones</label>
            <textarea id="c_obs" rows="2" placeholder="Opcional..."></textarea>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom:16px;"><i data-lucide="check-square"></i> Check-List de Control</div>
        <div class="ck-grid">${ckHtml}</div>
      </div>

      <button class="btn btn-primary btn-lg btn-block" onclick="generarPDF()" id="btn-pdf">
        <i data-lucide="download-cloud"></i>
        Generar Contrato PDF
      </button>
    </div>

    <div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i data-lucide="history"></i> Historial de Contratos</div></div>
        ${S.contratos.length === 0 ? `<div class="empty"><i data-lucide="archive"></i><p>Aún no hay contratos en el historial.</p></div>` :
        S.contratos.map(c => `
          <div class="contrato-row">
            <div>
              <div class="item-name">${c.cliente}</div>
              <div class="item-sub">${c.marca || ''} ${c.modelo || ''} · ${c.placa}</div>
              <div class="item-sub" style="margin-top:6px; color:var(--text-main); font-weight: 600;">
                $${c.precio}/día × ${c.dias} días = $${parseFloat(c.precio)*parseInt(c.dias)}
              </div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="delContrato('${c.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function calcDev() {
  const dias = parseInt(document.getElementById('c_dias')?.value) || 0;
  const fechaSal = document.getElementById('c_fecha')?.value;
  const horaSal = document.getElementById('c_hora')?.value || '08:00';
  if (fechaSal && dias > 0) {
    const [y, m, d] = fechaSal.split('-');
    const f = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    f.setDate(f.getDate() + dias);
    document.getElementById('c_fecha_dev').value = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
  }
  if (document.getElementById('c_hora_dev')) {
    document.getElementById('c_hora_dev').value = horaSal;
  }
}

async function delContrato(id) {
  if (confirm('¿Eliminar este contrato del historial?')) {
    try {
      await apiCall(`/api/contratos/${id}`, 'DELETE');
      toast('Contrato eliminado.');
      renderPage();
    } catch(err) {
      toast(`Error: ${err.message}`, false);
    }
  }
}

// ==================== CLIENTES VIEW ====================
function renderClientes() {
  const list = S.clientes.map(c => `
    <div class="list-item">
      <div>
        <div class="item-name">${c.nombres}</div>
        <div class="item-sub">
          <span>C.I. ${c.cedula}</span> · 
          <span>📱 ${c.telefono}</span> · 
          <span>📍 ${c.ciudad}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="editCliente('${c.id}')"><i data-lucide="edit-3"></i></button>
        <button class="btn btn-danger" onclick="delCliente('${c.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`).join('');

  return `
  <div class="page-header">
    <div class="page-title"><i data-lucide="users" style="width:24px; height:24px; vertical-align:middle; margin-right:8px; stroke-width:2.5px;"></i>Clientes</div>
    <div class="page-sub">Directorio de arrendatarios registrados</div>
  </div>
  <div class="card">
    <div class="card-header">
      <div class="card-title">Listado de Clientes (${S.clientes.length})</div>
      <button class="btn btn-primary" onclick="modalCliente()">
        <i data-lucide="plus"></i> Nuevo Cliente
      </button>
    </div>
    ${S.clientes.length === 0 ? `<div class="empty"><i data-lucide="users"></i><p>No hay clientes registrados.</p></div>` : list}
  </div>`;
}

function modalCliente(id) {
  const ex = id ? S.clientes.find(x => x.id === id) : null;
  const v = ex || { nombres: '', cedula: '', telefono: '', ciudad: 'MANTA', refLaboral: '', telLaboral: '', refPersonal: '', telPersonal: '' };
  
  const html = `
  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-title">${ex ? 'Editar' : 'Registrar'} Cliente</div>
      <div class="form-group">
        <label>Nombres Completos (APELLIDOS NOMBRES)</label>
        <input id="f_nom" value="${v.nombres}" style="text-transform:uppercase" oninput="this.value=this.value.toUpperCase()">
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Cédula</label><input id="f_ced" value="${v.cedula}"></div>
        <div class="form-group"><label>Celular</label><input id="f_tel" value="${v.telefono}"></div>
      </div>
      <div class="form-group">
        <label>Ciudad</label>
        <input id="f_ciu" value="${v.ciudad}" oninput="this.value=this.value.toUpperCase()">
      </div>
      <hr style="margin:16px 0; border-color:var(--border);">
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:14px; font-weight:700;">REFERENCIAS (OPCIONAL)</div>
      <div class="grid-2">
        <div class="form-group"><label>Referencia Laboral</label><input id="f_rl" value="${v.refLaboral}"></div>
        <div class="form-group"><label>Teléfono Laboral</label><input id="f_tl" value="${v.telLaboral}"></div>
        <div class="form-group"><label>Referencia Personal</label><input id="f_rp" value="${v.refPersonal}"></div>
        <div class="form-group"><label>Teléfono Personal</label><input id="f_tp" value="${v.telPersonal}"></div>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="guardarCliente('${id || ''}')">Guardar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  if (window.lucide) window.lucide.createIcons();
}

function editCliente(id) {
  modalCliente(id);
}

async function guardarCliente(id) {
  const nom = document.getElementById('f_nom').value.toUpperCase();
  const ced = document.getElementById('f_ced').value;
  if (!nom || !ced) {
    alert('Nombres y Cédula son obligatorios');
    return;
  }
  
  const obj = {
    id: id || 'c' + Date.now(),
    nombres: nom,
    cedula: ced,
    telefono: document.getElementById('f_tel').value,
    ciudad: document.getElementById('f_ciu').value.toUpperCase(),
    refLaboral: document.getElementById('f_rl').value,
    telLaboral: document.getElementById('f_tl').value,
    refPersonal: document.getElementById('f_rp').value,
    telPersonal: document.getElementById('f_tp').value
  };

  try {
    if (id) {
      await apiCall(`/api/clientes/${id}`, 'PUT', obj);
    } else {
      await apiCall('/api/clientes', 'POST', obj);
    }
    closeModal();
    toast('Cliente guardado.');
    renderPage();
  } catch (err) {
    toast(`Error: ${err.message}`, false);
  }
}

async function delCliente(id) {
  if (confirm('¿Eliminar este cliente?')) {
    try {
      await apiCall(`/api/clientes/${id}`, 'DELETE');
      toast('Cliente eliminado.');
      renderPage();
    } catch(err) {
      toast(`Error: ${err.message}`, false);
    }
  }
}

// ==================== VEHÍCULOS VIEW ====================
function renderVehiculos() {
  const placeholder = encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'52\'><rect fill=\'#1e293b\' width=\'80\' height=\'52\'/></svg>');
  const list = S.vehiculos.map(v => `
    <div class="list-item">
      <div class="veh-row">
        <div class="skeleton" style="width:64px; height:42px; border-radius:var(--radius-sm); overflow:hidden;">
          <img class="veh-thumb" id="thumb_${v.id}" alt="${v.marca} ${v.modelo}" src="data:image/svg+xml,${placeholder}">
        </div>
        <div>
          <div class="item-name">${v.marca} ${v.modelo} <span class="badge badge-placa">${v.placa}</span></div>
          <div class="item-sub">${v.color} · ${v.año} · Motor: ${v.motor || 'N/A'}</div>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary" title="Regenerar imagen IA" onclick="regenerarImagen('${v.id}')"><i data-lucide="refresh-cw"></i></button>
        <button class="btn btn-secondary" onclick="editVehiculo('${v.id}')"><i data-lucide="edit-3"></i></button>
        <button class="btn btn-danger" onclick="delVehiculo('${v.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`).join('');

  return `
  <div class="page-header">
    <div class="page-title"><i data-lucide="car" style="width:24px; height:24px; vertical-align:middle; margin-right:8px; stroke-width:2.5px;"></i>Vehículos</div>
    <div class="page-sub">Flota vehicular registrada</div>
  </div>
  <div class="card">
    <div class="card-header">
      <div class="card-title">Vehículos (${S.vehiculos.length})</div>
      <button class="btn btn-primary" onclick="modalVehiculo()">
        <i data-lucide="plus"></i> Nuevo Vehículo
      </button>
    </div>
    ${S.vehiculos.length === 0 ? `<div class="empty"><i data-lucide="car"></i><p>No hay vehículos registrados.</p></div>` : list}
  </div>`;
}

async function regenerarImagen(id) {
  const v = S.vehiculos.find(x => x.id === id);
  if (!v) return;
  showLoading('Generando imágenes premium con IA…');
  try {
    delete S.imageCache[vehImageKey(v, 'front')];
    delete S.imageCache[vehImageKey(v, 'rear')];
    saveImageCache();
    await fetchVehicleImages(v, true);
    hideLoading();
    toast('Imágenes de IA generadas.');
    renderPage();
  } catch(e) {
    hideLoading();
    toast('Error al generar imágenes IA.', false);
  }
}

function modalVehiculo(id) {
  const ex = id ? S.vehiculos.find(x => x.id === id) : null;
  const v = ex || { placa: '', marca: '', modelo: '', año: 2023, color: '', motor: '', chasis: '', img1: '', img2: '' };
  
  const html = `
  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-title">${ex ? 'Editar' : 'Registrar'} Vehículo</div>
      <div class="grid-2">
        <div class="form-group"><label>Placa</label><input id="vf_placa" value="${v.placa}" oninput="this.value=this.value.toUpperCase()"></div>
        <div class="form-group"><label>Marca</label><input id="vf_marca" value="${v.marca}" oninput="this.value=this.value.toUpperCase()"></div>
        <div class="form-group"><label>Modelo</label><input id="vf_modelo" value="${v.modelo}" oninput="this.value=this.value.toUpperCase()"></div>
        <div class="form-group"><label>Año</label><input type="number" id="vf_año" value="${v.año}" min="1995" max="2035"></div>
        <div class="form-group"><label>Color</label><input id="vf_color" value="${v.color}" oninput="this.value=this.value.toUpperCase()"></div>
        <div class="form-group"><label>Motor</label><input id="vf_motor" value="${v.motor}"></div>
      </div>
      <div class="form-group"><label>Chasis (Opcional)</label><input id="vf_chasis" value="${v.chasis}"></div>
      
      <div style="background:var(--bg-app); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin-top:8px;">
        <div style="font-size:12px; color:var(--text-muted); font-weight:700; margin-bottom:8px;">IMÁGENES DEL VEHÍCULO</div>
        <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5; margin-bottom:12px;">Se auto-generarán imágenes premium usando Inteligencia Artificial según la marca, modelo y color del carro. Opcionalmente puedes pegar URLs personalizadas:</p>
        <div class="form-group"><label>URL Imagen Delantera</label><input id="vf_img1" value="${v.img1}" placeholder="Dejar vacío para usar IA"></div>
        <div class="form-group"><label>URL Imagen Trasera</label><input id="vf_img2" value="${v.img2}" placeholder="Dejar vacío para usar IA"></div>
      </div>
      
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="guardarVehiculo('${id || ''}')">Guardar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  if (window.lucide) window.lucide.createIcons();
}

function editVehiculo(id) {
  modalVehiculo(id);
}

async function guardarVehiculo(id) {
  const placa = document.getElementById('vf_placa').value.toUpperCase();
  const marca = document.getElementById('vf_marca').value.toUpperCase();
  const modelo = document.getElementById('vf_modelo').value.toUpperCase();
  
  if (!placa || !marca || !modelo) {
    alert('Placa, Marca y Modelo son obligatorios');
    return;
  }
  
  const obj = {
    id: id || 'v' + Date.now(),
    placa,
    marca,
    modelo,
    año: parseInt(document.getElementById('vf_año').value),
    color: document.getElementById('vf_color').value.toUpperCase(),
    motor: document.getElementById('vf_motor').value,
    chasis: document.getElementById('vf_chasis').value,
    img1: document.getElementById('vf_img1').value,
    img2: document.getElementById('vf_img2').value
  };

  try {
    if (id) {
      await apiCall(`/api/vehiculos/${id}`, 'PUT', obj);
    } else {
      await apiCall('/api/vehiculos', 'POST', obj);
    }
    closeModal();
    toast('Vehículo guardado.');
    renderPage();
  } catch (err) {
    toast(`Error: ${err.message}`, false);
  }
}

async function delVehiculo(id) {
  if (confirm('¿Eliminar este vehículo de la flota?')) {
    try {
      await apiCall(`/api/vehiculos/${id}`, 'DELETE');
      toast('Vehículo eliminado.');
      renderPage();
    } catch(err) {
      toast(`Error: ${err.message}`, false);
    }
  }
}

// ==================== ARRENDADORES VIEW ====================
function renderArrendadores() {
  const list = S.arrendadores.map(a => `
    <div class="list-item">
      <div>
        <div class="item-name">${a.nombre}</div>
        <div class="item-sub">C.I. ${a.cedula} · RUC: ${a.ruc || 'N/A'} · 📱 ${a.celular}</div>
        <div class="item-sub" style="margin-top:4px;">📍 ${a.direccion} · ✉️ ${a.email}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-secondary" onclick="editArrendador('${a.id}')"><i data-lucide="edit-3"></i></button>
        <button class="btn btn-danger" onclick="delArrendador('${a.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`).join('');

  return `
  <div class="page-header">
    <div class="page-title"><i data-lucide="building" style="width:24px; height:24px; vertical-align:middle; margin-right:8px; stroke-width:2.5px;"></i>Arrendadores</div>
    <div class="page-sub">Dueños de los vehículos de la flota</div>
  </div>
  <div class="card">
    <div class="card-header">
      <div class="card-title">Arrendadores registrados (${S.arrendadores.length})</div>
      <button class="btn btn-primary" onclick="modalArrendador()">
        <i data-lucide="plus"></i> Nuevo Arrendador
      </button>
    </div>
    ${S.arrendadores.length === 0 ? `<div class="empty"><i data-lucide="building"></i><p>No hay arrendadores registrados.</p></div>` : list}
  </div>`;
}

function modalArrendador(id) {
  const ex = id ? S.arrendadores.find(x => x.id === id) : null;
  const v = ex || { nombre: '', cedula: '', ruc: '', direccion: '', celular: '', email: '' };
  
  const html = `
  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-title">${ex ? 'Editar' : 'Registrar'} Arrendador</div>
      <div class="form-group">
        <label>Nombres Completos (APELLIDOS NOMBRES)</label>
        <input id="af_nom" value="${v.nombre}" style="text-transform:uppercase" oninput="this.value=this.value.toUpperCase()">
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Cédula</label><input id="af_ced" value="${v.cedula}"></div>
        <div class="form-group"><label>RUC</label><input id="af_ruc" value="${v.ruc}"></div>
      </div>
      <div class="form-group">
        <label>Dirección Física</label>
        <input id="af_dir" value="${v.direccion}" placeholder="Barrio Costa Azul, Manta">
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Celular</label><input id="af_cel" value="${v.celular}"></div>
        <div class="form-group"><label>Correo Electrónico</label><input id="af_email" type="email" value="${v.email}"></div>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="guardarArrendador('${id || ''}')">Guardar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  if (window.lucide) window.lucide.createIcons();
}

// ==================== CORE ACTIONS ====================
function editArrendador(id) {
  modalArrendador(id);
}

async function guardarArrendador(id) {
  const nom = document.getElementById('af_nom').value.toUpperCase();
  const ced = document.getElementById('af_ced').value;
  if (!nom || !ced) {
    alert('Nombres y Cédula son obligatorios');
    return;
  }
  
  const obj = {
    id: id || 'arr' + Date.now(),
    nombre: nom,
    cedula: ced,
    ruc: document.getElementById('af_ruc').value,
    direccion: document.getElementById('af_dir').value,
    celular: document.getElementById('af_cel').value,
    email: document.getElementById('af_email').value
  };

  try {
    if (id) {
      await apiCall(`/api/arrendadores/${id}`, 'PUT', obj);
    } else {
      await apiCall('/api/arrendadores', 'POST', obj);
    }
    closeModal();
    toast('Arrendador guardado.');
    renderPage();
  } catch (err) {
    toast(`Error: ${err.message}`, false);
  }
}

async function delArrendador(id) {
  if (S.arrendadores.length === 1) {
    alert('Debe haber al menos un arrendador registrado.');
    return;
  }
  if (confirm('¿Eliminar este arrendador?')) {
    try {
      await apiCall(`/api/arrendadores/${id}`, 'DELETE');
      toast('Arrendador eliminado.');
      renderPage();
    } catch(err) {
      toast(`Error: ${err.message}`, false);
    }
  }
}

function closeModal() {
  const m = document.getElementById('modal');
  if (m) m.remove();
}

// ==================== PDF CONTRACT EXPORT ====================
function pdfLogoBar(subtitle = '') {
  return `<div class="pdf-logo-bar">
    <div class="pdf-logo-text"><div class="ln1">FAST<span>CAR</span></div><div class="ln2">Rentadora · Manta</div></div>
    <div class="pdf-title">${subtitle || 'Contrato de Arrendamiento de Vehículo Automotor'}</div>
  </div>`;
}

function waitForImages(container) {
  const imgs = [...container.querySelectorAll('img')];
  return Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(res => {
      img.onload = img.onerror = () => res();
      setTimeout(res, 8000);
    });
  }));
}

window.generarPDF = async function() {
  const dId = document.getElementById('c_due')?.value;
  let cId = document.getElementById('c_cli')?.value;
  if (!cId) {
    const textVal = document.getElementById('c_cli_autocomplete')?.value || '';
    const matching = S.clientes.find(c => `${c.nombres} (${c.cedula})` === textVal || c.nombres === textVal);
    if (matching) cId = matching.id;
  }
  const vId = document.getElementById('c_veh')?.value;
  if (!dId || !cId || !vId) {
    toast('Selecciona Arrendador, Cliente y Vehículo.', false);
    return;
  }

  const arrD = S.arrendadores.find(x => x.id === dId);
  const cli = S.clientes.find(x => x.id === cId);
  const veh = S.vehiculos.find(x => x.id === vId);
  const precio = document.getElementById('c_precio').value || '0';
  const dias = document.getElementById('c_dias').value || '1';
  const fecha = document.getElementById('c_fecha').value;
  const hora = document.getElementById('c_hora').value || '08:00';
  const fechaDev = document.getElementById('c_fecha_dev').value || fecha;
  const horaDev = document.getElementById('c_hora_dev').value || hora;
  const km = document.getElementById('c_km').value || '_______';
  const fuel = document.getElementById('c_fuel')?.value || '1/2';
  let golpes = document.getElementById('c_golpes').value || 'Ninguno observado al momento de la entrega';
  if (golpes === 'Otro') {
    golpes = document.getElementById('c_golpes_custom')?.value || 'Ninguno observado al momento de la entrega';
  }
  const obs = document.getElementById('c_obs').value || '';

  // Save to history backend
  try {
    await apiCall('/api/contratos', 'POST', {
      id: 'ct' + Date.now(),
      cliente: cli.nombres,
      placa: veh.placa,
      marca: veh.marca,
      modelo: veh.modelo,
      precio,
      dias,
      fecha,
      dueñoNombre: arrD.nombre
    });
  } catch(err) {
    toast('Error al registrar el contrato en el historial.', false);
    return;
  }

  const btn = document.getElementById('btn-pdf');
  btn.disabled = true;
  btn.textContent = '⏳ Generando imágenes IA...';
  showLoading('Generando imágenes del vehículo con IA…');

  let aiImages = { img1: '', img2: '' };
  try {
    aiImages = await fetchVehicleImages(veh);
  } catch (e) {
    hideLoading();
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="download-cloud"></i> Generar Contrato PDF';
    if (window.lucide) window.lucide.createIcons();
    toast('No se pudieron generar todas las imágenes del vehículo.', false);
    return;
  }

  showLoading('Compilando documento PDF…');
  btn.textContent = '⏳ Generando PDF...';

  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [fy, fm, fd] = fecha.split('-');
  const fechaLarga = `${parseInt(fd)} días del mes de ${meses[parseInt(fm) - 1]} del año ${fy}`;

  let ckRows = '';
  document.querySelectorAll('.ck-item').forEach(el => {
    const ok = el.value === 'OK' ? '✓' : '';
    const no = el.value === 'NO' ? '✗' : '';
    const na = el.value === 'N/A' ? '—' : '';
    ckRows += `<tr><td>${el.dataset.name}</td><td style="text-align:center">${ok}</td><td style="text-align:center">${no}</td><td style="text-align:center">${na}</td></tr>`;
  });

  const src1 = veh.img1 || aiImages.img1;
  const src2 = veh.img2 || aiImages.img2;
  let imgHtml = '';
  if (src1 || src2) {
    imgHtml = `<div class="pdf-car-imgs">
      ${src1 ? `<img src="${src1}" crossorigin="anonymous">` : ''}
      ${src2 ? `<img src="${src2}" crossorigin="anonymous">` : ''}
    </div>`;
  }

  const formatFecha = (iso) => {
    if (!iso) return '_________';
    const [y, m, d] = iso.split('-');
    return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
  };

  const tpl = document.getElementById('contract-pdf-template');
  tpl.className = 'show';
  tpl.innerHTML = `
  <!-- PAGE 1: CONTRATO -->
  <div id="pdf-p1" style="padding:20px; background:#fff; width:794px; min-height:1080px; position:relative;">
    ${pdfLogoBar()}
    <div class="pdf-car-imgs" style="margin:12px 0 16px;">
      ${src1 ? `<img src="${src1}" style="max-height:140px; max-width:48%; object-fit:contain; border:1px solid #e5e7eb; border-radius:6px;" crossorigin="anonymous">` : ''}
      ${src2 ? `<img src="${src2}" style="max-height:140px; max-width:48%; object-fit:contain; border:1px solid #e5e7eb; border-radius:6px;" crossorigin="anonymous">` : ''}
    </div>
    <div style="font-size:10px; color:#6b7280; text-align:center; margin-bottom:12px;">${veh.marca} ${veh.modelo} ${veh.año} · ${veh.color} · Placa ${veh.placa}</div>

    <p class="pdf-section">En la ciudad de Manta, a los <span class="pdf-bold">${fechaLarga}</span>, comparece por una parte el/la señor/a <span class="pdf-bold">${arrD.nombre}</span>, portador/a de la cédula de identidad No. <span class="pdf-bold">${arrD.cedula}</span>, quien actúa en calidad de persona natural bajo el régimen RIMPE – Negocio Popular, con RUC No. <span class="pdf-bold">${arrD.ruc}</span>, a quién en adelante se le denominará <span class="pdf-bold">EL ARRENDADOR</span>; y, por otra parte, el/la SR./SRA. <span class="pdf-bold">${cli.nombres}</span>, mayor de edad, identificado/a con la cédula de ciudadanía No. <span class="pdf-bold">${cli.cedula}</span> con Licencia de Conducción Vigente, a quien en adelante se denominará <span class="pdf-bold">EL ARRENDATARIO</span>. Se ha celebrado el contrato de arrendamiento de Vehículo Automotor, que se rige por la legislación ecuatoriana y que incluye las siguientes cláusulas:</p>

    <p class="pdf-section"><span class="pdf-bold">PRIMERA. DE LAS CARACTERÍSTICAS DEL VEHÍCULO. -</span> El Arrendador entrega al Arrendatario en alquiler un Vehículo Automotor de las características siguientes:</p>
    <table class="pdf-table" style="width:50%; margin-left:20px; margin-bottom:10px;">
      <tr><td class="pdf-bold">Placa:</td><td>${veh.placa}</td><td class="pdf-bold">Marca:</td><td>${veh.marca}</td></tr>
      <tr><td class="pdf-bold">Modelo:</td><td>${veh.modelo}</td><td class="pdf-bold">Año:</td><td>${veh.año}</td></tr>
      <tr><td class="pdf-bold">Color:</td><td>${veh.color}</td><td class="pdf-bold">Motor:</td><td>${veh.motor||'N/A'}</td></tr>
    </table>

    <p class="pdf-section"><span class="pdf-bold">SEGUNDA. CONDICIONES DEL VEHÍCULO. -</span> El vehículo dado en alquiler se encuentra en perfecto estado de funcionamiento, externa e internamente; además de una llanta de emergencia y herramientas de desvare como gato, cruceta. Las demás condiciones del vehículo se verifican de acuerdo al protocolo de registro de Checklist Vehicular, Verificación de entrega-recepción, que consta adjunto al presente contrato.</p>

    <p class="pdf-section"><span class="pdf-bold">TERCERA. DEL PRECIO. -</span> El arrendamiento del vehículo automotor descrito en el punto anterior será de <span class="pdf-bold">$${precio} dólares americanos</span>, diarios, mismos que se pagarán por adelantado.</p>

    <p class="pdf-section"><span class="pdf-bold">CUARTA. VIGENCIA. -</span> Este contrato es por un plazo de <span class="pdf-bold">${dias} días</span>, pero podrá ser prorrogado de mutuo acuerdo y con la antelación que el caso amerite, debiendo el arrendatario notificar al arrendador con por lo menos cuatro horas de anticipación a la hora de vencimiento de tiempo por el que fue contratado el servicio. En caso de prórroga, el arrendatario deberá comunicar al arrendador de su deseo de extender el tiempo de arriendo a los contactos determinados y señalados en la cláusula Décima Cuarta. En caso de que el arrendatario no comunicara el retraso por causas de fuerza mayor justificable para la entrega del vehículo al arrendador con por lo menos 30 minutos antes de la hora a vencer y que el arrendador así lo aceptara, el arrendatario pagará el costo de precio al cincuenta por ciento del alquiler.</p>

    <p class="pdf-section"><span class="pdf-bold">QUINTA. DESTINACIÓN Y USO DEL VEHÍCULO. -</span> El Arrendatario destinará el vehículo automotor al transporte de su persona, de tal manera, que el arrendatario no podrá subarrendar, ni permitir que terceros lo utilicen. El Arrendatario no puede violar los límites de carga o pasajeros que establece el fabricante del vehículo automotor, así como respetar los límites de velocidades establecidos por las leyes ecuatorianas vigentes. Por tanto, El Arrendatario no podrá dedicar el vehículo a: uso distinto a los estipulados en este contrato ni brindar transporte de pasajeros de tipo servicio público; al transporte de cargas o bultos pesados, peligrosos o explosivos; a labores peligrosas o ilícitas que contravengan las leyes penales vigentes; a operaciones de remolque de cualquier clase; a participar en carreras automovilísticas, pruebas de velocidad o certámenes de cualquier tipo.</p>

    <p class="pdf-section"><span class="pdf-bold">SEXTA. CONDUCCIÓN. -</span> El vehículo será manejado por el mismo arrendatario o por quien éste delegue, quedando totalmente prohibido conducirlo: en estado de ebriedad o bajo efectos de sustancias estupefacientes; sin licencia válida expedida por las autoridades competentes; excediendo los límites de velocidad; o permitiendo que personas menores de edad lo conduzcan bajo ninguna circunstancia.</p>

    <p class="pdf-section"><span class="pdf-bold">SÉPTIMA. DE LA CUSTODIA Y TENENCIA DEL VEHÍCULO. -</span> El Arrendatario se constituye como depositario y custodio del vehículo automotor, asumiendo todas las responsabilidades civiles y penales que tal condición implica, hasta tanto proceda la debida devolución al Arrendador, conforme al protocolo de Checklist Vehicular adjunto al presente contrato.</p>

    <p class="pdf-section"><span class="pdf-bold">OCTAVA. DEVOLUCIÓN. -</span> Al finalizar el término del contrato, el Arrendatario deberá entregar el vehículo automotor en horarios de oficina de 08h00 a 18h00 de lunes a domingo, en el mismo estado en que fue recibido al momento del arriendo, salvo el desgaste natural del vehículo automotor y en el domicilio del Arrendador.</p>

    <p class="pdf-section"><span class="pdf-bold">NOVENA. RESPONSABILIDADES DEL ARRENDATARIO. -</span> Mientras esté en poder del Arrendatario el vehículo automotor, éste será responsable de: (a) cualquier daño causado al vehículo o con este sobre propiedad de terceros; (b) los daños causados a terceras personas; (c) los daños causados sobre bienes o personas transportadas en el vehículo; (d) todas las infracciones a la Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial, incluyendo multas por foto radar; (e) arreglos mecánicos o de lámina y pintura que deberá informar previamente al Arrendador.</p>

    <p class="pdf-section"><span class="pdf-bold">DÉCIMA. SEGUROS OBLIGATORIOS. -</span> El valor del seguro corresponde su pago al Arrendador, el cual tiene como obligación mantenerlo siempre vigente.</p>

    <p class="pdf-section"><span class="pdf-bold">DÉCIMA PRIMERA. INCUMPLIMIENTO. -</span> El incumplimiento de cualquier obligación o prohibición descritas en este contrato, da derecho al Arrendador a declarar rescindido el presente contrato de arrendamiento.</p>

    <p class="pdf-section"><span class="pdf-bold">DÉCIMA SEGUNDA. SUSCRIPCIÓN DE DOCUMENTO TÍTULO VALOR. -</span> El arrendatario suscribirá a favor del arrendador dos Letras de Cambio / Pagaré a la Orden: la primera por el valor e importe del vehículo, y la segunda por las multas que se generen por contravención de tránsito de foto radar; el Arrendador devolverá las mismas siempre y cuando el vehículo sea devuelto en el mismo estado en que fue entregado, estando al día en los pagos y sin existir deudas civiles, penales o de tránsito.</p>

    <p class="pdf-section"><span class="pdf-bold">DÉCIMA TERCERA. DE LA EXCLUSIÓN DE RESPONSABILIDAD. -</span> El Arrendador no se responsabilizará por la pérdida y/o extravío de cualquier objeto de valor ubicados o dejados en el automóvil arrendado una vez este haya sido entregado.</p>

    <p class="pdf-section"><span class="pdf-bold">DÉCIMA CUARTA. HORARIOS DE ATENCIÓN Y NOTIFICACIONES. -</span> El Arrendador señala que los horarios de atención quedan estipulados de 08h00 a 18h00 de lunes a domingo. Las notificaciones deberán dirigirse al Arrendador en: <span class="pdf-bold">${arrD.direccion}</span>, celular <span class="pdf-bold">${arrD.celular}</span>, y/o correo electrónico <span class="pdf-bold">${arrD.email}</span>. El Arrendatario de la ciudad de ${cli.ciudad}, teléfono: ${cli.telefono}.</p>

    <p class="pdf-section"><span class="pdf-bold">DÉCIMA QUINTA. DE LAS CONTROVERSIAS. -</span> Las partes acuerdan que en caso de conflicto derivado de este contrato, su ejecución y liquidación, se sujetará ante la competencia exclusiva de los Jueces Civiles y Mercantiles en la ciudad de Manta.</p>

    <table class="pdf-sig-table" style="margin-top:35px;">
      <tr>
        <td><div class="pdf-sig-line"></div><span class="pdf-bold">${cli.nombres}</span><br>ARRENDATARIO/A<br>C.I. ${cli.cedula}</td>
        <td><div class="pdf-sig-line"></div><span class="pdf-bold">${arrD.nombre}</span><br>ARRENDADOR<br>C.I. ${arrD.cedula}</td>
      </tr>
    </table>
  </div>

  <!-- PAGE 2: CHECK-LIST -->
  <div id="pdf-p2" style="padding:20px; background:#fff; width:794px; min-height:1080px; margin-top:10px;">
    ${pdfLogoBar('Check-List Vehicular')}
    <div style="text-align:center; font-size:11px; color:#6b7280; margin-bottom:10px;">Verificación de entrega-recepción</div>

    <table class="pdf-table" style="margin-bottom:10px;">
      <tr>
        <td style="width:50%;"><span class="pdf-bold">SALIDA</span><br>Fecha: ${formatFecha(fecha)} &nbsp; Km: ${km} &nbsp; Hora: ${hora}</td>
        <td style="width:50%;"><span class="pdf-bold">LLEGADA</span><br>Fecha: ${formatFecha(fechaDev)} &nbsp; Km: _______ &nbsp; Hora: ${horaDev}</td>
      </tr>
    </table>

    <table class="pdf-table" style="margin-bottom:10px;">
      <tr>
        <td style="width:50%;">
          <div style="font-weight:700; text-align:center; background:#e8e8e8; margin:-4px -6px 6px; padding:4px;">DATOS PERSONALES DEL CLIENTE</div>
          <b>Cliente:</b> ${cli.nombres}<br>
          <b>Cédula:</b> ${cli.cedula}<br>
          <b>Teléfono:</b> ${cli.telefono}<br>
          <b>Ref. Laboral:</b> ${cli.refLaboral||'_________________________'}<br>
          <b>Teléfono:</b> ${cli.telLaboral||'_________________________'}<br>
          <b>Ref. Personal:</b> ${cli.refPersonal||'_________________________'}<br>
          <b>Teléfono:</b> ${cli.telPersonal||'_________________________'}
        </td>
        <td style="width:50%;">
          <div style="font-weight:700; text-align:center; background:#e8e8e8; margin:-4px -6px 6px; padding:4px;">DATOS DEL VEHÍCULO</div>
          <b>Modelo:</b> ${veh.modelo}<br>
          <b>Marca:</b> ${veh.marca}<br>
          <b>Año:</b> ${veh.año}<br>
          <b>Color:</b> ${veh.color}<br>
          <b>Placa:</b> ${veh.placa}<br>
          <b>Motor:</b> ${veh.motor||'N/A'}<br>
          <b>Chasis:</b> ${veh.chasis||'N/A'}
        </td>
      </tr>
    </table>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
      <div>
        <table class="pdf-table">
          <tr><td class="th" colspan="4">PUNTOS DE VERIFICACIÓN</td></tr>
          <tr><td class="th">Ítem</td><td class="th" style="width:40px;">OK</td><td class="th" style="width:40px;">NO</td><td class="th" style="width:40px;">N/A</td></tr>
          ${ckRows}
        </table>
      </div>
      <div>
        <div style="font-weight:700; font-size:11px; text-align:center; background:#e8e8e8; padding:4px; margin-bottom:6px; border:1px solid #000;">INDICAR GOLPES O RAYONES DEL VEHÍCULO</div>
        ${imgHtml || `<div style="border:1px dashed #d1d5db; height:220px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:11px; border-radius:4px;">Generando imágenes…</div>`}
        <div style="font-size:10px; margin-top:4px;"><b>Observaciones:</b> ${golpes}</div>
        <div style="margin-top:14px; font-weight:700; font-size:11px; text-align:center; background:#e8e8e8; padding:4px; border:1px solid #000;">NIVEL DE COMBUSTIBLE</div>
        <table style="width:100%; margin-top:6px; font-size:11px;">
          <tr>
            <td style="width:50%; text-align:center; padding:4px; border:1px solid #ccc; border-radius:4px;"><b>Salida:</b> ${fuel}</td>
            <td style="width:50%; text-align:center; padding:4px; border:1px solid #ccc; border-radius:4px;"><b>Llegada:</b> _______</td>
          </tr>
        </table>
        ${obs ? `<div style="margin-top:10px; font-size:11px;"><b>Obs. adicionales:</b> ${obs}</div>` : ''}
      </div>
    </div>

    <p style="font-size:10px; text-align:justify; border:1px solid #ccc; padding:8px; border-radius:4px; margin-bottom:14px;">Declaro haber recibido el vehículo en las condiciones que mediante esta acta de entrega se indica las condiciones físicas y mecánicas del vehículo. Me comprometo a entregarlo en las mismas condiciones en horarios de oficina de 08h00 a 18h00 de lunes a domingo; y, cancelar cualquier daño o multa de tránsito que se dé mientras el vehículo esté en mi poder. Acepto y firmo este documento después de haber leído las condiciones de alquiler. La garantía será devuelta al cliente luego de 3 meses de realizado el alquiler para la respectiva revisión mecánica y de multas de tránsito de foto radar. La Rentadora no se responsabiliza por objetos olvidados en el vehículo una vez que sea devuelto.</p>

    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="width:50%; text-align:center; padding:8px; border:1px solid #ccc;"><div style="height:50px;"></div><div style="border-top:1px solid #000; width:75%; margin:0 auto 4px;"></div><b>${arrD.nombre}</b><br>ARRENDADOR<br>C.I. ${arrD.cedula}</td>
        <td style="width:50%; text-align:center; padding:8px; border:1px solid #ccc;"><div style="height:50px;"></div><div style="border-top:1px solid #000; width:75%; margin:0 auto 4px;"></div><b>${cli.nombres}</b><br>ARRENDATARIO/A<br>C.I. ${cli.cedula}</td>
      </tr>
      <tr>
        <td style="text-align:center; background:#f5f5f5; padding:6px; font-weight:700; font-size:11px; border:1px solid #ccc;">Firma a la SALIDA</td>
        <td style="text-align:center; background:#f5f5f5; padding:6px; font-weight:700; font-size:11px; border:1px solid #ccc;">Firma a la LLEGADA</td>
      </tr>
    </table>
  </div>`;

  try {
    await waitForImages(tpl);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pages = ['pdf-p1', 'pdf-p2'];
    for (let i = 0; i < pages.length; i++) {
      const el = document.getElementById(pages[i]);
      const canvas = await html2canvas(el, { scale: 1.8, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (i > 0) pdf.addPage();
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pW, h = pW / ratio;
      if (h > pH) { h = pH; w = pH * ratio; }
      const x = (pW - w) / 2, y = (pH - h) / 2;
      pdf.addImage(imgData, 'JPEG', x, y, w, h);
    }

    const fname = `Contrato_${cli.nombres.split(' ')[0]}_${veh.placa}_${fecha}.pdf`;
    pdf.save(fname);
    hideLoading();
    toast('PDF descargado correctamente.');
  } catch (err) {
    console.error(err);
    hideLoading();
    toast('Error al generar PDF.', false);
  }

  tpl.className = '';
  tpl.innerHTML = '';
  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="download-cloud"></i> Generar Contrato PDF';
  if (window.lucide) window.lucide.createIcons();
  renderPage();
};

// ==================== INITIALIZATION ====================
initTheme();
goPage('dashboard');

window.selectDamage = function(btn) {
  document.querySelectorAll('.damage-opt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const val = btn.dataset.val;
  document.getElementById('c_golpes').value = val;
  const customWrap = document.getElementById('damage-custom-wrap');
  if (val === 'Otro') {
    customWrap.style.display = 'block';
  } else {
    customWrap.style.display = 'none';
  }
};

window.onClientAutocomplete = function(val) {
  const matching = S.clientes.find(c => `${c.nombres} (${c.cedula})` === val || c.nombres === val);
  if (matching) {
    document.getElementById('c_cli').value = matching.id;
  } else {
    document.getElementById('c_cli').value = "";
  }
};
