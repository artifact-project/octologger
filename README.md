OctoLogger
----------
Ultimate logger system for your an application.<br/>
We Appreciate <s>Power</s>Logs.

---

### Usage

```ts
import { logger } from 'octologger'; // or import xlog, { octologger } from 'octologger';

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
For logger from out of box.

#### core
- **setup**(options: `LoggerOptions`): `void`
  - meta: `boolean`
  - silent: `boolean`
  - output: `Output[]`
- **scope**(name: `string`): `ScopeEntry`
- **scope**(name: `string`, detail: `any`): `ScopeEntry`
- **scope**(name: `string`, inScope: `() => void`): `ScopeEntry`
- **scope**(name: `string`, detail: `any`, inScope: `() => void`): `ScopeEntry`
- **print**(): `void`
- **clear**(): `void`
- **getLastEntry**(): `void`
- **getLastEntry**(): `void`

#### logs

- **add**(...args: `any[]`): `Entry` — similar `log`
- **log**(...args: `any[]`): `void`
- **success**(...args: `any[]`): `void`
- **info**(...args: `any[]`): `void`
- **verbose**(...args: `any[]`): `void`
- **debug**(...args: `any[]`): `void`
- **error**(...args: `any[]`): `void`

---

### How to create custom logger?

```ts
import { createLogger, universalOutput, createLogEntry } from 'octologger'; // or import xlog, { octologger } from 'octologger';

// Create
const xlog = createLogger(
	// Options
	{
		meta: false,
		output: [universalOutput()],
	},

	// Methods
	({levels, logger}) => ({
		ok(msg: string, detail?: any) {
			logger.add(createLogEntry(
				levels.success, // level
				'👌', // badge
				'OK', // label
				msg, // message
				detail, // detail
			));
		},

		error(msg: string, detail?: any) {
			logger.add(createLogEntry(levels.error, '❌', 'error', msg, detail));
		},
	}),
);


// Usage
xlog.ok('Wow!');
xlog.error('Ooops...');
```
![DevTools -> Console](https://habrastorage.org/webt/mw/ct/fk/mwctfkskaqawzo6mey_likzopta.png)

---

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
