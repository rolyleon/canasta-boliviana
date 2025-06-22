import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCbE78-0DMWVEuf7rae3uyI-FqhDTPL3J8",
  authDomain: "canasta-boliviana.firebaseapp.com",
  projectId: "canasta-boliviana",
  storageBucket: "canasta-boliviana.appspot.com",
  messagingSenderId: "995591486402",
  appId: "1:995591486402:web:51517ae579d2a43f45b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cargar unidades según producto seleccionado
export function CargarUnidades() {
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

  const unidadesUnidad = [
    { value: 'unidad', label: 'Unidad' }
  ];

  const unidadesSolidosConArroba = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'arroba', label: 'Arroba (arroba)' },
    { value: 'q', label: 'Quintal (q)' },
    { value: 't', label: 'Tonelada (t)' }
  ];

  let opciones = unidadesGenerales;
  if (['Aceite'].includes(producto)) {
    opciones = unidadesLiquidos;
  } else if (['Huevo', 'Pan'].includes(producto)) {
    opciones = unidadesUnidad;
  } else if (['Arroz', 'Harina', 'Lenteja'].includes(producto)) {
    opciones = unidadesSolidosConArroba;
  }

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}
window.CargarUnidades = CargarUnidades;

// Mapeo etiquetas unidades
function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)',
    q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)',
    l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad', arroba: 'Arroba (arroba)'
  };
  return map[codigo] || codigo;
}

// Obtener semana actual
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('es-BO');
}

// Mostrar datos
function mostrarDatos(datos, semanaInicio, semanaFin) {
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = '';
  const datosFiltrados = datos.filter(d => {
    const fecha = new Date(d.fecha);
    return fecha >= semanaInicio && fecha <= semanaFin;
  });

  if (!datosFiltrados.length) {
    tbody.innerHTML = `<tr><td colspan="5">No hay datos registrados para esta semana.</td></tr>`;
    return;
  }

  datosFiltrados.forEach(d => {
    tbody.innerHTML += `<tr>
      <td>${d.producto}</td>
      <td>${parseFloat(d.precio).toFixed(2)}</td>
      <td>${unidadLabel(d.equivalencia)}</td>
      <td>${d.ciudad}</td>
      <td>${formatDate(new Date(d.fecha))}</td>
    </tr>`;
  });
}

// Mostrar estadisticas
function mostrarEstadisticas(datos, semanaInicio, semanaFin) {
  const tbody = document.getElementById('tabla-estadisticas');
  tbody.innerHTML = '';
  const datosFiltrados = datos.filter(d => {
    const fecha = new Date(d.fecha);
    return fecha >= semanaInicio && fecha <= semanaFin;
  });

  const agrupados = {};
  datosFiltrados.forEach(d => {
    if (!agrupados[d.producto]) agrupados[d.producto] = [];
    agrupados[d.producto].push(d);
  });

  if (Object.keys(agrupados).length === 0) {
    tbody.innerHTML = '<tr><td>No hay productos para esta semana.</td></tr>';
    return;
  }

  Object.keys(agrupados).forEach(prod => {
    tbody.innerHTML += `<tr style="cursor:pointer;" onclick="mostrarDetalle('${prod}')">
      <td style="color:blue;">${prod}</td></tr>`;
  });
}

// Ver detalle producto
window.mostrarDetalle = async function(producto) {
  const datos = await obtenerDatosFirebase();
  const registros = datos.filter(d => d.producto === producto &&
    new Date(d.fecha) >= currentSemanaInicio && new Date(d.fecha) <= currentSemanaFin);

  const detalleDiv = document.getElementById('detalle-estadisticas');
  const detalleContenido = document.getElementById('detalle-contenido');

  if (!registros.length) {
    detalleContenido.innerHTML = "Sin registros esta semana.";
    detalleDiv.classList.remove('hidden');
    return;
  }

  let html = `<strong>${producto}</strong><br><br>`;
  const agrupados = {};

  registros.forEach(r => {
    if (!agrupados[r.equivalencia]) agrupados[r.equivalencia] = [];
    agrupados[r.equivalencia].push(r);
  });

  for (const unidad in agrupados) {
    const lista = agrupados[unidad];
    const precios = lista.map(r => parseFloat(r.precio));
    const max = Math.max(...precios);
    const min = Math.min(...precios);
    const avg = precios.reduce((a,b) => a+b, 0) / precios.length;

    html += `<div>
      <strong>Unidad: ${unidadLabel(unidad)}</strong><br>
      Máximo: ${max.toFixed(2)} Bs<br>
      Mínimo: ${min.toFixed(2)} Bs<br>
      Promedio: ${avg.toFixed(2)} Bs<br>
      Registros: ${precios.length}
    </div><br>`;
  }

  detalleContenido.innerHTML = html;
  detalleDiv.classList.remove('hidden');
};

// Obtener datos desde Firestore
async function obtenerDatosFirebase() {
  const snapshot = await getDocs(collection(db, "precios"));
  return snapshot.docs.map(doc => doc.data());
}

// Variables globales de semana
let currentSemanaInicio = getMonday(new Date());
let currentSemanaFin = new Date(currentSemanaInicio);
currentSemanaFin.setDate(currentSemanaInicio.getDate() + 6);

// Mostrar datos semana
async function cargarDatosSemana() {
  const datos = await obtenerDatosFirebase();
  mostrarDatos(datos, currentSemanaInicio, currentSemanaFin);
  mostrarEstadisticas(datos, currentSemanaInicio, currentSemanaFin);
}

// Registrar precio en Firestore
document.getElementById('btn-reportar').addEventListener('click', async () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (producto && !isNaN(precio) && equivalencia && ciudad) {
    try {
      await addDoc(collection(db, "precios"), {
        producto,
        precio,
        equivalencia,
        ciudad,
        fecha: new Date().toISOString()
      });
      mostrarToast('Precio guardado en Firebase.', '#27ae60');
      limpiarFormulario();
      cargarDatosSemana();
    } catch (e) {
      console.error("Error al guardar:", e);
      mostrarToast('Error al guardar.', '#e74c3c');
    }
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});

// Utilidades
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

// Cambiar semana
document.getElementById('btn-semana-anterior').addEventListener('click', () => {
  currentSemanaInicio.setDate(currentSemanaInicio.getDate() - 7);
  currentSemanaFin.setDate(currentSemanaFin.getDate() - 7);
  cargarDatosSemana();
});
document.getElementById('btn-semana-siguiente').addEventListener('click', () => {
  currentSemanaInicio.setDate(currentSemanaInicio.getDate() + 7);
  currentSemanaFin.setDate(currentSemanaFin.getDate() + 7);
  cargarDatosSemana();
});

// Mostrar datos al cargar
window.onload = () => {
  cargarDatosSemana();
};
