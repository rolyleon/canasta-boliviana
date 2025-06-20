// Firebase config e inicialización
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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

let userId = localStorage.getItem('canastaUserId');
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem('canastaUserId', userId);
}

// Función para cargar unidades según producto
export function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '';

  const unidadesSolidos = [
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
    { value: 'unidad', label: 'Unidad' },
    { value: 'docena', label: 'Docena' }
  ];

  let opciones = unidadesSolidos;
  if (['Aceite', 'Leche en polvo', 'Pescado'].includes(producto)) opciones = unidadesLiquidos;
  else if (['Huevo', 'Pan'].includes(producto)) opciones = unidadesUnidad;

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

async function cargarMisDatos() {
  const preciosRef = collection(db, 'precios');
  const q = query(preciosRef, where('userId', '==', userId), orderBy('fecha', 'desc'));
  const snapshot = await getDocs(q);
  const datos = snapshot.docs.map(doc => doc.data());
  mostrarMisDatos(datos);
}

function mostrarMisDatos(datos) {
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = '';
  if (!datos.length) {
    tbody.innerHTML = `<tr><td colspan="4">No hay datos tuyos registrados.</td></tr>`;
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
      userId
    };
    await addDoc(collection(db, "precios"), registro);
    limpiarFormulario();
    cargarMisDatos();
  } else {
    alert('Completa todos los campos');
  }
});

function limpiarFormulario() {
  document.getElementById('Producto').selectedIndex = 0;
  document.getElementById('precio').value = '';
  document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  document.getElementById('ciudad').selectedIndex = 0;
}

window.addEventListener('load', () => {
  CargarUnidades();
  cargarMisDatos();
});
