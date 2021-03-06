import moment from '../platform/lib/moment';
import UAParser from '../platform/lib/ua-parser';
import {
  getChannel,
  getCountry,
  getDistribution,
  getInstallDate, // nDays since Epoch
  getUserAgent
} from '../platform/demographics';

import Logger from './logger';
import getSynchronizedDate from './synchronized-time';

const logger = Logger.get('core', {
  level: 'log',
  prefix: '[demographics]',
});

const ARCHITECTURE = new Set([
  'amd64',
  'i386',
  'x86_64',
]);

const BSD_OS = new Set([
  'FreeBSD',
  'NetBSD',
  'OpenBSD',
  'DragonFly',
]);


const LINUX_OS = new Set([
  'Arch',
  'CentOS',
  'Fedora',
  'Debian',
  'Gentoo',
  'GNU',
  'Mageia',
  'Mandriva',
  'Mint',
  'RedHat',
  'Slackware',
  'SUSE',
  'Ubuntu',
  'VectorLinux',
]);


function normalizeString(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function parseCountry(country) {
  return country;
}


function parseInstallDate(rawInstallDate) {
  let installDate = `Other/${rawInstallDate || ''}`;

  if (rawInstallDate) {
    const installDateMs = rawInstallDate * 86400000;
    const momentInstallDate = moment(installDateMs);
    // This date format is expected by the gid backend. '/' is used as a
    // separator to split demographics into sub-trees. Do not use another
    // format there.
    installDate = momentInstallDate.format('YYYY/MM/DD');
    const currentDate = getSynchronizedDate();
    if (rawInstallDate < 16129 || momentInstallDate.isAfter(currentDate, 'day')) {
      // Some install date are not possible and should be considered as
      // outlier:
      // - In the past (before Cliqz existed)
      // - In the future
      installDate = `Other/${installDate}`;
    }
  }
  logger.debug('install_date', installDate);
  return installDate;
}


function parsePlatform(agent) {
  let platform = `Other/${agent}`;
  if (agent === 'ios') {
    platform = 'Mobile/iOS';
  } else if (agent === 'android') {
    platform = 'Mobile/Android';
  } else if (agent) {
    const uaParser = new UAParser();
    uaParser.setUA(agent);

    // Possible osFamily:
    // AIX, Amiga OS, Android, Arch, Bada, BeOS, BlackBerry, CentOS, Chromium OS, Contiki,
    // Fedora, Firefox OS, FreeBSD, Debian, DragonFly, Gentoo, GNU, Haiku, Hurd, iOS,
    // Joli, Linpus, Linux, Mac OS, Mageia, Mandriva, MeeGo, Minix, Mint, Morph OS, NetBSD,
    // Nintendo, OpenBSD, OpenVMS, OS/2, Palm, PCLinuxOS, Plan9, Playstation, QNX, RedHat,
    // RIM Tablet OS, RISC OS, Sailfish, Series40, Slackware, Solaris, SUSE, Symbian, Tizen,
    // Ubuntu, UNIX, VectorLinux, WebOS, Windows [Phone/Mobile], Zenwalk
    const { name: osName, version: osVersion } = uaParser.getOS();

    // Indicate if we should append osVersion to platform
    let shouldAppendVersion = false;

    if (osName === 'Windows') {
      platform = 'Desktop/Windows';
      shouldAppendVersion = true;
    } else if (osName === 'Mac OS') {
      platform = 'Desktop/Mac OS';
      shouldAppendVersion = true;
    } else if (BSD_OS.has(osName)) {
      platform = `Desktop/BSD/${osName}`;
    } else if (osName === 'Linux' || osName === 'linux') {
      platform = 'Desktop/Linux';
    } else if (LINUX_OS.has(osName)) {
      platform = `Desktop/Linux/${osName}`;
      shouldAppendVersion = true;
    } else if (osName === 'Android') {
      platform = 'Mobile/Android';
      shouldAppendVersion = true;
    } else if (osName === 'iOS') {
      platform = 'Mobile/iOS';
      shouldAppendVersion = true;
    } else if (osName !== undefined) {
      platform = `Other/${osName}`;
    }

    // Ignore architecture and truncate version if needed
    if (shouldAppendVersion && !ARCHITECTURE.has(osVersion) && osVersion !== undefined) {
      // Only keep first part of the version by splitting on first space
      // eg: 10.6 Leopard, we are only interested in 10.6 here.
      let splittedVersion;
      if (osVersion.indexOf(' ') !== -1) {
        splittedVersion = osVersion.split(' ', 1)[0].split('.');
      } else {
        splittedVersion = osVersion.split('.');
      }

      if (splittedVersion.length > 2) {
        splittedVersion = splittedVersion.slice(0, 2);
      }

      platform = `${platform}/${splittedVersion.join('.').trim()}`;
    }
  }
  logger.debug('platform', platform);
  return platform;
}


function parseProduct(channel, platform) {
  let product = `Other/${channel || ''}`; // Default value

  try {
    // Try to convert channel to an int
    // channel < 40 is extension.
    let intChannel = null;
    try {
      intChannel = Number(channel);
    } catch (ex) {
      /* Ignore if the channel is not an integer */
    }

    // TODO: Should we create a set of possible values at the top of the file?
    if (channel === '40') {
      const prefix = 'CLIQZ/desktop';
      // Desktop browser
      if (platform.includes('Windows')) {
        product = `${prefix}/Cliqz for Windows`;
      } else if (platform.includes('Mac')) {
        product = `${prefix}/Cliqz for Mac OS`;
      } else {
        product = `${prefix}/Cliqz for Linux`;
      }
    } else if (intChannel !== null && intChannel < 40) {
      // Navigation extension
      product = 'CLIQZ/add-on/Cliqz for Firefox';
    } else if (channel === 'MA10') {
      product = 'third-party/mobile/Telefonica';
    } else if (channel.startsWith('MA')) {
      product = 'CLIQZ/mobile/Cliqz for Android';
    } else if (channel.startsWith('MI')) {
      product = 'CLIQZ/mobile/Cliqz for iOS';
    } else if (channel === 'CH50') {
      product = 'third-party/desktop/Avira Scout';
    }
    logger.debug('product', product);
    return product;
  } catch (ex) {
    /* Wrong data for product */
    logger.error('exception', ex);
    return product;
  }
}


function parseCampaign(distribution) {
  return distribution;
}


export default async function getDemographics() {
  const platform = parsePlatform(await getUserAgent());
  return {
    country: normalizeString(parseCountry(await getCountry())),
    campaign: normalizeString(parseCampaign(await getDistribution())),
    install_date: normalizeString(parseInstallDate(await getInstallDate())),
    platform: normalizeString(platform),
    product: normalizeString(parseProduct(await getChannel(), platform)),
  };
}
