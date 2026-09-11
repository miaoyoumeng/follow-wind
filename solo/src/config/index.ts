export { SOLO_DIR_NAME, CONFIG_FILE_NAME, SOLO_DIR, CONFIG_PATH, CONFIG_PATH_NAME, paths } from './paths';

export { readConfig, writeConfig, configExists, isValidPanePosition } from './yaml/writer';
export {
  type SoloConfig,
  type AgentConfig,
  type AgentPanes,
  type PanePosition,
  type PaneEntry,
  type TaskConfig
} from './yaml/types';
