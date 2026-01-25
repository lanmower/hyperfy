export const isArray = Array.isArray;

export const isBoolean = (v) => typeof v === 'boolean';

export const isFunction = (v) => typeof v === 'function';

export const isNumber = (v) => typeof v === 'number' && !isNaN(v);

export const isString = (v) => typeof v === 'string';

export const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const isNil = (v) => v == null;

export const isDefined = (v) => v !== undefined;

export const isUndefined = (v) => v === undefined;

export function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => cloneDeep(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = cloneDeep(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

export function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }

  return true;
}

export function debounce(func, wait) {
  let timeout;
  return function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export const every = (arr, predicate) => arr.every(predicate);

export const some = (arr, predicate) => arr.some(predicate);

export function sortBy(arr, iteratees) {
  const copy = [...arr];
  return copy.sort((a, b) => {
    const getIteratee = (obj) => {
      if (typeof iteratees === 'function') return iteratees(obj);
      if (typeof iteratees === 'string') return obj[iteratees];
      return obj[iteratees];
    };
    const aVal = getIteratee(a);
    const bVal = getIteratee(b);
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}

export function orderBy(arr, iteratees, orders = 'asc') {
  const copy = [...arr];
  const orderArr = Array.isArray(orders) ? orders : [orders];

  return copy.sort((a, b) => {
    const iterateeArr = Array.isArray(iteratees) ? iteratees : [iteratees];

    for (let i = 0; i < iterateeArr.length; i++) {
      const iteratee = iterateeArr[i];
      const order = orderArr[i] || 'asc';

      const getVal = (obj) => {
        if (typeof iteratee === 'function') return iteratee(obj);
        if (typeof iteratee === 'string') return obj[iteratee];
        return obj[iteratee];
      };

      const aVal = getVal(a);
      const bVal = getVal(b);

      if (aVal !== bVal) {
        const cmp = aVal < bVal ? -1 : 1;
        return order === 'desc' ? -cmp : cmp;
      }
    }
    return 0;
  });
}
