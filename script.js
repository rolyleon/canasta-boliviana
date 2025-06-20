import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Config Firebase
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

// --- GENERAR O CARGAR ID UNICO DE USUARIO (DISPOSITIVO) ---
let userId = localStorage.getItem('canastaUserId');
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('canastaUserId', userId);
}

// ----------- Función para cargar unidades según producto -----------
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

// ----------- Función para mostrar etiquetas de unidad -----------
function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)',
    q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)',
    l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad'
  };
  return map[codigo] || codigo;
}

// ----------- Función para obtener rango semana dado un Date -----------
function getRangoSemana(fecha) {
  const dia = fecha.getDay(); // 0=Domingo ... 6=Sábado
  const diffLunes = (dia === 0 ? -6 : 1) - dia; // Ajustar al lunes
  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  return { lunes, domingo };
}

// ----------- Función para obtener datos Firebase filtrados por rango fechas y opcional userId -----------
async function obtenerDatosPorRangoFechas(fechaInicio, fechaFin, userFilter = null) {
  const preciosRef = collection(db, 'precios');
  let q;

  if (userFilter) {
    // Filtrar por usuario y rango fechas
    q = query(
      preciosRef,
      where('userId', '==', userFilter),
      where('fecha', '>=', fechaInicio.toISOString()),
      where('fecha', '<=', fechaFin.toISOString()),
      orderBy('fecha', 'desc')
    );
  } else {
    // Solo filtrar por rango fechas
    q = query(
      preciosRef,
      where('fecha', '>=', fechaInicio.toISOString()),
      where('fecha', '<=', fechaFin.toISOString()),
      orderBy('fecha', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  const resultados = [];
  snapshot.forEach(doc => resultados.push(doc.data()));
  return resultados;
}

// ----------- Mostrar tabla con precios -----------

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
      <td>${parseFloat(d.precio).toFixed(2)}</td>
      <td>${unidadLabel(d.equivalencia)}</td>
      <td>${d.ciudad}</td>
    </tr>`;
  });
}

// ----------- Mostrar lista de productos en estadisticas -----------

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

// ----------- Mostrar detalle producto clickeado -----------

window.mostrarDetalle = function(producto) {
  cargarDatosFirebase(producto);
};

async function cargarDatosFirebase(productoFiltro = null) {
  // Cargar semana actual para mostrar en detalle
  // Aquí en detalle mostramos datos filtrados por semana actual y producto
  
  const datos = await obtenerDatosPorRangoFechas(rangoSemana.lunes, rangoSemana.domingo);

  if (productoFiltro) {
    const registrosProducto = datos.filter(d => d.producto === productoFiltro);
    const detalleDiv = document.getElementById('detalle-estadisticas');
    const detalleContenido = document.getElementById('detalle-contenido');

    if (!registrosProducto.length) {
      detalleContenido.innerHTML = "Sin registros.";
      detalleDiv.classList.remove('hidden');
      return;
    }

    let detalleHTML = `<strong>${productoFiltro}</strong><br><br>`;
    const agrupados = {};
    registrosProducto.forEach(r => {
      if (!agrupados[r.equivalencia]) agrupados[r.equivalencia] = [];
      agrupados[r.equivalencia].push(r);
    });

    for (const unidad in agrupados) {
      const registros = agrupados[unidad];
      const precios = registros.map(r => parseFloat(r.precio));
      const max = Math.max(...precios);
      const min = Math.min(...precios);

      const ciudadesMax = registros.filter(r => parseFloat(r.precio) === max).map(r => r.ciudad).join(', ');
      const ciudadesMin = registros.filter(r => parseFloat(r.precio) === min).map(r => r.ciudad).join(', ');

      detalleHTML += `<strong>Unidad:</strong> ${unidadLabel(unidad)}<br>
      Máximo: ${max.toFixed(2)} Bs (${ciudadesMax})<br>
      Mínimo: ${min.toFixed(2)} Bs (${ciudadesMin})<br><br>`;
    }

    const promedio = registrosProducto.reduce((sum, r) => sum + parseFloat(r.precio), 0) / registrosProducto.length;
    detalleHTML += `<strong>Promedio:</strong> ${promedio.toFixed(2)} Bs<br>`;
    detalleContenido.innerHTML = detalleHTML;
    detalleDiv.classList.remove('hidden');
    return;
  }

  // Mostrar datos generales sin filtro producto
  mostrarDatos(datos);
  mostrarEstadisticas(datos);
  document.getElementById('detalle-estadisticas').classList.add('hidden');
}

// ----------- Registrar nuevo precio en Firebase -----------

async function registrarPrecioFirebase(registro) {
  try {
    await addDoc(collection(db, "precios"), registro);
    return true;
  } catch (error) {
    console.error("Error guardando en Firestore:", error);
    return false;
  }
}

// ----------- Variables para control de semana actual y rango -----------

let rangoSemana = getRangoSemana(new Date());

// ----------- Función para cargar datos segun semana seleccionada -----------

async function cargarSemana(fecha, paraEstadisticas = true) {
  rangoSemana = getRangoSemana(fecha);
  const tituloSemana = document.getElementById('titulo-semana');
  tituloSemana.textContent = `Semana del ${rangoSemana.lunes.toLocaleDateString()} al ${rangoSemana.domingo.toLocaleDateString()}`;

  let datos;

  if (paraEstadisticas) {
    // En estadisticas mostramos TODOS los usuarios, filtrado por semana
    datos = await obtenerDatosPorRangoFechas(rangoSemana.lunes, rangoSemana.domingo);
    mostrarDatos(datos);
    mostrarEstadisticas(datos);
    // Control botón siguiente para no pasar semana actual
    const semanaActual = getRangoSemana(new Date());
    document.getElementById('btn-semana-siguiente').disabled = rangoSemana.lunes >= semanaActual.lunes;
    document.getElementById('detalle-estadisticas').classList.add('hidden');
  } else {
    // En registros mostramos SOLO del usuario actual
    datos = await obtenerDatosPorRangoFechas(rangoSemana.lunes, rangoSemana.domingo, userId);
    mostrarDatos(datos);
  }
}

// ----------- Eventos botones para cambiar semana -----------

document.getElementById('btn-semana-anterior').addEventListener('click', () => {
  const nuevaFecha = new Date(rangoSemana.lunes);
  nuevaFecha.setDate(nuevaFecha.getDate() - 7);
  cargarSemana(nuevaFecha, true);
});

document.getElementById('btn-semana-siguiente').addEventListener('click', () => {
  const nuevaFecha = new Date(rangoSemana.lunes);
  nuevaFecha.setDate(nuevaFecha.getDate() + 7);
  cargarSemana(nuevaFecha, true);
});

// ----------- Evento botón registrar -----------

document.getElementById('btn-reportar').addEventListener('click', async () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (
    producto !== 'Selecciona El Producto' &&
    !isNaN(precio) && precio > 0 &&
    equivalencia !== 'Selecciona la Unidad' &&
    ciudad !== 'Selecciona Ciudad'
  ) {
    const registro = {
      producto,
      precio,
      equivalencia,
      ciudad,
      fecha: new Date().toISOString(),
      userId  // Guardamos id para filtrar después
    };

    const exito = await registrarPrecioFirebase(registro);
    if (exito) {
      limpiarFormulario();
      mostrarToast('Precio guardado con éxito.', '#27ae60');
      // Actualizar lista de registros SOLO para este usuario
      cargarSemana(new Date(), false);
    } else {
      mostrarToast('Error guardando datos.', '#e74c3c');
    }
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});

// ----------- Función para limpiar formulario -----------

function limpiarFormulario() {
  document.getElementById('Producto').selectedIndex = 0;
  document.getElementById('precio').value = '';
  document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  document.getElementById('ciudad').selectedIndex = 0;
}

// ----------- Función para mostrar toast -----------

function mostrarToast(msg, color) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = color;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ----------- Menú lateral y mostrar secciones -----------

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');

  if (id === 'estadisticas') {
    cargarSemana(new Date(), true);
  } else {
    // En registro mostramos solo registros propios
    cargarSemana(new Date(), false);
    document.getElementById('detalle-estadisticas').classList.add('hidden');
  }
};

// ----------- Inicializar -----------

window.addEventListener('load', () => {
  mostrarSeccion('registro');
  CargarUnidades();
});
