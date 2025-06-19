function CargarUnidades() {
  const producto = document.getElementById("Producto").value;
  const unidadSelect = document.getElementById("equivalencia");

  unidadSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';

  const liquidos = ["Aceite", "Leche en polvo"];
  const solidos = [
    "Arroz", "Fideo", "Harina", "Carne de res", "Carne de pollo", "Papa",
    "Cebolla", "Zanahoria", "Tomate", "Huevo", "Pescado", "Lenteja", "Ajo"
  ];

  let unidades = [];

  if (liquidos.includes(producto)) {
    unidades = ["ml", "l", "gal", "bbl"];
  } else if (solidos.includes(producto)) {
    unidades = ["g", "kg", "lb", "q", "t", "Arroba"];
  }

  unidades.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    unidadSelect.appendChild(opt);
  });
}

function mostrarSeccion(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  if (id === 'estadisticas') mostrarDatosSemana();
}

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden');
});

document.getElementById('btn-reportar').addEventListener('click', () => {
  const producto = document.getElementById('Producto').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ciudad').value;

  if (!producto || isNaN(precio) || equivalencia.includes('Selecciona') || ciudad.includes('Selecciona')) {
    mostrarToast('Completa todos los campos.', '#e74c3c');
    return;
  }

  const nuevoRegistro = {
    producto,
    precio,
    equivalencia,
    ciudad,
    fecha: new Date().toISOString()
  };

  guardarRegistroSemanal(nuevoRegistro);
  limpiarFormulario();
  mostrarToast('Precio guardado con éxito.', '#27ae60');
  mostrarDatosSemana();
});

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

// Aquí continúa todo el resto del JS que ya tenías: funciones de semana, mostrarDatos, estadísticas, etc...