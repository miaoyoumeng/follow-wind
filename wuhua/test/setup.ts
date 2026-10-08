import { join } from 'path';
import { setConfigPath } from '../src/config/paths';

// 测试隔离：所有测试使用 .wuhua/config-test.yaml，不干扰生产环境 .wuhua/config.yaml
setConfigPath(join(process.cwd(), '.wuhua', 'config-test.yaml'));
