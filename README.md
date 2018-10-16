OctoLogger
----------


### Usage

```ts
import { logger } from 'octologger';


logger.add('current data', {
	id: 123,
	flags: {
		foo: true,
		bar: 123,
	},
});

logger.info('Wow!');
logger.scope('users', () => {
	logger.add('Start');

	setTimeout(() => {
		logger.done('End');
	}, 100);
});

// [[users]]
//    ⏳ Fetch All
//         Start
//           [[setTimeout]] {delay: 100}

// [[users]]
//    ✅ Fetch All
//         Start
//           [[setTimeout]] {delay: 100}
//              ✅ End
```


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
