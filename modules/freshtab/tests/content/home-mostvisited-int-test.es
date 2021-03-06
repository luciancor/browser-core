import {
  clearIntervals,
  clone,
  expect,
  waitFor
} from '../../core/test-helpers';
import {
  defaultConfig,
  generateHistoryResponse,
  Subject
} from '../../core/test-helpers-freshtab';

describe('Fresh tab interactions with most visited', function () {
  const dialSelector = '#section-most-visited .dial';
  const dialTitleSelector = '.title';
  const deleteBtnSelector = 'button.delete';
  const undoBoxSelector = '.undo-notification-box';
  const areaSelector = '#section-most-visited';
  const historyResponse = generateHistoryResponse();

  let $initialDials;
  let $dialToDelete;
  let $2ndDialToDelete;
  let deletedTitle;
  let $deletedBtn;
  let $afterClickDials;
  let subject;
  let messages;
  let listener;

  beforeEach(function () {
    subject = new Subject();
    subject.respondsWithEmptyTelemetry();
    subject.respondsWithEmptyNews();

    const mostVisitedConfig = clone(defaultConfig);
    mostVisitedConfig.response.componentsState.historyDials.visible = true;
    subject.respondsWith(mostVisitedConfig);
  });

  afterEach(function () {
    clearIntervals();
  });

  context('when first two tiles have been deleted from a list of 3 elements', function () {
    let $2ndDeletedBtn;

    beforeEach(async function () {
      subject.respondsWith({
        module: 'freshtab',
        action: 'getSpeedDials',
        response: historyResponse[2],
      });

      subject.respondsWith({
        module: 'freshtab',
        action: 'checkForHistorySpeedDialsToRestore',
        response: true,
      });

      subject.respondsWith({
        module: 'freshtab',
        action: 'resetAllHistory',
        response: historyResponse[2],
      });

      await subject.load();
      // Keep track of received messages
      messages = new Map();
      listener = function (msg) {
        if (!messages.has(msg.action)) {
          messages.set(msg.action, []);
        }

        messages.get(msg.action).push(msg);
      };
      subject.chrome.runtime.onMessage.addListener(listener);

      $initialDials = subject.queryAll(dialSelector);
      $dialToDelete = $initialDials[0];
      $2ndDialToDelete = $initialDials[1];
      $deletedBtn = $dialToDelete.querySelector(deleteBtnSelector);
      $deletedBtn.click();
      await waitFor(() => (subject.query(undoBoxSelector)));

      $2ndDeletedBtn = $2ndDialToDelete
        .querySelector(deleteBtnSelector);
      $2ndDeletedBtn.click();
      return waitFor(() => (subject.query(undoBoxSelector)));
    });

    afterEach(function () {
      subject.chrome.runtime.onMessage.removeListener(listener);
      subject.unload();
    });

    describe('clicking on the "Restore all" button in settings panel', function () {
      const settingsButtonSelector = '#settings-btn';
      const settingsPanelSelector = '#settings-panel';
      const restoreBtnSelector = '#settings-panel button.link';

      beforeEach(async function () {
        subject.query(settingsButtonSelector).click();
        await waitFor(() => subject.query(settingsPanelSelector).classList.contains('visible'));
        subject.query(restoreBtnSelector).click();
        return waitFor(() => subject.queryAll(dialSelector).length === 3);
      });

      it('renders 3 most visited elements', function () {
        expect(subject.queryAll(dialSelector).length).to.equal(3);
      });

      it('changes the "Restore all" button state to inactive', function () {
        expect(subject.query(restoreBtnSelector).disabled).to.be.true;
      });

      it('sends a "resetAllHistory" message', function () {
        expect(messages.has('resetAllHistory')).to.equal(true);
        expect(messages.get('resetAllHistory').length).to.equal(1);
      });

      it('sends a "settings > restore_topsites > click" telemetry signal', function () {
        expect(messages.has('sendTelemetry')).to.equal(true);

        const telemetrySignals = messages.get('sendTelemetry');
        let count = 0;

        expect(telemetrySignals.length).to.be.above(0);

        count = telemetrySignals.filter(function (s) {
          return (
            s.args[0].type === 'home' &&
            s.args[0].view === 'settings' &&
            s.args[0].target === 'restore_topsites' &&
            s.args[0].action === 'click'
          );
        }).length;

        expect(count).to.equal(1);
      });
    });
  });

  context('when most visited has just one element', function () {
    beforeEach(async function () {
      subject.respondsWith({
        module: 'freshtab',
        action: 'getSpeedDials',
        response: historyResponse[0],
      });

      await subject.load();

      // Keep track of received messages
      messages = new Map();
      listener = function (msg) {
        if (!messages.has(msg.action)) {
          messages.set(msg.action, []);
        }

        messages.get(msg.action).push(msg);
      };
      subject.chrome.runtime.onMessage.addListener(listener);

      $initialDials = subject.queryAll(dialSelector);
      $dialToDelete = $initialDials[0];
    });

    afterEach(function () {
      subject.chrome.runtime.onMessage.removeListener(listener);
      subject.unload();
    });

    describe('clicking on the element', function () {
      beforeEach(function () {
        const logoSelector = '.logo';
        $dialToDelete.querySelector(logoSelector).click();
      });

      it('sends a "topsite > click" telemetry signal', function () {
        expect(messages.has('sendTelemetry')).to.equal(true);

        const telemetrySignals = messages.get('sendTelemetry');
        let count = 0;

        expect(telemetrySignals.length).to.be.above(0);

        count = telemetrySignals.filter(function (s) {
          return (
            s.args[0].type === 'home' &&
            s.args[0].target === 'topsite' &&
            s.args[0].action === 'click'
          );
        }).length;

        expect(count).to.equal(1);
      });
    });

    describe('clicking on a delete button of the element', function () {
      beforeEach(function () {
        deletedTitle = $dialToDelete
          .querySelector(dialTitleSelector).textContent;
        $deletedBtn = $dialToDelete.querySelector(deleteBtnSelector);
        $deletedBtn.click();
        return waitFor(() => (subject.query(undoBoxSelector)));
      });

      afterEach(function () {
        subject.chrome.runtime.onMessage.removeListener(listener);
      });

      describe('of the first element', function () {
        it('removes the element', function () {
          expect(deletedTitle).to.equal(historyResponse[0].history[0].displayTitle);
        });

        it('does not render any other elements', function () {
          expect(subject.queryAll(dialSelector).length).to.equal(0);
        });

        it('renders a popup with undo message', function () {
          expect(subject.query(undoBoxSelector)).to.exist;
        });

        it('still renders the most visited area', function () {
          expect(subject.query(areaSelector)).to.exist;
        });

        it('sends a "removeSpeedDial" message', function () {
          expect(messages.has('removeSpeedDial')).to.equal(true);
          expect(messages.get('removeSpeedDial').length).to.equal(1);
        });

        it('sends a "delete_topsite > click" telemetry signal', function () {
          expect(messages.has('sendTelemetry')).to.equal(true);

          const telemetrySignals = messages.get('sendTelemetry');
          let count = 0;

          expect(telemetrySignals.length).to.be.above(0);

          count = telemetrySignals.filter(function (s) {
            return (
              s.args[0].type === 'home' &&
              s.args[0].target === 'delete_topsite' &&
              s.args[0].action === 'click'
            );
          }).length;

          expect(count).to.equal(1);
        });

        describe('then clicking on a close button of the undo popup', function () {
          const undoPopupCloseBtnSelector = '.undo-notification-box button.close';

          beforeEach(async function () {
            subject.query(undoPopupCloseBtnSelector).click();
            await waitFor(() => expect(subject.query(undoBoxSelector)).to.not.have.class('visible'), 500);
            $afterClickDials = subject.queryAll(dialSelector);
          });

          it('removes the popup', function () {
            expect(subject.query(undoBoxSelector)).to.not.have.class('visible');
          });

          it('total amount of rendered elements equals to 0', function () {
            expect($afterClickDials.length).to.equal(0);
          });

          it('sends a "notification > close > click" telemetry signal', function () {
            expect(messages.has('sendTelemetry')).to.equal(true);

            const telemetrySignals = messages.get('sendTelemetry');
            let count = 0;

            expect(telemetrySignals.length).to.be.above(0);

            count = telemetrySignals.filter(function (s) {
              return (
                s.args[0].type === 'home' &&
                s.args[0].view === 'notification' &&
                s.args[0].target === 'close' &&
                s.args[0].action === 'click'
              );
            }).length;

            expect(count).to.equal(1);
          });
        });

        describe('then clicking on an undo button of the undo popup', function () {
          const undoPopupUndoBtnSelector = '.undo-notification-box button.undo';

          beforeEach(async function () {
            subject.query(undoPopupUndoBtnSelector).click();
            await waitFor(() => expect(subject.query(undoBoxSelector)).to.not.have.class('visible'), 500);
            $afterClickDials = subject.queryAll(dialSelector);
          });

          it('removes the popup', function () {
            expect(subject.query(undoBoxSelector)).to.not.have.class('visible');
          });

          it('renders the previously deleted element', function () {
            let deletedDialExists = false;

            expect($afterClickDials.length).to.be.above(0);
            [...$afterClickDials].forEach(function (dial) {
              if (dial.querySelector(dialTitleSelector).textContent
                      === deletedTitle) {
                deletedDialExists = true;
              }
            });
            expect(deletedDialExists).to.equal(true);
          });

          it('total amount of rendered elements equals to 1', function () {
            expect($afterClickDials.length).to.equal(1);
          });

          it('renders the previously deleted element on correct position', function () {
            expect([...$afterClickDials][0]
              .querySelector(dialTitleSelector).textContent)
              .to.equal(deletedTitle);
          });

          it('sends a "revertHistorySpeedDial" message', function () {
            expect(messages.has('revertHistorySpeedDial')).to.equal(true);
            expect(messages.get('revertHistorySpeedDial').length).to.equal(1);
          });

          it('sends a "notification > undo_delete_topsite > click" telemetry signal', function () {
            expect(messages.has('sendTelemetry')).to.equal(true);

            const telemetrySignals = messages.get('sendTelemetry');
            let count = 0;

            expect(telemetrySignals.length).to.be.above(0);

            count = telemetrySignals.filter(function (s) {
              return (
                s.args[0].type === 'home' &&
                s.args[0].view === 'notification' &&
                s.args[0].target === 'undo_delete_topsite' &&
                s.args[0].action === 'click'
              );
            }).length;

            expect(count).to.equal(1);
          });
        });
      });
    });
  });

  context('when most visited has six elements', function () {
    beforeEach(function () {
      subject.respondsWith({
        module: 'freshtab',
        action: 'getSpeedDials',
        response: historyResponse[5],
      });
      return subject.load();
    });

    afterEach(function () {
      subject.chrome.runtime.onMessage.removeListener(listener);
      subject.unload();
    });

    describe('clicking on a delete button of the first element', function () {
      beforeEach(async function () {
        $initialDials = subject.queryAll(dialSelector);
        $dialToDelete = $initialDials[0];
        deletedTitle = $dialToDelete
          .querySelector(dialTitleSelector).textContent;
        $deletedBtn = $dialToDelete.querySelector(deleteBtnSelector);
        $deletedBtn.click();
        await waitFor(() => (subject.queryAll(dialSelector).length === 5));
        $afterClickDials = subject.queryAll(dialSelector);
      });

      it('removes the element', function () {
        expect(deletedTitle).to.equal(historyResponse[1].history[0].displayTitle);
      });

      it('keeps rendering a full list consisting of 5 elements', function () {
        expect(subject.queryAll(dialSelector).length).to.equal(5);
      });
    });

    describe('clicking on a delete button of the fifth element', function () {
      beforeEach(async function () {
        $initialDials = subject.queryAll(dialSelector);
        $dialToDelete = $initialDials[4];
        deletedTitle = $dialToDelete
          .querySelector(dialTitleSelector).textContent;
        $deletedBtn = $dialToDelete.querySelector(deleteBtnSelector);
        $deletedBtn.click();
        await waitFor(() => (subject.queryAll(dialSelector).length === 5));
        $afterClickDials = subject.queryAll(dialSelector);
      });

      it('removes the element', function () {
        expect(deletedTitle).to.equal(historyResponse[5].history[4].displayTitle);
      });

      it('keeps rendering a full list consisting of 5 elements', function () {
        expect(subject.queryAll(dialSelector).length).to.equal(5);
      });
    });
  });
});
