// Stubs for Node.js modules that might get imported by mistake in bundled code
// These are never actually used in the browser but prevent import errors
window['generic-pool'] = { Pool: class {} };
window['knex'] = { default: () => {} };
window['pg'] = { Pool: class {} };
window['better-sqlite3'] = class {};
window['mysql2'] = {};
window['sqlite3'] = { Database: class {} };
