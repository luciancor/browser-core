/* global describeModule */

const moment = require('moment');
const storageTests = require('./impl');

const DATE_FORMAT = 'YYYY-MM-DD';
let currentDate = '2017-01-01';
const setCurrentDate = (date) => { currentDate = date; };
const getCurrentMoment = () => moment(currentDate, DATE_FORMAT);
const getFormattedCurrentDate = () => getCurrentMoment().format(DATE_FORMAT);

export default describeModule('anolysis/internals/storage/async-storage',
  () => ({
    'anolysis/internals/synchronized-date': {
      DATE_FORMAT,
      default() {
        return getCurrentMoment();
      },
    },
  }),
  () => {
    let Storage = null;

    beforeEach(function () {
      if (Storage === null) {
        Storage = this.module().default;
      }
    });

    describe('Run tests', function () {
      storageTests({
        DATE_FORMAT,
        getCurrentMoment,
        getFormattedCurrentDate,
        setCurrentDate,
        getStorage: () => Storage,
      });
    });
  },
);
