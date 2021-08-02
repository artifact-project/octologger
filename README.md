OctoLogger
----------
Ultimate logger system for your an application.<br/>
We Appreciate <s>Power</s>Logs.

---

### Usage

```ts
import { octoLogger } from 'octologger'; // or import { logger } from 'octologger';

octoLogger.info('Wow!');
octoLogger.scope('users', (scope) => {
	logger.add('Start');

	setTimeout(() => {
		logger.done('End');
	}, 100);
});
```

---

### API

For logger from out of box.

#### Core

- **setup**(options: `LoggerOptions`): `void`
  - time: `boolean` — Disable time
  - silent: `boolean` — Disable output
  - output: `Output`
- **scope**(name: `string`): `ScopeEntry`
- **scope**(name: `string`, detail: `any`): `ScopeEntry`
- **scope**(name: `string`, executer: `() => void`): `ScopeEntry`
- **scope**(name: `string`, detail: `any`, executer: `() => void`): `ScopeEntry`
- **print**(): `void`
- **clear**(): `void`
- **entries**(): `Entry[]`
- **entry**(): `Entry`

#### Methods

- **add**(...args: `any[]`): `Entry` — similar `log`
- **log**(...args: `any[]`): `void`
- **info**(...args: `any[]`): `void`
- **done**(...args: `any[]`): `void`
- **verbose**(...args: `any[]`): `void`
- **error**(...args: `any[]`): `void`

---

### Dev Tools: Ignore List / Black Boxing

To make the logger show the correct position (file and line) of the output in `console`, follow the instructions:

1. Open `Dev Tools` -> `Settings`
1. Choice a `Ignore List`
1. Click `Add Pattern`
1. Enter "Pattern": `octologger|@mail-core/logger`
1. Profit 💁🏻‍♂️

---

### How to create custom logger?

```ts
import { createLogger, universalOutput } from 'octologger';

// Create
const xlog = createLogger(
	// Options
	{
		output: [universalOutput()],
	},

	// Methods
	({logger, createEntry}) => ({
		ok(msg: string, detail?: any) {
			logger.add(createEntry(
				'info', // level
				'👌',   // badge
				'OK',   // label
				msg,    // message
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

### Meta in Production

To get the position of the logger call in production, you need to use [ttsc](https://github.com/cevek/ttypescript) or transformers.

#### [ttypescript / ttsc](https://github.com/cevek/ttypescript)

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "type": "checker",
        "transform": "octologger/tx"
      }
    ]
}
```

#### [ts-loader](https://github.com/TypeStrong/ts-loader/#getcustomtransformers)

```js
import {transformer} from 'octologger/tx';

// ts-loader config
getCustomTransformers(program)  {
	return {
		before: [
			transformer(program),
		],
	};
}
```

---

### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
