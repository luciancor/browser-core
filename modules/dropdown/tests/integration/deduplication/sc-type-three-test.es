import {
  blurUrlBar,
  $cliqzResults,
  expect,
  fillIn,
  mockSearch,
  testsEnabled,
  urlbar,
  waitFor,
  waitForPopup,
  withHistory
} from '../helpers';

import wikiResult from '../fixtures/resultsBigMachineRichData';
import bingResult from '../fixtures/resultsBigMachineWithButtons';

export default function () {
  if (!testsEnabled()) { return; }
  describe('deduplication for SC results of type 3', function () {
    before(function () {
      window.preventRestarts = true;
    });

    after(function () {
      window.preventRestarts = false;
    });

    context('2 backend results, both have rich data', function () {
      context('when first result is "search with"', function () {
        const results = wikiResult.concat(bingResult);
        let $resultElement1;
        let $resultElement2;
        const query = 'test wikipedia';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          $resultElement1 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result')
          );
          $resultElement2 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data only for 1st url', function () {
          expect($resultElement1.querySelector('.anchors')).to.exist;
          expect($resultElement1.querySelector('.images')).to.exist;
          expect($resultElement2.querySelector('.buttons')).to.not.exist;
        });
      });

      context('when first result is "navigate to"', function () {
        const results = bingResult.concat(wikiResult);
        let $resultElement1;
        let $resultElement2;
        const query = 'bing.com';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          $resultElement1 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result')
          );
          $resultElement2 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data only for 1st url', function () {
          expect($resultElement1.querySelector('.buttons')).to.exist;
          expect($resultElement2.querySelector('.anchors')).to.not.exist;
          expect($resultElement2.querySelector('.images')).to.not.exist;
        });
      });

      context('when first result is autocompleted', function () {
        const results = bingResult.concat(wikiResult);
        let $resultElement1;
        let $resultElement2;
        const query = 'bing';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(2);
          await waitFor(() => urlbar.mInputField.value !== query);
          $resultElement1 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result')
          );
          $resultElement2 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data only for 1st url', function () {
          expect($resultElement1.querySelector('.buttons')).to.exist;
          expect($resultElement2.querySelector('.anchors')).to.not.exist;
          expect($resultElement2.querySelector('.images')).to.not.exist;
        });
      });
    });

    context('2 backend results, only second has rich data', function () {
      context('when first result is "search with"', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $resultElement2;
        const query = 'test bing';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`));
          $resultElement2 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data for 2nd url', function () {
          expect($resultElement2.querySelector('.buttons')).to.exist;
        });
      });

      context('when first result is "navigate to"', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $resultElement2;
        const query = 'test-sc-of-type-3.com';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`));
          $resultElement2 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data for 2nd url', function () {
          expect($resultElement2.querySelector('.buttons')).to.exist;
        });
      });

      context('when first result is autocompleted', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $resultElement2;
        const query = 'test-sc';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(2);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`));
          $resultElement2 = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data for 2nd url', function () {
          expect($resultElement2.querySelector('.buttons')).to.exist;
        });
      });
    });

    context('1 history and 1 backend, both have rich data', function () {
      context('when first result is "search with"', function () {
        const results = wikiResult.concat(bingResult);
        let $historyElement;
        let $resultElement;
        const query = 'test wikipedia';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          $historyElement = () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history');
          $resultElement = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data only for 1st url', function () {
          expect($historyElement()).to.exist;
          expect($historyElement().querySelector('.anchors')).to.exist;
          expect($historyElement().querySelector('.images')).to.exist;
          expect($resultElement.querySelector('.buttons')).to.not.exist;
        });
      });

      context('when first result is "navigate to"', function () {
        const results = bingResult.concat(wikiResult);
        let $historyElement;
        let $resultElement;
        const query = 'bing.com';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          $historyElement = () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result');
          $resultElement = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data only for 1st url', function () {
          expect($historyElement()).to.exist;
          expect($historyElement().querySelector('.buttons')).to.exist;
          expect($resultElement.querySelector('.anchors')).to.not.exist;
          expect($resultElement.querySelector('.images')).to.not.exist;
        });
      });

      context('when first result is autocompleted', function () {
        const results = bingResult.concat(wikiResult);
        let $historyElement;
        let $resultElement;
        const query = 'bing';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          await waitFor(() => urlbar.mInputField.value !== query);
          $historyElement = () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result');
          $resultElement = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data only for 1st url', function () {
          expect($historyElement()).to.exist;
          expect($historyElement().querySelector('.buttons')).to.exist;
          expect($resultElement.querySelector('.anchors')).to.not.exist;
          expect($resultElement.querySelector('.images')).to.not.exist;
        });
      });
    });

    context('1 history and 1 backend, backend result has rich data', function () {
      context('when first result is "search with"', function () {
        const results = bingResult.concat([{ url: 'http://test-sc-of-type-3.com' }]);
        let $resultElement;
        const query = 'test bing';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history'));
          $resultElement = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data for backend url', function () {
          expect($resultElement.querySelector('.buttons')).to.exist;
        });
      });

      context('when first result is "navigate to"', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $resultElement;
        const query = 'test-sc-of-type-3.com';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history'));
          $resultElement = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data for backend url', function () {
          expect($resultElement.querySelector('.buttons')).to.exist;
        });
      });

      context('when first result is autocompleted', function () {
        const results = bingResult.concat([{ url: 'http://test-sc-of-type-3.com' }]);
        let $resultElement;
        const query = 'test-sc';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history'));
          $resultElement = await waitFor(
            () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result')
          );
        });

        it('renders rich data for backend url', function () {
          expect($resultElement.querySelector('.buttons')).to.exist;
        });
      });
    });

    context('2 history results, both have rich data', function () {
      context('when first result is "search with"', function () {
        const results = bingResult.concat(wikiResult);
        let $historyElement1;
        let $historyElement2;
        const query = 'test wikipedia';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url2 }, { value: url1 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          $historyElement1 = () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history');
          $historyElement2 = () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history');
        });

        it('renders rich data only for 1st url', async function () {
          await waitFor(() => {
            expect($historyElement1().querySelector('.anchors')).to.exist;
            expect($historyElement1().querySelector('.images')).to.exist;
            return expect($historyElement2().querySelector('.buttons')).to.not.exist;
          }, 600);
        });
      });

      context('when first result is "navigate to"', function () {
        const results = bingResult.concat(wikiResult);
        let $historyElement1;
        let $historyElement2;
        const query = 'bing.com';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }, { value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          $historyElement1 = () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history');
          $historyElement2 = () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history');
        });

        it('renders rich data only for 1st url', async function () {
          await waitFor(() => {
            expect($historyElement1().querySelector('.buttons')).to.exist;
            expect($historyElement2().querySelector('.anchors')).to.not.exist;
            return expect($historyElement2().querySelector('.images')).to.not.exist;
          }, 600);
        });
      });

      context('when first result is autocompleted', function () {
        const results = bingResult.concat(wikiResult);
        let $historyElement1;
        let $historyElement2;
        const query = 'bing';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }, { value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          await waitFor(() => urlbar.mInputField.value !== query);
          $historyElement1 = () => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.cliqz-result');
          $historyElement2 = () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.cliqz-result');
        });

        it('renders rich data only for 1st url', async function () {
          await waitFor(() => {
            expect($historyElement1().querySelector('.buttons')).to.exist;
            expect($historyElement2().querySelector('.anchors')).to.not.exist;
            return expect($historyElement2().querySelector('.images')).to.not.exist;
          }, 600);
        });
      });
    });

    context('2 history results, only second has rich data', function () {
      context('when first result is "search with"', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $historyElement;
        const query = 'test bing';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }, { value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history'));
          $historyElement = () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history');
        });

        it('renders rich data for 2nd url', function () {
          expect($historyElement()).to.exist;
          expect($historyElement().querySelector('.buttons')).to.exist;
        });
      });

      context('when first result is "navigate to"', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $historyElement;
        const query = 'test-sc-of-type-3.com';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }, { value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(4);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history'));
          $historyElement = () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history');
        });

        it('renders rich data for 2nd url', function () {
          expect($historyElement()).to.exist;
          expect($historyElement().querySelector('.buttons')).to.exist;
        });
      });

      context('when first result is autocompleted', function () {
        const results = [{ url: 'http://test-sc-of-type-3.com' }].concat(bingResult);
        let $historyElement;
        const query = 'test-sc';
        const url1 = results[0].url;
        const url2 = results[1].url;

        before(async function () {
          blurUrlBar();
          withHistory([{ value: url1 }, { value: url2 }]);
          await mockSearch({ results });
          fillIn(query);
          await waitForPopup(3);
          await waitFor(() => $cliqzResults.querySelector(`.result[data-url="${url1}"]`).closest('.history'));
          $historyElement = () => $cliqzResults.querySelector(`.result[data-url="${url2}"]`).closest('.history');
        });

        it('render rich data for 2nd url', function () {
          expect($historyElement()).to.exist;
          expect($historyElement().querySelector('.buttons')).to.exist;
        });
      });
    });
  });
}
