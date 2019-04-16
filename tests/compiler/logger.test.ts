import { Level, Logger } from '../../lib/compiler/logger';

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let logs: any[] = [];
let errors: any[] = [];

beforeEach(() => {
  logs = [];
  errors = [];
  console.log = (...args: any[]) => logs.push(args);
  console.error = (...args: any[]) => errors.push(args);
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

test('Logger should print enabled level', () => {
  const logger = new Logger(Level.info);
  logger.debug('debug');
  logger.info('info');
  logger.warn('warn');
  logger.error('error');

  expect(logs).toEqual([['info'], ['warn']]);
  expect(errors).toEqual([['error']]);
});

test('Logger should print error', () => {
  const error = new Error();

  const logger = new Logger(Level.info);
  logger.error('error', error);

  expect(errors).toEqual([['error', error]]);
});
