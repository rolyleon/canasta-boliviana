// Función para cargar unidades según producto seleccionado
function CargarUnidades() {
  const producto = document.getElementById('Producto').value;
  const equivalenciaSelect = document.getElementById('equivalencia');
  equivalenciaSelect.innerHTML = ''; // limpiar opciones

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

  let opciones = [];

  if (['Aceite', 'Leche en polvo', 'Pescado'].includes(producto)) {
    opciones = unidadesLiquidos;
  } else if (producto === 'Huevo') {
    opciones = [{ value: 'unidad', label: 'Unidad' }];
  } else if (producto === 'Leche') {
    opciones = unidadesLiquidos;
  } else {
    opciones = unidadesGenerales;
  }

  equivalenciaSelect.innerHTML = '<option disabled selected>Selecciona la Unidad</option>';
  opciones.forEach(u => {
    equivalenciaSelect.innerHTML += `<option value="${u.value}">${u.label}</option>`;
  });
}

// --- Funciones para manejo de semanas ---

function obtenerClaveSemana(fecha) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semanaNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${semanaNum.toString().padStart(2, '0')}`;
}

function fechasSemana(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  return { inicio: ISOweekStart, fin: ISOweekEnd };
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function guardarRegistroSemanal(registro) {
  const historial = JSON.parse(localStorage.getItem('historialSemanal')) || {};
  const claveSemana = obtenerClaveSemana(new Date());
  if (!historial[claveSemana]) historial[claveSemana] = [];
  historial[claveSemana].push(registro);
  localStorage.setItem('historialSemanal', JSON.stringify(historial));
}

function obtenerDatosSemana(claveSemana) {
  const historial = JSON.parse(localStorage.getItem('historialSemanal')) || {};
  return historial[claveSemana] || [];
}

let semanaSeleccionadaIndex = 0;

function calcularClaveSemanaConOffset(offset) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offset * 7);
  return obtenerClaveSemana(fecha);
}

function mostrarTituloSemana(claveSemana) {
  const titulo = document.getElementById('titulo-semana');
  if (!titulo) return;

  const [yearStr, semanaStr] = claveSemana.split('-');
  const year = Number(yearStr);
  const semana = Number(semanaStr);

  const { inicio, fin } = fechasSemana(year, semana);
  const rango = `Del ${formatearFecha(inicio)} al ${formatearFecha(fin)}`;

  titulo.textContent = semanaSeleccionadaIndex === 0
    ? `Semana Actual (${rango})`
    : `Semana ${semana} del ${year} (${rango})`;

  const btnSig = document.getElementById('btn-semana-siguiente');
  if (btnSig) btnSig.disabled = (semanaSeleccionadaIndex >= 0);
}

function mostrarDatosSemana() {
  const clave = semanaSeleccionadaIndex === 0
    ? obtenerClaveSemana(new Date())
    : calcularClaveSemanaConOffset(semanaSeleccionadaIndex);

  const datosSemana = obtenerDatosSemana(clave);
  mostrarDatos(datosSemana);
  mostrarEstadisticas(datosSemana);
  mostrarTituloSemana(clave);
}

function mostrarDatos(datos) {
  const tbody = document.getElementById('tabla-precios');
  tbody.innerHTML = '';
  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No hay datos registrados.</td></tr>`;
    return;
  }

  datos.forEach(d => {
    const unidadTexto = unidadLabel(d.equivalencia);
    const row = `<tr>
      <td>${d.producto}</td>
      <td>${d.precio.toFixed(2)}</td>
      <td>${unidadTexto}</td>
      <td>${d.ciudad}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// Para mostrar el texto completo de unidad
function unidadLabel(codigo) {
  const map = {
    g: 'Gramos (g)',
    kg: 'Kilogramos (kg)',
    lb: 'Libras (lb)',
    q: 'Quintal (q)',
    t: 'Tonelada (t)',
    ml: 'Mililitros (ml)',
    l: 'Litros (l)',
    gal: 'Galón (gal)',
    bbl: 'Barril (bbl)',
    unidad: 'Unidad'
  };
  return map[codigo] || codigo;
}

function mostrarEstadisticas(datos) {
  const tbodyEstadisticas = document.getElementById('tabla-estadisticas');
  const detalleDiv = document.getElementById('detalle-estadisticas');
  const detalleContenido = document.getElementById('detalle-contenido');

  tbodyEstadisticas.innerHTML = '';
  detalleDiv.classList.add('hidden');

  if (!datos || datos.length === 0) {
    tbodyEstadisticas.innerHTML = '<tr><td>No hay datos registrados.</td></tr>';
    return;
  }

  const agrupados = {};
  datos.forEach(d => {
    const clave = `${d.producto}`;
    if (!agrupados[clave]) agrupados[clave] = [];
    agrupados[clave].push(d);
  });

  let hayDatos = false;
  Object.entries(agrupados).forEach(([producto, registros]) => {
    if (registros.length < 1) return;
    hayDatos = true;
    tbodyEstadisticas.innerHTML += `
      <tr style="cursor:pointer;" onclick="mostrarDetalle('${producto}')">
        <td style="color:blue; text-decoration:underline;">${producto}</td>
      </tr>
    `;
  });

  if (!hayDatos) {
    tbodyEstadisticas.innerHTML = '<tr><td>No hay productos con suficientes registros.</td></tr>';
  }
}

function mostrarDetalle(producto) {
  const claveSemana = semanaSeleccionadaIndex === 0
    ? obtenerClaveSemana(new Date())
    : calcularClaveSemanaConOffset(semanaSeleccionadaIndex);
  
  const datos = obtenerDatosSemana(claveSemana);
  const detalleDiv = document.getElementById('detalle-estadisticas');
  const detalleContenido = document.getElementById('detalle-contenido');

  const registrosProducto = datos.filter(d => d.producto === producto);

  if (registrosProducto.length === 0) {
    detalleContenido.innerHTML = "No hay registros para este producto en esta semana.";
    detalleDiv.classList.remove('hidden');
    return;
  }

  let detalleHTML = `<strong>Producto:</strong> ${producto}<br><br>`;

  const agrupadosPorUnidad = {};
  registrosProducto.forEach(r => {
    if (!agrupadosPorUnidad[r.equivalencia]) agrupadosPorUnidad[r.equivalencia] = [];
    agrupadosPorUnidad[r.equivalencia].push(r);
  });

  for (const [unidad, registros] of Object.entries(agrupadosPorUnidad)) {
    detalleHTML += `<strong>Unidad:</strong> ${unidadLabel(unidad)}<br>`;

    const precios = registros.map(r => r.precio);
    const maxPrecio = Math.max(...precios);
    const minPrecio = Math.min(...precios);

    const ciudadesMax = [...new Set(
      registros.filter(r => r.precio === maxPrecio).map(r => r.ciudad)
    )].join(', ');

    const ciudadesMin = [...new Set(
      registros.filter(r => r.precio === minPrecio).map(r => r.ciudad)
    )].join(', ');

    detalleHTML += `- <strong>Máximo:</strong> ${maxPrecio.toFixed(2)} Bs en: ${ciudadesMax}<br>`;
    detalleHTML += `- <strong>Mínimo:</strong> ${minPrecio.toFixed(2)} Bs en: ${ciudadesMin}<br><br>`;
  }

  const sumaPrecios = registrosProducto.reduce((acc, r) => acc + r.precio, 0);
  const promedio = sumaPrecios / registrosProducto.length;
  detalleHTML += `<strong>Promedio General:</strong> ${promedio.toFixed(2)} Bs<br>`;

  detalleContenido.innerHTML = detalleHTML;
  detalleDiv.classList.remove('hidden');
}

// Toast para mostrar mensajes
const toast = document.getElementById('toast');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

function mostrarSeccion(id) {
  document.querySelectorAll('.card').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  sidebar.classList.add('hidden');
  if (id === 'estadisticas') mostrarDatosSemana();
}

document.getElementById('btn-semana-anterior').addEventListener('click', () => {
  semanaSeleccionadaIndex--;
  mostrarDatosSemana();
});

document.getElementById('btn-semana-siguiente').addEventListener('click', () => {
  if (semanaSeleccionadaIndex < 0) {
    semanaSeleccionadaIndex++;
    mostrarDatosSemana();
  }
});

document.getElementById('btn-reportar').addEventListener('click', () => {
  const producto = document.getElementById('Producto').value;
  const precioInput = document.getElementById('precio');
  const precio = parseFloat(precioInput.value);
  const equivalencia = document.getElementById('equivalencia').value;
  const ciudad = document.getElementById('ci
