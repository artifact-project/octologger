OctoLogger
----------
Ultimate logger system for your an application.
We Appreciate <s>Power</s>Logs.

---

### Usage

```ts
import { logger } from 'octologger';

logger.info('Wow!');
logger.scope('users', () => {
	logger.add('Start');

	setTimeout(() => {
		logger.done('End');
	}, 100);
});
```

---

### API

- @todo

---

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
