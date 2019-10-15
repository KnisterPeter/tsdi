// these imports run the test directly
// in the default window of cypress
import '../index-test';
import '../mock-test';

describe('TSDI should work', () => {
  it('as UMD distribution', () => {
    cy.visit('/tests/integration/test.umd.html');
  });
});
