/* global chai, describeModule */

const Rx = require('rxjs');
const rxSandbox = require('rx-sandbox').rxSandbox;


const mock = {
  'platform/lib/rxjs': {
    default: Rx,
  }
};

export default describeModule('search/operators/streams/static/combine-any-latest',
  () => mock,
  () => {
    describe('#combineAnyLatest', function () {
      let combineAnyLatest;
      let sandbox;

      beforeEach(function () {
        sandbox = rxSandbox.create();
        combineAnyLatest = this.module().default;
      });

      it('does not emit', function () {
        const obs1$ = sandbox.hot(' --');
        const obs2$ = sandbox.hot(' --');
        const expected = sandbox.e('--');

        const messages = sandbox.getMessages(combineAnyLatest([obs1$, obs2$]));
        sandbox.flush();

        return chai.expect(messages).to.deep.equal(expected);
      });

      it('emits immediately', function () {
        const obs1$ = sandbox.hot(' --1');
        const obs2$ = sandbox.hot(' ---');
        const expected = sandbox.e('--c', { c: ['1'] });

        const messages = sandbox.getMessages(combineAnyLatest([obs1$, obs2$]));
        sandbox.flush();

        return chai.expect(messages).to.deep.equal(expected);
      });

      it('combines latest', function () {
        const obs1$ = sandbox.hot(' --12-');
        const obs2$ = sandbox.hot(' ----3');
        const expected = sandbox.e('--cde', { c: ['1'], d: ['2'], e: ['2', '3'] });

        const messages = sandbox.getMessages(combineAnyLatest([obs1$, obs2$]));
        sandbox.flush();

        return chai.expect(messages).to.deep.equal(expected);
      });
    });
  },
);
