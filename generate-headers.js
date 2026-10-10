// Writes the _headers file that puts the whole site behind a password.
// The username and password come from the BASIC_AUTH_CREDENTIALS environment
// variable set in the Netlify dashboard, in the form  username:password
// If the variable is missing or malformed, the build stops, so the site is
// never published without a password (Netlify keeps the previous deploy live).
const fs = require('fs');

const cred = (process.env.BASIC_AUTH_CREDENTIALS || '').trim();

if (!cred) {
  console.error('BASIC_AUTH_CREDENTIALS is not set. Stopping so the site is not published without a password.');
  process.exit(1);
}
if (!/^[^:\s]+:[^\s]+$/.test(cred)) {
  console.error('BASIC_AUTH_CREDENTIALS must look like username:password, with no spaces.');
  process.exit(1);
}

const rules = [
  '/*',
  '  Basic-Auth: ' + cred,
  '  X-Robots-Tag: noindex, nofollow',
  ''
].join('\n');

fs.writeFileSync('_headers', rules);
console.log('Password protection set up for user "' + cred.split(':')[0] + '".');
