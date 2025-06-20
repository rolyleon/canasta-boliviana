import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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

// Unidades según tipo de producto
function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';

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
  if (['Aceite', 'Leche en polvo', 'Pescado'].includes(producto)) {
    opciones = unidadesLiquidos;
  } else if (producto === 'Huevo') {
    opciones = [{ value: 'unidad', label: 'Unidad' }];
  }

  opciones.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.value;
    opt.textContent = u.label;
    equivalenciaSelect.appendChild(opt);
  });
}

document.getElementById('Producto').addEventListener('change', CargarUnidades);

// Mostrar/ocultar menú
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

function mostrarToast(msg, color) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.backgroundColor = color;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function limpiarFormulario() {
  document.getElementById('Producto').selectedIndex = 0;
  document.getElementById('precio').value = '';
  document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  document.getElementById('ciudad').selectedIndex = 0;
}

async function registrarPrecioFirebase(registro) {
  try {
    await addDoc(collection(db, "precios"), registro);
    return true;
  } catch (e) {
    console.error("Error guardando en Firestore", e);
    return false;
  }
}

document.getElementById('btn-reportar').addEventListener('click', async () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (!producto || isNaN(precio) || !equivalencia || !ciudad ||
      producto === 'Selecciona El Producto' ||
      equivalencia === 'Selecciona la Unidad' ||
      ciudad === 'Selecciona Ciudad') {
    mostrarToast('Completa todos los campos correctamente.', '#e74c3c');
    return;
  }

  const registro = { producto, precio, equivalencia, ciudad, fecha: new Date().toISOString() };
  const exito = await registrarPrecioFirebase(registro);
  if (exito) {
    mostrarToast('Precio guardado con éxito.', '#27ae60');
    limpiarFormulario();
  } else {
    mostrarToast('Error al guardar.', '#e74c3c');
  }
});

window.mostrarSeccion = function(id) {
  document.querySelectorAll('.card').forEach(card => card.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
};

window.addEventListener('load', () => {
  mostrarSeccion('registro');
});
