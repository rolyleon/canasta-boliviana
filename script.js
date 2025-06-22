// script.js (CORREGIDO Y FUNCIONAL CON FIREBASE + MENÚ + UNIDADES)
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

export async function guardarEnFirebase(datos) {
  try {
    await addDoc(collection(db, "precios"), datos);
    console.log("Datos guardados en Firebase");
  } catch (e) {
    console.error("Error al guardar en Firebase", e);
  }
}

export function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '';

  const unidadesGenerales = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'a', label: 'Arroba (a)' },
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

  let opciones = unidadesGenerales;
  if (["Aceite", "Leche en polvo", "Pescado"].includes(producto)) {
    opciones = unidadesLiquidos;
  } else if (["Huevo", "Pan"].includes(producto)) {
    opciones = unidadesUnidad;
  }

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}

window.CargarUnidades = CargarUnidades;

// Botón registrar
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-reportar').addEventListener('click', async () => {
    const producto = document.getElementById('Producto').value;
    const precio = parseFloat(document.getElementById('precio').value);
    const equivalencia = document.getElementById('equivalencia').value;
    const ciudad = document.getElementById('ciudad').value;

    if (producto && !isNaN(precio) && equivalencia && ciudad) {
      const datos = {
        producto,
        precio,
        equivalencia,
        ciudad,
        fecha: new Date().toISOString()
      };
      await guardarEnFirebase(datos);
      document.getElementById('toast').textContent = 'Precio guardado con éxito';
      document.getElementById('toast').classList.remove('hidden');
      setTimeout(() => document.getElementById('toast').classList.add('hidden'), 3000);
      document.getElementById('Producto').selectedIndex = 0;
      document.getElementById('precio').value = '';
      document.getElementById('equivalencia').innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
      document.getElementById('ciudad').selectedIndex = 0;
    } else {
      document.getElementById('toast').textContent = 'Completa todos los campos';
      document.getElementById('toast').classList.remove('hidden');
      document.getElementById('toast').style.background = '#e74c3c';
      setTimeout(() => document.getElementById('toast').classList.add('hidden'), 3000);
    }
  });

  // Menú hamburguesa
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('hidden');
  });

  // Cambio de sección
  window.mostrarSeccion = function(id) {
    document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('sidebar').classList.add('hidden');
  };
});
