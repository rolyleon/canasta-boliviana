import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbE78-0DMWVEuf7rae3uyI-FqhDTPL3J8",
  authDomain: "canasta-boliviana.firebaseapp.com",
  projectId: "canasta-boliviana",
  storageBucket: "canasta-boliviana.appspot.com",
  messagingSenderId: "995591486402",
  appId: "1:995591486402:web:51517ae579805d2a43f45b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';

  const unidadesGenerales = [
    { value: 'g', label: 'Gramos (g)' }, { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' }, { value: 'a', label: 'Arroba (a)' },
    { value: 'q', label: 'Quintal (q)' }, { value: 't', label: 'Tonelada (t)' }
  ];
  const unidadesLiquidos = [
    { value: 'ml', label: 'Mililitros (ml)' }, { value: 'l', label: 'Litros (l)' },
    { value: 'gal', label: 'Galón (gal)' }, { value: 'bbl', label: 'Barril (bbl)' }
  ];

  let opciones = unidadesGenerales;
  if (['Aceite', 'Leche en polvo', 'Pescado'].includes(producto)) opciones = unidadesLiquidos;
  if (['Huevo', 'Pan'].includes(producto)) opciones = [{ value: 'unidad', label: 'Unidad' }];

  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}
window.CargarUnidades = CargarUnidades;

