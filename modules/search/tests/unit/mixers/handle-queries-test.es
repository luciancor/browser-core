/* global chai, describeModule */

const Rx = require('rxjs');
const rxSandbox = require('rx-sandbox').rxSandbox;


const mock = {
  'search/logger': {
    default: {
      log() {},
    },
  },
  'search/operators/enricher': {
    default: class {},
  },
  'search/operators/responses/finalize': {
    default: observable => observable,
  },
  'search/operators/results/utils': {
    getResultOrder: x => x,
  },
  'search/mixers/mix-results': {
    default: '[dynamic]',
  },
};

export default describeModule('search/mixers/handle-queries',
  () => mock,
  () => {
    describe('#handleQueries', function () {
      let handleQueries;
      let sandbox;

      beforeEach(function () {
        sandbox = rxSandbox.create();
        this.deps('search/mixers/mix-results').default = () => sandbox.hot('rr|');
        handleQueries = this.module().default;
      });


      it('start search for each query', function () {
        const query$ = sandbox.hot('-q--q--|');
        const expected = sandbox.e('   -rr-rr-|');

        const messages = sandbox.getMessages(handleQueries(query$, Rx.Observable.empty()));
        sandbox.flush();

        return chai.expect(messages).to.deep.equal(expected);
      });

      it('stop updating results on highlight', function () {
        const query$ = sandbox.hot('-q--q--|');
        const highlight$ = sandbox.hot('-----h-|');
        const expected = sandbox.e('    -rr-r--|');

        const messages = sandbox.getMessages(handleQueries(query$, highlight$));
        sandbox.flush();

        return chai.expect(messages).to.deep.equal(expected);
      });
    });
  },
);
