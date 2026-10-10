// BIOL3005 Cognition: login check that runs before every page and file.
// The login comes from the secret BASIC_AUTH_CREDENTIALS, set in the
// Cloudflare dashboard as  username:password  (it is never stored in the repository).
// Anything other than the correct login gets a 401 and the browser's login box.

const REALM = 'BIOL3005 Cognition';

async function sameText(a, b) {
  // Compare via SHA-256 digests so the comparison time does not leak the password.
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(da), y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function loginRequired() {
  return new Response('Please log in to view BIOL3005 Cognition.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export default {
  async fetch(request, env) {
    const expected = (env.BASIC_AUTH_CREDENTIALS || '').trim();
    // Refuse to serve anything if the login has not been set up properly.
    if (!/^[^:\s]+:\S+$/.test(expected)) {
      return new Response('This site is not configured yet.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    const header = request.headers.get('Authorization') || '';
    if (!header.startsWith('Basic ')) return loginRequired();

    let given = '';
    try {
      const bytes = Uint8Array.from(atob(header.slice(6).trim()), c => c.charCodeAt(0));
      given = new TextDecoder().decode(bytes);
    } catch (e) {
      return loginRequired();
    }
    if (!(await sameText(given, expected))) return loginRequired();

    // Logged in: serve the requested page or file.
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('Cache-Control', 'private, no-cache');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  },
};
