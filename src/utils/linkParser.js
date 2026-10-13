/**
 * Amigo Link & Signaling Server URL Parser
 * Automatically parses full invite links, tunnel URLs, and raw server addresses:
 * Extracts:
 * - serverUrl: clean base server URL without query params (e.g. http://192.168.1.3:4000)
 * - roomId: room ID if embedded in link (?room=...)
 * - roomSecret: room passcode if embedded in link (?secret=...)
 */

export function parseInviteOrServerLink(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return null;
  let trimmed = inputStr.trim();
  if (!trimmed) return null;

  // Auto-correct accidental dot before port (e.g. 192.168.1.3.4000 -> 192.168.1.3:4000)
  trimmed = trimmed.replace(/\.([0-9]{4,5})(\/?|\?.*)$/, ':$1$2');

  let urlObj = null;
  try {
    const hasScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    urlObj = new URL(hasScheme ? trimmed : `http://${trimmed}`);
  } catch {
    let clean = trimmed.split('?')[0].replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    return {
      serverUrl: clean,
      roomId: null,
      roomSecret: null,
      hasLinkParams: false,
    };
  }

  const queryRoom = urlObj.searchParams.get('room');
  const querySecret = urlObj.searchParams.get('secret');
  const queryServer = urlObj.searchParams.get('server');

  // Determine the clean base signaling server URL:
  let cleanServer = '';
  if (queryServer) {
    try {
      const serverParsed = new URL(queryServer.startsWith('http') ? queryServer : `http://${queryServer}`);
      cleanServer = `${serverParsed.protocol}//${serverParsed.host}`;
    } catch {
      cleanServer = queryServer.split('?')[0].replace(/\/+$/, '');
    }
  } else {
    cleanServer = `${urlObj.protocol}//${urlObj.host}`;
  }

  // If user typed https:// on a local IP, convert to http://
  if (cleanServer.startsWith('https://192.168.') || cleanServer.startsWith('https://localhost') || cleanServer.startsWith('https://127.0.0.1')) {
    cleanServer = cleanServer.replace(/^https:\/\//, 'http://');
  }

  return {
    serverUrl: cleanServer,
    roomId: queryRoom ? decodeURIComponent(queryRoom).trim() : null,
    roomSecret: querySecret ? decodeURIComponent(querySecret).trim() : null,
    hasLinkParams: Boolean(queryRoom || querySecret || queryServer),
  };
}
