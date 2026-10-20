"use strict";
/* =====================================================================
   LOOKS AMAZING · Tienda en línea de moda femenina
   Proyecto final del Diplomado en Informática
   ===================================================================== */

/* ---------- 1. VARIABLES Y TIPOS DE DATOS ---------- */
const STORE = {                       // objeto
  name: "Looks Amazing",              // texto (string)
  currency: "$",
  shippingFee: 3.5,                   // número (number)
  freeShippingFrom: 50,
  adminPin: "1234",
  maxBackups: 8
};
const LOGO_FULL = "images/logo.jpg";
const CATEGORIES = [                  // arreglo (array) de objetos
  { id: "blusas", name: "Blusas" },
  { id: "pantalones", name: "Pantalones" },
  { id: "vestidos", name: "Vestidos" },
  { id: "accesorios", name: "Accesorios" }
];
const COUPONS = { BIENVENIDA: 10, LOOKS15: 15 };   // código → % de descuento
const COLORS = {
  "Nude": "#D9B99B", "Marfil": "#F1E6D3", "Blanco": "#FBF8F3", "Arena": "#CDB394",
  "Camel": "#B98B5E", "Café": "#8B5E3C", "Chocolate": "#6B4429", "Rosa palo": "#E3C2B5",
  "Negro": "#2E2A27", "Dorado": "#C9A24B", "Plateado": "#BFC0C2"
};
const DEPARTMENTS = ["Ahuachapán","Cabañas","Chalatenango","Cuscatlán","La Libertad","La Paz","La Unión","Morazán","San Miguel","San Salvador","San Vicente","Santa Ana","Sonsonate","Usulután"];
const ORDER_STATUS = ["Pendiente", "Preparando", "Enviado", "Entregado", "Cancelado"];
const ART_OPTIONS = {
  blusas: [{ kind: "blusa", v: 0, label: "Manga corta" }, { kind: "blusa", v: 1, label: "De tirantes" }, { kind: "blusa", v: 2, label: "Manga larga" }],
  pantalones: [{ kind: "pantalon", v: 0, label: "Recto" }, { kind: "pantalon", v: 1, label: "Palazzo / ancho" }, { kind: "pantalon", v: 2, label: "Entubado / jean" }],
  vestidos: [{ kind: "vestido", v: 0, label: "Strapless midi" }, { kind: "vestido", v: 1, label: "Tirantes" }, { kind: "vestido", v: 2, label: "Largo manga larga" }, { kind: "vestido", v: 3, label: "Con mangas y vuelo" }, { kind: "vestido", v: 4, label: "Corto con vuelo" }],
  accesorios: [{ kind: "bolso", v: 0, label: "Bolso" }, { kind: "lentes", v: 0, label: "Lentes de sol" }, { kind: "collar", v: 0, label: "Collar" }, { kind: "aretes", v: 0, label: "Aretes" }, { kind: "cinturon", v: 0, label: "Cinturón" }, { kind: "sombrero", v: 0, label: "Sombrero" }]
};

let products = [], cart = [], orders = [], messages = [], backups = [];   // arreglos
let state = {                                                             // estado de la aplicación
  route: "inicio", cat: "todas", q: "", sort: "relevancia",
  maxPrice: 9999, onlyOffers: false, coupon: null, admin: false, adminTab: "productos"
};
let modalState = null, checkoutState = { pickup: false }, exportText = "";

async function loadAll() {
  products = (await DB.all("products")).sort((a, b) => a.id.localeCompare(b.id));
  cart = await DB.all("cart");
  orders = (await DB.all("orders")).sort((a, b) => b.date.localeCompare(a.date));
  messages = (await DB.all("messages")).sort((a, b) => b.date.localeCompare(a.date));
  backups = (await DB.all("backups")).sort((a, b) => b.date.localeCompare(a.date));
  cart = cart.filter(i => products.some(p => p.id === i.pid));
  const top = Math.ceil(Math.max(1, ...products.map(p => p.price)));
  if (state.maxPrice > top) state.maxPrice = top;
}

