// Firebase config (si usas Firebase, coloca aquí la config real)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbE78-0DMWVEuf7rae3uyI-FqhDTPL3J8",
  authDomain: "canasta-boliviana.firebaseapp.com",
  projectId: "canasta-boliviana",
  storageBucket: "canasta-boliviana.appspot.com",
  messagingSenderId: "995591486402",
  appId: "1:995591486402:web:51517ae579805d2a43f45b"
};

const app = initializeApp(firebaseConfig);

// Quita export si llamas desde HTML directamente
function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '';

  const unidadesGenerales = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'q', label: 'Quintal (q)' },
    { value: 't', label: 'Tonelada (t)' }
  ];

  const unidadesLiquidos = [
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'l', label: 'Litros (l)' },
    { value: 'gal', label: 'Galón (gal)' },
    { value: 'bbl', label: 'Barril (bbl)' }
  ];

  let opciones = unidadesGenerales;
  if (['Aceite', 'Leche en polvo', 'Pescado'].includes(producto)) opciones = unidadesLiquidos;
  else if (producto === 'Huevo') opciones = [{ value: 'unidad', label: 'Unidad' }];

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}

// FUNCIONES CON CORRECCIÓN DE TEMPLATE LITERALS

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

function guardarRegistroSemanal(registro) {
  const historial = JSON.parse(localStorage.getItem('historialSemanal')) || {};
  const claveSemana = obtenerClaveSemana(new Date());
  if (!historial[claveSemana]) historial[claveSemana] = [];
  historial[claveSemana].push(registro);
  localStorage.setItem('historialSemanal', JSON.stringify(historial));
}

function obtenerDatosSemana(claveSemana) {
  const historial = JSON.parse(localStorage.getItem('historialSemanal')) || {};
  return historial[claveSemana] || [];
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
  const year = Number(yearStr);
  const semana = Number(semanaStr);
  const { inicio, fin } = fechasSemana(year, semana);
  const rango = `Del ${formatearFecha(inicio)} al ${formatearFecha(fin)}`;

  titulo.textContent = semanaSeleccionadaIndex === 0
    ? `Semana Actual (${rango})`
    : `Semana ${semana} del ${year} (${rango})`;

  document.getElementById('btn-semana-siguiente').disabled = (semanaSeleccionadaIndex >= 0);
}

function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)',
    q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)',
    l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad'
  };
  return map[codigo] || codigo;
}

function mostrarDatos(datos) {
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = '';
  if (!datos.length) {
    tbody.innerHTML = `<tr><td colspan="4">No hay datos registrados.</td></tr>`;
    return;
  }
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
  tbodyEstadisticas.innerHTML = '';
  const agrupados = {};

  datos.forEach(d => {
    if (!agrupados[d.producto]) agrupados[d.producto] = [];
    agrupados[d.producto].push(d);
  });

  if (Object.keys(agrupados).length === 0) {
    tbodyEstadisticas.innerHTML = '<tr><td>No hay productos.</td></tr>';
    return;
  }

  Object.keys(agrupados).forEach(producto => {
    tbodyEstadisticas.innerHTML += `<tr style="cursor:pointer;" onclick="mostrarDetalle('${producto}')">
      <td style="color:blue;">${producto}</td></tr>`;
  });
}

window.mostrarDetalle = function(producto) {
  const claveSemana = semanaSeleccionadaIndex === 0
    ? obtenerClaveSemana(new Date())
    : calcularClaveSemanaConOffset(semanaSeleccionadaIndex);
  const datos = obtenerDatosSemana(claveSemana);
  const registrosProducto = datos.filter(d => d.producto === producto);
  const detalleDiv = document.getElementById('detalle-estadisticas');
  const detalleContenido = document.getElementById('detalle-contenido');

  if (!registrosProducto.length) {
    detalleContenido.innerHTML = "Sin registros.";
    detalleDiv.classList.remove('hidden');
    return;
  }

  let detalleHTML = `<strong>${producto}</strong><br><br>`;
  const agrupados = {};
  registrosProducto.forEach(r => {
    if (!agrupados[r.equivalencia]) agrupados[r.equivalencia] = [];
    agrupados[r.equivalencia].push(r);
  });

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

function mostrarDatosSemana() {
  const clave = semanaSeleccionadaIndex === 0
    ? obtenerClaveSemana(new Date())
    : calcularClaveSemanaConOffset(semanaSeleccionadaIndex);
  const datosSemana = obtenerDatosSemana(clave);
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

document.getElementById('btn-reportar').addEventListener('click', () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') {
    guardarRegistroSemanal({ producto, precio, equivalencia, ciudad, fecha: new Date().toISOString() });
    limpiarFormulario();
    mostrarToast('Precio guardado con éxito.', '#27ae60');
    mostrarDatosSemana();
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

document.getElementById('Producto').addEventListener('change', CargarUnidades);
window.addEventListener('load', () => {
  mostrarDatosSemana();
  CargarUnidades();
});

// Menú lateral
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  if (id === 'estadisticas') mostrarDatosSemana();
};
