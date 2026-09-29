import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Explicit one-time import. Never overwrite a database, never delete the source.
const directory = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const candidates = existsSync(directory)
  ? readdirSync(directory).filter(name => name.endsWith('.sqlite') && name !== 'metadata.sqlite')
  : [];
if (!process.argv[2] && candidates.length !== 1) {
  throw new Error('Pass the exact existing D1 SQLite file as the first argument.');
}
const source = resolve(process.argv[2] || `${directory}/${candidates[0]}`);
const destination = resolve(process.env.SPLITSAFARI_DATABASE_PATH || 'data/splitsafari.sqlite');
if (!existsSync(source)) throw new Error('Source database does not exist.');
if (existsSync(destination)) throw new Error('Destination already exists; refusing to overwrite data.');
const input = new DatabaseSync(source, { readOnly: true });
const before = input.prepare('SELECT COUNT(*) AS count FROM groups').get().count;
mkdirSync(dirname(destination), { recursive: true });
await backup(input, destination);
input.close();
const output = new DatabaseSync(destination, { readOnly: true });
if (output.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Database integrity check failed.');
const after = output.prepare('SELECT COUNT(*) AS count FROM groups').get().count;
output.close();
if (before !== after) throw new Error('Database group count does not match.');
console.log(`Preserved ${after} groups, expenses, sessions and invitations in ${destination}. Original D1 state is unchanged.`);
