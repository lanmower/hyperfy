// Server security configuration - extends core defaults
// Note: For buildless compatibility, server uses same config as client
// MasterConfig overrides can be applied at runtime if needed

export const SecurityConfig = {
  limits: {
    maxScriptSize: 1000000,
    maxStringLiteral: 100000,
    maxUrlLength: 2048,
    maxPropertyDepth: 20,
  },

  dangerousPatterns: [
    { pattern: /\beval\s*\(/gi, name: 'eval()' },
    { pattern: /\bFunction\s*\(/gi, name: 'Function()' },
    { pattern: /\bsetTimeout\s*\(\s*['"`]/gi, name: 'setTimeout with string code' },
    { pattern: /\bsetInterval\s*\(\s*['"`]/gi, name: 'setInterval with string code' },
    { pattern: /\brequire\s*\(/gi, name: 'require()' },
    { pattern: /\bimport\s+/gi, name: 'import statement' },
    { pattern: /\bdocument\./gi, name: 'document access' },
    { pattern: /\bwindow\./gi, name: 'window access' },
    { pattern: /\bparent\./gi, name: 'parent access' },
    { pattern: /\btop\./gi, name: 'top access' },
    { pattern: /\blocalStorage/gi, name: 'localStorage' },
    { pattern: /\bsessionStorage/gi, name: 'sessionStorage' },
    { pattern: /\bcookie/gi, name: 'cookie access' },
    { pattern: /\bWorker\s*\(/gi, name: 'Worker constructor' },
    { pattern: /\bprocess\./gi, name: 'process access' },
    { pattern: /\bchild_process/gi, name: 'child_process module' },
    { pattern: /\bfs\./gi, name: 'fs module' },
    { pattern: /\bpath\./gi, name: 'path module' },
    { pattern: /\bos\./gi, name: 'os module' },
    { pattern: /\b__dirname/gi, name: '__dirname' },
    { pattern: /\b__filename/gi, name: '__filename' },
    { pattern: /\bglobal\./gi, name: 'global access' },
    { pattern: /\bglobalThis\./gi, name: 'globalThis access' },
    { pattern: /constructor\s*\.\s*constructor/gi, name: 'constructor.constructor' },
  ],

  urlConfig: {
    allowedProtocols: ['http:', 'https:'],
    blockedPatterns: [
      /^127\./,
      /^localhost$/i,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^\[::1\]/,
      /^\[::/,
    ],
  },

  regexRedosPatterns: [
    /(\.\*){3,}/,
    /(\.\+){3,}/,
    /(\w\*){3,}/,
    /(\w\+){3,}/,
    /\(.*\)\*/,
    /\(.*\)\+/,
  ],

  pathTraversalPatterns: [
    '../',
    '..\\',
    /^\/etc\//,
    /^\/root\//,
    /^C:\\Windows\\/,
    /^C:\\Program Files\\/,
  ],
}

export default SecurityConfig
