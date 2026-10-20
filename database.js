/* =====================================================================
   database.js · BASE DE DATOS de Looks Amazing
   - Datos de ejemplo (24 productos con precio, descripción, fotos, colores y tallas)
   - Módulo DB (IndexedDB): crear, consultar, modificar y eliminar registros
   - Respaldos: crear, restaurar
   Debe cargarse ANTES de script.js
   ===================================================================== */
"use strict";
const SIZES = ["XS", "S", "M", "L", "XL"];
const ONE_SIZE = ["Única"];

/* ---------- 2. DATOS DE EJEMPLO (se cargan una sola vez en la base de datos) ---------- */
const SEED = [
  { id: "P001", img: "images/productos/P001.svg", name: "Blusa satinada cuello V", cat: "blusas", kind: "blusa", v: 0, pat: false, price: 18.99, old: 24.99, stock: 24, colors: ["Nude", "Marfil", "Chocolate"], sizes: SIZES, rating: 4.7, sold: 1280, isNew: false, desc: "Blusa de satén suave con escote en V y manga corta. Cae con soltura y no necesita plancha. Lavar a mano o ciclo delicado." },
  { id: "P002", img: "images/productos/P002.svg", name: "Blusa de lino manga larga", cat: "blusas", kind: "blusa", v: 2, pat: false, price: 22.5, old: 0, stock: 18, colors: ["Marfil", "Arena", "Camel"], sizes: SIZES, rating: 4.6, sold: 640, isNew: true, desc: "Lino mezclado fresco y ligero, con puños anchos y corte recto. Ideal para la oficina o una salida de día." },
  { id: "P003", img: "images/productos/P003.svg", name: "Top de tirantes con encaje", cat: "blusas", kind: "blusa", v: 1, pat: false, price: 14.99, old: 0, stock: 30, colors: ["Blanco", "Rosa palo", "Negro"], sizes: SIZES, rating: 4.5, sold: 2150, isNew: false, desc: "Top de tirantes finos con detalle de encaje en el borde. Se usa solo o debajo de un blazer." },
  { id: "P004", img: "images/productos/P004.svg", name: "Blusa con volantes", cat: "blusas", kind: "blusa", v: 0, pat: true, price: 19.9, old: 0, stock: 14, colors: ["Rosa palo", "Marfil"], sizes: SIZES, rating: 4.8, sold: 530, isNew: true, desc: "Blusa estampada con pequeños detalles florales y cuello suave. Tela fresca que no se pega al cuerpo." },
  { id: "P005", img: "images/productos/P005.svg", name: "Blusa camisera oversize", cat: "blusas", kind: "blusa", v: 2, pat: false, price: 21, old: 0, stock: 20, colors: ["Camel", "Blanco", "Café"], sizes: SIZES, rating: 4.4, sold: 410, isNew: false, desc: "Camisa amplia de algodón con botones al frente. Combina con jeans o se usa abierta sobre un top." },
  { id: "P006", img: "images/productos/P006.svg", name: "Blusa manga abullonada", cat: "blusas", kind: "blusa", v: 2, pat: false, price: 17.5, old: 23, stock: 16, colors: ["Nude", "Chocolate", "Negro"], sizes: SIZES, rating: 4.6, sold: 870, isNew: false, desc: "Manga larga con puño elástico y hombro con volumen. Un toque romántico para cualquier día." },
  { id: "P007", img: "images/productos/P007.svg", name: "Pantalón palazzo", cat: "pantalones", kind: "pantalon", v: 1, pat: false, price: 26.99, old: 0, stock: 22, colors: ["Negro", "Arena", "Chocolate"], sizes: SIZES, rating: 4.7, sold: 960, isNew: false, desc: "Pierna ancha de tiro alto con caída fluida. Cintura con elástico atrás para mayor comodidad." },
  { id: "P008", img: "images/productos/P008.svg", name: "Jean mom fit", cat: "pantalones", kind: "pantalon", v: 2, pat: false, price: 29.99, old: 38, stock: 26, colors: ["Café", "Arena", "Blanco"], sizes: SIZES, rating: 4.8, sold: 3020, isNew: false, desc: "Jean de tiro alto y pierna relajada, de mezclilla con un poco de elasticidad. Cinco bolsillos y cierre con botón." },
  { id: "P009", img: "images/productos/P009.svg", name: "Pantalón sastre de pierna recta", cat: "pantalones", kind: "pantalon", v: 0, pat: false, price: 32, old: 0, stock: 12, colors: ["Camel", "Negro", "Marfil"], sizes: SIZES, rating: 4.6, sold: 380, isNew: true, desc: "Corte sastre con pinzas y raya al frente. Tela con caída que mantiene su forma todo el día." },
  { id: "P010", img: "images/productos/P010.svg", name: "Pantalón de lino cintura alta", cat: "pantalones", kind: "pantalon", v: 0, pat: false, price: 27.5, old: 0, stock: 15, colors: ["Marfil", "Nude"], sizes: SIZES, rating: 4.5, sold: 450, isNew: false, desc: "Lino fresco con cintura alta y cierre lateral. Perfecto para los días calurosos." },
  { id: "P011", img: "images/productos/P011.svg", name: "Jeggings entubados", cat: "pantalones", kind: "pantalon", v: 2, pat: false, price: 24, old: 0, stock: 28, colors: ["Negro", "Chocolate"], sizes: SIZES, rating: 4.3, sold: 1710, isNew: false, desc: "Se ajustan como leggings y lucen como jeans. Tela elástica y cómoda para todo el día." },
  { id: "P012", img: "images/productos/P012.svg", name: "Pantalón cargo beige", cat: "pantalones", kind: "pantalon", v: 1, pat: false, price: 28.9, old: 35, stock: 17, colors: ["Arena", "Camel"], sizes: SIZES, rating: 4.4, sold: 590, isNew: false, desc: "Bolsillos laterales amplios, cintura ajustable y pierna holgada. Estilo casual con mucha personalidad." },
  { id: "P013", img: "images/productos/P013.svg", name: "Vestido midi strapless", cat: "vestidos", kind: "vestido", v: 0, pat: false, price: 39.99, old: 52, stock: 10, colors: ["Nude", "Marfil", "Negro"], sizes: SIZES, rating: 4.9, sold: 1840, isNew: false, desc: "Corset ajustado y falda con vuelo que llega a media pierna. El favorito para bodas y eventos de tarde." },
  { id: "P014", img: "images/productos/P014.svg", name: "Vestido satinado de tirantes", cat: "vestidos", kind: "vestido", v: 1, pat: false, price: 34.5, old: 0, stock: 13, colors: ["Chocolate", "Rosa palo", "Camel"], sizes: SIZES, rating: 4.6, sold: 720, isNew: true, desc: "Vestido tipo lencero con tirantes finos y falda fluida. Se ve elegante con tacones o sandalias planas." },
  { id: "P015", img: "images/productos/P015.svg", name: "Vestido largo manga larga", cat: "vestidos", kind: "vestido", v: 2, pat: false, price: 44, old: 0, stock: 9, colors: ["Café", "Negro", "Arena"], sizes: SIZES, rating: 4.7, sold: 330, isNew: true, desc: "Maxi vestido con cinturón a la cintura y manga larga. Tela con caída para eventos formales." },
  { id: "P016", img: "images/productos/P016.svg", name: "Vestido floral de verano", cat: "vestidos", kind: "vestido", v: 3, pat: true, price: 31.99, old: 40, stock: 19, colors: ["Rosa palo", "Marfil"], sizes: SIZES, rating: 4.8, sold: 2260, isNew: false, desc: "Estampado floral, manga corta y falda con vuelo. Ligero y fresco para paseos y fiestas de día." },
  { id: "P017", img: "images/productos/P017.svg", name: "Vestido camisero con cinturón", cat: "vestidos", kind: "vestido", v: 3, pat: false, price: 36, old: 0, stock: 11, colors: ["Camel", "Blanco", "Chocolate"], sizes: SIZES, rating: 4.5, sold: 410, isNew: false, desc: "Estilo camisero con botones al frente y cinturón para marcar la cintura. Versátil de la oficina a la cena." },
  { id: "P018", img: "images/productos/P018.svg", name: "Vestido de cóctel con vuelo", cat: "vestidos", kind: "vestido", v: 4, pat: false, price: 48.5, old: 0, stock: 8, colors: ["Negro", "Chocolate", "Nude"], sizes: SIZES, rating: 4.9, sold: 260, isNew: true, desc: "Corto, con tirantes y falda amplia con vuelo. Forro interior suave para una caída perfecta." },
  { id: "P019", img: "images/productos/P019.svg", name: "Bolso tote de cuero vegano", cat: "accesorios", kind: "bolso", v: 0, pat: false, price: 27, old: 0, stock: 15, colors: ["Camel", "Chocolate", "Negro"], sizes: ONE_SIZE, rating: 4.7, sold: 1190, isNew: false, desc: "Bolso amplio con asas reforzadas, cierre con broche y bolsillo interior. Cabe una laptop de 13 pulgadas." },
  { id: "P020", img: "images/productos/P020.svg", name: "Lentes de sol cat-eye", cat: "accesorios", kind: "lentes", v: 0, pat: false, price: 12.99, old: 18, stock: 40, colors: ["Café", "Negro", "Dorado"], sizes: ONE_SIZE, rating: 4.5, sold: 2480, isNew: false, desc: "Marco de forma felina con protección UV400. Incluye estuche de tela." },
  { id: "P021", img: "images/productos/P021.svg", name: "Collar dorado con perla", cat: "accesorios", kind: "collar", v: 0, pat: false, price: 9.99, old: 0, stock: 35, colors: ["Dorado", "Plateado"], sizes: ONE_SIZE, rating: 4.8, sold: 1560, isNew: true, desc: "Cadena fina con una perla sintética al centro. Largo ajustable de 40 a 46 cm." },
  { id: "P022", img: "images/productos/P022.svg", name: "Aretes gota dorados", cat: "accesorios", kind: "aretes", v: 0, pat: false, price: 7.5, old: 0, stock: 50, colors: ["Dorado", "Plateado"], sizes: ONE_SIZE, rating: 4.6, sold: 3310, isNew: false, desc: "Aretes ligeros en forma de gota con gancho seguro. No pesan y combinan con todo." },
  { id: "P023", img: "images/productos/P023.svg", name: "Cinturón fino con hebilla", cat: "accesorios", kind: "cinturon", v: 0, pat: false, price: 11, old: 0, stock: 25, colors: ["Café", "Negro", "Camel"], sizes: ONE_SIZE, rating: 4.4, sold: 640, isNew: false, desc: "Cinturón delgado con hebilla dorada y varios ajustes. Marca la cintura de vestidos y blusas largas." },
  { id: "P024", img: "images/productos/P024.svg", name: "Sombrero de paja ala ancha", cat: "accesorios", kind: "sombrero", v: 0, pat: false, price: 15.9, old: 21, stock: 14, colors: ["Arena", "Camel"], sizes: ONE_SIZE, rating: 4.7, sold: 780, isNew: false, desc: "Paja natural con cinta de tela en la copa. Ala ancha que protege del sol en playa o paseos." }
];

