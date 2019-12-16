import * as EventEmitter from 'events';

export interface DitroCliOptions {
	pkg?: any;
}

export declare interface DitroCli {
	on(event: 'end', listener: (successful: boolean) => void): this;
}

export class DitroCli extends EventEmitter {
	public name: string;
	public pkg: any;

	public constructor(name: string, {
		pkg
	}: DitroCliOptions = {}) {
		super();

		this.name = name;
		this.pkg = pkg;
	}

	public get version() {
		return this.pkg ? this.pkg.version : null;
	}

	public get description() {
		return this.pkg ? this.pkg.description : null;
	}

	public get author() {
		return this.pkg ? this.pkg.author : null;
	}
}
