/**
 * Utilitários de Data e Hora padronizados para Moçambique (Africa/Maputo - UTC+2 / CAT)
 * Garante sincronização estrita em recibos, talões, movimentações e relatórios.
 */

export const MAPUTO_TIMEZONE = 'Africa/Maputo';

/**
 * Retorna a data/hora atual no fuso de Maputo (UTC+2)
 */
export function getMaputoNow(): Date {
  return new Date();
}

/**
 * Formata apenas a hora no formato HH:mm (ou HH:mm:ss se includeSeconds = true)
 */
export function formatTimeMaputo(
  date: Date | string | number = new Date(),
  includeSeconds = false
): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleTimeString('pt-MZ', {
      timeZone: MAPUTO_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });
  } catch {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
    });
  }
}

/**
 * Formata apenas a data no formato DD/MM/AAAA
 */
export function formatDateMaputo(date: Date | string | number = new Date()): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleDateString('pt-MZ', {
      timeZone: MAPUTO_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT');
  }
}

/**
 * Formata data e hora completas no formato: DD/MM/AAAA às HH:mm:ss
 */
export function formatDateTimeMaputo(
  date: Date | string | number = new Date(),
  includeSeconds = true
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const data = formatDateMaputo(d);
  const hora = formatTimeMaputo(d, includeSeconds);
  return `${data} ${hora}`;
}

/**
 * Retorna o tempo decorrido amigável (ex: "há 10 min", "há 2h") no fuso de Moçambique
 */
export function getRelativeTimeMaputo(date: Date | string | number): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `há ${diffHoras}h ${diffMin % 60}m`;
    const diffDias = Math.floor(diffHoras / 24);
    return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
  } catch {
    return 'Recentemente';
  }
}
