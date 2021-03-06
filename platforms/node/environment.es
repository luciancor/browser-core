import config from '../core/config';

const CLIQZEnvironment = {
  RESULTS_TIMEOUT: config.settings.RESULTS_TIMEOUT,
  historySearch() {},
  // mocked functions
  getWindow() {},
  Promise,
  telemetry: () => {},
};

export default CLIQZEnvironment;
