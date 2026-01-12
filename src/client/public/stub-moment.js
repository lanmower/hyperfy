export default function moment(date) {
  return {
    format: (fmt) => new Date(date || Date.now()).toISOString(),
    toDate: () => new Date(date || Date.now()),
    valueOf: () => (date instanceof Date ? date.getTime() : Date.now()),
    unix: () => Math.floor((date instanceof Date ? date.getTime() : Date.now()) / 1000)
  };
}

export function utc(date) {
  return moment(date);
}

moment.utc = utc;
