import { join } from 'path';
import { setConfigPath } from '../src/config/paths';

// 测试隔离：所有测试使用 .solo/config-test.yaml，不干扰生产环境 .solo/config.yaml
setConfigPath(join(process.cwd(), '.solo', 'config-test.yaml'));
