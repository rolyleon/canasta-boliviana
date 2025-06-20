// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbE78-0DMWVEuf7rae3uyI-FqhDTPL3J8",
  authDomain: "canasta-boliviana.firebaseapp.com",
  projectId: "canasta-boliviana",
  storageBucket: "canasta-boliviana.appspot.com",
  messagingSenderId: "995591486402",
  appId: "1:995591486402:web:51517ae579805d2a43f45b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID único de usuario local
const usuarioId = localStorage.getItem("usuarioId") || generarIdUsuario();
function generarIdUsuario() {
  const id = 'usuario_' + Math.random().toString(36).substring(2, 12);
  localStorage.setItem("usuarioId", id);
  return id;
}

// Función para obtener número de semana actual
function getNumeroSemana(date = new Date()) {
  const lunes = new Date(date.setDate(date.getDate() - (date.getDay() + 6) % 7));
  const año = lunes.getFullYear();
  const semana = Math.ceil((((lunes - new Date(año, 0, 1)) / 86400000) + 1) / 7);
  return ${año}-S${semana};
}

// Rango de fecha de una semana
function getRangoSemana(date = new Date()) {
  const lunes = new Date(date.setDate(date.getDate() - (date.getDay() + 6) % 7));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return {
    desde: lunes.toISOString().slice(0, 10),
    hasta: domingo.toISOString().slice(0, 10),
    texto: Del ${lunes.toLocaleDateString()} al ${domingo.toLocaleDateString()}
  };
}

// Unidades por producto
export function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '';

  const unidadesPeso = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'arroba', label: 'Arroba' },
    { value: 'q', label: 'Quintal (q)' },
    { value: 't', label: 'Tonelada (t)' }
  ];

  const unidadesLiquido = [
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'l', label: 'Litros (l)' },
    { value: 'gal', label: 'Galón (gal)' },
    { value: 'bbl', label: 'Barril (bbl)' }
  ];

  let opciones = unidadesPeso;
  if (['Aceite', 'Leche', 'Refresco', 'Agua', 'Jugo'].includes(producto)) opciones = unidadesLiquido;
  else if (producto === 'Huevo') opciones = [{ value: 'unidad', label: 'Unidad' }];

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += <option value="${u.value}">${u.label}</option>;
  });
}

function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)', arroba: 'Arroba',
    q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)',
    l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad'
  };
  return map[codigo] || codigo;
}

async function guardarRegistroSemanal(registro) {
  try {
    await addDoc(collection(db, "precios"), registro);
    mostrarToast('Precio guardado con éxito.', '#27ae60');
    console.log("Registro guardado en Firestore");
  } catch (e) {
    mostrarToast('Error al guardar el precio.', '#e74c3c');
    console.error("Error al guardar en Firestore: ", e);
  }
}

async function obtenerDatosSemana() {
  try {
    const querySnapshot = await getDocs(collection(db, "precios"));
    const datos = [];
    querySnapshot.forEach((doc) => {
      datos.push(doc.data());
    });
    return datos;
  } catch (e) {
    console.error("Error al leer datos de Firestore: ", e);
    return [];
  }
}

// Mostrar registros del usuario actual en semana actual
async function mostrarDatosSemanaUsuario() {
  const datos = await obtenerDatosSemana();
  const filtrados = datos.filter(d => d.usuarioId === usuarioId && d.semana === getNumeroSemana());
  mostrarDatos(filtrados);
}

// Mostrar tabla
function mostrarDatos(datos) {
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = '';
  if (!datos.length) {
    tbody.innerHTML = <tr><td colspan="4">No hay datos registrados.</td></tr>;
    return;
  }
  datos.forEach(d => {
    tbody.innerHTML += `<tr>
      <td>${d.producto}</td>
      <td>${Number(d.precio).toFixed(2)}</td>
      <td>${unidadLabel(d.equivalencia)}</td>
      <td>${d.ciudad}</td>
    </tr>`;
  });
}

// === Estadísticas ===
let semanaSeleccionada = getNumeroSemana();

async function mostrarDatosSemana() {
  const datosSemana = (await obtenerDatosSemana()).filter(d => d.semana === semanaSeleccionada);
  mostrarEstadisticas(datosSemana);
  const { texto } = getRangoSemana();
  document.getElementById('titulo-semana').textContent = texto;
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
  obtenerDatosSemana().then((datos) => {
    const registrosProducto = datos.filter(d => d.producto === producto && d.semana === semanaSeleccionada);
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
  });
};

// Cambiar semana
document.getElementById('btn-semana-anterior').addEventListener('click', () => cambiarSemana(-1));
document.getElementById('btn-semana-siguiente').addEventListener('click', () => cambiarSemana(1));

function cambiarSemana(offset) {
  const base = new Date();
  const dia = base.getDay();
  const lunes = new Date(base.setDate(base.getDate() - (dia + 6) % 7));
  lunes.setDate(lunes.getDate() + offset * 7);
  semanaSeleccionada = getNumeroSemana(lunes);
  mostrarDatosSemana();
}

// === Formulario ===
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

// === Eventos ===
document.getElementById('btn-reportar').addEventListener('click', () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') {
    guardarRegistroSemanal({
      producto, precio, equivalencia, ciudad,
      fecha: new Date().toISOString(),
      usuarioId,
      semana: getNumeroSemana()
    });
    limpiarFormulario();
    mostrarDatosSemanaUsuario();
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});

document.getElementById('Producto').addEventListener('change', CargarUnidades);

// === Carga inicial ===
window.addEventListener('load', () => {
  mostrarDatosSemanaUsuario();
  mostrarDatosSemana();
  CargarUnidades();
});

// Menú
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  if (id === 'estadisticas') mostrarDatosSemana();
};
