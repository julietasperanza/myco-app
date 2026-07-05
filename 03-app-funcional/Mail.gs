/**
 * PROYECTO MYCO — Mail.gs
 * Envío de correos transaccionales.
 */

function enviarPasswordTemporal_(email, nombre, passwordTemporal) {
  var asunto = 'Myco — Tu acceso temporal';
  var cuerpoHtml =
    '<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background:#EFE8D8; border-radius: 16px;">' +
    '<h2 style="color:#22362A; font-weight:600;">🌿 Bienvenido/a a Myco, ' + nombre + '</h2>' +
    '<p style="color:#22362A; font-size:15px; line-height:1.6;">Tu cuenta fue creada. Usá esta contraseña temporal para ingresar por primera vez. Vas a tener que cambiarla apenas inicies sesión.</p>' +
    '<div style="background:#22362A; color:#FBF8F0; font-family: monospace; font-size:20px; letter-spacing:2px; padding:16px; border-radius:8px; text-align:center; margin: 20px 0;">' +
    passwordTemporal +
    '</div>' +
    '<p style="color:#5C7A52; font-size:13px;">Si no solicitaste esta cuenta, podés ignorar este correo.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: asunto,
    htmlBody: cuerpoHtml
  });
}