/* ---------- 3. BASE DE DATOS (IndexedDB, con respaldo en memoria si el navegador la bloquea) ---------- */
const DB = (() => {
  const NAME = "looks_amazing_db", VERSION = 1;
  const KEYS = { products: "id", cart: "key", orders: "id", messages: "id", backups: "id", meta: "key" };
  let idb = null, modo = "memoria";
  const mem = {};
  for (const s in KEYS) mem[s] = new Map();

  function open() {
    return new Promise(resolve => {
      try {
        if (!window.indexedDB) { resolve(false); return; }
        const req = indexedDB.open(NAME, VERSION);
        req.onupgradeneeded = () => {
          const d = req.result;
          for (const s in KEYS) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: KEYS[s] });
        };
        req.onsuccess = () => { idb = req.result; modo = "IndexedDB"; resolve(true); };
        req.onerror = () => resolve(false);
        req.onblocked = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }
  function run(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const t = idb.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => resolve(r ? r.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  return {
    open,
    get modo() { return modo; },
    async all(s) { return idb ? run(s, "readonly", os => os.getAll()) : [...mem[s].values()]; },        // CONSULTAR
    async get(s, k) { return idb ? run(s, "readonly", os => os.get(k)) : mem[s].get(k); },
    async put(s, v) { if (idb) await run(s, "readwrite", os => os.put(v)); else mem[s].set(v[KEYS[s]], v); return v; },  // CREAR / MODIFICAR
    async del(s, k) { if (idb) await run(s, "readwrite", os => os.delete(k)); else mem[s].delete(k); },                // ELIMINAR
    async clear(s) { if (idb) await run(s, "readwrite", os => os.clear()); else mem[s].clear(); }
  };
})();

async function snapshotData() {
  return { app: "looks-amazing", version: 1, date: new Date().toISOString(), products: await DB.all("products"), orders: await DB.all("orders"), messages: await DB.all("messages") };
}
async function createBackup(label) {
  const data = await snapshotData();
  await DB.put("backups", { id: "B" + Date.now(), date: data.date, label, counts: { products: data.products.length, orders: data.orders.length, messages: data.messages.length }, data });
  let list = (await DB.all("backups")).sort((a, b) => a.date.localeCompare(b.date));
  while (list.length > STORE.maxBackups) { const oldest = list.shift(); await DB.del("backups", oldest.id); }
  await loadAll();
}
async function restoreData(data, label) {
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.orders) || !Array.isArray(data.messages)) throw new Error("Formato inválido");
  await createBackup("Automático antes de " + label);
  for (const s of ["products", "orders", "messages"]) { await DB.clear(s); for (const r of data[s]) await DB.put(s, r); }
  await DB.put("meta", { key: "seeded", value: true });
  await loadAll(); refreshCartUI();
}