import { TSDI } from '../lib';
import { managed } from '../lib/compiler';

test('Allow scopes to be configured statically', () => {
  @managed
  class DependencyWithScope {}

  const tsdi = new TSDI();
  tsdi.configure(DependencyWithScope, {
    meta: {
      scope: 'some-scope'
    }
  });

  tsdi.getScope('some-scope').enter();

  expect(tsdi.get(DependencyWithScope)).toBeInstanceOf(DependencyWithScope);
});
