/**
 * PROYECTO MYCO — Auth.gs
 * Registro, login, sesión y cambio obligatorio de contraseña.
 */

var SESION_DURACION_MS = 2 * 60 * 60 * 1000; // 2 horas

// ---------- utilidades de hash ----------
function generarSalt_() {
  return Utilities.getUuid();
}

function hashPassword_(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + ':' + salt);
  return digest.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function generarPasswordTemporal_() {
  // 10 caracteres alfanuméricos legibles (sin caracteres ambiguos)
  var alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var pass = '';
  for (var i = 0; i < 10; i++) {
    pass += alfabeto.charAt(Math.floor(Math.random() * alfabeto.length));
  }
  return pass;
}

// ---------- API pública (llamada desde el frontend con google.script.run) ----------

function registrarUsuario(nombre, email) {
  nombre = (nombre || '').trim();
  email = (email || '').trim().toLowerCase();

  if (!nombre || !email) return { ok: false, error: 'Completá tu nombre y tu email.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'El email no es válido.' };

  var existente = buscarFilaPor_('Usuarios', 'email', email);
  if (existente) return { ok: false, error: 'Ya existe una cuenta con ese email.' };

  var passwordTemporal = generarPasswordTemporal_();
  var salt = generarSalt_();
  var hash = hashPassword_(passwordTemporal, salt);

  agregarFila_('Usuarios', {
    id_usuario: Utilities.getUuid(),
    nombre: nombre,
    email: email,
    password_hash: hash,
    salt: salt,
    debe_cambiar_password: true,
    fecha_registro: new Date(),
    ultimo_login: '',
    estado: 'activo',
    avatar: 'a1'
  });

  enviarPasswordTemporal_(email, nombre, passwordTemporal);

  return { ok: true, mensaje: 'Te enviamos un correo con tu contraseña temporal.' };
}

function login(email, password) {
  email = (email || '').trim().toLowerCase();
  var usuario = buscarFilaPor_('Usuarios', 'email', email);

  if (!usuario) return { ok: false, error: 'Email o contraseña incorrectos.' };
  if (usuario.estado === 'bloqueado') return { ok: false, error: 'Esta cuenta está bloqueada.' };

  var hashIngresado = hashPassword_(password, usuario.salt);
  if (hashIngresado !== usuario.password_hash) {
    return { ok: false, error: 'Email o contraseña incorrectos.' };
  }

  actualizarFila_('Usuarios', usuario._fila, { ultimo_login: new Date() });

  var token = Utilities.getUuid();
  agregarFila_('Sesiones', {
    token: token,
    id_usuario: usuario.id_usuario,
    fecha_creacion: new Date(),
    fecha_expiracion: new Date(Date.now() + SESION_DURACION_MS)
  });

  return {
    ok: true,
    token: token,
    nombre: usuario.nombre,
    debeCambiarPassword: usuario.debe_cambiar_password === true || usuario.debe_cambiar_password === 'TRUE'
  };
}

function validarSesion_(token) {
  if (!token) return null;
  var sesion = buscarFilaPor_('Sesiones', 'token', token);
  if (!sesion) return null;
  if (new Date(sesion.fecha_expiracion).getTime() < Date.now()) return null;
  var usuario = buscarFilaPor_('Usuarios', 'id_usuario', sesion.id_usuario);
  return usuario;
}

function validarSesion(token) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false };
  return {
    ok: true,
    nombre: usuario.nombre,
    debeCambiarPassword: usuario.debe_cambiar_password === true || usuario.debe_cambiar_password === 'TRUE'
  };
}

function cambiarPassword(token, nuevaPassword) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false, error: 'Tu sesión expiró. Iniciá sesión de nuevo.' };
  if (!nuevaPassword || nuevaPassword.length < 8) {
    return { ok: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }

  var salt = generarSalt_();
  var hash = hashPassword_(nuevaPassword, salt);

  actualizarFila_('Usuarios', usuario._fila, {
    password_hash: hash,
    salt: salt,
    debe_cambiar_password: false
  });

  return { ok: true };
}

function cerrarSesion(token) {
  var sesion = buscarFilaPor_('Sesiones', 'token', token);
  if (sesion) eliminarFila_('Sesiones', sesion._fila);
  return { ok: true };
}

// ---------- OLVIDÉ MI CONTRASEÑA ----------
function solicitarRecuperacionPassword(email) {
  email = (email || '').trim().toLowerCase();
  var usuario = buscarFilaPor_('Usuarios', 'email', email);

  // Por seguridad, respondemos "ok" exista o no la cuenta (no revelamos si el email está registrado).
  if (!usuario) return { ok: true };

  var passwordTemporal = generarPasswordTemporal_();
  var salt = generarSalt_();
  var hash = hashPassword_(passwordTemporal, salt);

  actualizarFila_('Usuarios', usuario._fila, {
    password_hash: hash,
    salt: salt,
    debe_cambiar_password: true
  });

  enviarPasswordTemporal_(email, usuario.nombre, passwordTemporal);

  return { ok: true };
}

// ---------- PERFIL (nombre, edad, ciudad) ----------
function guardarPerfil(token, nombre, edad, ciudad) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false, error: 'Tu sesión expiró. Iniciá sesión de nuevo.' };

  var cambios = { edad: edad || '', ciudad: (ciudad || '').trim() };
  nombre = (nombre || '').trim();
  if (nombre) cambios.nombre = nombre;

  actualizarFila_('Usuarios', usuario._fila, cambios);

  return { ok: true, nombre: nombre || usuario.nombre };
}

function obtenerPerfil(token) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false };
  return { ok: true, nombre: usuario.nombre, edad: usuario.edad || '', ciudad: usuario.ciudad || '', avatar: usuario.avatar || 'a1' };
}

// ---------- AVATAR (elegido en el onboarding) ----------
function guardarAvatar(token, avatarId) {
  var usuario = validarSesion_(token);
  if (!usuario) return { ok: false };
  actualizarFila_('Usuarios', usuario._fila, { avatar: avatarId });
  return { ok: true };
}
