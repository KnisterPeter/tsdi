// these imports run the test directly
// in the default window of cypress
import '../__tests__/configure-test';
import '../__tests__/index-test';
import '../__tests__/mock-test';

describe('TSDI should work', () => {
  it('as UMD distribution', () => {
    cy.visit('lib/__integration__/test.umd.html');
  });
});
