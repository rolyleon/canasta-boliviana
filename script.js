// ✅ CANASTA BOLIVIANA - script.js MEJORADO AL 100% import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js"; import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyCbE78-0DMWVEuf7rae3uyI-FqhDTPL3J8", authDomain: "canasta-boliviana.firebaseapp.com", projectId: "canasta-boliviana", storageBucket: "canasta-boliviana.appspot.com", messagingSenderId: "995591486402", appId: "1:995591486402:web:51517ae579805d2a43f45b" };

const app = initializeApp(firebaseConfig); const db = getFirestore(app);

// 🔐 Generar o recuperar ID único por usuario let usuarioId = localStorage.getItem('usuarioId'); if (!usuarioId) { usuarioId = crypto.randomUUID(); localStorage.setItem('usuarioId', usuarioId); }

// 📅 Utilidades de fecha function obtenerLunes(date = new Date()) { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); // lunes anterior d.setDate(diff); d.setHours(0, 0, 0, 0); return d; }

function obtenerDomingo(lunes) { const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6); domingo.setHours(23, 59, 59, 999); return domingo; }

function formatearFechaCompleta(fecha) { return fecha.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' }); }

let semanaActual = obtenerLunes();

export function CargarUnidades() { const producto = document.getElementById('Producto').value; const equivalenciaSelect = document.getElementById('equivalencia'); equivalenciaSelect.innerHTML = '';

const unidadesGenerales = [ { value: 'g', label: 'Gramos (g)' }, { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'lb', label: 'Libras (lb)' }, { value: 'q', label: 'Quintal (q)' }, { value: 't', label: 'Tonelada (t)' } ];

const unidadesLiquidos = [ { value: 'ml', label: 'Mililitros (ml)' }, { value: 'l', label: 'Litros (l)' }, { value: 'gal', label: 'Galón (gal)' }, { value: 'bbl', label: 'Barril (bbl)' } ];

let opciones = unidadesGenerales; if (["Aceite", "Leche en polvo", "Pescado"].includes(producto)) opciones = unidadesLiquidos; else if (producto === "Huevo") opciones = [{ value: "unidad", label: "Unidad" }];

equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>'; opciones.forEach(u => { equivalenciaSelect.innerHTML += <option value="${u.value}">${u.label}</option>; }); }

function unidadLabel(codigo) { const map = { g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)', q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)', l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad' }; return map[codigo] || codigo; }

async function guardarRegistroSemanal(registro) { try { await addDoc(collection(db, "precios"), { ...registro, usuarioId }); mostrarToast('Precio guardado con éxito.', '#27ae60'); console.log("Registro guardado en Firestore"); } catch (e) { mostrarToast('Error al guardar el precio.', '#e74c3c'); console.error("Error al guardar en Firestore: ", e); } }

async function obtenerDatosSemana(lunes, usuarioSolo = false) { try { const querySnapshot = await getDocs(collection(db, "precios")); const inicio = lunes; const fin = obtenerDomingo(lunes); return querySnapshot.docs.map(doc => doc.data()).filter(d => { const fecha = new Date(d.fecha); const enSemana = fecha >= inicio && fecha <= fin; const esUsuario = !usuarioSolo || d.usuarioId === usuarioId; return enSemana && esUsuario; }); } catch (e) { console.error("Error al leer datos de Firestore: ", e); return []; } }

function mostrarDatos(datos) { const tbody = document.getElementById('tabla-precios'); tbody.innerHTML = ''; if (!datos.length) { tbody.innerHTML = <tr><td colspan="4">No hay datos registrados.</td></tr>; return; } datos.forEach(d => { tbody.innerHTML += <tr> <td>${d.producto}</td> <td>${Number(d.precio).toFixed(2)}</td> <td>${unidadLabel(d.equivalencia)}</td> <td>${d.ciudad}</td> </tr>; }); }

function mostrarEstadisticas(datos) { const tbody = document.getElementById('tabla-estadisticas'); tbody.innerHTML = ''; const agrupados = {};

datos.forEach(d => { if (!agrupados[d.producto]) agrupados[d.producto] = []; agrupados[d.producto].push(d); });

if (Object.keys(agrupados).length === 0) { tbody.innerHTML = '<tr><td>No hay productos.</td></tr>'; return; }

Object.keys(agrupados).forEach(producto => { tbody.innerHTML += <tr style="cursor:pointer;" onclick="mostrarDetalle('${producto}')"> <td style="color:blue;">${producto}</td></tr>; }); }

window.mostrarDetalle = async function(producto) { const datos = await obtenerDatosSemana(semanaActual); const registros = datos.filter(d => d.producto === producto); const detalleDiv = document.getElementById('detalle-estadisticas'); const detalleContenido = document.getElementById('detalle-contenido');

if (!registros.length) { detalleContenido.innerHTML = "Sin registros."; detalleDiv.classList.remove('hidden'); return; }

let html = <strong>${producto}</strong><br><br>; const agrupados = {};

registros.forEach(r => { if (!agrupados[r.equivalencia]) agrupados[r.equivalencia] = []; agrupados[r.equivalencia].push(r); });

for (const unidad in agrupados) { const registrosUnidad = agrupados[unidad]; const precios = registrosUnidad.map(r => Number(r.precio)); const max = Math.max(...precios); const min = Math.min(...precios); const ciudadesMax = registrosUnidad.filter(r => Number(r.precio) === max).map(r => r.ciudad).join(', '); const ciudadesMin = registrosUnidad.filter(r => Number(r.precio) === min).map(r => r.ciudad).join(', ');

html += `<strong>Unidad:</strong> ${unidadLabel(unidad)}<br>
Máximo: ${max.toFixed(2)} Bs (${ciudadesMax})<br>
Mínimo: ${min.toFixed(2)} Bs (${ciudadesMin})<br><br>`;

}

const promedio = registros.reduce((sum, r) => sum + Number(r.precio), 0) / registros.length; html += <strong>Promedio:</strong> ${promedio.toFixed(2)} Bs<br>;

detalleContenido.innerHTML = html; detalleDiv.classList.remove('hidden'); };

async function mostrarDatosSemana() { const datosUsuario = await obtenerDatosSemana(semanaActual, true); const datosTodos = await obtenerDatosSemana(semanaActual, false);

mostrarDatos(datosUsuario); mostrarEstadisticas(datosTodos);

const inicio = formatearFechaCompleta(semanaActual); const fin = formatearFechaCompleta(obtenerDomingo(semanaActual)); document.getElementById('titulo-semana').textContent = Semana del ${inicio} al ${fin};

document.getElementById('btn-semana-siguiente').disabled = obtenerLunes().getTime() === semanaActual.getTime(); }

function limpiarFormulario() { document.getElementById('Producto').selectedIndex = 0; document.getElementById('precio').value = ''; document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>'; document.getElementById('ciudad').selectedIndex = 0; }

function mostrarToast(msg, color) { const toast = document.getElementById('toast'); toast.textContent = msg; toast.style.background = color; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 3000); }

document.getElementById('btn-reportar').addEventListener('click', () => { const producto = document.getElementById('Producto').value; const precio = parseFloat(document.getElementById('precio').value); const equivalencia = document.getElementById('equivalencia').value; const ciudad = document.getElementById('ciudad').value;

if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') { guardarRegistroSemanal({ producto, precio, equivalencia, ciudad, fecha: new Date().toISOString() }); limpiarFormulario(); mostrarDatosSemana(); } else { mostrarToast('Completa todos los campos.', '#e74c3c'); } });

document.getElementById('Producto').addEventListener('change', CargarUnidades);

document.getElementById('btn-semana-anterior').addEventListener('click', () => { semanaActual.setDate(semanaActual.getDate() - 7); mostrarDatosSemana(); });

document.getElementById('btn-semana-siguiente').addEventListener('click', () => { semanaActual.setDate(semanaActual.getDate() + 7); mostrarDatosSemana(); });

window.addEventListener('load', () => { mostrarDatosSemana(); CargarUnidades(); });

document.getElementById('menu-toggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('hidden'); });

window.mostrarSeccion = function(id) { document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden')); document.getElementById(id).classList.remove('hidden'); document.getElementById('sidebar').classList.add('hidden'); if (id === 'estadisticas') mostrarDatosSemana(); };

