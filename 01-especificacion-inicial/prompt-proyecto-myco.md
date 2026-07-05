# PROMPT DE CONSTRUCCIÓN — PROYECTO MYCO

> Este documento es el prompt/spec técnico completo para que una IA (o un desarrollador) construya la aplicación de punta a punta. Está pensado para pegarse en Claude Code, Cursor, o similar, y ejecutarse por fases.

---

## 1. CONTEXTO Y OBJETIVO

Construí **Myco**, una aplicación web que recomienda hongos adaptógenos según las respuestas de un cuestionario, muestra en un mapa dónde comprarlos, y cierra la experiencia con una mini-interacción/juego temático relacionado al hongo recomendado.

**Principios no negociables:**
- La app corre 100% sobre **Google Apps Script (GAS)**, publicada como Web App.
- El backend de datos es **Google Sheets** (no hay base de datos externa).
- La recomendación es **determinística basada en reglas** (árbol de decisión / sistema de puntajes), **sin IA ni modelos** corriendo en producción. La IA solo se usa como herramienta de desarrollo (para escribir el código), nunca en runtime.
- Tiene que soportar **registro de usuario propio**, con envío de **contraseña temporal de un solo uso por correo**, y **cambio obligatorio de contraseña en el primer ingreso**.

---

## 2. STACK TÉCNICO

- **Backend:** Google Apps Script (`Code.gs` + archivos `.gs` auxiliares).
- **Frontend:** HTML Service de Apps Script (`index.html` + `HtmlService.createTemplateFromFile`), con CSS y JS embebidos o incluidos vía `<?!= include('archivo') ?>`.
- **Persistencia:** Google Sheets (una hoja de cálculo actuando como base de datos, con una pestaña por "tabla").
- **Envío de mails:** `MailApp.sendEmail()` o `GmailApp.sendEmail()`.
- **Mapa:** Google Maps Embed API o Google Maps JavaScript API (iframe simple es suficiente para el MVP; no requiere backend de mapas).
- **Autenticación:** manejada 100% a mano (no hay OAuth de usuario final), con hash de contraseña + tokens de sesión guardados en Sheets/`CacheService`/`PropertiesService`.

---

## 3. MODELO DE DATOS (Google Sheets como DB)

Crear un Spreadsheet único llamado `Myco_DB` con las siguientes pestañas:

### 3.1 `Usuarios`
| Columna | Tipo | Notas |
|---|---|---|
| id_usuario | string (UUID) | |
| nombre | string | |
| email | string | único, usado como login |
| password_hash | string | SHA-256 + salt |
| salt | string | |
| debe_cambiar_password | boolean | `TRUE` hasta el primer cambio |
| fecha_registro | datetime | |
| ultimo_login | datetime | |
| estado | string | activo / bloqueado |

### 3.2 `Sesiones`
| Columna | Tipo | Notas |
|---|---|---|
| token | string | |
| id_usuario | string | |
| fecha_creacion | datetime | |
| fecha_expiracion | datetime | |

### 3.3 `Respuestas_Cuestionario`
| Columna | Tipo | Notas |
|---|---|---|
| id_respuesta | string | |
| id_usuario | string | |
| fecha | datetime | |
| respuestas_json | string | JSON con las respuestas crudas |
| hongo_recomendado | string | resultado calculado |

### 3.4 `Puntos_Venta`
| Columna | Tipo | Notas |
|---|---|---|
| id_punto | string | |
| nombre_comercio | string | |
| hongo | string | qué hongo(s) vende (puede ser lista separada por coma) |
| direccion | string | |
| lat | number | |
| lng | number | |
| telefono / web | string | opcional |

### 3.5 `Config_Hongos`
Tabla de referencia estática con la info de cada hongo (beneficios, descripción corta, tipo de experiencia asociada). Sirve para no hardcodear textos en el código.

---

## 4. LÓGICA DE RECOMENDACIÓN (sin IA)

Implementar como **sistema de puntaje por reglas**, no árbol rígido de sí/no, para que escale a futuras preguntas.

1. El cuestionario tiene entre 5 y 8 preguntas de opción múltiple (ej: "¿Qué buscás mejorar?", "¿Cómo dormís?", "¿Tenés problemas de concentración?", "¿Buscás energía física o mental?", "¿Te cuesta relajarte?").
2. Cada opción de respuesta suma puntos a uno o más hongos en un diccionario de puntajes (definido en `Config_Hongos` o hardcodeado en `.gs`).
3. Al finalizar, se suman los puntajes y gana el hongo con mayor puntaje (con manejo de empate: elegir el primero en un orden de prioridad predefinido, o mostrar el "hongo secundario" también).
4. Guardar el resultado en `Respuestas_Cuestionario`.

**Mapeo hongo → experiencia final:**

| Hongo | Beneficio principal | Experiencia gamificada |
|---|---|---|
| Reishi | Relajación / sueño | Playlist musical para relajar antes de dormir (embed de Spotify/YouTube) |
| Cordyceps | Energía física | Mini-juego runner (esquivar obstáculos, velocidad creciente) |
| Melena de León | Foco / memoria / cognición | Juego de memoria (memotest) |
| Cola de Pavo (Turkey Tail) | Sistema inmune / equilibrio | Puzzle (rompecabezas deslizante o de piezas) |

---

## 5. FLUJO DE USUARIO END-TO-END

