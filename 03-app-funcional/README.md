# Myco — Instrucciones de instalación

## 1. Crear el Spreadsheet
1. Andá a Google Sheets y creá una planilla nueva. Nombrala **Myco_DB**.
2. Copiá su ID (está en la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`).

## 2. Crear el proyecto de Apps Script
1. Desde la misma planilla: **Extensiones > Apps Script**. Esto asegura que el proyecto quede vinculado, aunque el ID de la planilla lo vamos a pasar por Script Properties (así el código no depende de estar "contenido" en la hoja).
2. Borrá el `Code.gs` de ejemplo y creá todos los archivos de esta carpeta con el mismo nombre exacto (Apps Script no usa la extensión `.gs`/`.html` en el nombre visible, pero sí importa el tipo de archivo):
   - `Code.gs`
   - `DB.gs`
   - `Auth.gs`
   - `Mail.gs`
   - `Recomendacion.gs`
   - `Index.html`
   - `Styles.html`
   - `Scripts.html`
   - `RootDivider.html`
   - `Playlist.html`
   - `JuegoRunner.html`
   - `JuegoMemoria.html`
   - `JuegoPuzzle.html`
3. Pegá el contenido de cada archivo de esta carpeta en el archivo correspondiente del editor de Apps Script.

## 3. Configurar el ID de la planilla
1. En el editor de Apps Script: **Configuración del proyecto (ícono de engranaje) > Propiedades del script > Agregar propiedad del script**.
2. Clave: `SPREADSHEET_ID` — Valor: el ID que copiaste en el paso 1.

## 4. Inicializar la base de datos
1. En el editor, seleccioná la función `inicializarBaseDeDatos` (arriba, en el desplegable de funciones) y hacé clic en **Ejecutar**.
2. Te va a pedir autorización la primera vez — acéptala (es tu propio proyecto).
3. Verificá en la planilla que se crearon las pestañas: `Usuarios`, `Sesiones`, `Respuestas_Cuestionario`, `Puntos_Venta`, `Config_Hongos`.
4. Reemplazá los datos de ejemplo de `Puntos_Venta` por los comercios reales (columnas: id, nombre, hongo — separado por coma si vende más de uno —, dirección, lat, lng, teléfono).

## 5. Publicar como Web App
1. **Implementar > Nueva implementación > Tipo: Aplicación web**.
2. "Ejecutar como": Yo (tu cuenta). "Quién tiene acceso": *Cualquier usuario* (para que cualquiera pueda registrarse) — o *Cualquier usuario de tu organización* si es uso interno.
3. Copiá la URL que te da al implementar. Esa es la URL pública de Myco.

## 6. Probar el flujo completo
1. Abrí la URL, creá una cuenta con tu propio email.
2. Revisá tu casilla: debería llegar el correo con la contraseña temporal (viene de tu cuenta de Gmail/Google Workspace, vía `MailApp`).
3. Iniciá sesión con esa contraseña, cambiala cuando te lo pida.
4. Completá el cuestionario, mirá el resultado, el mapa y la experiencia final.

## Notas y próximos pasos
- El mapa usa un iframe simple de Google Maps (no requiere API Key). Si más adelante querés pines múltiples reales en un mismo mapa interactivo, se puede migrar a la API de JavaScript de Google Maps con una API Key propia.
- `MailApp.sendEmail` tiene un límite diario de envíos según el tipo de cuenta de Google (cuenta gratuita vs. Workspace). Para volúmenes altos, migrar a `GmailApp` con alias o a un servicio transaccional (SendGrid, etc. vía `UrlFetchApp`).
- Todo el sistema de recomendación vive en `Recomendacion.gs`, en la función `getPreguntas()` y `calcularRecomendacion()` — se puede ajustar preguntas y puntajes sin tocar nada más.
- Para sumar un quinto hongo: agregar la fila en `Config_Hongos`, sumar sus puntos en `getPreguntas()`, agregarlo a `PRIORIDAD_DESEMPATE`, y crear su experiencia (nuevo `.html` + registrar el `tipo` en `irAExperiencia()` de `Scripts.html`).
- El diseño (`Styles.html`) usa variables CSS (`--bg`, `--forest`, `--moss`, `--umber`, `--gold`, `--lichen`) — cambiar la paleta ahí impacta toda la app.

## ACTUALIZACIÓN — Versión 2 (mejoras de UX + fix de bug)

Si ya tenías la Versión 1 instalada, hacé esto:

1. **Reemplazá el contenido completo** de estos archivos (se reescribieron): `Code.gs`, `Auth.gs`, `Recomendacion.gs`, `Styles.html`, `Scripts.html`, `Index.html`, `Playlist.html`, `JuegoRunner.html`, `JuegoMemoria.html`, `JuegoPuzzle.html`.
2. En el editor de Apps Script, seleccioná la función **`actualizarEsquema`** en el desplegable y ejecutala una vez (agrega las columnas nuevas `edad`, `ciudad` y `habitos` sin borrar tus datos existentes).
3. Volvé a implementar: **Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar**.
4. Borrá el acceso directo viejo del celular y agregalo de nuevo (para que tome el ícono nuevo).

### Qué se corrigió / agregó
- **Bug de `include()`**: los archivos de juegos mostraban código crudo en pantalla (`<?!= include(...) ?>` visible). Era un error real en `Code.gs` — los includes anidados no se evaluaban. Corregido.
- **Sesión persistente**: ya no te pide loguearte de nuevo cada vez que volvés a abrir la app.
- **Botones "Salir" → "Inicio"**: dentro de la app ya no cierran sesión, te llevan a un panel de inicio (logueado).
- **Recuperar contraseña**: nueva opción en el login.
- **Perfil**: nombre, edad y ciudad, usados para afinar el mapa.
- **Turkey Tail**: el puzzle deslizante se reemplazó por un juego de ordenar anillos (más claro).
- **Botones del cuestionario**: reset de estilos nativos del navegador para que todas las opciones se vean iguales.
- **Buenas prácticas**: cada resultado ahora suma hábitos diarios sugeridos.
- **Onboarding cálido**: aviso de que la app no reemplaza a un profesional de la salud, mostrado la primera vez que se entra.
- **Texto**: "Buscando tu hongo" → "Buscando tu aliado".

### Limitación conocida (no corregible desde el código)
El aviso **"Un usuario de Google Apps Script creó esta aplicación"** que aparece arriba al abrir el link es un banner que agrega Google automáticamente a cualquier Web App con acceso "Cualquier usuario" que no pasó por el proceso de verificación de OAuth de Google (algo pensado para apps públicas de terceros, que requiere dominio propio, política de privacidad publicada y revisión manual de Google — no es viable para un proyecto personal sobre una cuenta de Gmail). No hay forma de quitarlo mientras la app viva dentro de la infraestructura de Apps Script. No afecta el funcionamiento.
