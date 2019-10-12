/* istanbul ignore next */
const enabled = (() => {
  const test = (str: string | undefined | null) => {
    return (str || '').indexOf('tsdi') !== -1 || str === '*';
  };
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    return test(process.env.DEBUG);
  } else if (typeof window !== 'undefined') {
    return test(window.localStorage.getItem('DEBUG'));
  }
  return false;
})();

/* istanbul ignore next */
export const debug = (_: string) => {
  // tslint:disable-next-line:cyclomatic-complexity
  const log = (template: string | Error, ...args: any[]) => {
    if (!enabled) {
      return;
    }

    if (template instanceof Error) {
      console.error(template);
      return;
    }

    const parts = [];
    let arg = 0;
    let pos = 0;
    let idx = template.indexOf('%', pos);
    while (idx !== -1) {
      parts.push(template.substring(pos, idx));
      switch (template.substr(idx, 2)) {
        case '%o':
          parts.push(args[arg++]);
          break;
        case '%s':
          parts.push(String(args[arg++]));
          break;
      }
      pos = idx + 2;
      idx = template.indexOf('%', pos);
    }
    if (pos < template.length) {
      parts.push(template.substring(pos));
    }
    console.log(...parts);
  };
  log.enabled = enabled;
  return log;
};
