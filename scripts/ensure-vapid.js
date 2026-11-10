const fs = require('node:fs');
const path = require('node:path');
const webpush = require('web-push');

const envPath = path.join(process.cwd(), '.env');
let contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const current = Object.fromEntries(contents.split(/\r?\n/).filter(line => /^[A-Z0-9_]+=/.test(line)).map(line => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, '')];
}));

if (current.VAPID_PUBLIC_KEY && current.VAPID_PRIVATE_KEY) {
  process.stdout.write('VAPID keys already exist in .env; left unchanged.\n');
  process.exit(0);
}

const keys = webpush.generateVAPIDKeys();
const values = {
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: current.VAPID_SUBJECT || 'mailto:admin@example.com',
};
for (const [name, value] of Object.entries(values)) {
  const line = `${name}=${value}`;
  const matcher = new RegExp(`^${name}=.*$`, 'm');
  contents = matcher.test(contents) ? contents.replace(matcher, line) : `${contents.replace(/\s*$/, '')}\n${line}\n`;
}
fs.writeFileSync(envPath, contents, 'utf8');
process.stdout.write('Generated VAPID keys and saved them to the ignored .env file.\n');
