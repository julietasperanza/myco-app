# Myco — Recomendador de hongos adaptógenos

Aplicación web que recomienda hongos adaptógenos a partir de un breve
cuestionario, muestra en un mapa dónde conseguirlos cerca tuyo, y cierra la
experiencia con una actividad gamificada relacionada al hongo recomendado.

Proyecto final — Uso de IA generativa (vibe coding con Claude, de Anthropic).

## Elegí este tema porque...

...me apasiona el mundo de los hongos y todo su potencial para mejorar la
salud y el bienestar de las personas. Me interesa especialmente la
aplicación de los hongos adaptógenos como una alternativa natural para
acompañar el equilibrio físico y mental.

Creo que hoy existe una tendencia a buscar soluciones cada vez más
artificiales para problemas cotidianos, cuando muchas respuestas pueden
encontrarse en la naturaleza. Me inspira la idea de volver a las raíces,
recuperar conocimientos ancestrales y acercar esos saberes de una forma
accesible, simple y basada en evidencia.

## Para qué sirve

- Respondés un cuestionario de 5 preguntas sobre cómo te sentís (energía,
  sueño, foco, estrés, sistema inmune).
- La app te recomienda uno de 4 hongos adaptógenos: **Reishi**, **Cordyceps**,
  **Melena de León** o **Turkey Tail**, con sus beneficios clave y una
  sugerencia de consumo.
- Te muestra en un mapa dónde conseguirlo cerca de tu ciudad.
- Cierra la experiencia con una actividad temática: una playlist para
  relajarte (Reishi), un juego de reflejos (Cordyceps), un memotest (Melena
  de León), o un juego de defensa (Turkey Tail).

La recomendación se calcula con reglas fijas (sin IA en producción): la IA
generativa se usó únicamente para **construir** la aplicación, no para que
la persona que la usa dependa de un modelo en tiempo real.

## Cómo se usa

1. Entrás a la app, creás una cuenta con tu nombre y email.
2. Te llega un correo con una contraseña temporal, que tenés que cambiar en
   el primer ingreso.
3. Completás el cuestionario.
4. Ves tu recomendación, el mapa de dónde conseguirlo, y accedés a la
   experiencia gamificada asociada.

## Cómo está construido

- **Backend**: Google Apps Script (autenticación, base de datos, motor de
  recomendación, envío de correos).
- **Base de datos**: Google Sheets.
- **Frontend**: HTML, CSS y JavaScript, servidos por el propio Apps Script.
- **IA generativa usada en el proceso**: Claude (Anthropic), para redactar la
  especificación técnica, generar todo el código, diseñar la identidad
  visual, generar mockups previos a cada implementación, y diagnosticar
  errores a partir de capturas de pantalla reales.

## Estructura de este repositorio

- `01-especificacion-inicial/` — el prompt y documento con el que arrancó el
  proyecto, antes de escribir código.
- `02-capturas-del-proceso/` — capturas reales de pantallas, bugs detectados
  y correcciones a lo largo del desarrollo.
- `03-app-funcional/` — el código completo y funcional de la aplicación
  (Google Apps Script + HTML/CSS/JS).
- `informe-final.pdf` — el informe del trabajo (introducción, marco
  conceptual, metodología, resultados, análisis crítico y conclusiones).
- `registro-de-iteraciones.docx` — historial detallado de todas las rondas de
  feedback, bugs encontrados y mejoras aplicadas durante el desarrollo.

## Instalación

Los pasos detallados para instalar la app en una cuenta propia de Google
están en `03-app-funcional/README.md`.

## Autora

Julieta Speranza — Diplomatura en IA Aplicada a Entornos Digitales de
Gestión, FCE-UBA, Cohorte 2026.
