// Liest die Einstellungen aus Umgebungsvariablen. Im Add-on setzt das Dockerfile sie,
// lokal gelten die Vorgaben unten.
import path from 'node:path';

export function ladeKonfiguration(env = process.env) {
  return Object.freeze({
    host: env.HOST || '0.0.0.0',
    port: Number(env.PORT || 8099),
    // Hier liegen Datenbank und Dateien. Im Add-on ist das /data (Teil des HA-Backups).
    datenDir: path.resolve(env.DATEN_DIR || './daten'),
    // "test", "echt" oder "entwicklung"; wird in der Oberfläche angezeigt.
    kanal: env.KANAL || 'entwicklung',
    // 1 = nur Anfragen vom Home-Assistant-Supervisor (Ingress) annehmen.
    nurIngress: env.NUR_INGRESS === '1',
    // Nur lokal: Benutzername, wenn keine Ingress-Kopfzeilen ankommen.
    devBenutzer: env.DEV_BENUTZER || '',
    maxBildBytes: Number(env.MAX_BILD_MB || 60) * 1024 * 1024,
    maxAudioBytes: Number(env.MAX_AUDIO_MB || 25) * 1024 * 1024,
  });
}
