import os from 'os';

type Platform = {
  isLinux: boolean;
  isWin: boolean;
  isMac: boolean;
};

export const platform: Platform = {
  isLinux: os.platform() === 'linux',
  isWin: os.platform() === 'win32',
  isMac: os.platform() === 'darwin'
};
