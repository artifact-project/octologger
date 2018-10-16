import { now } from '../utils/utils';

const tasks = {} as {
	[index:string]: Task;
};

export class Task {
	error: Error = null;
	active = true;
	canceled = false;

	private _start: number = now();
	private _duration: number = 0;

	constructor(
		public pid: number,
		public name: string,
		private _cancelFn: (pid: number) => void,
	) {
		tasks[`${name}:${pid}`] = this;
	}

	cancel() {
		this.canceled = true;
		this._cancelFn(this.pid);
		this.end();
	}

	end(err?: Error) {
		if (this.active) {
			this.active = false;
			this.error = err || null;
			this._duration = now() - this._start;
		}
	}
}

export function startTask(name: string, cancel: (pid: number) => void, pid: number): Task {
	return new Task(pid, name, cancel);
}

export function cancelTask(name: string, pid: number) {
	const key = `${name}:${pid}`;

	if (tasks.hasOwnProperty(key)) {
		tasks[key].cancel();
		delete tasks[key];
	}
}