/* ---------- 4. UTILIDADES ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => STORE.currency + Number(n).toFixed(2);
const pctOff = p => (p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0);
const isSale = p => p.old > p.price;
const catName = id => (CATEGORIES.find(c => c.id === id) || { name: id }).name;
const fmtDate = iso => new Date(iso).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });
const soldLabel = n => (n >= 1000 ? "+" + (n / 1000).toFixed(1) + "k" : String(n));
const uid = prefix => prefix + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 100);
function stars(r) { let s = ""; for (let i = 1; i <= 5; i++) { s += i <= Math.round(r) ? "★" : "☆"; } return s; }
function toast(msg, type) {
  const t = document.createElement("div");
  t.className = "toast" + (type === "err" ? " err" : "");
  t.textContent = msg;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
function askConfirm(msg, okLabel = "Aceptar") {
  return new Promise(resolve => {
    $("#confirmBox").innerHTML = `<h2 style="margin:0 0 8px;font-size:21px">¿Estás segura?</h2><p style="margin:0 0 18px;color:var(--muted)">${esc(msg)}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn ghost sm" id="cNo">Cancelar</button><button class="btn sm" id="cYes">${esc(okLabel)}</button></div>`;
    $("#confirm").classList.add("open");
    const done = v => { $("#confirm").classList.remove("open"); resolve(v); };
    $("#cNo").onclick = () => done(false);
    $("#cYes").onclick = () => done(true);
    $("#cNo").focus();
  });
}
function openModal(html, narrow) {
  const box = $("#modalBox");
  box.className = "box" + (narrow ? " narrow" : "");
  box.innerHTML = `<button class="x" data-act="close" aria-label="Cerrar">×</button>` + html;
  $("#modal").classList.add("open");
  box.scrollTop = 0; box.focus();
}
function closeModal() { $("#modal").classList.remove("open"); modalState = null; }

/* ---------- 5. IMÁGENES DE PRODUCTO (ilustraciones en SVG; se pueden reemplazar por fotos reales) ---------- */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? c => Math.round(c * (1 + amt)) : c => Math.round(c + (255 - c) * amt);
  return "#" + [f(r), f(g), f(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const artCache = new Map();
function svgArt(kind, v, hex, pat) {
  const c = hex, d = shade(hex, -0.24), l = shade(hex, 0.32), gold = "#C9A24B";
  const hanger = `<path d="M150 90 L150 76 C150 66 164 66 164 54 C164 44 148 42 146 54" fill="none" stroke="#8B6B4E" stroke-width="3" stroke-linecap="round"/><path d="M150 90 L66 108 L234 108 Z" fill="none" stroke="#8B6B4E" stroke-width="3" stroke-linejoin="round"/>`;
  const folds = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${d}" stroke-opacity=".35" stroke-width="2"/>`;
  let g = "";
  if (kind === "blusa") {
    let body;
    if (v === 1) body = "M112 112 L128 112 L132 142 Q150 160 168 142 L172 112 L188 112 L198 164 L204 318 Q150 334 96 318 L102 164 Z";
    else if (v === 2) body = "M108 112 L192 112 L236 140 L262 282 L236 288 L206 182 L204 318 Q150 334 96 318 L94 182 L64 288 L38 282 L64 140 Z";
    else body = "M108 112 L192 112 L238 142 L222 184 L204 172 L204 318 Q150 334 96 318 L96 172 L78 184 L62 142 Z";
    g = hanger + `<path d="${body}" fill="${c}"/>`;
    if (v !== 1) g += `<path d="M128 112 L150 152 L172 112 Z" fill="${d}"/>`;
    g += folds(150, 152, 150, 322) + folds(120, 200, 116, 316) + folds(180, 200, 184, 316);
    if (v === 0 && !pat) g += [196, 232, 268].map(y => `<circle cx="150" cy="${y}" r="3.5" fill="${d}"/>`).join("");
    if (v === 1) g += `<path d="M98 318 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0 q8 10 16 0" fill="none" stroke="${l}" stroke-width="3"/>`;
    if (v === 2) g += `<rect x="40" y="276" width="26" height="12" fill="${d}" transform="rotate(-8 53 282)"/><rect x="234" y="276" width="26" height="12" fill="${d}" transform="rotate(8 247 282)"/>`;
    if (pat) for (let i = 0; i < 18; i++) { const x = 96 + (i * 47) % 108, y = 170 + (i * 31) % 140; g += `<circle cx="${x}" cy="${y}" r="5" fill="${l}" opacity=".85"/><circle cx="${x}" cy="${y}" r="2" fill="${d}"/>`; }
  } else if (kind === "pantalon") {
    let legs;
    if (v === 1) legs = "M100 124 L200 124 L240 340 L158 340 L150 196 L142 340 L60 340 Z";
    else if (v === 2) legs = "M100 124 L200 124 L204 340 L160 340 L150 196 L140 340 L96 340 Z";
    else legs = "M100 124 L200 124 L212 340 L158 340 L150 196 L142 340 L88 340 Z";
    g = hanger + `<path d="${legs}" fill="${c}"/><rect x="98" y="112" width="104" height="16" rx="3" fill="${d}"/>`;
    g += `<path d="M150 128 L150 196" stroke="${d}" stroke-width="2"/><circle cx="150" cy="134" r="3.5" fill="${gold}"/>`;
    g += `<path d="M106 134 Q122 152 134 140" fill="none" stroke="${l}" stroke-width="2" stroke-dasharray="4 3"/><path d="M194 134 Q178 152 166 140" fill="none" stroke="${l}" stroke-width="2" stroke-dasharray="4 3"/>`;
    g += folds(126, 200, 112, 336) + folds(174, 200, 190, 336);
  } else if (kind === "vestido") {
    let body;
    if (v === 1) body = "M112 112 L122 112 L126 134 Q150 148 174 134 L178 112 L188 112 L196 212 L232 336 Q150 352 68 336 L104 212 Z";
    else if (v === 2) body = "M108 112 L192 112 L236 140 L258 262 L234 268 L206 180 L216 348 Q150 364 84 348 L94 180 L66 268 L42 262 L64 140 Z";
    else if (v === 3) body = "M108 112 L192 112 L226 136 L214 172 L200 164 L200 204 L254 340 Q150 358 46 340 L100 204 L100 164 L86 172 L74 136 Z";
    else if (v === 4) body = "M112 112 L124 112 L128 136 Q150 150 172 136 L176 112 L188 112 L196 190 L248 300 Q150 320 52 300 L104 190 Z";
    else body = "M98 116 Q150 134 202 116 L196 196 Q150 206 104 196 Z M104 196 Q150 206 196 196 L262 340 Q150 360 38 340 Z";
    g = hanger + `<path d="${body}" fill="${c}"/>`;
    if (v === 0) g += `<path d="M98 116 Q150 134 202 116" fill="none" stroke="${l}" stroke-width="3"/><path d="M104 196 Q150 206 196 196" fill="none" stroke="${d}" stroke-width="5"/>`;
    if (v === 2) g += `<rect x="96" y="186" width="108" height="11" rx="3" fill="${d}"/>`;
    if (v === 3 && !pat) g += `<rect x="98" y="196" width="104" height="10" rx="3" fill="${d}"/>`;
    if (v === 3 || v === 2) g += `<path d="M128 112 L150 148 L172 112 Z" fill="${d}"/>`;
    g += folds(150, 210, 150, 346) + folds(124, 220, 96, 340) + folds(176, 220, 204, 340);
    if (pat) for (let i = 0; i < 26; i++) { const x = 70 + (i * 53) % 160, y = 214 + (i * 37) % 120; g += `<circle cx="${x}" cy="${y}" r="5.5" fill="${l}" opacity=".9"/><circle cx="${x}" cy="${y}" r="2" fill="${d}"/>`; }
  } else if (kind === "bolso") {
    g = `<path d="M112 200 C112 120 188 120 188 200" fill="none" stroke="${d}" stroke-width="9" stroke-linecap="round"/><path d="M76 196 L224 196 L242 334 L58 334 Z" fill="${c}"/><path d="M76 196 L224 196 L228 232 L72 232 Z" fill="${d}" opacity=".45"/><circle cx="150" cy="226" r="8" fill="${gold}"/><path d="M84 316 L216 316" stroke="${l}" stroke-width="2" stroke-dasharray="5 4"/>`;
  } else if (kind === "lentes") {
    g = `<path d="M62 188 Q58 172 82 170 L132 174 Q142 214 112 228 Q76 234 66 208 Z" fill="#2c1d14" fill-opacity=".88" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M238 188 Q242 172 218 170 L168 174 Q158 214 188 228 Q224 234 234 208 Z" fill="#2c1d14" fill-opacity=".88" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M134 184 Q150 174 166 184" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M62 186 L34 176 M238 186 L266 176" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M80 186 L100 182" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/><path d="M220 186 L200 182" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`;
  } else if (kind === "collar") {
    g = `<path d="M66 110 C76 270 224 270 234 110" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><circle cx="150" cy="248" r="3" fill="${c}"/><circle cx="150" cy="268" r="17" fill="#F7F0E8" stroke="#d9cdbd" stroke-width="2"/><ellipse cx="144" cy="262" rx="6" ry="4" fill="#fff" opacity=".85"/>`;
  } else if (kind === "aretes") {
    const drop = x => `<path d="M${x} 112 L${x} 176" stroke="${c}" stroke-width="2.5"/><circle cx="${x}" cy="108" r="6" fill="none" stroke="${c}" stroke-width="3"/><circle cx="${x}" cy="182" r="6" fill="${c}"/><path d="M${x} 194 C${x - 20} 226 ${x - 20} 262 ${x} 276 C${x + 20} 262 ${x + 20} 226 ${x} 194 Z" fill="${c}"/><path d="M${x - 7} 226 Q${x - 9} 244 ${x - 3} 256" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`;
    g = drop(106) + drop(194);
  } else if (kind === "cinturon") {
    g = `<rect x="26" y="190" width="248" height="24" rx="12" fill="${c}"/><path d="M40 202 L260 202" stroke="${l}" stroke-width="2" stroke-dasharray="6 4"/>` + [196, 212, 228, 244].map(x => `<circle cx="${x + 20}" cy="202" r="3" fill="${d}"/>`).join("") + `<rect x="106" y="174" width="52" height="56" rx="6" fill="none" stroke="${gold}" stroke-width="8"/><path d="M132 202 L176 202" stroke="${gold}" stroke-width="6" stroke-linecap="round"/>`;
  } else if (kind === "sombrero") {
    g = `<ellipse cx="150" cy="248" rx="124" ry="38" fill="${c}"/><ellipse cx="150" cy="248" rx="124" ry="38" fill="none" stroke="${d}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 5"/><path d="M92 244 C90 150 210 150 208 244 Q150 266 92 244 Z" fill="${l}"/><path d="M92 226 Q150 248 208 226 L208 244 Q150 266 92 244 Z" fill="${d}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0E4D4"/><stop offset="1" stop-color="#D8C0A4"/></linearGradient></defs><rect width="300" height="380" fill="url(#bg)"/><ellipse cx="150" cy="362" rx="88" ry="9" fill="#000" opacity=".08"/>${g}</svg>`;
}
function artURI(p, color) {
  const name = color && COLORS[color] ? color : p.colors[0];
  const hex = COLORS[name] || "#D9B99B";
  const key = [p.kind, p.v, hex, p.pat].join("|");
  if (!artCache.has(key)) artCache.set(key, "data:image/svg+xml;utf8," + encodeURIComponent(svgArt(p.kind, p.v, hex, p.pat)));
  return artCache.get(key);
}
/* Foto que se muestra: foto subida por el admin > archivo de images/productos > ilustración generada */
function imgFor(p, color) {
  if (p.img && p.img.startsWith("data:")) return p.img;              // foto subida desde Admin
  if (p.img && (!color || color === p.colors[0])) return p.img;      // archivo images/productos/Pxxx.svg
  return artURI(p, color);                                           // otro color: se dibuja al momento
}
/* Si falta un archivo de imagen, se usa la ilustración generada por código */
document.addEventListener("error", e => {
  const t = e.target;
  if (t.tagName !== "IMG" || t.dataset.fb) return;
  t.dataset.fb = "1";
  const m = /productos\/([^/.]+)\./.exec(t.getAttribute("src") || "");
  const p = m && products.find(x => x.id === m[1]);
  if (p) t.src = artURI(p, p.colors[0]);
}, true);

/* ---------- 6. CARRITO DE COMPRAS ---------- */
function cartLines() {
  const lines = [];
  for (const item of cart) {
    const p = products.find(x => x.id === item.pid);
    if (p) lines.push({ item, p, subtotal: p.price * item.qty });
  }
  return lines;
}
function totals(pickup) {
  let subtotal = 0, count = 0;
  for (const l of cartLines()) { subtotal += l.subtotal; count += l.item.qty; }
  const pct = state.coupon ? COUPONS[state.coupon] : 0;
  const discount = +(subtotal * pct / 100).toFixed(2);
  const after = subtotal - discount;
  let shipping = 0;
  if (count > 0 && !pickup) shipping = after >= STORE.freeShippingFrom ? 0 : STORE.shippingFee;
  const total = +(after + shipping).toFixed(2);
  return { count, subtotal, pct, discount, shipping, total, after, missing: Math.max(0, STORE.freeShippingFrom - after) };
}
async function addToCart(pid, size, color, qty = 1) {
  const p = products.find(x => x.id === pid);
  if (!p) { toast("Ese producto ya no está disponible.", "err"); return false; }
  if (p.stock <= 0) { toast("Este producto está agotado.", "err"); return false; }
  const key = pid + "|" + size + "|" + color;
  const inCart = cart.filter(i => i.pid === pid).reduce((s, i) => s + i.qty, 0);
  if (inCart + qty > p.stock) { toast(`Solo quedan ${p.stock} unidades de este producto.`, "err"); return false; }
  let item = cart.find(i => i.key === key);
  if (item) item.qty += qty; else { item = { key, pid, size, color, qty }; cart.push(item); }
  await DB.put("cart", item);
  refreshCartUI();
  toast("Agregado al carrito: " + p.name);
  return true;
}
async function changeQty(key, delta) {
  const item = cart.find(i => i.key === key); if (!item) return;
  const p = products.find(x => x.id === item.pid);
  const inCart = cart.filter(i => i.pid === item.pid).reduce((s, i) => s + i.qty, 0);
  if (delta > 0 && inCart + delta > p.stock) { toast(`Solo quedan ${p.stock} unidades.`, "err"); return; }
  item.qty += delta;
  if (item.qty <= 0) return removeItem(key);
  await DB.put("cart", item); refreshCartUI();
}
async function removeItem(key) {
  cart = cart.filter(i => i.key !== key);
  await DB.del("cart", key); refreshCartUI();
}
async function clearCart() {
  for (const i of cart) await DB.del("cart", i.key);
  cart = []; state.coupon = null; refreshCartUI();
}
function applyCoupon(code) {
  const c = code.trim().toUpperCase();
  if (!c) { toast("Escribe un código de descuento.", "err"); return; }
  if (COUPONS[c] === undefined) { state.coupon = null; toast("Ese código no es válido.", "err"); }
  else { state.coupon = c; toast(`Cupón aplicado: ${COUPONS[c]}% de descuento`); }
  refreshCartUI();
}
function refreshCartUI() {
  const t = totals(false), el = $("#cartCount");
  el.textContent = t.count; el.hidden = t.count === 0;
  if ($("#drawer").classList.contains("open")) renderCart();
}
function renderCart() {
  const lines = cartLines(), t = totals(false);
  let body;
  if (!lines.length) body = `<div class="empty"><b>Tu carrito está vacío</b>Agrega blusas, vestidos o accesorios y aparecerán aquí.<br><br><button class="btn sm" data-act="cartshop">Ir a la tienda</button></div>`;
  else body = lines.map(({ item, p }) => `
    <div class="line"><img src="${imgFor(p, item.color)}" alt="${esc(p.name)}">
      <div><h3>${esc(p.name)}</h3><div class="meta">${esc(item.color)} · Talla ${esc(item.size)}</div>
      <div class="row2"><div class="qty"><button data-act="cdec" data-key="${esc(item.key)}" aria-label="Quitar una unidad">−</button><span>${item.qty}</span><button data-act="cinc" data-key="${esc(item.key)}" aria-label="Agregar una unidad">+</button></div>
      <b>${money(p.price * item.qty)}</b></div>
      <button class="link" data-act="cdel" data-key="${esc(item.key)}" style="font-size:13px">Quitar</button></div></div>`).join("");
  const pct = Math.min(100, Math.round(t.after / STORE.freeShippingFrom * 100));
  const shipMsg = !lines.length ? "" : t.missing > 0
    ? `Te faltan <b>${money(t.missing)}</b> para envío gratis.`
    : `¡Tienes envío gratis!`;
  $("#drawerPanel").innerHTML = `
    <div class="panel-head"><h2>Mi carrito (${t.count})</h2><button class="x" data-act="cartclose" aria-label="Cerrar carrito">×</button></div>
    <div class="panel-body">${lines.length ? `<div class="ship">${shipMsg}<div class="bar"><i style="width:${pct}%"></i></div></div>` : ""}${body}</div>
    ${lines.length ? `<div class="panel-foot">
      <div class="coupon"><input id="couponIn" placeholder="Código de descuento" value="${esc(state.coupon || "")}" aria-label="Código de descuento"><button class="btn ghost sm" data-act="coupon">Aplicar</button></div>
      <div class="sum"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      ${t.discount > 0 ? `<div class="sum"><span>Descuento (${t.pct}%)</span><span class="neg">−${money(t.discount)}</span></div>` : ""}
      <div class="sum"><span>Envío</span><span>${t.shipping === 0 ? "Gratis" : money(t.shipping)}</span></div>
      <div class="sum total"><span>Total</span><span>${money(t.total)}</span></div>
      <button class="btn block" data-act="checkout">Finalizar compra</button>
      <button class="link" data-act="cclear" style="justify-self:center;font-size:14px">Vaciar carrito</button>
    </div>` : ""}`;
}
function openCart() { renderCart(); $("#drawer").classList.add("open"); }
function closeCart() { $("#drawer").classList.remove("open"); }

/* ---------- 7. FINALIZAR COMPRA ---------- */
function openCheckout() {
  if (!cartLines().length) { toast("Tu carrito está vacío.", "err"); return; }
  closeCart(); checkoutState = { pickup: false };
  openModal(`<div class="box-pad"><h2 style="margin:0 0 4px;font-size:26px">Finalizar compra</h2>
    <p style="margin:0 0 18px;color:var(--muted)">Completa tus datos para confirmar el pedido.</p>
    <form id="coForm" novalidate>
      <div class="two"><div class="field"><label for="co-name">Nombre completo</label><input id="co-name" name="name" autocomplete="name"><div class="err" data-err="name"></div></div>
      <div class="field"><label for="co-phone">Teléfono (8 dígitos)</label><input id="co-phone" name="phone" inputmode="numeric" autocomplete="tel"><div class="err" data-err="phone"></div></div></div>
      <div class="field"><label for="co-email">Correo electrónico</label><input id="co-email" name="email" type="email" autocomplete="email"><div class="err" data-err="email"></div></div>
      <fieldset class="field"><legend>Entrega</legend><div class="checks">
        <label><input type="radio" name="delivery" value="domicilio" checked> A domicilio</label>
        <label><input type="radio" name="delivery" value="retiro"> Retiro en tienda (sin costo de envío)</label></div></fieldset>
      <div class="two"><div class="field"><label for="co-dept">Departamento</label><select id="co-dept" name="dept"><option value="">Elige uno</option>${DEPARTMENTS.map(d => `<option>${d}</option>`).join("")}</select><div class="err" data-err="dept"></div></div>
      <div class="field"><label for="co-address">Dirección</label><input id="co-address" name="address" autocomplete="street-address"><div class="err" data-err="address"></div></div></div>
      <fieldset class="field"><legend>Forma de pago</legend><div class="checks">
        <label><input type="radio" name="pay" value="Pago contra entrega" checked> Pago contra entrega</label>
        <label><input type="radio" name="pay" value="Transferencia bancaria"> Transferencia bancaria</label></div></fieldset>
      <div class="field"><label for="co-notes">Notas del pedido (opcional)</label><textarea id="co-notes" name="notes" style="min-height:64px"></textarea></div>
      <div class="cardbox" id="coSummary"></div>
      <button class="btn block" type="submit">Confirmar pedido</button>
    </form></div>`);
  refreshCheckoutSummary();
}
function refreshCheckoutSummary() {
  const t = totals(checkoutState.pickup), box = $("#coSummary"); if (!box) return;
  box.innerHTML = `<div class="sum"><span>Artículos (${t.count})</span><span>${money(t.subtotal)}</span></div>
    ${t.discount > 0 ? `<div class="sum"><span>Descuento (${t.pct}%)</span><span class="neg">−${money(t.discount)}</span></div>` : ""}
    <div class="sum"><span>Envío</span><span>${t.shipping === 0 ? "Gratis" : money(t.shipping)}</span></div>
    <div class="sum total"><span>Total a pagar</span><span>${money(t.total)}</span></div>`;
}
function validateCheckout(d) {
  const e = {};
  if (d.name.trim().length < 3) e.name = "Escribe tu nombre completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (d.phone.replace(/\D/g, "").length !== 8) e.phone = "El teléfono debe tener 8 dígitos.";
  if (!d.dept) e.dept = "Elige un departamento.";
  if (d.delivery !== "retiro" && d.address.trim().length < 8) e.address = "Escribe una dirección más completa.";
  return e;
}
async function submitCheckout(form) {
  const f = new FormData(form);
  const d = { name: f.get("name") || "", email: f.get("email") || "", phone: f.get("phone") || "", dept: f.get("dept") || "", address: f.get("address") || "", delivery: f.get("delivery"), pay: f.get("pay"), notes: f.get("notes") || "" };
  const errors = validateCheckout(d);
  $$("[data-err]", form).forEach(el => { el.textContent = errors[el.dataset.err] || ""; });
  $$("input,select", form).forEach(el => el.setAttribute("aria-invalid", errors[el.name] ? "true" : "false"));
  const firstKey = Object.keys(errors)[0];
  if (firstKey) { const el = form.elements[firstKey]; if (el) el.focus(); return; }
  const lines = cartLines(), pickup = d.delivery === "retiro", t = totals(pickup);
  for (const l of lines) if (l.item.qty > l.p.stock) { toast(`"${l.p.name}" ya no tiene suficiente stock.`, "err"); return; }
  const order = {
    id: "LA-" + String(Date.now()).slice(-7), date: new Date().toISOString(), status: "Pendiente",
    customer: { name: d.name.trim(), email: d.email.trim(), phone: d.phone.replace(/\D/g, ""), dept: d.dept, address: pickup ? "Retiro en tienda" : d.address.trim() },
    pay: d.pay, delivery: pickup ? "Retiro en tienda" : "A domicilio", notes: d.notes.trim(), coupon: state.coupon,
    items: lines.map(l => ({ pid: l.p.id, name: l.p.name, size: l.item.size, color: l.item.color, qty: l.item.qty, price: l.p.price })),
    totals: { subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total }
  };
  try {
    await DB.put("orders", order);
    for (const l of lines) { l.p.stock -= l.item.qty; await DB.put("products", l.p); }
    await clearCart(); await loadAll();
  } catch (err) { toast("No se pudo guardar el pedido. Intenta de nuevo.", "err"); return; }
  openModal(`<div class="box-pad" style="text-align:center"><h2 style="margin:0 0 6px;font-size:28px">¡Gracias por tu compra, ${esc(order.customer.name.split(" ")[0])}!</h2>
    <p style="color:var(--muted);margin:0 0 14px">Tu pedido <b>${order.id}</b> quedó registrado por <b>${money(order.totals.total)}</b>. Pronto nos pondremos en contacto contigo.</p>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn" data-act="gopedidos">Ver mis pedidos</button><button class="btn ghost" data-act="close">Seguir comprando</button></div></div>`, true);
  render();
}

/* ---------- 8. DETALLE DE PRODUCTO Y CALCULADORA DE TALLA ---------- */
function recommendSize(bust, waist, hip) {
  const table = [{ s: "XS", b: 82, w: 64, h: 90 }, { s: "S", b: 88, w: 70, h: 96 }, { s: "M", b: 94, w: 76, h: 102 }, { s: "L", b: 100, w: 82, h: 108 }, { s: "XL", b: 106, w: 88, h: 114 }];
  if (bust < 60 || waist < 45 || hip < 60 || bust > 150 || waist > 150 || hip > 160) return { ok: false, text: "Revisa tus medidas: deben estar en centímetros (por ejemplo, busto 90)." };
  for (const row of table) {
    if (bust <= row.b && waist <= row.w && hip <= row.h) return { ok: true, size: row.s, text: `Tu talla recomendada es ${row.s}.` };
  }
  return { ok: false, text: "Tus medidas superan nuestra talla XL. Escríbenos desde Contacto y te ayudamos a elegir." };
}
function openProduct(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  const single = p.sizes.length === 1;
  modalState = { pid: id, size: single ? p.sizes[0] : null, color: p.colors[0], qty: 1 };
  openModal(`<div class="pm"><div class="pm-img"><img id="pm-img" src="${imgFor(p, p.colors[0])}" alt="${esc(p.name)}"></div>
    <div class="pm-info"><h2>${esc(p.name)}</h2>
      <div class="meta"><span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} · ${soldLabel(p.sold)} vendidos · ${esc(catName(p.cat))}</div>
      <div class="price big ${isSale(p) ? "sale" : ""}" style="margin-top:8px;padding:0"><b style="font-size:30px">${money(p.price)}</b>${isSale(p) ? `<s>${money(p.old)}</s><span class="tag" style="position:static">−${pctOff(p)}%</span>` : ""}</div>
      <p>${esc(p.desc)}</p>
      <fieldset><legend class="meta">Color: <b id="pm-color" style="color:var(--ink)">${esc(p.colors[0])}</b></legend><div class="swatches">
        ${p.colors.map((c, i) => `<button class="sw" data-act="color" data-v="${esc(c)}" aria-pressed="${i === 0}"><i style="background:${COLORS[c] || "#ccc"}"></i>${esc(c)}</button>`).join("")}</div></fieldset>
      <fieldset><legend class="meta">Talla: <b id="pm-size" style="color:var(--ink)">${single ? p.sizes[0] : "Elige una talla"}</b></legend><div class="sizes">
        ${p.sizes.map(s => `<button class="sz" data-act="size" data-v="${esc(s)}" aria-pressed="${single}">${esc(s)}</button>`).join("")}</div>
        ${single ? "" : `<button class="link" data-act="calctoggle" style="font-size:14px;margin-top:6px">¿Cuál es mi talla?</button>
        <form class="calc" id="calcForm" hidden novalidate><div class="meta" style="margin-bottom:8px">Escribe tus medidas en centímetros.</div>
          <div class="three"><div class="field" style="margin:0"><label for="c-b">Busto</label><input id="c-b" inputmode="numeric"></div><div class="field" style="margin:0"><label for="c-w">Cintura</label><input id="c-w" inputmode="numeric"></div><div class="field" style="margin:0"><label for="c-h">Cadera</label><input id="c-h" inputmode="numeric"></div></div>
          <button class="btn sm" type="submit" style="margin-top:10px">Calcular talla</button><div class="out" id="calcOut" aria-live="polite"></div></form>`}</fieldset>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:6px">
        <div class="qty"><button data-act="mdec" aria-label="Menos">−</button><span id="pm-qty">1</span><button data-act="minc" aria-label="Más">+</button></div>
        <span class="meta" style="color:${p.stock <= 5 ? "var(--sale)" : "var(--muted)"}">${p.stock <= 0 ? "Agotado" : p.stock <= 5 ? `¡Últimas ${p.stock} unidades!` : `${p.stock} disponibles`}</span></div>
      <button class="btn block" data-act="addmodal" style="margin-top:16px" ${p.stock <= 0 ? "disabled" : ""}>Agregar al carrito</button>
    </div></div>`);
}
function syncModal() {
  const m = modalState; if (!m) return;
  const p = products.find(x => x.id === m.pid);
  $$("#modalBox [data-act=size]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === m.size)));
  $$("#modalBox [data-act=color]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === m.color)));
  $("#pm-qty").textContent = m.qty;
  $("#pm-color").textContent = m.color;
  $("#pm-size").textContent = m.size || "Elige una talla";
  $("#pm-img").src = imgFor(p, m.color);
}

/* ---------- 9. VISTAS ---------- */
function productCard(p) {
  const out = p.stock <= 0;
  return `<article class="card">
    <button class="card-img" data-act="open" data-id="${p.id}" aria-label="Ver ${esc(p.name)}"><img src="${imgFor(p)}" alt="${esc(p.name)}" loading="lazy">
      ${isSale(p) ? `<span class="tag">−${pctOff(p)}%</span>` : p.isNew ? `<span class="tag new">Nuevo</span>` : ""}${out ? `<span class="tag out">Agotado</span>` : ""}</button>
    <div class="card-body"><h3>${esc(p.name)}</h3>
      <div class="meta"><span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} · ${soldLabel(p.sold)} vendidos</div>
      <div class="price ${isSale(p) ? "sale" : ""}"><b>${money(p.price)}</b>${isSale(p) ? `<s>${money(p.old)}</s>` : ""}</div></div>
    <button class="add" data-act="quick" data-id="${p.id}" aria-label="Agregar ${esc(p.name)} al carrito" ${out ? "disabled" : ""}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></article>`;
}
function homeView() {
  const flash = products.filter(isSale).slice(0, 8);
  const news = products.filter(p => p.isNew).slice(0, 8);
  const sample = { blusas: "P002", pantalones: "P008", vestidos: "P013", accesorios: "P019" };
  return `
  <section class="wrap hero"><div>
      <h1>Moda para mujer que se ve increíble en ti</h1>
      <p>Blusas, pantalones, vestidos y accesorios en tonos nude. Envío gratis en compras desde ${money(STORE.freeShippingFrom)}.</p>
      <div class="cta"><button class="btn" data-act="cat" data-id="vestidos">Ver vestidos</button><button class="btn ghost" data-act="nav" data-route="ofertas">Ver ofertas</button></div>
    </div><img src="${LOGO_FULL}" alt="Logo de Looks Amazing, haute couture fashion"></section>
  <section class="wrap sec"><div class="sec-head"><h2>Compra por categoría</h2></div><div class="cats">
    ${CATEGORIES.map(c => { const p = products.find(x => x.id === sample[c.id]) || products.find(x => x.cat === c.id); const n = products.filter(x => x.cat === c.id).length;
      return `<button class="cat-tile" data-act="cat" data-id="${c.id}">${p ? `<img src="${imgFor(p)}" alt="">` : ""}<span>${c.name}<small>${n} productos</small></span></button>`; }).join("")}</div></section>
  ${flash.length ? `<section class="wrap sec"><div class="sec-head"><h2>Ofertas relámpago</h2><span class="timer">Termina en <b class="cd">00:00:00</b></span><button class="link" data-act="nav" data-route="ofertas">Ver todas</button></div>
    <div class="row">${flash.map(productCard).join("")}</div></section>` : ""}
  ${news.length ? `<section class="wrap sec"><div class="sec-head"><h2>Recién llegados</h2><button class="link" data-act="cat" data-id="todas">Ver toda la tienda</button></div>
    <div class="grid">${news.map(productCard).join("")}</div></section>` : ""}
  <section class="wrap"><div class="perks">
    <div><b>Envío gratis</b><span>En compras desde ${money(STORE.freeShippingFrom)}</span></div>
    <div><b>Paga al recibir</b><span>Pago contra entrega en todo el país</span></div>
    <div><b>Cambios en 7 días</b><span>Si la talla no es la tuya</span></div>
    <div><b>Cupón BIENVENIDA</b><span>10% en tu primera compra</span></div></div></section>`;
}
function shopView() {
  const ofertas = state.route === "ofertas";
  const title = ofertas ? "Ofertas" : state.cat === "todas" ? "Toda la tienda" : catName(state.cat);
  const top = Math.ceil(Math.max(1, ...products.map(p => p.price)));
  return `<section class="wrap sec"><div class="sec-head"><h2>${esc(title)}</h2><span class="meta" id="resCount"></span></div>
    <div class="filters">
      ${[{ id: "todas", name: "Todo" }, ...CATEGORIES].map(c => `<button class="chip" data-act="chip" data-id="${c.id}" aria-pressed="${state.cat === c.id}">${c.name}</button>`).join("")}
      <span class="sp"></span>
      <label for="maxp">Hasta <b id="maxpv">${money(state.maxPrice)}</b><input id="maxp" type="range" min="5" max="${top}" step="1" value="${Math.min(state.maxPrice, top)}"></label>
      ${ofertas ? "" : `<label><input type="checkbox" id="offOnly" ${state.onlyOffers ? "checked" : ""}> Solo ofertas</label>`}
      <label for="sort" class="sr">Ordenar por</label>
      <select class="sel" id="sort"><option value="relevancia">Más relevantes</option><option value="vendidos">Más vendidos</option><option value="nuevo">Novedades</option><option value="menor">Precio: menor a mayor</option><option value="mayor">Precio: mayor a menor</option></select>
    </div><div id="gridbox"></div></section>`;
}
function visibleProducts() {
  const ofertas = state.route === "ofertas", q = state.q.trim().toLowerCase();
  const list = products.filter(p => {
    if ((ofertas || state.onlyOffers) && !isSale(p)) return false;
    if (state.cat !== "todas" && p.cat !== state.cat) return false;
    if (p.price > state.maxPrice) return false;
    if (q && !(p.name + " " + p.desc + " " + catName(p.cat)).toLowerCase().includes(q)) return false;
    return true;
  });
  switch (state.sort) {
    case "menor": list.sort((a, b) => a.price - b.price); break;
    case "mayor": list.sort((a, b) => b.price - a.price); break;
    case "vendidos": list.sort((a, b) => b.sold - a.sold); break;
    case "nuevo": list.sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
    default: break;
  }
  return list;
}
function renderGrid() {
  const box = $("#gridbox"); if (!box) return;
  const list = visibleProducts();
  $("#resCount").textContent = list.length + (list.length === 1 ? " producto" : " productos");
  box.innerHTML = list.length ? `<div class="grid">${list.map(productCard).join("")}</div>`
    : `<div class="empty"><b>No encontramos productos</b>Prueba con otra categoría, sube el precio máximo o borra la búsqueda.<br><br><button class="btn sm" data-act="resetfilters">Quitar filtros</button></div>`;
}
function pedidosView() {
  const body = orders.length ? orders.map(o => `<article class="ord"><header><div><b>${o.id}</b><div class="meta">${fmtDate(o.date)}</div></div><span class="pill ${o.status}">${o.status}</span></header>
      <ul>${o.items.map(i => `<li>${i.qty} × ${esc(i.name)} <span class="meta">(${esc(i.color)}, ${esc(i.size)})</span></li>`).join("")}</ul>
      <div class="meta">${esc(o.delivery)} · ${esc(o.pay)}</div><div style="font-weight:600;color:var(--cocoa);margin-top:4px">Total: ${money(o.totals.total)}</div></article>`).join("")
    : `<div class="empty"><b>Todavía no hay pedidos</b>Cuando completes una compra aparecerá aquí.<br><br><button class="btn sm" data-act="cat" data-id="todas">Explorar la tienda</button></div>`;
  return `<div class="page"><h1>Mis pedidos</h1><p class="lead">Aquí ves el historial de compras hechas en este dispositivo.</p>${body}</div>`;
}
function contactoView() {
  return `<div class="page"><h1>Contacto</h1><p class="lead">¿Dudas sobre una talla, un pedido o un cambio? Escríbenos y respondemos al correo que dejes.</p>
    <form class="cardbox" id="contactForm" novalidate style="max-width:560px">
      <div class="field"><label for="ct-name">Nombre</label><input id="ct-name" name="name" autocomplete="name"><div class="err" data-err="name"></div></div>
      <div class="field"><label for="ct-email">Correo electrónico</label><input id="ct-email" name="email" type="email" autocomplete="email"><div class="err" data-err="email"></div></div>
      <div class="field"><label for="ct-msg">Mensaje</label><textarea id="ct-msg" name="msg"></textarea><div class="err" data-err="msg"></div></div>
      <button class="btn" type="submit">Enviar mensaje</button></form></div>`;
}
function nosotrosView() {
  const concepts = [
    ["Variables", "<code>STORE</code>, <code>state</code>, <code>cart</code>, <code>products</code>", "Guardan el nombre de la tienda, el carrito, el filtro activo y el catálogo."],
    ["Tipos de datos", "texto, número, booleano, arreglo, objeto, fecha, <code>null</code>", "Nombre y precio de cada prenda, stock, <code>isNew</code>, listas de tallas y colores, fecha del pedido."],
    ["Operadores", "<code>+ − * /</code>, <code>&gt;= &lt;= ===</code>, <code>&amp;&amp; || !</code>, <code>+=</code>", "Subtotal, descuento (<code>subtotal*pct/100</code>), porcentaje de rebaja, validación de stock."],
    ["Entrada de datos", "formularios, cuadro de búsqueda, control de precio, cupón", "Compra, contacto, búsqueda, calculadora de talla y panel de administración."],
    ["Salida de información", "<code>render()</code>, <code>toast()</code>, <code>money()</code>", "Muestra productos, totales, avisos y errores en pantalla."],
    ["Condicionales", "<code>if / else</code>, <code>switch</code>, operador <code>?:</code>", "Stock agotado, cupón válido, envío gratis, talla recomendada, ordenar productos."],
    ["Estructuras de control", "<code>for</code>, <code>for…of</code>, <code>while</code>, <code>filter</code>, <code>map</code>, <code>setInterval</code>", "Recorren el catálogo y el carrito, borran respaldos antiguos y actualizan el reloj de ofertas."],
    ["Funciones", "<code>addToCart()</code>, <code>totals()</code>, <code>recommendSize()</code>, <code>validateCheckout()</code>", "Cada acción importante está en una función que se puede reutilizar."]
  ];
  return `<div class="page"><h1>Información del proyecto</h1>
    <p class="lead">Looks Amazing es una tienda en línea de ropa y accesorios para mujer, creada como proyecto final del Diplomado en Informática del Complejo Educativo Católico Doctora María Julia Hernández.</p>
    <div class="two" style="align-items:center;margin-bottom:6px"><img src="${LOGO_FULL}" alt="Logo de Looks Amazing" style="border-radius:20px;max-width:320px;border:1px solid var(--line)"><div>
      <h2 style="margin-top:0">Necesidad que resuelve</h2><p>Una boutique pequeña necesita mostrar su catálogo, recibir pedidos y controlar su inventario sin hacerlo todo a mano en cuadernos o chats. Esta aplicación centraliza el catálogo, el carrito, los pedidos y los mensajes de clientas.</p></div></div>
    <h2>Qué puedes hacer en la tienda</h2>
    <ul><li>Ver blusas, pantalones, vestidos y accesorios con foto, precio, descripción, colores y tallas.</li><li>Buscar, filtrar por precio y ordenar los productos.</li><li>Agregar al carrito, aplicar un cupón y finalizar la compra con un formulario.</li><li>Consultar los pedidos y escribir mensajes desde Contacto.</li><li>Administrar productos, pedidos, mensajes y respaldos desde el panel Admin.</li></ul>
    <h2>Cómo comprar (manual breve)</h2>
    <ol><li>Elige una categoría o usa el buscador.</li><li>Toca un producto, escoge color, talla y cantidad. Si dudas, usa <b>¿Cuál es mi talla?</b></li><li>Pulsa <b>Agregar al carrito</b> y abre el carrito arriba a la derecha.</li><li>Escribe un cupón si tienes uno (prueba <code>BIENVENIDA</code>).</li><li>Pulsa <b>Finalizar compra</b>, llena tus datos y confirma.</li></ol>
    <h2>Administración</h2><p>Entra a <b>Admin</b> con el PIN de demostración <code>${STORE.adminPin}</code>. Ahí puedes crear, editar y eliminar productos (con foto propia), cambiar el estado de los pedidos, leer mensajes y crear o restaurar respaldos.</p>
    <h2>Tecnología</h2><p>HTML5 para la estructura, CSS3 para el diseño adaptable a celular y computadora, y JavaScript para la lógica. Los datos se guardan en una base de datos <b>IndexedDB</b> del navegador (actualmente usando: <b>${DB.modo}</b>) con cuatro tablas de datos: productos, carrito, pedidos y mensajes, más respaldos.</p>
    <h2>Base de datos: operaciones disponibles</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Operación</th><th>Dónde se usa</th></tr></thead><tbody>
      <tr><td>Crear registros</td><td>Nuevo producto, pedido, mensaje de contacto</td></tr>
      <tr><td>Consultar información</td><td>Catálogo, pedidos, mensajes, historial de respaldos</td></tr>
      <tr><td>Modificar información</td><td>Editar producto, cambiar estado del pedido, descontar stock</td></tr>
      <tr><td>Eliminar registros</td><td>Quitar productos, pedidos, mensajes o respaldos</td></tr>
      <tr><td>Respaldo</td><td>Panel Admin → Respaldo: crear copia, restaurar, exportar e importar archivo</td></tr></tbody></table></div>
    <h2>Conceptos de programación demostrados</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Concepto</th><th>Ejemplo en el código</th><th>Dónde se ve</th></tr></thead><tbody>
      ${concepts.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table></div>
    <h2>Guía de tallas (cm)</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Talla</th><th>Busto</th><th>Cintura</th><th>Cadera</th></tr></thead><tbody>
      <tr><td>XS</td><td>78–82</td><td>60–64</td><td>86–90</td></tr><tr><td>S</td><td>83–88</td><td>65–70</td><td>91–96</td></tr><tr><td>M</td><td>89–94</td><td>71–76</td><td>97–102</td></tr><tr><td>L</td><td>95–100</td><td>77–82</td><td>103–108</td></tr><tr><td>XL</td><td>101–106</td><td>83–88</td><td>109–114</td></tr></tbody></table></div>
    <h2>Identidad gráfica</h2><p>Paleta en tonos nude tomada del logotipo: arena <code>#DAC6AE</code>, taupe <code>#B89B7E</code> y chocolate <code>#4A2C17</code>. Las ilustraciones de producto son dibujos vectoriales propios que cambian de color según la opción elegida, y se pueden reemplazar por fotos reales desde Admin.</p></div>`;
}

/* ----- Administración ----- */
function adminView() {
  if (!state.admin) return `<div class="page" style="max-width:460px"><h1>Administración</h1><p class="lead">Ingresa el PIN para administrar la tienda.</p>
    <form class="cardbox" id="pinForm" novalidate><div class="field"><label for="pin">PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="off"><div class="err" id="pinErr"></div></div><button class="btn block" type="submit">Entrar</button>
    <p class="meta" style="margin:10px 0 0">PIN de demostración: ${STORE.adminPin}</p></form></div>`;
  const tabs = [["productos", "Productos"], ["pedidos", "Pedidos"], ["mensajes", "Mensajes"], ["respaldo", "Respaldo"]];
  return `<div class="page" style="max-width:1100px"><div class="sec-head"><div><h1>Panel de administración</h1><p class="lead" style="margin:0">Base de datos: ${DB.modo}</p></div><button class="btn ghost sm" data-act="alogout">Cerrar sesión</button></div>
    ${adminStats()}
    <div class="tabs" role="tablist">${tabs.map(t => `<button class="chip" role="tab" data-act="atab" data-id="${t[0]}" aria-pressed="${state.adminTab === t[0]}">${t[1]}</button>`).join("")}</div>
    <div id="adminBody">${adminTabView()}</div></div>`;
}
function adminStats() {
  let units = 0, revenue = 0, pending = 0;
  for (const p of products) units += p.stock;
  for (const o of orders) { if (o.status !== "Cancelado") revenue += o.totals.total; if (o.status === "Pendiente") pending++; }
  const low = products.filter(p => p.stock <= 5).length;
  return `<div class="stats"><div class="stat"><b>${products.length}</b><span>Productos</span></div><div class="stat"><b>${units}</b><span>Unidades en inventario</span></div>
    <div class="stat"><b>${low}</b><span>Con poco stock (5 o menos)</span></div><div class="stat"><b>${orders.length}</b><span>Pedidos (${pending} pendientes)</span></div><div class="stat"><b>${money(revenue)}</b><span>Ventas (sin cancelados)</span></div></div>`;
}
function adminTabView() {
  if (state.adminTab === "productos") {
    return `<div style="margin-bottom:12px"><button class="btn sm" data-act="pnew">+ Nuevo producto</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>Foto</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>
      ${products.map(p => `<tr><td><img class="thumb" src="${imgFor(p)}" alt=""></td><td><b>${esc(p.name)}</b><div class="meta">${esc(p.id)}</div></td><td>${esc(catName(p.cat))}</td>
        <td>${money(p.price)}${isSale(p) ? `<div class="meta"><s>${money(p.old)}</s></div>` : ""}</td><td>${p.stock}</td>
        <td><div class="row-actions"><button class="btn ghost sm" data-act="pedit" data-id="${p.id}">Editar</button><button class="btn danger sm" data-act="pdel" data-id="${p.id}">Eliminar</button></div></td></tr>`).join("") || `<tr><td colspan="6">No hay productos. Crea el primero.</td></tr>`}</tbody></table></div>`;
  }
  if (state.adminTab === "pedidos") {
    return orders.length ? orders.map(o => `<article class="ord"><header><div><b>${o.id}</b> <span class="meta">· ${fmtDate(o.date)}</span></div>
        <div class="row-actions"><select class="sel" data-act="ostatus" data-id="${o.id}" aria-label="Estado del pedido ${o.id}">${ORDER_STATUS.map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        <button class="btn danger sm" data-act="odel" data-id="${o.id}">Eliminar</button></div></header>
        <div><b>${esc(o.customer.name)}</b> · ${esc(o.customer.phone)} · ${esc(o.customer.email)}</div>
        <div class="meta">${esc(o.delivery)}: ${esc(o.customer.address)}, ${esc(o.customer.dept)} · ${esc(o.pay)}${o.coupon ? " · Cupón " + esc(o.coupon) : ""}</div>
        <ul>${o.items.map(i => `<li>${i.qty} × ${esc(i.name)} <span class="meta">(${esc(i.color)}, ${esc(i.size)}) ${money(i.price)}</span></li>`).join("")}</ul>
        ${o.notes ? `<div class="meta">Nota: ${esc(o.notes)}</div>` : ""}<div style="font-weight:600;color:var(--cocoa)">Total: ${money(o.totals.total)}</div></article>`).join("")
      : `<div class="empty"><b>Aún no hay pedidos</b>Cuando alguien compre, aparecerá aquí.</div>`;
  }
  if (state.adminTab === "mensajes") {
    return messages.length ? messages.map(m => `<article class="ord"><header><div><b>${esc(m.name)}</b> <span class="meta">· ${esc(m.email)} · ${fmtDate(m.date)}</span></div><button class="btn danger sm" data-act="mdel2" data-id="${m.id}">Eliminar</button></header><p style="margin:0;white-space:pre-wrap">${esc(m.msg)}</p></article>`).join("")
      : `<div class="empty"><b>No hay mensajes</b>Los mensajes de Contacto llegarán aquí.</div>`;
  }
  return `<div class="cardbox"><h2 style="margin:0 0 6px;font-size:20px">Respaldo de la base de datos</h2>
    <p class="meta" style="margin:0 0 12px">Guarda una copia de productos, pedidos y mensajes. Puedes restaurarla en cualquier momento.</p>
    <div class="row-actions"><button class="btn sm" data-act="bnew">Crear respaldo ahora</button><button class="btn ghost sm" data-act="bexport">Exportar a archivo</button><button class="btn ghost sm" data-act="bimportopen">Importar desde archivo</button><button class="btn danger sm" data-act="breset">Restablecer catálogo de ejemplo</button></div>
    <input type="file" id="importFile" accept="application/json,.json" hidden>
    <div id="exportBox" ${exportText ? "" : "hidden"} style="margin-top:12px"><p class="meta" style="margin:0 0 6px">Copia este texto y guárdalo en un archivo .json:</p><textarea class="json" id="exportTa" readonly>${esc(exportText)}</textarea></div></div>
    <h2 style="font-size:20px;margin:18px 0 10px">Historial de respaldos</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Nombre</th><th>Contenido</th><th>Acciones</th></tr></thead><tbody>
    ${backups.map(b => `<tr><td>${fmtDate(b.date)}</td><td>${esc(b.label)}</td><td>${b.counts.products} productos · ${b.counts.orders} pedidos · ${b.counts.messages} mensajes</td>
      <td><div class="row-actions"><button class="btn ghost sm" data-act="brestore" data-id="${b.id}">Restaurar</button><button class="btn danger sm" data-act="bdel" data-id="${b.id}">Eliminar</button></div></td></tr>`).join("") || `<tr><td colspan="4">Todavía no hay respaldos.</td></tr>`}</tbody></table></div>`;
}
function openProductForm(id) {
  const p = id ? products.find(x => x.id === id) : null;
  const cat = p ? p.cat : "blusas";
  const artVal = p ? p.kind + ":" + p.v : "blusa:0";
  const f = p || { name: "", price: "", old: "", stock: 10, desc: "", colors: ["Nude"], sizes: SIZES };
  openModal(`<div class="box-pad"><h2 style="margin:0 0 14px;font-size:24px">${p ? "Editar producto" : "Nuevo producto"}</h2>
    <form id="pForm" novalidate data-id="${p ? p.id : ""}">
      <div class="field"><label for="pf-name">Nombre</label><input id="pf-name" name="name" value="${esc(f.name)}"><div class="err" data-err="name"></div></div>
      <div class="two"><div class="field"><label for="pf-cat">Categoría</label><select id="pf-cat" name="cat">${CATEGORIES.map(c => `<option value="${c.id}" ${c.id === cat ? "selected" : ""}>${c.name}</option>`).join("")}</select></div>
      <div class="field"><label for="pf-art">Dibujo de referencia</label><select id="pf-art" name="art">${artOptionsHtml(cat, artVal)}</select></div></div>
      <div class="two"><div class="field"><label for="pf-price">Precio ($)</label><input id="pf-price" name="price" inputmode="decimal" value="${esc(f.price)}"><div class="err" data-err="price"></div></div>
      <div class="field"><label for="pf-old">Precio anterior ($, opcional)</label><input id="pf-old" name="old" inputmode="decimal" value="${f.old ? esc(f.old) : ""}"><div class="err" data-err="old"></div></div></div>
      <div class="field"><label for="pf-stock">Stock (unidades)</label><input id="pf-stock" name="stock" inputmode="numeric" value="${esc(f.stock)}"><div class="err" data-err="stock"></div></div>
      <div class="field"><label for="pf-desc">Descripción</label><textarea id="pf-desc" name="desc">${esc(f.desc)}</textarea><div class="err" data-err="desc"></div></div>
      <fieldset class="field"><legend>Colores disponibles</legend><div class="checks">${Object.keys(COLORS).map(c => `<label><input type="checkbox" name="colors" value="${c}" ${f.colors.includes(c) ? "checked" : ""}> ${c}</label>`).join("")}</div><div class="err" data-err="colors"></div></fieldset>
      <fieldset class="field" id="pf-sizes" ${cat === "accesorios" ? "hidden" : ""}><legend>Tallas disponibles</legend><div class="checks">${SIZES.map(s => `<label><input type="checkbox" name="sizes" value="${s}" ${(f.sizes || []).includes(s) ? "checked" : ""}> ${s}</label>`).join("")}</div><div class="err" data-err="sizes"></div></fieldset>
      <div class="field"><label for="pf-img">Foto del producto (opcional)</label><input id="pf-img" name="img" type="file" accept="image/*">
        ${p && p.img && p.img.startsWith("data:") ? `<div class="checks" style="margin-top:6px"><img class="thumb" src="${p.img}" alt=""><label><input type="checkbox" name="rmimg"> Quitar la foto actual</label></div>` : `<div class="meta">Si no subes foto, se usa la ilustración del producto.</div>`}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn" type="submit">Guardar producto</button></div>
    </form></div>`);
}
function artOptionsHtml(cat, selected) {
  return ART_OPTIONS[cat].map(o => `<option value="${o.kind}:${o.v}" ${o.kind + ":" + o.v === selected ? "selected" : ""}>${o.label}</option>`).join("");
}
function fileToDataURL(file, maxW = 700) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, maxW / img.width), c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject; img.src = fr.result;
    };
    fr.onerror = reject; fr.readAsDataURL(file);
  });
}
async function saveProduct(form) {
  const f = new FormData(form), id = form.dataset.id;
  const errors = {}, name = (f.get("name") || "").trim(), desc = (f.get("desc") || "").trim();
  const price = parseFloat(String(f.get("price")).replace(",", ".")), oldRaw = String(f.get("old") || "").trim();
  const old = oldRaw === "" ? 0 : parseFloat(oldRaw.replace(",", ".")), stock = parseInt(f.get("stock"), 10);
  const cat = f.get("cat"), colors = f.getAll("colors"), sizes = cat === "accesorios" ? ONE_SIZE : f.getAll("sizes");
  if (name.length < 3) errors.name = "Escribe un nombre de al menos 3 letras.";
  if (!(price > 0)) errors.price = "Escribe un precio mayor que 0.";
  if (oldRaw !== "" && !(old > price)) errors.old = "El precio anterior debe ser mayor que el precio actual.";
  if (!(stock >= 0)) errors.stock = "Escribe el stock como número entero (0 o más).";
  if (desc.length < 10) errors.desc = "Escribe una descripción de al menos 10 caracteres.";
  if (!colors.length) errors.colors = "Elige al menos un color.";
  if (!sizes.length) errors.sizes = "Elige al menos una talla.";
  $$("[data-err]", form).forEach(el => { el.textContent = errors[el.dataset.err] || ""; });
  if (Object.keys(errors).length) { toast("Revisa los campos marcados.", "err"); return; }
  const [kind, v] = String(f.get("art")).split(":");
  const prev = id ? products.find(x => x.id === id) : null;
  const rec = prev ? { ...prev } : { id: "P" + String(Date.now()).slice(-6), rating: 4.5, sold: 0, isNew: true, pat: false, img: "" };
  Object.assign(rec, { name, cat, kind, v: parseInt(v, 10), price, old, stock, desc, colors, sizes });
  rec.pat = prev && prev.kind === kind && prev.v === rec.v ? prev.pat : false;
  if (prev && prev.img && !prev.img.startsWith("data:") && (prev.kind !== kind || prev.v !== rec.v)) rec.img = "";
  const file = f.get("img");
  try {
    if (f.get("rmimg")) rec.img = "";
    if (file && file.size > 0) rec.img = await fileToDataURL(file);
    await DB.put("products", rec); await loadAll();
  } catch (e) { toast("No se pudo guardar el producto.", "err"); return; }
  closeModal(); toast(prev ? "Producto actualizado." : "Producto creado."); render();
}

