import {
  clearIntervals,
  clone,
  defaultConfig,
  expect
} from './helpers';
import {
  mockOfferMessage,
  Subject
} from '../../core/test-helpers-freshtab';

describe('Fresh tab offer notification UI', function () {
  let subject;
  let config;

  before(function () {
    subject = new Subject();
    config = clone(defaultConfig);
    config.response.componentsState.news.visible = true;
    config.response.messages = mockOfferMessage;
    subject.respondsWith(config);

    subject.respondsWith({
      module: 'offers-v2',
      action: 'processRealEstateMessages',
      response: {}
    });

    subject.respondsWith({
      module: 'core',
      action: 'sendTelemetry',
      response: ''
    });

    subject.respondsWith({
      module: 'freshtab',
      action: 'getSpeedDials',
      response: {
        history: [],
        custom: []
      }
    });

    subject.respondsWith({
      module: 'freshtab',
      action: 'getNews',
      response: {
        version: 0,
        news: []
      }
    });
  });

  after(function () {
    clearIntervals();
  });

  context('when one offer message is available', function () {
    before(function () {
      return subject.load();
    });

    after(function () {
      subject.unload();
    });

    it('the offer is visible', function () {
      const offerSelector = '.offer-middle-notification';
      expect(subject.query(offerSelector)).to.exist;
    });
  });
});