1. **Landing** → botón "Crear cuenta" / "Iniciar sesión".
2. **Registro:**
   - Usuario completa nombre + email.
   - Sistema genera contraseña temporal aleatoria, la hashea y guarda en `Usuarios` con `debe_cambiar_password = TRUE`.
   - Se envía email con la contraseña temporal vía `MailApp.sendEmail()`.
3. **Login:**
   - Usuario ingresa email + contraseña.
   - Si `debe_cambiar_password = TRUE` → redirige forzosamente a pantalla de "Cambiar contraseña" antes de dejarlo pasar a cualquier otra pantalla.
   - Si login OK → se genera token de sesión (guardado en `Sesiones` o `CacheService`, con expiración de ej. 2 horas).
4. **Cambio de contraseña obligatorio:** el usuario define su nueva contraseña (con validación mínima de seguridad), se actualiza `password_hash` y `debe_cambiar_password = FALSE`.
5. **Cuestionario:** preguntas una por una o en un solo formulario. Guarda respuestas.
6. **Resultado:** muestra el hongo recomendado + descripción + beneficios (desde `Config_Hongos`).
7. **Mapa:** filtra `Puntos_Venta` por el hongo recomendado y muestra pines en un mapa embebido.
8. **Experiencia gamificada:** según el hongo, redirige/muestra el mini-juego o playlist correspondiente (implementado en HTML/JS/CSS embebido dentro de la misma Web App).
9. **Historial (opcional/fase 2):** el usuario logueado puede ver sus recomendaciones pasadas.

---

## 6. SEGURIDAD (consideraciones obligatorias)

- Nunca guardar contraseñas en texto plano — usar hash (ej. `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt)`).
- La contraseña temporal debe expirar (ej. si no se usa en 24hs, forzar regeneración).
- Los tokens de sesión deben expirar y no ser predecibles (usar `Utilities.getUuid()`).
- Validar todos los inputs del lado del servidor (`.gs`), no confiar solo en validación de frontend.
- Sanitizar antes de escribir en Sheets para evitar inyección de fórmulas (prefijar valores que empiecen con `=`, `+`, `-`, `@`).
- Explicar al usuario en el prompt de build que Sheets **no es una base de datos con controles de acceso granulares reales**, así que es aceptable para un MVP/proyecto de bajo volumen, pero no para datos sensibles a gran escala.

---

## 7. ESTRUCTURA DE ARCHIVOS SUGERIDA (Apps Script)

```
Code.gs                → punto de entrada (doGet, doPost, funciones de negocio)
Auth.gs                → registro, login, cambio de contraseña, sesiones
Recomendacion.gs       → lógica de puntajes y mapeo hongo→experiencia
Mail.gs                → envío de emails
DB.gs                  → helpers de lectura/escritura sobre Sheets (get/set genéricos)
Index.html             → shell principal (SPA simple con vistas mostrando/ocultando divs, o navegación por parámetros)
Login.html
Registro.html
CambioPassword.html
Cuestionario.html
Resultado.html
Mapa.html
JuegoRunner.html
JuegoMemoria.html
JuegoPuzzle.html
Playlist.html
Styles.html            → CSS compartido
Scripts.html           → JS compartido (fetch a google.script.run)
```

Comunicación frontend↔backend vía `google.script.run.withSuccessHandler(...).nombreFuncion(...)`.

---

## 8. PLAN DE DESARROLLO POR FASES

**Fase 0 — Setup:** crear el Spreadsheet `Myco_DB` con las pestañas y encabezados definidos en la sección 3. Crear el proyecto de Apps Script vinculado.

**Fase 1 — Autenticación:** registro, envío de mail con contraseña temporal, login, cambio obligatorio de contraseña, manejo de sesión.

**Fase 2 — Cuestionario y motor de recomendación:** UI del cuestionario + lógica de puntajes + guardado de resultado.

**Fase 3 — Mapa:** pantalla de resultado con listado/mapa de puntos de venta filtrados por hongo.

**Fase 4 — Experiencias gamificadas:** las 4 experiencias (playlist, runner, memoria, puzzle), simples pero pulidas.

**Fase 5 — Pulido:** diseño visual, responsive, manejo de errores, mensajes de carga, deploy como Web App (acceso "Cualquier usuario, incluso anónimo" o "Cualquiera con cuenta de Google", según se decida).

---

## 9. CRITERIOS DE ACEPTACIÓN

- [ ] Un usuario nuevo puede registrarse sin intervención manual y recibe el mail con contraseña temporal.
- [ ] No puede usar la app hasta cambiar la contraseña temporal.
- [ ] El cuestionario siempre devuelve un hongo recomendado (nunca "ninguno").
- [ ] El mapa muestra únicamente puntos de venta relevantes al hongo recomendado.
- [ ] Cada uno de los 4 hongos dispara su experiencia gamificada correspondiente.
- [ ] Toda la lógica de recomendación es auditable en el código (sin llamadas a APIs de IA en producción).
- [ ] Los datos persisten correctamente en Google Sheets entre sesiones.

---

## 10. NOTAS PARA QUIEN EJECUTE ESTE PROMPT

- Construir fase por fase, no todo de una vez; validar cada fase antes de avanzar.
- Priorizar simplicidad en los mini-juegos (no hace falta que sean sofisticados, solo que cumplan la función de cerrar la experiencia).
- Dejar `Config_Hongos` fácil de editar para poder sumar más hongos a futuro sin tocar código.
- Documentar en el propio código los pasos de deploy (Publicar > Implementar como aplicación web).
