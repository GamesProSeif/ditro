/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as EventEmitter from 'events';
import { extname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import { DitroModule } from './DitroModule';
import DitroError from '../util/DitroError';
import { EVENTS } from '../util/Constants';

export interface DitroHandlerOptions {
	directory?: string;
	extensions?: string[];
	classToHandle?: Function;
}

export class DitroHandler extends EventEmitter {
	public directory: string;
	public modules: Map<string, DitroModule>;
	public categories: Map<string, Map<string, DitroModule>>;
	public extensions: Set<string>;
	public classToHandle: Function;

	public constructor({
		directory = join(process.cwd(), 'modules'),
		extensions = ['.js', '.ts', '.json'],
		classToHandle = DitroModule
	}: DitroHandlerOptions = {}) {
		super();

		this.modules = new Map();
		this.categories = new Map();
		this.directory = directory;
		this.extensions = new Set(extensions);
		this.classToHandle = classToHandle;
	}

	public load(thing: DitroModule | string, isReload = false): DitroModule | undefined {
		const isClass = typeof thing === 'function';
		if (!isClass && !this.extensions.has(extname(thing as string))) return undefined;

		let mod: any = isClass ? thing : this.findExport(thing);

		if (mod && mod.prototype instanceof this.classToHandle) {
			// @ts-ignore
			mod = new mod();
		} else {
			if (!isClass) delete require.cache[require.resolve(thing as string)];
			return undefined;
		}

		this.register((mod as DitroModule), isClass ? null : (thing as string));
		this.emit(EVENTS.DITRO_HANDLER.LOAD, (mod as DitroModule), isReload);
		return mod;
	}

	public loadAll(dir = this.directory): DitroHandler {
		if (!dir) {
			throw new DitroError('NO_DIRECTORY_SPECIFIED', this.classToHandle.name);
		}
		const paths = DitroHandler.readdirRecursive(dir);
		for (const path of paths) {
			if (this.extensions.has(extname(path))) this.load(path);
		}

		return this;
	}

	public remove(id: string): DitroModule {
		const mod = this.modules.get(id.toString().toLowerCase());
		if (!mod) throw new DitroError('MODULE_NOT_FOUND', this.classToHandle.name, id);

		this.deregister(mod);

		this.emit(EVENTS.DITRO_HANDLER.REMOVE, mod);
		return mod;
	}

	public removeAll(): DitroHandler {
		for (const m of Array.from(this.modules.values())) {
			if (m.filepath) this.remove(m.id);
		}

		return this;
	}

	public reload(id: string): DitroModule | undefined {
		const mod = this.modules.get(id.toString().toLowerCase());
		if (!mod) throw new DitroError('MODULE_NOT_FOUND', this.classToHandle.name, id);
		if (!mod.filepath) throw new DitroError('NOT_RELOADABLE', this.classToHandle.name, id);

		this.deregister(mod);

		const filepath = mod.filepath;
		const newMod = this.load(filepath, true);
		return newMod;
	}

	public reloadAll() {
		for (const m of Array.from(this.modules.values())) {
			if (m.filepath) this.reload(m.id);
		}

		return this;
	}

	public register(mod: DitroModule, filepath: string | null) {
		if (this.modules.has(mod.id)) {
			throw new
			DitroError('DUPLICATE_IDENTIFIER', this.classToHandle.name, mod.id);
		}

		this.modules.set(mod.id, mod);
		if (this.categories.has(mod.category)) {
			this.categories.get(mod.category)!.set(mod.id, mod);
		} else {
			this.categories.set(mod.category, new Map());
			this.categories.get(mod.category)!.set(mod.id, mod);
		}
		mod.handler = this;
		mod.filepath = filepath;
	}

	public deregister(mod: DitroModule) {
		if (mod.filepath) delete require.cache[require.resolve(mod.filepath)];
		this.modules.delete(mod.id);
	}

	private static readdirRecursive(directory: string): string[] {
		const result: string[] = [];

		function read(dir: string) {
			const files = readdirSync(dir);

			for (const file of files) {
				const filepath = join(dir, file);

				if (statSync(filepath).isDirectory()) {
					read(filepath);
				} else {
					result.push(filepath);
				}
			}
		}

		read(directory);

		return result;
	}

	private findExport(m: any): Function | any {
		if (!m) return null;
		if (typeof m === 'string') return this.findExport(require(m));
		if (m.prototype instanceof this.classToHandle) return m;
		if (m.default) return this.findExport(m.default);
		return null;
	}
}
