import { join } from 'path';
import * as EventEmitter from 'events';
import { DitroHandler, DitroHandlerOptions } from '../DitroHandler';
import { DitroCli } from '../DitroCli';
import { Listener } from './Listener';
import DitroError from '../../util/DitroError';

export interface ListenerHandlerOptions extends DitroHandlerOptions {}

export class ListenerHandler extends DitroHandler {
	public modules!: Map<string, Listener>;
	public categories!: Map<string, Map<string, Listener>>;
	public emitters: Map<string, EventEmitter>;

	public constructor(cli: DitroCli, {
		directory = join(process.cwd(), 'listeners/'),
		classToHandle = Listener,
		extensions = ['.js', '.ts'],
		...rest
	}: ListenerHandlerOptions = {}) {
		super(cli, { directory, classToHandle, extensions, ...rest });

		this.emitters = new Map();
		this.emitters.set('cli', this.cli);
	}

	public register(listener: Listener, filepath: string) {
		super.register(listener, filepath);
		listener.exec = listener.exec.bind(listener);
		this.addToEmitter(listener.id);
		return listener;
	}

	public deregister(listener: Listener) {
		this.removeFromEmitter(listener.id);
		super.deregister(listener);
	}

	public addToEmitter(id: string) {
		const listener = this.modules.get(id.toString().toLowerCase());
		if (!listener) throw new DitroError('MODULE_NOT_FOUND', this.classToHandle.name, id);

		const emitter = ListenerHandler.isEventEmitter(listener.emitter) ? (listener.emitter as EventEmitter) : this.emitters.get(listener.emitter as string)!;
		if (!ListenerHandler.isEventEmitter(emitter)) throw new DitroError('INVALID_TYPE', emitter, 'EventEmitter', true);

		if (listener.type === 'once') {
			emitter.once(listener.event, listener.exec);
			return listener;
		}

		emitter.on(listener.event, listener.exec);
		return listener;
	}

	public removeFromEmitter(id: string) {
		const listener = this.modules.get(id.toString());
		if (!listener) throw new DitroError('MODULE_NOT_FOUND', this.classToHandle.name, id);

		const emitter = ListenerHandler.isEventEmitter(listener.emitter) ? (listener.emitter as EventEmitter) : this.emitters.get(listener.emitter as string)!;
		if (!ListenerHandler.isEventEmitter(emitter)) throw new DitroError('INVALID_TYPE', emitter, 'EventEmitter', true);

		emitter.removeListener(listener.event, listener.exec);
		return listener;
	}

	public setEmitters(emitters: { [key: string]: EventEmitter}) {
		for (const [key, value] of Object.entries(emitters)) {
			if (!ListenerHandler.isEventEmitter(value)) throw new DitroError('INVALID_TYPE', key, 'EventEmitter', true);
			this.emitters.set(key, value);
		}

		return this;
	}

	public static isEventEmitter(emitter: any) {
		if (
			typeof emitter.on === 'function' &&
			typeof emitter.once === 'function' &&
			typeof emitter.emit === 'function' &&
			typeof emitter.off === 'function'
		) {
			return true;
		}
		return false;
	}
}
