import { logger } from '../logger/logger';

logger.add('ok');

const {info} = logger;
info('wow');

const scope = logger.scope('fetch');

scope.add('start');
scope.done('response');
