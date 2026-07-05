/**
 * PROYECTO MYCO — DB.gs
 * Helpers genéricos para tratar cada hoja del Spreadsheet como una "tabla".
 */

function sanitizar_(valor) {
  // Evita inyección de fórmulas al escribir en Sheets
  if (typeof valor === 'string' && /^[=+\-@]/.test(valor)) {
    return "'" + valor;
  }
  return valor;
}

function getHoja_(nombre) {
  var ss = getSpreadsheet_();
  var hoja = ss.getSheetByName(nombre);
  if (!hoja) throw new Error('No existe la hoja: ' + nombre);
  return hoja;
}

// Devuelve un array de objetos {columna: valor} a partir de una hoja con headers en la fila 1
function getFilas_(nombreHoja) {
  var hoja = getHoja_(nombreHoja);
  var valores = hoja.getDataRange().getValues();
  if (valores.length < 2) return [];
  var headers = valores[0];
  var filas = [];
  for (var i = 1; i < valores.length; i++) {
    var obj = { _fila: i + 1 }; // número de fila real en la hoja (1-indexed)
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = valores[i][j];
    }
    filas.push(obj);
  }
  return filas;
}

// Agrega una fila nueva a partir de un objeto {columna: valor}, respetando el orden de headers
function agregarFila_(nombreHoja, objeto) {
  var hoja = getHoja_(nombreHoja);
  var headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var fila = headers.map(function(h) { return sanitizar_(objeto[h] !== undefined ? objeto[h] : ''); });
  hoja.appendRow(fila);
}

// Busca la primera fila donde columna == valor. Devuelve el objeto fila o null.
function buscarFilaPor_(nombreHoja, columna, valor) {
  var filas = getFilas_(nombreHoja);
  for (var i = 0; i < filas.length; i++) {
    if (filas[i][columna] == valor) return filas[i];
  }
  return null;
}

function buscarFilasPor_(nombreHoja, columna, valor) {
  return getFilas_(nombreHoja).filter(function(f) { return f[columna] == valor; });
}

// Actualiza columnas específicas de una fila ya existente (identificada por su número de fila real)
function actualizarFila_(nombreHoja, numeroFila, cambios) {
  var hoja = getHoja_(nombreHoja);
  var headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  Object.keys(cambios).forEach(function(col) {
    var idx = headers.indexOf(col);
    if (idx > -1) {
      hoja.getRange(numeroFila, idx + 1).setValue(sanitizar_(cambios[col]));
    }
  });
}

function eliminarFila_(nombreHoja, numeroFila) {
  getHoja_(nombreHoja).deleteRow(numeroFila);
}
