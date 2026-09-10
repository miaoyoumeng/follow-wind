export { SOLO_DIR_NAME, CONFIG_FILE_NAME, SOLO_DIR, CONFIG_PATH, paths } from './paths';

export {
  readConfig,
  writeConfig,
  configExists,
  isValidPanePosition,
  type SoloConfig,
  type AgentConfig,
  type AgentPanes,
  type PanePosition,
  type PaneEntry,
  type TaskConfig
} from './yaml/writer';