function obtenerClaveSemana(fecha) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semanaNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${semanaNum.toString().padStart(2, '0')}`;
}

function fechasSemana(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  return { inicio: ISOweekStart, fin: ISOweekEnd };
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function guardarRegistroSemanal(registro) {
  try {
    await addDoc(collection(db, "registros"), registro);
    console.log("Guardado en Firestore:", registro);
  } catch (e) {
    console.error("Error al guardar en Firestore: ", e);
    throw e;
  }
}

async function obtenerDatosSemana(claveSemana) {
  const datos = [];
  const q = query(collection(db, "registros"), where("claveSemana", "==", claveSemana));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => datos.push(doc.data()));
  return datos;
}

let semanaSeleccionadaIndex = 0;

function calcularClaveSemanaConOffset(offset) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offset * 7);
  return obtenerClaveSemana(fecha);
}

function mostrarTituloSemana(claveSemana) {
  const titulo = document.getElementById('titulo-semana');
  const [yearStr, semanaStr] = claveSemana.split('-');
  const { inicio, fin } = fechasSemana(+yearStr, +semanaStr);
  titulo.textContent = semanaSeleccionadaIndex === 0
    ? `Semana Actual (${formatearFecha(inicio)} al ${formatearFecha(fin)})`
    : `Semana ${semanaStr} del ${yearStr} (${formatearFecha(inicio)} al ${formatearFecha(fin)})`;
  document.getElementById('btn-semana-siguiente').disabled = (semanaSeleccionadaIndex >= 0);
}

function unidadLabel(codigo) {
  const map = { g:'Gramos (g)',kg:'Kilogramos (kg)',lb:'Libras (lb)',a:'Arroba (a)',q:'Quintal (q)',t:'Tonelada (t)',ml:'Mililitros (ml)',l:'Litros (l)',gal:'Galón (gal)',bbl:'Barril (bbl)',unidad:'Unidad' };
  return map[codigo] || codigo;
}

function mostrarDatos(datos) {
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = datos.length ? '' : `<tr><td colspan="4">No hay datos registrados.</td></tr>`;
  datos.forEach(d => {
    tbody.innerHTML += `<tr>
      <td>${d.producto}</td>
      <td>${d.precio.toFixed(2)}</td>
      <td>${unidadLabel(d.equivalencia)}</td>
      <td>${d.ciudad}</td>
    </tr>`;
  });
}

function mostrarEstadisticas(datos) {
  const tbodyEstadisticas = document.getElementById('tabla-estadisticas');
  const agrupados = datos.reduce((acc, d) => {
    acc[d.producto] = acc[d.producto] || [];
    acc[d.producto].push(d);
    return acc;
  }, {});
  tbodyEstadisticas.innerHTML = Object.keys(agrupados).length
    ? Object.keys(agrupados).map(p => `<tr onclick="mostrarDetalle('${p}')" style="cursor:pointer;"><td style="color:blue;">${p}</td></tr>`).join('')
    : '<tr><td>No hay productos.</td></tr>';
}

window.mostrarDetalle = async function(producto) {
  const claveSemana = semanaSeleccionadaIndex === 0 ? obtenerClaveSemana(new Date()) : calcularClaveSemanaConOffset(semanaSeleccionadaIndex);
  const datos = await obtenerDatosSemana(claveSemana);
  const registrosProducto = datos.filter(d => d.producto === producto);
  const detalleDiv = document.getElementById('detalle-estadisticas');
  const detalleContenido = document.getElementById('detalle-contenido');
  if (!registrosProducto.length) {
    detalleContenido.innerHTML = "Sin registros.";
    detalleDiv.classList.remove('hidden');
    return;
  }

  let detalleHTML = `<strong>${producto}</strong><br><br>`;
  const agrupados = registrosProducto.reduce((acc, r) => {
    acc[r.equivalencia] = acc[r.equivalencia] || [];
    acc[r.equivalencia].push(r);
    return acc;
  }, {});
  for (const unidad in agrupados) {
    const registros = agrupados[unidad];
    const precios = registros.map(r => r.precio);
    const max = Math.max(...precios);
    const min = Math.min(...precios);
    const ciudadesMax = registros.filter(r => r.precio === max).map(r => r.ciudad).join(', ');
    const ciudadesMin = registros.filter(r => r.precio === min).map(r => r.ciudad).join(', ');
    detalleHTML += `<strong>Unidad:</strong> ${unidadLabel(unidad)}<br>
      Máximo: ${max.toFixed(2)} Bs (${ciudadesMax})<br>
      Mínimo: ${min.toFixed(2)} Bs (${ciudadesMin})<br><br>`;
  }
  const promedio = registrosProducto.reduce((sum, r) => sum + r.precio, 0) / registrosProducto.length;
  detalleHTML += `<strong>Promedio:</strong> ${promedio.toFixed(2)} Bs<br>`;
  detalleContenido.innerHTML = detalleHTML;
  detalleDiv.classList.remove('hidden');
};

async function mostrarDatosSemana() {
  const clave = semanaSeleccionadaIndex === 0 ? obtenerClaveSemana(new Date()) : calcularClaveSemanaConOffset(semanaSeleccionadaIndex);
  const datosSemana = await obtenerDatosSemana(clave);
  mostrarDatos(datosSemana);
  mostrarEstadisticas(datosSemana);
  mostrarTituloSemana(clave);
}

function limpiarFormulario() {
  document.getElementById('Producto').selectedIndex = 0;
  document.getElementById('precio').value = '';
  document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  document.getElementById('ciudad').selectedIndex = 0;
}

function mostrarToast(msg, color) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = color;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

document.getElementById('btn-reportar').addEventListener('click', async () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;
  if (producto && !isNaN(precio) && precio > 0 && equivalencia && ciudad) {
    const claveSemana = obtenerClaveSemana(new Date());
    try {
      await guardarRegistroSemanal({ producto, precio, equivalencia, ciudad, fecha: new Date().toISOString(), claveSemana });
      limpiarFormulario();
      mostrarToast('Precio guardado con éxito.', '#27ae60');
      mostrarDatosSemana();
    } catch {
      mostrarToast('Error guardando datos.', '#e74c3c');
    }
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});

document.getElementById('btn-semana-anterior').addEventListener('click', () => {
  semanaSeleccionadaIndex--;
  mostrarDatosSemana();
});
document.getElementById('btn-semana-siguiente').addEventListener('click', () => {
  if (semanaSeleccionadaIndex < 0) {
    semanaSeleccionadaIndex++;
    mostrarDatosSemana();
  }
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});
document.getElementById('Producto').addEventListener('change', CargarUnidades);

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  if (id === 'estadisticas') mostrarDatosSemana();
};
