// script.js - Firebase completo y funcional
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
  else if (['Huevo', 'Pan'].includes(producto)) opciones = [{ value: 'unidad', label: 'Unidad' }];

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
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

  if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') {
    try {
      await addDoc(collection(db, "precios"), {
        producto, precio, equivalencia, ciudad, fecha: new Date().toISOString()
      });
      mostrarToast('Precio guardado en Firebase.', '#27ae60');
      cargarPrecios();
    } catch (e) {
      console.error("Error al guardar:", e);
      mostrarToast('Error al guardar.', '#e74c3c');
    }
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});

async function cargarPrecios() {
  const querySnapshot = await getDocs(collection(db, "precios"));
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = '';
  if (querySnapshot.empty) {
    tbody.innerHTML = '<tr><td colspan="4">No hay datos registrados.</td></tr>';
    return;
  }
  querySnapshot.forEach((doc) => {
    const d = doc.data();
    tbody.innerHTML += `<tr>
      <td>${d.producto}</td>
      <td>${d.precio.toFixed(2)}</td>
      <td>${d.equivalencia}</td>
      <td>${d.ciudad}</td>
    </tr>`;
  });
}

// Mostrar precios al cargar
window.addEventListener('load', () => {
  cargarPrecios();
  CargarUnidades();
});

// Menú lateral
const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  if (id === 'registro') cargarPrecios();
};
