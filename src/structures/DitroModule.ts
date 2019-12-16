import { DitroHandler } from './DitroHandler';

export interface DitroModuleOptions {
	category?: string;
}

export class DitroModule {
	public readonly id: string;
	public readonly category: string;
	public filepath!: string | null;
	public handler!: DitroHandler;

	public constructor(id: string, {
		category = 'default'
	}: DitroModuleOptions = {}) {
		this.id = id.toString().toLowerCase();
		this.category = category.toString().toLowerCase();
	}

	public reload(): DitroModule {
		return this.handler.reload(this.id)!;
	}

	public remove(): DitroModule {
		return this.handler.remove(this.id);
	}

	public toString() {
		return this.id;
	}
}
