export const now = typeof performance !== 'undefined' && performance.now
	? () => performance.now()
	: Date.now
;

export function zeroPad(n: number, min?: 1 | 2) {
	let val = n < 10 ? '0' + n : n;
	if (min! > 1 && n < 100) {
		val = `0${val}`;
	}
	return val;
}

export function timeFormat(ts: number) {
	const sec = ts / 1000;

	return `${zeroPad(sec / 60 % 24 | 0)}:${zeroPad(sec % 60 | 0)}.${zeroPad(ts % 1000 | 0, 2)}`
}
