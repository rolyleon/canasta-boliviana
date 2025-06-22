// Firebase config y Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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

// Cargar Unidades
export function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = '';

  const unidadesGenerales = [
    { value: 'g', label: 'Gramos (g)' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'a', label: 'Arroba (a)'},
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

  if (["Aceite", "Leche en polvo", "Pescado"].includes(producto)) {
    opciones = unidadesLiquidos;
  } else if (["Huevo", "Pan"].includes(producto)) {
    opciones = [{ value: 'unidad', label: 'Unidad' }];
  }

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}

function obtenerClaveSemana(fecha) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semanaNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${semanaNum.toString().padStart(2, '0')}`;
}

async function guardarRegistroSemanal(registro) {
  const claveSemana = obtenerClaveSemana(new Date());
  await addDoc(collection(db, "precios"), { ...registro, semana: claveSemana });
}

async function obtenerDatosSemana(claveSemana) {
  const q = query(collection(db, "precios"), where("semana", "==", claveSemana));
  const querySnapshot = await getDocs(q);
  const datos = [];
  querySnapshot.forEach(doc => datos.push(doc.data()));
  return datos;
}

// Todo lo demás: sin cambios
// mostrarDatosSemana, mostrarDatos, mostrarEstadisticas, mostrarDetalle, etc.

// Al cargar:
window.addEventListener('load', () => {
  mostrarDatosSemana();
  CargarUnidades();
});

// Guardar precio:
document.getElementById('btn-reportar').addEventListener('click', async () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (producto !== 'Selecciona El Producto' && !isNaN(precio) && precio > 0 && equivalencia !== 'Selecciona la Unidad' && ciudad !== 'Selecciona Ciudad') {
    await guardarRegistroSemanal({ producto, precio, equivalencia, ciudad, fecha: new Date().toISOString() });
    limpiarFormulario();
    mostrarToast('Precio guardado con éxito.', '#27ae60');
    mostrarDatosSemana();
  } else {
    mostrarToast('Completa todos los campos.', '#e74c3c');
  }
});
