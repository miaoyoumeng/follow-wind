export {
  SOLO_DIR_NAME,
  CONFIG_FILE_NAME,
  SOLO_DIR,
  CONFIG_PATH,
  CONFIG_PATH_NAME,
  LOG_FILE,
  IPC_SOCKET_NAME_TEMPLATE,
  getConfigPath,
  setConfigPath,
  getIpcSocketPath,
  paths
} from './paths';

export { readConfig, writeConfig, configExists, isValidPanePosition, resolveLoggingConfig } from './yaml/writer';
export {
  type SoloConfig,
  type AgentConfig,
  type AgentPanes,
  type PanePosition,
  type PaneEntry,
  type TaskConfig
} from './yaml/types';
