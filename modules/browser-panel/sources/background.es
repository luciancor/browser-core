import background from '../core/base/background';
import events from '../core/events';
import console from '../core/console';
import prefs from '../core/prefs';
import DisplayManager from './display_manager';
import { REAL_ESTATE_ID, PANEL_STATE_PREF_NAME } from './consts';
import inject from '../core/kord/inject';

const MODULE_NAME = 'browser-panel-bg';


function linfo(msg) {
  console.log(`[info] ${msg}`, MODULE_NAME);
}
function lwarn(msg) {
  console.log(`[warning] ${msg}`, MODULE_NAME);
}


/**
  @namespace browser-panel
  @module browser-panel
  @class Background
 */
export default background({
  offersV2: inject.module('offers-v2'),

  /**
    @method init
    @param settings
  */
  init() {
    this.is_enabled = prefs.get(PANEL_STATE_PREF_NAME, false);

    if (!this.is_enabled) {
      return;
    }

    this.actions = {
      windowUIConnector: this.windowUIConnector.bind(this)
    };
    if (this.is_enabled) {
      this.displayMngr = new DisplayManager(this.actions.windowUIConnector);
    }
    // register real estate
    this.registerState();
  },

  unload() {
    if (!this.is_enabled) {
      return;
    }
    if (this.displayMngr) {
      delete this.displayMngr;
    }
    this.is_enabled = false;
    this.registerState();
  },

  beforeBrowserShutdown() {

  },

  /**
   * in this method we will process all the events coming from the ui
   * the layout of the message:
   * {
   *   handler: offers,
   *   data: {...}, // real data of the message
   * }
   * @return {[type]} [description]
   */
  displayCbHandler(msg) {
    if (!msg || !msg.handler) {
      lwarn('displayCbHandler: invalid msg format');
      return;
    }
    switch (msg.handler) {
      case 'offers':
        this.sendOffersMessage(msg.data);
        // check if the message is close we need to close it on the display manager
        if (msg.data &&
            msg.data.type === 'offer-action-signal' &&
            msg.data.data.action_id === 'offer_closed') {
          // close the offer / remove it
          if (this.displayMngr) {
            this.displayMngr.removeElement(msg.data.data.offer_id);
          }
        }
        break;
      default:
        lwarn(`displayCbHandler: invalid handler: ${msg.handler}`);
        break;
    }
  },

  /**
   * this method will process the message coming from the offer module and
   * properly adapt it to the display manager. This method should be called from
   * the offers-send-ch callback or from the message-center
   * @param  {[type]} msg [description]
   * @return {[type]}     [description]
   */
  processOfferMessage(msg) {
    if (!msg.type || !msg.data) {
      lwarn(`processOfferMessage: invalid msg: ${msg}`);
      return;
    }
    // we will execute the proper action
    switch (msg.type) {
      case 'push-offer': {
        // check that the format is the proper
        if (!msg.data.offer_id || !msg.data.offer_data) {
          lwarn('processOfferMessage: missing arguments');
          return;
        }
        const offerID = msg.data.offer_id;
        const offerData = msg.data.offer_data;
        let displayUrls = null;
        let displayTimeSecs = null;
        if (msg.data.display_rule) {
          displayUrls = msg.data.display_rule.url;
          displayTimeSecs = msg.data.display_rule.display_time_secs;
        } else {
          displayUrls = msg.data.offer_data.rule_info.url;
          displayTimeSecs = msg.data.offer_data.rule_info.display_time_secs;
        }
        if (!displayUrls) {
          lwarn('processOfferMessage: missing arguments on the msg?');
          return;
        }
        // we add the offer for all the urls
        const self = this;
        const offerInfo = {
          offer_id: offerID,
          offer_data: offerData,
          display_time_secs: displayTimeSecs
        };
        displayUrls.forEach((url) => {
          self.displayMngr.displayElement(offerID, url, offerInfo);
        });
      }
        break;
      case 'remove-offer':
        linfo(`processOfferMessage: removing offer: ${msg.data.offer_id}`);
        this.displayMngr.removeElement(msg.data.offer_id);
        break;
      default:
        linfo(`processOfferMessage: skipping msg type: ${msg.type}`);
        break;
    }
  },

  /**
   * we will send the offer signals on this method
   * @param  {[type]} msg [description]
   * @return {[type]}     [description]
   */
  sendOffersMessage(msg) {
    events.pub('offers-recv-ch', msg);
  },

  windowUIConnector(msg) {
    this.displayCbHandler(msg);
  },

  events: {
    'content:location-change': function onLocationChange({ url }) {
      const blackList = ['resource://', 'about:', 'chrome://', 'file://'];
      if (blackList.some(e => url.startsWith(e))) {
        return;
      }
      if (this.displayMngr) {
        this.displayMngr.onTabOrUrlChange({ url });
      }
    },
    'core:tab_select': function onTabSelected({ url }) {
      if (this.displayMngr) {
        this.displayMngr.onTabOrUrlChange({ url });
      }
    },

    // TODO: here we should later use the proper listener to get the events
    // from the message-center, we will do this in a second step after
    // we add the proper functionality on other commit
    'offers-send-ch': function onOfferMessage(msg) {
      if (!this.displayMngr) {
        // skip this message since it is not enabled
        return;
      }
      if (!msg || (msg.dest && msg.dest.length && (msg.dest.indexOf(REAL_ESTATE_ID) < 0))) {
        return;
      }
      // else we have the proper format we process it
      this.processOfferMessage(msg);
    },

    'offers-re-registration': function onOffersRegMessage(event) {
      if (event && event.type === 'broadcast') {
        this.registerState();
      }
    },
    prefchange: function onPrefChange(pref) {
      if (pref === PANEL_STATE_PREF_NAME) {
        this.is_enabled = prefs.get(PANEL_STATE_PREF_NAME, false);
        if (this.is_enabled && !this.displayMngr) {
          this.displayMngr = new DisplayManager(this.actions.windowUIConnector);
        }
        this.registerState();
      }
    }
  },

  actions: {
  },

  registerState() {
    const msg = { realEstateID: REAL_ESTATE_ID };
    if (this.is_enabled) {
      this.offersV2.action('registerRealEstate', msg).catch(() => {});
    } else {
      this.offersV2.action('unregisterRealEstate', msg).catch(() => {});
    }
  },

});
