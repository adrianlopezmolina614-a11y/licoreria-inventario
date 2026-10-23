
import './style.css'

// LICORERA LA BENDECIDA
// Inventario local en el navegador

const DB_KEY = 'la_bendecida_productos_v1'
const SALES_KEY = 'la_bendecida_ventas_v1'

let products = loadProducts()
let sales = loadSales()
let cart = []
let currentView = 'inicio'
let searchText = ''

function loadSales() {
  try {
    const data = JSON.parse(localStorage.getItem(SALES_KEY) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveSales() {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales))
}

function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]')
  } catch {
    return []
  }
}

function saveProducts() {
  localStorage.setItem(DB_KEY, JSON.stringify(products))
}

function money(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}
function productImage(product) {
  const text = `${product.name || ''} ${product.brand || ''}`.toLowerCase()

  if (/aguardiente amarillo/.test(text)) {
    return '/productos/Aguardiente amarillo 750.png'
  }

  if (/águila|aguila/.test(text)) {
    return '/productos/Aguila Lata.png'
  }

  if (/poker|póker/.test(text)) {
    return '/productos/Poker Lata.png'
  }

  if (/cerveza/.test(text)) {
    return 'https://images.unsplash.com/photo-1608270586620-248524c67de9'
  }

  if (/aguardiente|ron|whisky|vodka|tequila|licor/.test(text)) {
    return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b'
  }

  if (/vino/.test(text)) {
    return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3'
  }

  if (/agua|gaseosa|soda/.test(text)) {
    return 'https://images.unsplash.com/photo-1544145945-f90425340c7e'
  }

  if (/energizante|vive100|red bull|monster/.test(text)) {
    return 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e'
  }

  return 'https://images.unsplash.com/photo-1513558161293-cdaf765edfd4'
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])
}

function totalStock() {
  return products.reduce((sum, product) => sum + product.stock, 0)
}

function inventoryValue() {
  return products.reduce(
    (sum, product) => sum + product.stock * product.cost,
    0
  )
}

function lowStockProducts() {
  return products.filter(product => product.stock <= product.minimum)
}

