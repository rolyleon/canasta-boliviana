import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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

function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)',
    q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)',
    l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad'
  };
  return map[codigo] || codigo;
}

// Guardar registro en Firestore
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

// Obtener todos los registros de Firestore
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
      <td>${Number(d.precio).toFixed(2)}</td>
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
  obtenerDatosSemana().then((datos) => {
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
    detalleHTML += `<strong>Promedio:</strong> ${promedio.toFixed(2)} Bs<br>`;
    detalleContenido.innerHTML = detalleHTML;
    detalleDiv.classList.remove('hidden');
  });
};

async function mostrarDatosSemana() {
  const datosSemana = await obtenerDatosSemana();
  mostrarDatos(datosSemana);
  mostrarEstadisticas(datosSemana);
  // Puedes quitar manejo de semanas si solo cargas todo
  document.getElementById('titulo-semana').textContent = "Datos en tiempo real desde Firestore";
  document.getElementById('btn-semana-anterior').disabled = true;
  document.getElementById('btn-semana-siguiente').disabled = true;
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
    mostrarDatosSemana();
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
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
