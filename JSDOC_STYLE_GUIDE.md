# JSDoc Style Guide

This document defines the JSDoc style for the Hyperfy codebase. JSDoc types help catch code duplication and improve IDE support.

## Class Documentation

```javascript
/**
 * Short description of the class
 * @class
 * @param {Object} options
 * @param {string} options.name
 * @param {Logger} options.logger
 */
export class MyClass {
  constructor(options) {}
}
```

## Method Documentation

```javascript
/**
 * Short description
 * @param {string} name - Parameter description
 * @param {number} [timeout=5000] - Optional parameter with default
 * @param {...string} args - Variable arguments
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} When something fails
 * @example
 * const result = await obj.method('test', 1000)
 */
async method(name, timeout = 5000, ...args) {
  return {}
}
```

## Type Definitions

```javascript
/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {Array} violations
 */

/**
 * @typedef {Object} BackupManifest
 * @property {string} id
 * @property {number} timestamp
 * @property {Object} stats
 */
```

## Function Types

```javascript
/**
 * @callback RequestHandler
 * @param {Request} request
 * @param {Reply} reply
 * @returns {Promise<void>}
 */

/**
 * @param {RequestHandler} handler
 */
function register(handler) {}
```

## Common Type Patterns

### Nullable Types
```javascript
/**
 * @param {string|null} value
 * @param {?string} value - Alternative syntax
 * @returns {string|undefined}
 */
```

### Object with Properties
```javascript
/**
 * @param {Object} options
 * @param {string} options.name
 * @param {number} options.port
 * @param {Array<string>} options.hosts
 */
```

### Arrays and Maps
```javascript
/**
 * @param {Array<string>} items
 * @param {Map<string, Object>} cache
 * @param {Set<number>} ids
 */
```

### Union Types
```javascript
/**
 * @param {(string|number)} id
 * @param {'read'|'write'|'admin'} role
 */
```

## Coverage Strategy

Priority order for JSDoc documentation:

1. **Critical (Must Have)**
   - Class constructors and public methods
   - API route handlers
   - Error handlers and middleware
   - Validation functions
   - Data transformation functions

2. **Important (Should Have)**
   - System classes and their methods
   - Configuration classes
   - Utility functions used across modules
   - Event emitters and callbacks

3. **Nice to Have**
   - Small helper functions
   - Internal private methods
   - Obvious one-liners

## Enforcing Types

Run type checking with:
```bash
npm run lint
```

This will catch:
- Mismatched parameter types
- Missing return types
- Incorrect callback signatures
- Duplicate type definitions (helps catch code duplication)

## Benefits

✓ IDE autocomplete and hover hints
✓ Catch type mismatches early
✓ Detect duplicate patterns through type consistency
✓ Self-documenting code
✓ No TypeScript compilation overhead
✓ Zero runtime impact