function render() {
  const app = document.querySelector('#app')

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">B</div>
          <div>
            <h2>LA <span>BENDECIDA</span></h2>
            <small>Licorera · Inventario</small>
          </div>
        </div>

        <p class="section-label">MENÚ PRINCIPAL</p>

        <nav>
          ${navLink('inicio', '▦', 'Dashboard')}
          ${navLink('productos', '▤', 'Productos')}
          ${navLink('movimientos', '↔', 'Movimientos')}
          ${navLink('ventas', '$', 'Ventas')}
          ${navLink('reportes', '▥', 'Reportes')}
        </nav>

        <div class="sidebar-bottom">
          <div class="status"><span></span> Datos guardados localmente</div>
          <small>LA BENDECIDA · v1.0</small>
        </div>
      </aside>

      <main class="main">
        <header class="topbar">
          <div>
            <p class="eyebrow">LA BENDECIDA LICORERA</p>
            <h1>${pageTitle()}</h1>
            <p class="subtitle">${pageSubtitle()}</p>
          </div>
          <div class="date-chip" id="today"></div>
        </header>

        <div id="view"></div>

        <footer>LICORERA LA BENDECIDA · Inventario y ventas · COP</footer>
      </main>
    </div>
  `

  document.querySelector('#today').textContent =
    new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date())

  renderView()
  bindNavigation()
}

function navLink(id, icon, label) {
  return `
    <a href="#${id}"
       class="nav-link ${currentView === id ? 'active' : ''}"
       data-view="${id}">
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
    </a>
  `
}

function pageTitle() {
  const titles = {
    inicio: 'Dashboard',
    productos: 'Productos',
    movimientos: 'Movimientos',
    ventas: 'Ventas',
    reportes: 'Reportes'
  }
  return titles[currentView] || 'Dashboard'
}

function pageSubtitle() {
  const subtitles = {
    inicio: 'Resumen general de tu negocio',
    productos: 'Administra tus bebidas y existencias',
    movimientos: 'Consulta entradas y ajustes de inventario',
    ventas: 'Consulta el registro de ventas',
    reportes: 'Resumen de inventario y rentabilidad'
  }
  return subtitles[currentView] || ''
}

function renderView() {
  const view = document.querySelector('#view')

  if (currentView === 'inicio') view.innerHTML = dashboardHTML()
  if (currentView === 'productos') view.innerHTML = productsHTML()
  if (currentView === 'movimientos') view.innerHTML = movementsHTML()
  if (currentView === 'ventas') view.innerHTML = salesHTML()
  if (currentView === 'reportes') view.innerHTML = reportsHTML()

  bindViewEvents()
}

function dashboardHTML() {
  const low = lowStockProducts()

  return `
    <section class="stats">
      ${statCard('Productos registrados', products.length, 'Catálogo')}
      ${statCard('Unidades disponibles', totalStock(), 'Existencias totales')}
      ${statCard('Valor del inventario', money(inventoryValue()), 'A costo de compra')}
      ${statCard('Stock bajo', low.length, 'Productos por revisar', true)}
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>Accesos rápidos</h2>
            <p>Administra tu licorera</p>
          </div>
        </div>
        <div class="quick-actions">
          <button class="primary-btn" data-action="new-product">＋ Agregar producto</button>
          <button data-view="productos">▤ Ver inventario</button>
          <button data-view="movimientos">↔ Ajustar existencias</button>
          <button data-view="reportes">▥ Consultar reportes</button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>Estado del sistema</h2>
            <p>Información de almacenamiento</p>
          </div>
        </div>
        <div class="system-row"><span class="system-dot"></span><div><b>Aplicación activa</b><small>Interfaz cargada correctamente</small></div></div>
        <div class="system-row"><span class="system-dot"></span><div><b>Moneda</b><small>Peso colombiano (COP)</small></div></div>
        <div class="system-row"><span class="system-dot"></span><div><b>Almacenamiento</b><small>Datos guardados en este navegador</small></div></div>
      </article>
    </section>

    <section class="panel recent-panel">
      <div class="panel-heading">
        <div>
          <h2>Productos con stock bajo</h2>
          <p>Se consideran bajos cuando alcanzan el mínimo configurado</p>
        </div>
        <button class="secondary-btn" data-view="productos">Ver productos →</button>
      </div>

      ${low.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
            <tbody>
              ${low.slice(0, 8).map(p => `
                <tr>
                  <td>${escapeHTML(p.name)}</td>
                  <td><span class="stock-badge">${p.stock}</span></td>
                  <td>${p.minimum}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state">
          <span>📦</span>
          <b>${products.length ? 'No hay alertas de stock bajo' : 'Todavía no hay productos'}</b>
          <p>Registra las bebidas de La Bendecida para comenzar.</p>
          <button class="primary-btn" data-action="new-product">Agregar producto</button>
        </div>
      `}
    </section>
  `
}

function statCard(label, value, description, warning = false) {
  return `
    <article class="stat-card ${warning ? 'warning' : ''}">
      <div class="stat-top"><span>${label}</span></div>
      <strong>${value}</strong>
      <small>${description}</small>
    </article>
  `
}

function productsHTML() {
  const filtered = products.filter(p => {
    const text = `${p.name} ${p.brand} ${p.category} ${p.barcode}`.toLowerCase()
    return text.includes(searchText.toLowerCase())
  })

  return `
    <section class="panel">
      <div class="toolbar">
        <input id="search-products" type="search"
          placeholder="Buscar por nombre, marca o código..."
          value="${escapeHTML(searchText)}">
        <button class="primary-btn" data-action="new-product">＋ Nuevo producto</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Presentación</th>
              <th>Stock</th>
              <th>Compra</th>
              <th>Venta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map(p => `
              <tr>
                <td><b>${escapeHTML(p.name)}</b><small class="cell-sub">${escapeHTML(p.brand || '')}</small></td>
                <td>${escapeHTML(p.category)}</td>
                <td>${escapeHTML(p.presentation)}</td>
                <td><span class="${p.stock <= p.minimum ? 'stock-badge' : 'normal-badge'}">${p.stock}</span></td>
                <td>${money(p.cost)}</td>
                <td>${money(p.price)}</td>
                <td class="actions">
                  <button class="small-btn" data-action="edit-product" data-id="${p.id}">Editar</button>
                  <button class="small-btn" data-action="adjust-stock" data-id="${p.id}">Stock</button>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="7" class="empty-cell">No hay productos para mostrar.</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <p class="table-note">Productos registrados: ${products.length}. Los datos se guardan en este navegador.</p>
    </section>
  `
}

function productFormHTML(product = null) {
  const p = product || {
    name: '',
    brand: '',
    category: 'Cerveza',
    presentation: 'Unidad',
    barcode: '',
    stock: 0,
    minimum: 3,
    cost: 0,
    price: 0
  }

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div class="modal-heading">
          <div>
            <p class="eyebrow">LA BENDECIDA</p>
            <h2 id="form-title">${product ? 'Editar producto' : 'Nuevo producto'}</h2>
          </div>
          <button class="close-btn" data-action="close-modal" aria-label="Cerrar">×</button>
        </div>

        <form id="product-form" data-id="${product?.id || ''}">
          <label>Nombre del producto *
            <input name="name" required maxlength="100" value="${escapeHTML(p.name)}" placeholder="Ej. Águila botella">
          </label>

          <div class="form-grid">
            <label>Marca
              <input name="brand" value="${escapeHTML(p.brand)}" placeholder="Ej. Águila">
            </label>
            <label>Categoría *
              <select name="category" required>
                ${['Cerveza','Licor','Gaseosa','Agua','Energizante','Pasabocas','Cigarrillos','Otros'].map(c =>
                  `<option ${p.category === c ? 'selected' : ''}>${c}</option>`
                ).join('')}
              </select>
            </label>
          </div>

          <div class="form-grid">
            <label>Presentación
              <input name="presentation" value="${escapeHTML(p.presentation)}" placeholder="Botella, litro, lata...">
            </label>
            <label>Código de barras
              <input name="barcode" value="${escapeHTML(p.barcode)}" placeholder="Opcional">
            </label>
          </div>

          <div class="form-grid">
            <label>Existencias actuales *
              <input name="stock" type="number" min="0" step="1" required value="${p.stock}">
            </label>
            <label>Stock mínimo *
              <input name="minimum" type="number" min="0" step="1" required value="${p.minimum}">
            </label>
          </div>

          <div class="form-grid">
            <label>Precio de compra (COP)
              <input name="cost" type="number" min="0" step="1" required value="${p.cost}">
            </label>
            <label>Precio de venta (COP) *
              <input name="price" type="number" min="0" step="1" required value="${p.price}">
            </label>
          </div>

          <p class="form-note">Si aún no conoces el costo de compra, puedes dejarlo en 0 y actualizarlo después.</p>

          <div class="modal-actions">
            <button type="button" class="secondary-btn" data-action="close-modal">Cancelar</button>
            <button type="submit" class="primary-btn">Guardar producto</button>
          </div>
        </form>
      </section>
    </div>
  `
}

function movementsHTML() {
  return `
    <section class="panel">
      <div class="panel-heading">
        <div>
          <h2>Ajustar existencias</h2>
          <p>Registra entradas, salidas o correcciones del inventario.</p>
        </div>
      </div>

      ${products.length ? `
        <form id="stock-form" class="stock-form">
          <label>Producto
            <select name="productId" required>
              ${products.map(p => `<option value="${p.id}">${escapeHTML(p.name)} — Stock: ${p.stock}</option>`).join('')}
            </select>
          </label>
          <div class="form-grid">
            <label>Tipo de movimiento
              <select name="type">
                <option value="entrada">Entrada de mercancía</option>
                <option value="salida">Salida o merma</option>
                <option value="devolucion">Devolución recibida</option>
                <option value="ajuste">Ajuste manual</option>
              </select>
            </label>
            <label>Cantidad
              <input name="quantity" type="number" min="1" step="1" required>
            </label>
          </div>
          <label>Motivo
            <input name="reason" required maxlength="150" placeholder="Ej. Compra a proveedor">
          </label>
          <button class="primary-btn" type="submit">Registrar movimiento</button>
        </form>
      ` : `
        <div class="empty-state">
          <b>Primero registra productos</b>
          <button class="primary-btn" data-action="new-product">Agregar producto</button>
        </div>
      `}
    </section>
  `
}


function salesHTML() {
  const availableProducts = products.filter(p => Number(p.stock) > 0)
  const total = cartTotal()

  return `
    <section style="display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,340px);gap:18px;align-items:start">

      <article class="panel" style="min-width:0">
        <div class="panel-heading">
          <div>
            <h2>Catálogo de bebidas</h2>
            <p>Selecciona una bebida para agregarla a la venta.</p>
          </div>
        </div>

        <input
          id="sales-search"
          type="search"
          placeholder="Buscar bebida por nombre o marca..."
          style="width:100%;margin:12px 0 16px;padding:12px;border-radius:10px"
          value="${escapeHTML(searchText)}"
        >

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:14px">
          ${availableProducts.filter(p =>
            `${p.name} ${p.brand} ${p.category}`.toLowerCase()
              .includes(searchText.toLowerCase())
          ).map(p => `
            <article style="border:1px solid var(--border-color,#333);border-radius:13px;overflow:hidden;min-width:0">
              <img
                src="${productImage(p)}"
                alt="${escapeHTML(p.name)}"
                loading="lazy"
                style="width:100%;height:135px;object-fit:cover;display:block;background:#242424"
                onerror="this.style.display='none'"
              >

              <div style="padding:12px">
                <small style="opacity:.7">${escapeHTML(p.category || 'Bebida')}</small>
                <h3 style="font-size:15px;margin:6px 0;overflow-wrap:anywhere">
                  ${escapeHTML(p.name)}
                </h3>
                <p style="font-size:12px;opacity:.7;margin:0 0 8px">
                  ${escapeHTML(p.presentation || p.brand || '')}
                </p>
                <strong style="display:block;margin-bottom:8px">
                  ${money(p.price)}
                </strong>
                <small style="display:block;margin-bottom:10px">
                  Stock: ${Number(p.stock)}
                </small>
                <button
                  class="primary-btn"
                  style="width:100%"
                  data-action="add-sale-item"
                  data-id="${escapeHTML(p.id)}"
                >＋ Agregar</button>
              </div>
            </article>
          `).join('') || `
            <p class="empty-state">
              No hay bebidas disponibles para esa búsqueda.
            </p>
          `}
        </div>
      </article>

      <aside class="panel" style="position:sticky;top:12px">
        <div class="panel-heading">
          <div>
            <h2>Carrito</h2>
            <p>${cart.reduce((sum, item) => sum + item.quantity, 0)} unidad(es)</p>
          </div>
        </div>

        ${cart.length ? cart.map(item => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border-color,#333)">
            <strong>${escapeHTML(item.name)}</strong>
            <p style="margin:5px 0">${money(item.price)} por unidad</p>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <button class="small-btn" data-action="cart-minus" data-id="${escapeHTML(item.id)}">−</button>
              <span>${item.quantity}</span>
              <button class="small-btn" data-action="cart-plus" data-id="${escapeHTML(item.id)}">＋</button>
              <button class="small-btn" data-action="remove-sale-item" data-id="${escapeHTML(item.id)}">Quitar</button>
            </div>

            <strong style="display:block;margin-top:8px">
              ${money(item.price * item.quantity)}
            </strong>
          </div>
        `).join('') : `
          <div class="empty-state">
            <span>🛒</span>
            <b>Carrito vacío</b>
            <p>Agrega bebidas desde el catálogo.</p>
          </div>
        `}

        <div style="padding-top:16px">
          <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:14px">
            <strong>Total</strong>
            <strong>${money(total)}</strong>
          </div>

          <button
            class="primary-btn"
            style="width:100%"
            data-action="complete-sale"
            ${cart.length ? '' : 'disabled'}
          >Registrar venta</button>

          <button
            class="secondary-btn"
            style="width:100%;margin-top:8px"
            data-action="clear-cart"
            ${cart.length ? '' : 'disabled'}
          >Vaciar carrito</button>
        </div>
      </aside>
    </section>

    <section class="panel recent-panel">
      <div class="panel-heading">
        <div>
          <h2>Historial de ventas</h2>
          <p>Registro guardado en este navegador.</p>
        </div>
      </div>

      ${sales.length ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Número</th><th>Fecha</th><th>Unidades</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${[...sales].reverse().map(sale => `
                <tr>
                  <td>#${escapeHTML(sale.id)}</td>
                  <td>${escapeHTML(sale.date)}</td>
                  <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>${money(sale.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="empty-state">Todavía no hay ventas registradas.</p>'}
    </section>
  `
}


function reportsHTML() {
  const valueAtCost = inventoryValue()
  const potentialRevenue = products.reduce((sum, p) => sum + p.stock * p.price, 0)

  return `
    <section class="stats">
      ${statCard('Referencias', products.length, 'Productos registrados')}
      ${statCard('Unidades', totalStock(), 'Existencias actuales')}
      ${statCard('Valor a costo', money(valueAtCost), 'Según costo registrado')}
      ${statCard('Valor potencial de venta', money(potentialRevenue), 'Si se vende todo el stock')}
    </section>
    <section class="panel recent-panel">
      <h2>Productos por revisar</h2>
      <p class="subtitle">Los precios de compra pendientes deben completarse para calcular utilidades reales.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Producto</th><th>Compra</th><th>Venta</th><th>Diferencia unitaria</th></tr></thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>${escapeHTML(p.name)}</td>
                <td>${money(p.cost)}</td>
                <td>${money(p.price)}</td>
                <td>${money(p.price - p.cost)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">Registra productos para ver el reporte.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault()
      currentView = link.dataset.view
      searchText = ''
      render()
    })
  })
}

function bindViewEvents() {
  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', event => {
      const action = button.dataset.action

      if (action === 'new-product') openProductForm()
      if (action === 'edit-product') {
        const product = products.find(p => p.id === button.dataset.id)
        if (product) openProductForm(product)
      }
      if (action === 'adjust-stock') {
        currentView = 'movimientos'
        render()
        const select = document.querySelector('[name="productId"]')
        if (select) select.value = button.dataset.id
      }
      if (action === 'close-modal' && (event.target === button || event.target === button.closest('.close-btn'))) {
        closeModal()
      }
    })
  })

  const backdrop = document.querySelector('.modal-backdrop')
  if (backdrop) {
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closeModal()
    })
  }

  const search = document.querySelector('#search-products')
  if (search) {
    search.addEventListener('input', () => {
      searchText = search.value
      const position = search.selectionStart
      renderView()
      const newSearch = document.querySelector('#search-products')
      newSearch.focus()
      newSearch.setSelectionRange(position, position)
    })
  }

  const form = document.querySelector('#product-form')
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault()
      const data = new FormData(form)
      const id = form.dataset.id
      const name = String(data.get('name')).trim()
      const barcode = String(data.get('barcode')).trim()

      if (!name) return alert('Escribe el nombre del producto.')

      if (barcode && products.some(p => p.barcode === barcode && p.id !== id)) {
        return alert('Ya existe un producto con ese código de barras.')
      }

      const existing = products.find(p => p.id === id)
      const product = {
        id: id || crypto.randomUUID(),
        name,
        brand: String(data.get('brand')).trim(),
        category: String(data.get('category')),
        presentation: String(data.get('presentation')).trim(),
        barcode,
        stock: Number(data.get('stock')),
        minimum: Number(data.get('minimum')),
        cost: Number(data.get('cost')),
        price: Number(data.get('price'))
      }

      if (existing) {
        products = products.map(p => p.id === id ? product : p)
      } else {
        products.push(product)
      }

      saveProducts()
      closeModal()
      currentView = 'productos'
      render()
    })
  }

  const stockForm = document.querySelector('#stock-form')
  if (stockForm) {
    stockForm.addEventListener('submit', event => {
      event.preventDefault()
      const data = new FormData(stockForm)
      const product = products.find(p => p.id === data.get('productId'))
      const quantity = Number(data.get('quantity'))
      const type = String(data.get('type'))
      const reason = String(data.get('reason')).trim()

      if (!product || !Number.isInteger(quantity) || quantity <= 0) {
        return alert('Revisa el producto y la cantidad.')
      }
      
 


      if (type === 'salida' && quantity > product.stock) {
        return alert('No puedes retirar más unidades de las disponibles.')
      }

      if (type === 'entrada' || type === 'devolucion') product.stock += quantity
      if (type === 'salida') product.stock -= quantity

      if (type === 'ajuste') {
        const newStock = Number(prompt(`Stock actual: ${product.stock}. Escribe el nuevo stock:`))
        if (!Number.isInteger(newStock) || newStock < 0) return alert('Stock no válido.')
        product.stock = newStock
      }

      saveProducts()
      alert(`Movimiento registrado: ${reason}`)
      render()
    })
  }

 // Buscar bebidas en el catálogo de ventas.
  const salesSearch = document.querySelector('#sales-search')

  if (salesSearch) {
    salesSearch.addEventListener('input', () => {
      searchText = salesSearch.value
      const position = salesSearch.selectionStart
      renderView()

      const newInput = document.querySelector('#sales-search')
      if (newInput) {
        newInput.focus()
        newInput.setSelectionRange(position, position)
      }
    })
  }

  // Agregar bebida al carrito.
  document.querySelectorAll('[data-action="add-sale-item"]').forEach(button => {
    button.addEventListener('click', () => {
      const product = products.find(p => p.id === button.dataset.id)
      if (!product) return

      const item = cart.find(i => i.id === product.id)
      const currentQuantity = item ? item.quantity : 0

      if (currentQuantity + 1 > Number(product.stock)) {
        alert('No hay suficientes unidades disponibles.')
        return
      }

      if (item) {
        item.quantity++
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: 1
        })
      }

      renderView()
    })
  })

  // Aumentar cantidad.
  document.querySelectorAll('[data-action="cart-plus"]').forEach(button => {
    button.addEventListener('click', () => {
      const item = cart.find(i => i.id === button.dataset.id)
      const product = products.find(p => p.id === button.dataset.id)
      if (!item || !product) return

      if (item.quantity + 1 > Number(product.stock)) {
        alert('No hay suficientes unidades disponibles.')
        return
      }

      item.quantity++
      renderView()
    })
  })

  // Reducir cantidad.
  document.querySelectorAll('[data-action="cart-minus"]').forEach(button => {
    button.addEventListener('click', () => {
      const item = cart.find(i => i.id === button.dataset.id)
      if (!item) return

      item.quantity--

      if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== button.dataset.id)
      }

      renderView()
    })
  })

  // Quitar bebida del carrito.
  document.querySelectorAll('[data-action="remove-sale-item"]').forEach(button => {
    button.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== button.dataset.id)
      renderView()
    })
  })

  // Vaciar carrito.
  document.querySelectorAll('[data-action="clear-cart"]').forEach(button => {
    button.addEventListener('click', () => {
      if (!confirm('¿Deseas vaciar el carrito?')) return
      cart = []
      renderView()
    })
  })

  // Registrar venta y descontar existencias.
  document.querySelectorAll('[data-action="complete-sale"]').forEach(button => {
    button.addEventListener('click', () => {
      if (!cart.length) return

      for (const item of cart) {
        const product = products.find(p => p.id === item.id)

        if (!product || Number(product.stock) < item.quantity) {
          alert(`Stock insuficiente para ${item.name}.`)
          return
        }
      }

      const oldProducts = products.map(p => ({ ...p }))
      const oldSales = sales
      const total = cartTotal()

      const sale = {
        id: String(Date.now()),
        date: new Date().toLocaleString('es-CO'),
        items: cart.map(item => ({ ...item })),
        total
      }

      products = products.map(product => {
        const soldItem = cart.find(item => item.id === product.id)

        return soldItem
          ? {
              ...product,
              stock: Number(product.stock) - soldItem.quantity
            }
          : product
      })

      sales = [...sales, sale]

      try {
        saveProducts()
        saveSales()
      } catch (error) {
        products = oldProducts
        sales = oldSales
        console.error('Error guardando la venta:', error)
        alert('No se pudo guardar la venta. Revisa el almacenamiento.')
        return
      }

      cart = []
      searchText = ''
      alert(`Venta registrada correctamente: ${money(total)}`)
      currentView = 'ventas'
      render()
    })
  })
}

