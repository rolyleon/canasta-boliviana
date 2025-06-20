// Firebase y Firestore import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js"; import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js"; import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = { apiKey: "AIzaSyCbE78-0DMWVEuf7rae3uyI-FqhDTPL3J8", authDomain: "canasta-boliviana.firebaseapp.com", projectId: "canasta-boliviana", storageBucket: "canasta-boliviana.appspot.com", messagingSenderId: "995591486402", appId: "1:995591486402:web:51517ae579805d2a43f45b" };

const app = initializeApp(firebaseConfig); const db = getFirestore(app); const auth = getAuth(app);

let semanaOffset = 0; let uid = null;

signInAnonymously(auth).catch(console.error); onAuthStateChanged(auth, (user) => { if (user) { uid = user.uid; mostrarDatosSemana(); } });

export function CargarUnidades() { const producto = document.getElementById('Producto').value; const equivalenciaSelect = document.getElementById('equivalencia'); equivalenciaSelect.innerHTML = '';

const unidadesGenerales = [ { value: 'g', label: 'Gramos (g)' }, { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'lb', label: 'Libras (lb)' }, { value: 'q', label: 'Quintal (q)' }, { value: 't', label: 'Tonelada (t)' } ];

const unidadesLiquidos = [ { value: 'ml', label: 'Mililitros (ml)' }, { value: 'l', label: 'Litros (l)' }, { value: 'gal', label: 'Galón (gal)' }, { value: 'bbl', label: 'Barril (bbl)' } ];

let opciones = unidadesGenerales; if (["Aceite", "Leche en polvo", "Pescado"].includes(producto)) opciones = unidadesLiquidos; else if (producto === 'Huevo') opciones = [{ value: 'unidad', label: 'Unidad' }];

equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>'; opciones.forEach(u => { equivalenciaSelect.innerHTML += <option value="${u.value}">${u.label}</option>; }); }

function unidadLabel(codigo) { const map = { g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)', q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)', l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad' }; return map[codigo] || codigo; }

async function guardarRegistroSemanal(registro) { try { await addDoc(collection(db, "precios"), { ...registro, uid }); mostrarToast('Precio guardado con éxito.', '#27ae60'); mostrarDatosSemana(); } catch (e) { mostrarToast('Error al guardar el precio.', '#e74c3c'); console.error("Error al guardar en Firestore: ", e); } }

function getStartOfWeek(date) { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); d.setHours(0, 0, 0, 0); return new Date(d.setDate(diff)); }

async function obtenerDatosSemana() { try { const querySnapshot = await getDocs(collection(db, "precios")); const datos = []; const now = new Date(); const start = getStartOfWeek(now); start.setDate(start.getDate() + semanaOffset * 7); const end = new Date(start); end.setDate(start.getDate() + 7);

querySnapshot.forEach((doc) => {
  const data = doc.data();
  const fecha = new Date(data.fecha);
  if (fecha >= start && fecha < end && data.uid === uid) {
    datos.push(data);
  }
});
return datos;

} catch (e) { console.error("Error al leer datos de Firestore: ", e); return []; } }

function mostrarDatos(datos) { const tbody = document.getElementById('tabla-precios'); tbody.innerHTML = ''; if (!datos.length) { tbody.innerHTML = <tr><td colspan="4">No hay datos registrados.</td></tr>; return; } datos.forEach(d => { tbody.innerHTML += <tr> <td>${d.producto}</td> <td>${Number(d.precio).toFixed(2)}</td> <td>${unidadLabel(d.equivalencia)}</td> <td>${d.ciudad}</td> </tr>; }); }

async function mostrarDatosSemana() { const datosSemana = await obtenerDatosSemana(); mostrarDatos(datosSemana); const inicio = getStartOfWeek(new Date()); inicio.setDate(inicio.getDate() + semanaOffset * 7); const fin = new Date(inicio); fin.setDate(inicio.getDate() + 6); document.getElementById('titulo-semana').textContent = Semana: ${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}; document.getElementById('btn-semana-siguiente').disabled = semanaOffset >= 0; }

document.getElementById('btn-reportar').addEventListener('click', () => { const producto = document.getElementById('Producto').value; const precio = parseFloat(document.getElementById('precio').value); const equivalencia = document.getElementById('equivalencia').value; const ciudad = document.getElementById('ciudad').value;

if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') { guardarRegistroSemanal({ producto, precio, equivalencia, ciudad, fecha: new Date().toISOString() }); limpiarFormulario(); } else { mostrarToast('Completa todos los campos.', '#e74c3c'); } });

document.getElementById('btn-semana-anterior').addEventListener('click', () => { semanaOffset--; mostrarDatosSemana(); });

document.getElementById('btn-semana-siguiente').addEventListener('click', () => { if (semanaOffset < 0) semanaOffset++; mostrarDatosSemana(); });

document.getElementById('Producto').addEventListener('change', CargarUnidades);

function limpiarFormulario() { document.getElementById('Producto').selectedIndex = 0; document.getElementById('precio').value = ''; document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>'; document.getElementById('ciudad').selectedIndex = 0; }

function mostrarToast(msg, color) { const toast = document.getElementById('toast'); toast.textContent = msg; toast.style.background = color; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 3000); }

// Mostrar estadísticas generales sin filtrar usuario async function mostrarEstadisticas() { const querySnapshot = await getDocs(collection(db, "precios")); const datos = []; querySnapshot.forEach((doc) => datos.push(doc.data()));

const tbodyEstadisticas = document.getElementById('tabla-estadisticas'); tbodyEstadisticas.innerHTML = ''; const agrupados = {}; datos.forEach(d => { if (!agrupados[d.producto]) agrupados[d.producto] = []; agrupados[d.producto].push(d); });

if (Object.keys(agrupados).length === 0) { tbodyEstadisticas.innerHTML = '<tr><td>No hay productos.</td></tr>'; return; }

Object.keys(agrupados).forEach(producto => { tbodyEstadisticas.innerHTML += <tr style="cursor:pointer;" onclick="mostrarDetalle('${producto}')"> <td style="color:blue;">${producto}</td></tr>; }); }

window.mostrarDetalle = function(producto) { getDocs(collection(db, "precios")).then((querySnapshot) => { const registrosProducto = []; querySnapshot.forEach(doc => { const data = doc.data(); if (data.producto === producto) registrosProducto.push(data); });

const detalleDiv = document.getElementById('detalle-estadisticas');
const detalleContenido = document.getElementById('detalle-contenido');
if (!registrosProducto.length) {
  detalleContenido.innerHTML = "Sin registros.";
  detalleDiv.classList.remove('hidden');
  return;
}

let detalleHTML = <strong>${producto}</strong><br><br>;
const agrupados = {};
registrosProducto.forEach(r => {
  if (!agrupados[r.equivalencia]) agrupados[r.equivalencia] = [];
  agrupados[r.equivalencia].push(r);
});

for (const unidad in agrupados) {
  const registros = agrupados[unidad];
  const precios = registros.map(r => Number(r.precio));
  const max = Math.max(...precios);
  const min = Math.min(...precios);

  const ciudadesMax = registros.filter(r => Number(r.precio) === max).map(r => r.ciudad).join(', ');
  const ciudadesMin = registros.filter(r => Number(r.precio) === min).map(r => r.ciudad).join(', ');

  detalleHTML += `<strong>Unidad:</strong> ${unidadLabel(unidad)}<br>
  Máximo: ${max.toFixed(2)} Bs (${ciudadesMax})<br>
  Mínimo: ${min.toFixed(2)} Bs (${ciudadesMin})<br><br>`;
}

const promedio = registrosProducto.reduce((sum, r) => sum + Number(r.precio), 0) / registrosProducto.length;
detalleHTML += <strong>Promedio:</strong> ${promedio.toFixed(2)} Bs<br>;
detalleContenido.innerHTML = detalleHTML;
detalleDiv.classList.remove('hidden');

}); };

window.mostrarSeccion = function(id) { document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); document.getElementById('sidebar').classList.add('hidden'); if (id === 'estadisticas') mostrarEstadisticas(); };

document.getElementById('menu-toggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('hidden'); });

window.addEventListener('load', () => { CargarUnidades(); });
