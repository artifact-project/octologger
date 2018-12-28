export const LogLevels = {
	error: 0,
	warn: 1,
	info: 2,
	verbose: 3,
	debug: 4,
	log: 5,
	success: 6,
};

export const LogLevelsInvert = {} as {
	[level:number]: string;
};

for (let key in LogLevels) {
	LogLevelsInvert[LogLevels[key]] = key;
}

export type LogLevelTypes = keyof (typeof LogLevels);