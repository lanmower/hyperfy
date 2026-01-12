import { DatabaseSecurityWrapper } from './DatabaseSecurityWrapper.js'
import { XSSProtector } from './XSSProtector.js'
import { CSRFTokenManager } from './CSRFTokenManager.js'
import { SecurityAuditor } from './SecurityAuditor.js'
import { RetryManager } from '../resilience/RetryManager.js'
import { SecurityIntegration } from './SecurityIntegration.js'

export const SECURITY_USAGE_EXAMPLES = {
  databaseSecurity: {
    description: 'Protect against SQL injection with parameterized queries',
    example: `
const wrapper = new DatabaseSecurityWrapper(db);

const users = wrapper.executeSafe(
  'SELECT * FROM users WHERE email = ? AND id = ?',
  ['user@example.com', '123']
);

wrapper.insertWithValidation('users', {
  id: 'user123',
  email: 'user@example.com',
  name: 'John Doe'
});

wrapper.updateWithValidation(
  'users',
  { name: 'Jane Doe', email: 'jane@example.com' },
  'id = ?',
  ['user123']
);

wrapper.deleteWithValidation(
  'users',
  'id = ? AND email = ?',
  ['user123', 'jane@example.com']
);

const metrics = wrapper.getMetrics();
console.log('DB Security Metrics:', metrics);
    `,
  },

  xssProtection: {
    description: 'Prevent XSS attacks by sanitizing user input',
    example: `
const xss = new XSSProtector();

const userInput = '<script>alert("xss")</script><p>Hello</p>';
const safe = xss.sanitizeHTML(userInput);

const textInput = '<img src=x onerror="alert(\'xss\')">';
const escaped = xss.sanitizeText(textInput);

const contentValidation = xss.validateContentType(userInput);
if (!contentValidation.valid) {
  console.error('Invalid content:', contentValidation.error);
}

const objectData = {
  name: '<script>alert("xss")</script>',
  items: ['<img src=x onerror="alert()">', 'safe']
};
const sanitized = xss.sanitizeObject(objectData);

const xssPatterns = xss.checkForXSSPatterns(userInput);
if (xssPatterns.length > 0) {
  console.warn('XSS detected:', xssPatterns);
}
    `,
  },

  csrfProtection: {
    description: 'Generate and validate CSRF tokens for state-changing operations',
    example: `
const csrf = new CSRFTokenManager({ tokenExpiry: 3600000 });

const sessionId = 'user-session-123';
const token = csrf.generateToken(sessionId);
console.log('CSRF Token:', token);

const isValid = csrf.validateToken(token, sessionId);
if (isValid) {
  console.log('Token is valid');
  const newToken = csrf.refreshToken(token, sessionId);
}

csrf.invalidateSession(sessionId);

const metrics = csrf.getMetrics();
console.log('CSRF Metrics:', metrics);

csrf.destroy();
    `,
  },

  retryLogic: {
    description: 'Implement exponential backoff retry with transient error detection',
    example: `
const retry = new RetryManager();

async function fetchData() {
  return retry.execute(async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  }, 3, 100);
}

async function fetchWithBackoff() {
  return retry.executeWithBackoff(async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  }, {
    maxRetries: 5,
    baseDelay: 100,
    maxDelay: 30000,
    timeout: 10000,
  });
}

const isTransient = retry.isTransientError({ code: 'ECONNREFUSED' });
const delay = retry.calculateBackoff(2, 100, 30000);
    `,
  },

  securityAuditing: {
    description: 'Log all security events for monitoring and compliance',
    example: `
const auditor = new SecurityAuditor({
  maxEvents: 50000,
  enableRemoteLogging: true,
  remoteEndpoint: 'https://logging.example.com/audit'
});

auditor.auditAccess('resource/123', 'user-456', true, {
  method: 'GET',
  ipAddress: '192.168.1.1'
});

auditor.auditModification('user/789', 'admin-user', {
  name: 'John Doe',
  email: 'john@example.com'
}, { source: 'admin-panel' });

auditor.auditDeletion('file/abc', 'user-456', {
  reason: 'User requested deletion'
});

auditor.auditAuthentication('user-456', true, null, {
  method: 'oauth',
  provider: 'google'
});

auditor.auditSecurityViolation('SQL_INJECTION_ATTEMPT', 'HIGH', {
  endpoint: '/api/users',
  payload: 'SELECT * FROM users...',
  blocked: true
});

const violations = auditor.getSecurityViolations(100);
const metrics = auditor.getMetrics();
console.log('Audit Metrics:', metrics);

auditor.addEventListener((event) => {
  console.log('Security Event:', event);
});
    `,
  },

  integratedSecurity: {
    description: 'Use all security modules together',
    example: `
const security = new SecurityIntegration();
security.initialize(db);

async function handleUserUpdate(userId, userData, sessionId) {
  try {
    const token = request.headers['x-csrf-token'];
    if (!security.validateCSRFToken(token, sessionId)) {
      security.onAccessDenied('user/' + userId, userId);
      throw new Error('Invalid CSRF token');
    }

    const sanitized = security.sanitizeObject(userData);

    const result = await security.executeWithRetry(async () => {
      const wrapper = security.getDatabaseWrapper();
      return wrapper.updateWithValidation(
        'users',
        sanitized,
        'id = ?',
        [userId]
      );
    }, 3);

    security.onDataModified('user/' + userId, userId, result);
    return result;
  } catch (error) {
    security.onSecurityViolation('UPDATE_FAILED', 'MEDIUM', {
      userId,
      error: error.message
    });
    throw error;
  }
}

const metrics = security.getSecurityMetrics();
console.log('Complete Security Metrics:', metrics);

security.destroy();
    `,
  },
}

export function printSecurityGuide() {
  for (const [key, guide] of Object.entries(SECURITY_USAGE_EXAMPLES)) {
    console.log(`\n=== ${guide.description} ===\n`)
    console.log(guide.example)
  }
}