/* ---------- 10. RESPALDOS ---------- */
async function exportBackup() {
  const data = await snapshotData();
  const text = JSON.stringify(data, null, 1);
  const name = "respaldo-looks-amazing-" + data.date.slice(0, 10) + ".json";
  let saved = false;
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if (dl) { await dl.save({ filename: name, data: text }); saved = true; toast("Respaldo exportado."); }
  } catch (e) { if (e && e.code === "declined") return; }
  if (!saved) { exportText = text; $("#adminBody").innerHTML = adminTabView(); const ta = $("#exportTa"); if (ta) { ta.focus(); ta.select(); } toast("Copia el texto y guárdalo en un archivo .json"); }
}

/* ---------- 11. ENRUTADOR Y RENDER ---------- */
function renderNav() {
  const items = [["inicio", "Inicio", "inicio"], ...CATEGORIES.map(c => ["tienda", c.name, c.id]), ["ofertas", "Ofertas", "ofertas"], ["nosotros", "Nosotros", "nosotros"], ["contacto", "Contacto", "contacto"]];
  $("#nav").innerHTML = items.map(([route, label, id]) => {
    const cur = route === "tienda" ? (state.route === "tienda" && state.cat === id) : state.route === route;
    return `<button class="${route === "ofertas" ? "sale" : ""}" data-act="${route === "tienda" ? "cat" : "nav"}" data-route="${route}" data-id="${id}" ${cur ? 'aria-current="page"' : ""}>${label}</button>`;
  }).join("");
}
function go(route, cat) {
  state.route = route;
  if (cat !== undefined) state.cat = cat;
  if (route === "ofertas") state.cat = "todas";
  try { history.replaceState(null, "", route === "tienda" ? "#/tienda/" + state.cat : "#/" + route); } catch (e) { /* ignorar */ }
  render(); window.scrollTo({ top: 0 });
}
function render() {
  renderNav();
  const app = $("#app");
  switch (state.route) {
    case "tienda": case "ofertas": app.innerHTML = shopView(); $("#sort").value = state.sort; renderGrid(); break;
    case "nosotros": app.innerHTML = nosotrosView(); break;
    case "contacto": app.innerHTML = contactoView(); break;
    case "pedidos": app.innerHTML = pedidosView(); break;
    case "admin": app.innerHTML = adminView(); break;
    default: app.innerHTML = homeView(); tickCountdown();
  }
  const q = $("#q"); if (document.activeElement !== q) q.value = state.q;
}
function tickCountdown() {
  const now = new Date(), end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const secs = Math.max(0, Math.floor((end - now) / 1000));
  const h = String(Math.floor(secs / 3600)).padStart(2, "0"), m = String(Math.floor(secs % 3600 / 60)).padStart(2, "0"), s = String(secs % 60).padStart(2, "0");
  $$(".cd").forEach(el => { el.textContent = `${h}:${m}:${s}`; });
}
function parseHash() {
  const parts = (location.hash || "").replace(/^#\/?/, "").split("/");
  const r = parts[0] || "inicio";
  if (r === "tienda") { state.route = "tienda"; state.cat = ["todas", ...CATEGORIES.map(c => c.id)].includes(parts[1]) ? parts[1] : "todas"; }
  else if (["inicio", "ofertas", "nosotros", "contacto", "pedidos", "admin"].includes(r)) state.route = r;
}

/* ---------- 12. EVENTOS ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  try {
    switch (act) {
      case "nav": closeCart(); closeModal(); go(el.dataset.route); break;
      case "cat": closeCart(); closeModal(); state.q = ""; state.onlyOffers = false; go("tienda", id); break;
      case "chip": state.cat = id; if (state.route === "ofertas") state.route = "tienda"; go(state.route, id); break;
      case "open": openProduct(id); break;
      case "quick": {
        const p = products.find(x => x.id === id);
        if (p && p.sizes.length === 1) await addToCart(p.id, p.sizes[0], p.colors[0], 1); else openProduct(id);
        break;
      }
      case "cartopen": openCart(); break;
      case "cartclose": closeCart(); break;
      case "cartshop": closeCart(); go("tienda", "todas"); break;
      case "cinc": await changeQty(el.dataset.key, 1); break;
      case "cdec": await changeQty(el.dataset.key, -1); break;
      case "cdel": await removeItem(el.dataset.key); break;
      case "cclear": if (await askConfirm("Se quitarán todos los productos de tu carrito.", "Vaciar")) await clearCart(); break;
      case "coupon": applyCoupon($("#couponIn").value); break;
      case "checkout": openCheckout(); break;
      case "close": closeModal(); break;
      case "gopedidos": closeModal(); go("pedidos"); break;
      case "resetfilters": state.q = ""; state.onlyOffers = false; state.maxPrice = 9999; state.cat = "todas"; await loadAll(); render(); break;
      case "color": modalState.color = el.dataset.v; syncModal(); break;
      case "size": modalState.size = el.dataset.v; syncModal(); break;
      case "minc": {
        const p = products.find(x => x.id === modalState.pid);
        if (modalState.qty < p.stock) { modalState.qty++; syncModal(); } else toast(`Solo hay ${p.stock} disponibles.`, "err");
        break;
      }
      case "mdec": if (modalState.qty > 1) { modalState.qty--; syncModal(); } break;
      case "calctoggle": { const f = $("#calcForm"); f.hidden = !f.hidden; if (!f.hidden) $("#c-b").focus(); break; }
      case "usesize": modalState.size = el.dataset.v; syncModal(); break;
      case "addmodal": {
        if (!modalState.size) { toast("Elige tu talla antes de agregar.", "err"); break; }
        if (await addToCart(modalState.pid, modalState.size, modalState.color, modalState.qty)) { closeModal(); openCart(); }
        break;
      }
      /* administración */
      case "alogout": state.admin = false; render(); break;
      case "atab": state.adminTab = id; exportText = ""; render(); break;
      case "pnew": openProductForm(null); break;
      case "pedit": openProductForm(id); break;
      case "pdel": {
        const p = products.find(x => x.id === id);
        if (await askConfirm(`Se eliminará "${p.name}" del catálogo.`, "Eliminar")) { await DB.del("products", id); await removeItem(cart.find(i => i.pid === id)?.key); await loadAll(); refreshCartUI(); render(); toast("Producto eliminado."); }
        break;
      }
      case "odel": if (await askConfirm("Se eliminará este pedido.", "Eliminar")) { await DB.del("orders", id); await loadAll(); render(); toast("Pedido eliminado."); } break;
      case "mdel2": if (await askConfirm("Se eliminará este mensaje.", "Eliminar")) { await DB.del("messages", id); await loadAll(); render(); toast("Mensaje eliminado."); } break;
      case "bnew": await createBackup("Respaldo manual"); render(); toast("Respaldo creado."); break;
      case "bexport": await exportBackup(); break;
      case "bimportopen": $("#importFile").click(); break;
      case "brestore": {
        const b = backups.find(x => x.id === id);
        if (b && await askConfirm("Se reemplazarán los datos actuales por los de este respaldo. Antes se guardará una copia automática.", "Restaurar")) { await restoreData(b.data, "restaurar"); render(); toast("Respaldo restaurado."); }
        break;
      }
      case "bdel": if (await askConfirm("Se eliminará este respaldo.", "Eliminar")) { await DB.del("backups", id); await loadAll(); render(); } break;
      case "breset": if (await askConfirm("El catálogo volverá a los 24 productos de ejemplo. Antes se guardará una copia automática.", "Restablecer")) {
        await createBackup("Automático antes de restablecer"); await DB.clear("products"); for (const p of SEED) await DB.put("products", p); await loadAll(); refreshCartUI(); render(); toast("Catálogo restablecido.");
      } break;
    }
  } catch (err) { console.error(err); toast("Ocurrió un error. Intenta de nuevo.", "err"); }
});
document.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  try {
    if (form.id === "coForm") await submitCheckout(form);
    else if (form.id === "calcForm") {
      const r = recommendSize(parseFloat($("#c-b").value), parseFloat($("#c-w").value), parseFloat($("#c-h").value));
      const p = products.find(x => x.id === modalState.pid);
      $("#calcOut").innerHTML = esc(r.text) + (r.ok && p.sizes.includes(r.size) ? ` <button type="button" class="link" data-act="usesize" data-v="${r.size}">Elegir ${r.size}</button>` : "");
    } else if (form.id === "contactForm") {
      const d = { name: form.name.value.trim(), email: form.email.value.trim(), msg: form.msg.value.trim() }, er = {};
      if (d.name.length < 2) er.name = "Escribe tu nombre.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) er.email = "Escribe un correo válido.";
      if (d.msg.length < 10) er.msg = "Cuéntanos un poco más (mínimo 10 caracteres).";
      $$("[data-err]", form).forEach(el => { el.textContent = er[el.dataset.err] || ""; });
      if (Object.keys(er).length) return;
      await DB.put("messages", { id: uid("M"), date: new Date().toISOString(), ...d }); await loadAll();
      form.reset(); toast("Mensaje enviado. ¡Gracias por escribirnos!");
    } else if (form.id === "pinForm") {
      if ($("#pin").value === STORE.adminPin) { state.admin = true; render(); }
      else $("#pinErr").textContent = "PIN incorrecto. Prueba de nuevo.";
    } else if (form.id === "pForm") await saveProduct(form);
  } catch (err) { console.error(err); toast("Ocurrió un error. Intenta de nuevo.", "err"); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") {
    state.q = t.value;
    if (state.route === "tienda" || state.route === "ofertas") renderGrid(); else if (state.q.trim()) { state.cat = "todas"; go("tienda"); t.focus(); }
  } else if (t.id === "maxp") { state.maxPrice = Number(t.value); $("#maxpv").textContent = money(state.maxPrice); renderGrid(); }
  else if (t.name === "delivery") { checkoutState.pickup = t.value === "retiro"; refreshCheckoutSummary(); }
});
document.addEventListener("change", async e => {
  const t = e.target;
  try {
    if (t.id === "sort") { state.sort = t.value; renderGrid(); }
    else if (t.id === "offOnly") { state.onlyOffers = t.checked; renderGrid(); }
    else if (t.name === "delivery") { checkoutState.pickup = t.value === "retiro"; refreshCheckoutSummary(); }
    else if (t.id === "pf-cat") { $("#pf-art").innerHTML = artOptionsHtml(t.value, ""); $("#pf-sizes").hidden = t.value === "accesorios"; }
    else if (t.dataset.act === "ostatus") {
      const o = orders.find(x => x.id === t.dataset.id), next = t.value;
      if (o.status !== "Cancelado" && next === "Cancelado") for (const i of o.items) { const p = products.find(x => x.id === i.pid); if (p) { p.stock += i.qty; await DB.put("products", p); } }
      if (o.status === "Cancelado" && next !== "Cancelado") for (const i of o.items) { const p = products.find(x => x.id === i.pid); if (p) { p.stock = Math.max(0, p.stock - i.qty); await DB.put("products", p); } }
      o.status = next; await DB.put("orders", o); await loadAll(); render(); toast("Estado actualizado: " + next);
    } else if (t.id === "importFile" && t.files[0]) {
      const text = await t.files[0].text();
      let data; try { data = JSON.parse(text); } catch (er) { toast("El archivo no es un respaldo válido.", "err"); return; }
      if (await askConfirm("Se reemplazarán los datos actuales por los del archivo. Antes se guardará una copia automática.", "Importar")) { await restoreData(data, "importar"); render(); toast("Datos importados."); }
      t.value = "";
    }
  } catch (err) { console.error(err); toast("No se pudo completar la acción. Revisa el archivo e intenta de nuevo.", "err"); }
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if ($("#confirm").classList.contains("open")) { const n = $("#cNo"); if (n) n.click(); }
  else if ($("#modal").classList.contains("open")) closeModal();
  else closeCart();
});

/* ---------- 13. INICIO DE LA APLICACIÓN ---------- */
async function init() {
  $("#promo").innerHTML = `Envío gratis desde <b>${money(STORE.freeShippingFrom)}</b> · Usa el cupón <b>BIENVENIDA</b> y obtén 10% de descuento`;
  parseHash(); renderNav();
  try {
    await DB.open();
    const seeded = await DB.get("meta", "seeded");
    if (!seeded) { for (const p of SEED) await DB.put("products", p); await DB.put("meta", { key: "seeded", value: true }); }
    await loadAll();
  } catch (e) { console.error(e); products = SEED.slice(); }
  refreshCartUI(); render();
  setInterval(tickCountdown, 1000);
}
init();