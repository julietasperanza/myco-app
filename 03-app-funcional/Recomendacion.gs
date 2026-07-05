/**
 * PROYECTO MYCO — Recomendacion.gs
 * Cuestionario, motor de recomendación por puntajes (SIN IA) y puntos de venta.
 */

// Cada pregunta tiene opciones, y cada opción suma puntos a uno o más hongos.
function getPreguntas() {
  return [
    {
      id: 'p1',
      texto: '¿Qué te gustaría mejorar primero?',
      opciones: [
        { texto: 'Dormir mejor y bajar la ansiedad', puntos: { Reishi: 3 } },
        { texto: 'Tener más energía física', puntos: { Cordyceps: 3 } },
        { texto: 'Concentrarme y recordar mejor', puntos: { 'Melena de León': 3 } },
        { texto: 'Sentirme más equilibrado/a en general', puntos: { 'Turkey Tail': 3 } }
      ]
    },
    {
      id: 'p2',
      texto: '¿Cómo describirías tus noches?',
      opciones: [
        { texto: 'Me cuesta relajarme para dormir', puntos: { Reishi: 2 } },
        { texto: 'Duermo bien, pero despierto sin energía', puntos: { Cordyceps: 1, Reishi: 1 } },
        { texto: 'Duermo bien, sin problemas', puntos: { 'Melena de León': 1, 'Turkey Tail': 1 } }
      ]
    },
    {
      id: 'p3',
      texto: '¿Hacés actividad física con regularidad?',
      opciones: [
        { texto: 'Sí, y quiero rendir más', puntos: { Cordyceps: 3 } },
        { texto: 'Poca, pero quiero más energía en el día a día', puntos: { Cordyceps: 1, 'Turkey Tail': 1 } },
        { texto: 'No es mi prioridad ahora', puntos: { Reishi: 1, 'Melena de León': 1 } }
      ]
    },
    {
      id: 'p4',
      texto: '¿Cómo estás con el foco y la memoria últimamente?',
      opciones: [
        { texto: 'Me cuesta concentrarme', puntos: { 'Melena de León': 3 } },
        { texto: 'Estoy bien, sin quejas', puntos: { 'Turkey Tail': 1 } },
        { texto: 'Necesito más claridad mental para estudiar/trabajar', puntos: { 'Melena de León': 2 } }
      ]
    },
    {
      id: 'p5',
      texto: '¿Cómo anda tu sistema inmune / energía general del cuerpo?',
      opciones: [
        { texto: 'Me enfermo seguido o me cuesta recuperarme', puntos: { 'Turkey Tail': 3 } },
        { texto: 'Estoy bien, busco mantenerlo', puntos: { 'Turkey Tail': 1, Reishi: 1 } },
        { texto: 'Prefiero enfocarme en otra cosa', puntos: {} }
      ]
    }
  ];
}

// Orden de prioridad para desempatar (si dos hongos quedan con el mismo puntaje)
var PRIORIDAD_DESEMPATE = ['Reishi', 'Cordyceps', 'Melena de León', 'Turkey Tail'];

function calcularRecomendacion(respuestas) {
  // respuestas: { p1: 0, p2: 1, ... } (índice de la opción elegida por pregunta)
  var preguntas = getPreguntas();
  var puntajes = { Reishi: 0, Cordyceps: 0, 'Melena de León': 0, 'Turkey Tail': 0 };

  preguntas.forEach(function(pregunta) {
    var idxElegido = respuestas[pregunta.id];
    if (idxElegido === undefined || idxElegido === null) return;
    var opcion = pregunta.opciones[idxElegido];
    if (!opcion) return;
    Object.keys(opcion.puntos).forEach(function(hongo) {
      puntajes[hongo] += opcion.puntos[hongo];
    });
  });

  var mejorHongo = null;
  var mejorPuntaje = -1;
  PRIORIDAD_DESEMPATE.forEach(function(hongo) {
    if (puntajes[hongo] > mejorPuntaje) {
      mejorPuntaje = puntajes[hongo];
      mejorHongo = hongo;
    }
  });

  return { hongo: mejorHongo, puntajes: puntajes };
}

function enviarRespuestasCuestionario(token, respuestas) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false, error: 'Tu sesión expiró. Iniciá sesión de nuevo.' };

  var resultado = calcularRecomendacion(respuestas);

  agregarFila_('Respuestas_Cuestionario', {
    id_respuesta: Utilities.getUuid(),
    id_usuario: usuario.id_usuario,
    fecha: new Date(),
    respuestas_json: JSON.stringify(respuestas),
    hongo_recomendado: resultado.hongo
  });

  var config = buscarFilaPor_('Config_Hongos', 'hongo', resultado.hongo);

  return {
    ok: true,
    hongo: resultado.hongo,
    descripcion: config ? config.descripcion : '',
    beneficio: config ? config.beneficio_principal : '',
    experiencia: config ? config.experiencia : '',
    habitos: config && config.habitos ? config.habitos.split('|') : [],
    beneficiosClave: config && config.beneficios_clave ? config.beneficios_clave.split('|') : [],
    consumo: config && config.consumo ? config.consumo : ''
  };
}

// Devuelve la última recomendación guardada del usuario (para no perderla si vuelve a entrar)
function obtenerUltimaRecomendacion(token) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false };

  var respuestas = buscarFilasPor_('Respuestas_Cuestionario', 'id_usuario', usuario.id_usuario);
  if (!respuestas.length) return { ok: true, hayResultado: false };

  respuestas.sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });
  var ultima = respuestas[0];
  var config = buscarFilaPor_('Config_Hongos', 'hongo', ultima.hongo_recomendado);

  return {
    ok: true,
    hayResultado: true,
    hongo: ultima.hongo_recomendado,
    descripcion: config ? config.descripcion : '',
    beneficio: config ? config.beneficio_principal : '',
    experiencia: config ? config.experiencia : '',
    habitos: config && config.habitos ? config.habitos.split('|') : [],
    beneficiosClave: config && config.beneficios_clave ? config.beneficios_clave.split('|') : [],
    consumo: config && config.consumo ? config.consumo : ''
  };
}

function getPuntosDeVentaPorHongo(hongo, ciudad) {
  var todos = getFilas_('Puntos_Venta');
  ciudad = (ciudad || '').trim();

  var deEsteHongo = todos
    .filter(function(p) { return (p.hongo || '').split(',').map(function(h){return h.trim();}).indexOf(hongo) > -1; });

  function mapear(lista) {
    return lista.map(function(p) {
      return { nombre: p.nombre_comercio, direccion: p.direccion, lat: p.lat, lng: p.lng, telefono: p.telefono };
    });
  }

  // Si el usuario cargó su ciudad, priorizamos puntos de venta que la mencionen en la dirección.
  if (ciudad) {
    var enSuCiudad = deEsteHongo.filter(function(p) {
      return (p.direccion || '').toLowerCase().indexOf(ciudad.toLowerCase()) > -1;
    });
    if (enSuCiudad.length) {
      return { puntos: mapear(enSuCiudad), busquedaGenerica: null };
    }
    // No tenemos puntos cargados en esa ciudad: en vez de mostrar los de otra ciudad,
    // ofrecemos una búsqueda de Maps centrada en la ciudad del usuario.
    return { puntos: [], busquedaGenerica: 'comprar ' + hongo + ' en ' + ciudad };
  }

  // Sin ciudad cargada: mostramos los puntos que haya para ese hongo (los que estén).
  if (deEsteHongo.length) {
    return { puntos: mapear(deEsteHongo), busquedaGenerica: null };
  }
  return { puntos: [], busquedaGenerica: 'comprar ' + hongo };
}