function openProductForm(product = null) {
  closeModal()

  const wrapper = document.createElement('div')
  wrapper.id = 'modal-root'
  wrapper.innerHTML = productFormHTML(product)
  document.body.appendChild(wrapper)

  const backdrop = wrapper.querySelector('.modal-backdrop')
  const modal = wrapper.querySelector('.modal')
  const form = wrapper.querySelector('#product-form')

  // Evitar que los clics dentro del formulario lo cierren.
  modal?.addEventListener('click', event => {
    event.stopPropagation()
  })

  // Cerrar al pulsar fuera del formulario.
  backdrop?.addEventListener('click', event => {
    if (event.target === backdrop) closeModal()
  })

  // Botones para cerrar y cancelar.
  wrapper.querySelectorAll('[data-action="close-modal"]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault()
      event.stopPropagation()
      closeModal()
    })
  })

  if (!form) {
    console.error('No se encontró el formulario de productos.')
    return
  }

  // Guardar producto: el formulario ya existe.
  form.addEventListener('submit', event => {
    event.preventDefault()
    event.stopPropagation()

    const data = new FormData(form)
    const id = form.dataset.id
    const name = String(data.get('name') || '').trim()
    const barcode = String(data.get('barcode') || '').trim()

    if (!name) {
      alert('Escribe el nombre del producto.')
      return
    }

    if (
      barcode &&
      products.some(p => p.barcode === barcode && p.id !== id)
    ) {
      alert('Ya existe un producto con ese código de barras.')
      return
    }

    const existing = products.find(p => p.id === id)

    const productData = {
      id: id || (
        globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : String(Date.now())
      ),
      name,
      brand: String(data.get('brand') || '').trim(),
      category: String(data.get('category') || 'Otros'),
      presentation: String(data.get('presentation') || '').trim(),
      barcode,
      stock: Number(data.get('stock') || 0),
      minimum: Number(data.get('minimum') || 0),
      cost: Number(data.get('cost') || 0),
      price: Number(data.get('price') || 0)
    }

    const previousProducts = products

    products = existing
      ? products.map(p => p.id === id ? productData : p)
      : [...products, productData]

    try {
      saveProducts()
    } catch (error) {
      products = previousProducts
      console.error('Error al guardar el producto:', error)
      alert('No se pudo guardar el producto. Revisa la consola con F12.')
      return
    }

    closeModal()
    searchText = ''
    currentView = 'productos'
    render()
  })

  form.querySelector('[name="name"]')?.focus()
}
function closeModal() {
  document.querySelector('#modal-root')?.remove()
}


render()
