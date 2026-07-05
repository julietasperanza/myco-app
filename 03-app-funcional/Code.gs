/**
 * PROYECTO MYCO — Code.gs
 * Punto de entrada de la Web App + inicialización de la base de datos (Google Sheets).
 */

// ============ CONFIGURACIÓN ============
// Guardá el ID del Spreadsheet en Script Properties (Configuración del proyecto > Propiedades del script)
// Clave: SPREADSHEET_ID
function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('Falta configurar SPREADSHEET_ID en Propiedades del script.');
  }
  return SpreadsheetApp.openById(id);
}

// ============ ENTRY POINT WEB APP ============
function doGet(e) {
  // El manifest se sirve como una URL real (?manifest=1), no como data URI.
  // Android necesita poder "buscarlo" en la red para tomar el ícono al agregar a la pantalla de inicio;
  // los manifests embebidos como data: URI no siempre son reconocidos por Chrome para este fin.
  if (e && e.parameter && e.parameter.manifest) {
    return construirManifest_();
  }

  var template = HtmlService.createTemplateFromFile('Index');
  template.manifestUrl = ScriptApp.getService().getUrl() + '?manifest=1';
  return template.evaluate()
    .setTitle('Myco — Encontrá tu hongo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function construirManifest_() {
  var manifest = {
    name: 'Myco',
    short_name: 'Myco',
    start_url: ScriptApp.getService().getUrl(),
    display: 'standalone',
    background_color: '#EFE8D8',
    theme_color: '#22362A',
    icons: [
      { src: 'data:image/png;base64,' + ICONO_192_B64, sizes: '192x192', type: 'image/png' },
      { src: 'data:image/png;base64,' + ICONO_512_B64, sizes: '512x512', type: 'image/png' }
    ]
  };
  return ContentService.createTextOutput(JSON.stringify(manifest)).setMimeType(ContentService.MimeType.JSON);
}

// Permite incluir archivos HTML parciales (Styles, Scripts, juegos, etc.)
// IMPORTANTE: usamos createTemplateFromFile + evaluate() (no createHtmlOutputFromFile)
// para que los <?!= include('Otro'); ?> DENTRO de un parcial también se evalúen.
// Si no se hace así, esos tags aparecen como texto literal en pantalla.
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

// ============ SETUP INICIAL (ejecutar UNA sola vez a mano desde el editor) ============
function inicializarBaseDeDatos() {
  var ss = getSpreadsheet_();

  crearHojaSiNoExiste_(ss, 'Usuarios',
    ['id_usuario', 'nombre', 'email', 'password_hash', 'salt', 'debe_cambiar_password', 'fecha_registro', 'ultimo_login', 'estado', 'edad', 'ciudad', 'avatar']);

  crearHojaSiNoExiste_(ss, 'Sesiones',
    ['token', 'id_usuario', 'fecha_creacion', 'fecha_expiracion']);

  crearHojaSiNoExiste_(ss, 'Respuestas_Cuestionario',
    ['id_respuesta', 'id_usuario', 'fecha', 'respuestas_json', 'hongo_recomendado']);

  var puntosVenta = crearHojaSiNoExiste_(ss, 'Puntos_Venta',
    ['id_punto', 'nombre_comercio', 'hongo', 'direccion', 'lat', 'lng', 'telefono']);

  // Datos de ejemplo para que el mapa no quede vacío (reemplazar por datos reales)
  if (puntosVenta.getLastRow() === 1) {
    var ejemplos = [
      ['p1', 'Almacén Verde Raíz', 'Reishi', 'Av. Santa Fe 2450, CABA', -34.5895, -58.4098, '11-4000-1111'],
      ['p2', 'Herboristería Bosque Nativo', 'Reishi,Cordyceps', 'Av. Corrientes 3200, CABA', -34.6037, -58.4113, '11-4000-2222'],
      ['p3', 'Fungi Lab Store', 'Cordyceps', 'Av. Cabildo 1500, CABA', -34.5628, -58.4585, '11-4000-3333'],
      ['p4', 'Tierra Sagrada Naturista', 'Melena de León', 'Av. Rivadavia 5500, CABA', -34.6183, -58.4402, '11-4000-4444'],
      ['p5', 'Mercado Consciente', 'Turkey Tail,Melena de León', 'Av. Scalabrini Ortiz 1100, CABA', -34.5847, -58.4324, '11-4000-5555']
    ];
    puntosVenta.getRange(2, 1, ejemplos.length, ejemplos[0].length).setValues(ejemplos);
  }

  crearHojaSiNoExiste_(ss, 'Config_Hongos',
    ['hongo', 'descripcion', 'beneficio_principal', 'experiencia', 'habitos', 'beneficios_clave', 'consumo']);

  var config = ss.getSheetByName('Config_Hongos');
  if (config.getLastRow() === 1) {
    var datos = [
      ['Reishi', 'El "hongo de la inmortalidad". Calma el sistema nervioso y prepara el cuerpo para un descanso profundo.', 'Relajación y sueño', 'playlist',
        'Sumá 5 minutos de respiración profunda antes de dormir.|Bajá las pantallas una hora antes de acostarte.|Probá una infusión relajante en tu rutina nocturna.',
        'Favorece la relajación y el descanso profundo.|Ayuda a equilibrar la respuesta al estrés.|Aporta antioxidantes naturales.|Contribuye al bienestar del sistema inmune.|Acompaña rutinas de sueño más estables.',
        '1 gramo de extracto estandarizado por la noche, 30 a 60 minutos antes de dormir, en infusión tibia o con agua.'],
      ['Cordyceps', 'Un hongo que crece en las alturas del Himalaya. Potencia la energía física y la resistencia.', 'Energía y rendimiento físico', 'runner',
        'Movete al menos 20 minutos al aire libre por día.|Hidratate bien antes y después de entrenar.|Escuchá a tu cuerpo: el descanso también es rendimiento.',
        'Favorece la energía y la resistencia física.|Apoya la capacidad respiratoria durante el ejercicio.|Contribuye al rendimiento deportivo.|Ayuda a combatir la fatiga.|Aporta antioxidantes naturales.',
        '1 gramo de extracto estandarizado por la mañana, acompañado de una fuente de grasas saludables como aceite de coco o frutos secos.'],
      ['Melena de León', 'Estimula la claridad mental y la memoria, como raíces que se expanden en el bosque.', 'Foco y memoria', 'memoria',
        'Tomate una pausa corta cada 90 minutos de foco.|Anotá tus ideas en un cuaderno para liberar la mente.|Dormí las horas necesarias: la memoria se consolida durmiendo.',
        'Favorece la claridad mental y el enfoque.|Apoya la memoria y el aprendizaje.|Contribuye a la salud cognitiva a largo plazo.|Ayuda a sostener la energía mental durante el día.|Aporta compuestos con propiedades antioxidantes.',
        '1 gramo de extracto estandarizado por la mañana, junto con el desayuno, para acompañar el enfoque durante el día.'],
      ['Turkey Tail', 'Con su patrón de capas como anillos de un árbol, apoya el equilibrio y las defensas del cuerpo.', 'Equilibrio y sistema inmune', 'puzzle',
        'Sumá variedad de colores a tus comidas de la semana.|Caminá al aire libre para bajar el estrés.|Priorizá el descanso cuando el cuerpo lo pide.',
        'Apoya el sistema inmunológico.|Aporta antioxidantes y compuestos prebióticos.|Contribuye al equilibrio de la microbiota intestinal.|Favorece el bienestar general del organismo.|Complementa hábitos saludables de recuperación.',
        '1 gramo de extracto estandarizado por día, junto con las comidas, idealmente de forma constante durante varias semanas.']
    ];
    config.getRange(2, 1, datos.length, datos[0].length).setValues(datos);
  }

  SpreadsheetApp.flush();
  Logger.log('Base de datos inicializada correctamente.');
}

// Ejecutar UNA vez si ya habías corrido inicializarBaseDeDatos() antes de esta actualización.
// Agrega las columnas/datos nuevos sin borrar lo que ya tenías cargado.
function actualizarEsquema() {
  var ss = getSpreadsheet_();

  agregarColumnaSiFalta_(ss, 'Usuarios', 'edad');
  agregarColumnaSiFalta_(ss, 'Usuarios', 'ciudad');
  agregarColumnaSiFalta_(ss, 'Usuarios', 'avatar');

  var huboColumnaNueva = agregarColumnaSiFalta_(ss, 'Config_Hongos', 'habitos');
  if (huboColumnaNueva) {
    var config = ss.getSheetByName('Config_Hongos');
    var habitosPorHongo = {
      'Reishi': 'Sumá 5 minutos de respiración profunda antes de dormir.|Bajá las pantallas una hora antes de acostarte.|Probá una infusión relajante en tu rutina nocturna.',
      'Cordyceps': 'Movete al menos 20 minutos al aire libre por día.|Hidratate bien antes y después de entrenar.|Escuchá a tu cuerpo: el descanso también es rendimiento.',
      'Melena de León': 'Tomate una pausa corta cada 90 minutos de foco.|Anotá tus ideas en un cuaderno para liberar la mente.|Dormí las horas necesarias: la memoria se consolida durmiendo.',
      'Turkey Tail': 'Sumá variedad de colores a tus comidas de la semana.|Caminá al aire libre para bajar el estrés.|Priorizá el descanso cuando el cuerpo lo pide.'
    };
    var filas = getFilas_('Config_Hongos');
    filas.forEach(function(fila) {
      if (habitosPorHongo[fila.hongo]) {
        actualizarFila_('Config_Hongos', fila._fila, { habitos: habitosPorHongo[fila.hongo] });
      }
    });
  }

  var huboBeneficiosNueva = agregarColumnaSiFalta_(ss, 'Config_Hongos', 'beneficios_clave');
  var huboConsumoNueva = agregarColumnaSiFalta_(ss, 'Config_Hongos', 'consumo');
  if (huboBeneficiosNueva || huboConsumoNueva) {
    var datosPorHongo = {
      'Reishi': {
        beneficios_clave: 'Favorece la relajación y el descanso profundo.|Ayuda a equilibrar la respuesta al estrés.|Aporta antioxidantes naturales.|Contribuye al bienestar del sistema inmune.|Acompaña rutinas de sueño más estables.',
        consumo: '1 gramo de extracto estandarizado por la noche, 30 a 60 minutos antes de dormir, en infusión tibia o con agua.'
      },
      'Cordyceps': {
        beneficios_clave: 'Favorece la energía y la resistencia física.|Apoya la capacidad respiratoria durante el ejercicio.|Contribuye al rendimiento deportivo.|Ayuda a combatir la fatiga.|Aporta antioxidantes naturales.',
        consumo: '1 gramo de extracto estandarizado por la mañana, acompañado de una fuente de grasas saludables como aceite de coco o frutos secos.'
      },
      'Melena de León': {
        beneficios_clave: 'Favorece la claridad mental y el enfoque.|Apoya la memoria y el aprendizaje.|Contribuye a la salud cognitiva a largo plazo.|Ayuda a sostener la energía mental durante el día.|Aporta compuestos con propiedades antioxidantes.',
        consumo: '1 gramo de extracto estandarizado por la mañana, junto con el desayuno, para acompañar el enfoque durante el día.'
      },
      'Turkey Tail': {
        beneficios_clave: 'Apoya el sistema inmunológico.|Aporta antioxidantes y compuestos prebióticos.|Contribuye al equilibrio de la microbiota intestinal.|Favorece el bienestar general del organismo.|Complementa hábitos saludables de recuperación.',
        consumo: '1 gramo de extracto estandarizado por día, junto con las comidas, idealmente de forma constante durante varias semanas.'
      }
    };
    var filas2 = getFilas_('Config_Hongos');
    filas2.forEach(function(fila) {
      if (datosPorHongo[fila.hongo]) {
        actualizarFila_('Config_Hongos', fila._fila, datosPorHongo[fila.hongo]);
      }
    });
  }

  SpreadsheetApp.flush();
  Logger.log('Esquema actualizado correctamente.');
}

function agregarColumnaSiFalta_(ss, nombreHoja, columna) {
  var hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) return false;
  var headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  if (headers.indexOf(columna) === -1) {
    hoja.getRange(1, headers.length + 1).setValue(columna);
    return true;
  }
  return false;
}

function crearHojaSiNoExiste_(ss, nombre, headers) {
  var hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
    hoja.appendRow(headers);
    hoja.setFrozenRows(1);
  }
  return hoja;
}
