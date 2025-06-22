import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Tu configuración Firebase
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

// Función para cargar unidades según producto
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

  const unidadesSólidosConArroba = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'arroba', label: 'Arroba (arroba)' },
    { value: 'q', label: 'Quintal (q)' },
    { value: 't', label: 'Tonelada (t)' }
  ];

  let opciones = unidadesGenerales; // por defecto

  // Líquidos: Aceite, Leche en polvo (según tu criterio también aquí), Pescado (si es líquido o fresco)
  if (['Aceite'].includes(producto)) {
    opciones = unidadesLiquidos;
  }
  // Por unidad
  else if (['Huevo', 'Pan'].includes(producto)) {
    opciones = unidadesUnidad;
  }
  // Sólidos con Arroba
  else if (['Arroz', 'Harina', 'Lenteja'].includes(producto)) {
    opciones = unidadesSólidosConArroba;
  }

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}


// Para mostrar las etiquetas de unidad (g, kg, etc)
function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)', kg: 'Kilogramos (kg)', lb: 'Libras (lb)',
    q: 'Quintal (q)', t: 'Tonelada (t)', ml: 'Mililitros (ml)',
    l: 'Litros (l)', gal: 'Galón (gal)', bbl: 'Barril (bbl)', unidad: 'Unidad'
  };
  return map[codigo] || codigo;
}

// Mostrar tabla de precios (solo en Estadísticas)
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

// Mostrar productos en tabla estadisticas (solo nombres)
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

// Mostrar detalle al hacer click en producto
window.mostrarDetalle = function(producto) {
  // Vamos a usar todos los datos actuales cargados en Firebase
  // Para eso, recargamos datos y filtramos solo producto requerido
  cargarDatosFirebase(producto);
};

async function cargarDatosFirebase(productoFiltro = null) {
  const preciosCol = collection(db, "precios");
  const snapshot = await getDocs(preciosCol);
  const datos = snapshot.docs.map(doc => doc.data());

  // Si hay filtro de producto, mostramos solo ese detalle
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

  // Si no hay filtro, mostramos datos generales (todos) en tabla
  mostrarDatos(datos);
  mostrarEstadisticas(datos);
  document.getElementById('detalle-estadisticas').classList.add('hidden');
}

// Registrar un nuevo precio en Firestore
async function registrarPrecioFirebase(registro) {
  try {
    await addDoc(collection(db, "precios"), registro);
    return true;
  } catch (error) {
    console.error("Error guardando en Firestore:", error);
    return false;
  }
}

// Evento click botón registrar precio
document.getElementById('btn-reportar').addEventListener('click', async () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') {
    const registro = { producto, precio, equivalencia, ciudad, fecha: new Date().toISOString() };
    const exito = await registrarPrecioFirebase(registro);
    if (exito) {
      limpiarFormulario();
      mostrarToast('Precio guardado con éxito.', '#27ae60');
      // No actualizamos tabla precios en registro, solo en estadisticas si quieres actualizar la vista
    } else {
      mostrarToast('Error guardando datos.', '#e74c3c');
    }
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});

// Limpiar formulario
function limpiarFormulario() {
  document.getElementById('Producto').selectedIndex = 0;
  document.getElementById('precio').value = '';
  document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  document.getElementById('ciudad').selectedIndex = 0;
}

// Toast mensaje
function mostrarToast(msg, color) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.background = color;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Menú lateral y mostrar sección
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');

  if (id === 'estadisticas') {
    cargarDatosFirebase();
  } else {
    // En registro no mostramos datos, solo formulario vacío
    document.getElementById('detalle-estadisticas').classList.add('hidden');
    // Opcional: limpiar tabla precios en registro o dejar el mensaje
    document.getElementById('tabla-precios').innerHTML = `<tr><td colspan="4">No hay datos registrados.</td></tr>`;
  }
};

// Inicializar unidades y sección registro al cargar página
window.addEventListener('load', () => {
  mostrarSeccion('registro');
  CargarUnidades();
});
