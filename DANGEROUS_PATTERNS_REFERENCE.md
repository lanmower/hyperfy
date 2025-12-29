# Dangerous Patterns Reference

Quick reference for all patterns blocked by InputSanitizer.

## Code Execution Patterns

### eval()
**Pattern:** `/\beval\s*\(/gi`
**Risk:** Direct code execution from strings
**Example:** `eval('malicious code')`

### Function()
**Pattern:** `/\bFunction\s*\(/gi`
**Risk:** Dynamic function creation
**Example:** `new Function('alert(1)')()`

### setTimeout/setInterval with string code
**Pattern:** `/\bsetTimeout\s*\(\s*['"`]/gi` and `/\bsetInterval\s*\(\s*['"`]/gi`
**Risk:** Delayed code execution
**Example:** `setTimeout("alert(1)", 100)`

## Module System Patterns

### require()
**Pattern:** `/\brequire\s*\(/gi`
**Risk:** CommonJS module imports
**Example:** `require('fs').readFileSync('/etc/passwd')`

### import statement
**Pattern:** `/\bimport\s+/gi`
**Risk:** ES6 module imports
**Example:** `import fs from 'fs'`

## Browser API Patterns

### document access
**Pattern:** `/\bdocument\./gi`
**Risk:** DOM manipulation, XSS
**Example:** `document.cookie = 'stolen'`

### window access
**Pattern:** `/\bwindow\./gi`
**Risk:** Global scope manipulation
**Example:** `window.location = 'http://evil.com'`

### parent access
**Pattern:** `/\bparent\./gi`
**Risk:** Frame escape
**Example:** `parent.location = 'http://evil.com'`

### top access
**Pattern:** `/\btop\./gi`
**Risk:** Frame escape
**Example:** `top.location = 'http://evil.com'`

## Storage Patterns

### localStorage
**Pattern:** `/\blocalStorage/gi`
**Risk:** Persistent storage manipulation
**Example:** `localStorage.setItem('token', 'stolen')`

### sessionStorage
**Pattern:** `/\bsessionStorage/gi`
**Risk:** Session storage manipulation
**Example:** `sessionStorage.clear()`

### cookie
**Pattern:** `/\bcookie/gi`
**Risk:** Cookie theft
**Example:** `document.cookie`

## Worker Patterns

### Worker
**Pattern:** `/\bWorker\s*\(/gi`
**Risk:** Background thread creation
**Example:** `new Worker('malicious.js')`

## Node.js Patterns

### process access
**Pattern:** `/\bprocess\./gi`
**Risk:** Process manipulation
**Example:** `process.exit(1)`

### child_process
**Pattern:** `/\bchild_process/gi`
**Risk:** Subprocess spawning
**Example:** `require('child_process').exec('rm -rf /')`

### fs access
**Pattern:** `/\bfs\./gi`
**Risk:** File system access
**Example:** `fs.readFileSync('/etc/passwd')`

### path access
**Pattern:** `/\bpath\./gi`
**Risk:** Path manipulation
**Example:** `path.join('..', 'etc', 'passwd')`

### os access
**Pattern:** `/\bos\./gi`
**Risk:** OS information access
**Example:** `os.homedir()`

### __dirname
**Pattern:** `/\b__dirname/gi`
**Risk:** Directory path exposure
**Example:** `console.log(__dirname)`

### __filename
**Pattern:** `/\b__filename/gi`
**Risk:** File path exposure
**Example:** `console.log(__filename)`

## Global Scope Patterns

### global access
**Pattern:** `/\bglobal\./gi`
**Risk:** Node.js global scope manipulation
**Example:** `global.process = null`

### globalThis access
**Pattern:** `/\bglobalThis\./gi`
**Risk:** Universal global scope manipulation
**Example:** `globalThis.fetch = maliciousFetch`

### constructor.constructor
**Pattern:** `/constructor\s*\.\s*constructor/gi`
**Risk:** Prototype chain escape
**Example:** `({}).constructor.constructor('alert(1)')()`

## URL Validation

### Allowed Protocols
- http:
- https:

### Blocked Hosts
- 127.0.0.0/8 (127.*)
- localhost
- 192.168.0.0/16 (192.168.*)
- 10.0.0.0/8 (10.*)
- 172.16.0.0/12 (172.16-31.*)
- ::1 (IPv6 localhost)
- :: (IPv6 any)

## File Path Validation

### Blocked Patterns
- ../ (directory traversal)
- ..\\ (Windows directory traversal)
- /etc/ (Unix system)
- /root/ (Unix root)
- C:\\Windows\\ (Windows system)
- C:\\Program Files\\ (Windows programs)

## Regex Validation (ReDoS)

### Dangerous Patterns
- `(.*){3,}` - Excessive wildcard repetition
- `(.+){3,}` - Excessive plus repetition
- `(\w*){3,}` - Excessive word wildcard
- `(\w+){3,}` - Excessive word plus
- `(.*)*` - Nested quantifiers
- `(.*)+` - Nested quantifiers

## Size Limits

### Scripts
- Max size: 1,048,576 bytes (1MB)
- Max string literal: 102,400 bytes (100KB)

### Properties
- Max depth: 10 levels
- Max string value: 102,400 bytes (100KB)

### URLs
- Max length: 2,048 characters

### Entities
- position: array[3]
- quaternion: array[4]
- scale: array[3]
- state: validated object

## Comment Handling

Comments are removed before pattern matching:
- `/* multi-line comments */`
- `// single-line comments`

This prevents false positives from commented-out code.

## Allowed Safe Patterns

### THREE.js
All THREE.* objects and methods are allowed:
- THREE.Object3D
- THREE.Vector3
- THREE.Quaternion
- THREE.Euler
- THREE.Matrix4

### Standard JavaScript
- Math.*
- Object.*
- Array.*
- String.*
- Number.*
- Date.now
- console.log/warn/error

### Custom Code
- User-defined functions
- User-defined variables
- Standard control flow (if, for, while)
- Arrow functions
- Async/await

## Pattern Matching Notes

### Case Insensitive
All patterns use `/gi` flags for case-insensitive matching.

### Word Boundaries
Most patterns use `\b` word boundaries to prevent partial matches:
- `eval` matches `eval()` but not `medieval()`
- `window` matches `window.` but not `windowManager.`

### Whitespace Tolerance
Patterns allow optional whitespace:
- `eval\s*\(` matches both `eval()` and `eval ()`

## False Positive Prevention

### Comments Removed First
```javascript
// This is safe: eval('code')
const x = 1
```
The comment is removed before checking for `eval()`.

### String Literals Extracted
String size checking happens separately from pattern matching to avoid confusion.

### Context Aware
Validation knows the difference between:
- Blueprint scripts (strict)
- Blueprint properties (permissive)
- Entity data (structured)

## Violation Reporting

Each violation includes:
- `type` - Category of violation
- `pattern` - Specific pattern matched (for DANGEROUS_PATTERN)
- `message` - Human-readable description
- `occurrences` - Number of times pattern found (for DANGEROUS_PATTERN)
- `source` - Where violation occurred (for blueprints)
- `path` - Property path (for property violations)

Example:
```javascript
{
  type: 'DANGEROUS_PATTERN',
  pattern: 'eval()',
  message: 'Dangerous pattern detected: eval()',
  occurrences: 2,
  source: 'blueprint.script',
  blueprintId: 'bp-123'
}
```
