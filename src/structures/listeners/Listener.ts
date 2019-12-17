import * as EventEmitter from 'events';
import { DitroModule, DitroModuleOptions } from '../DitroModule';
import DitroError from '../../util/DitroError';
import { ListenerHandler } from './ListenerHandler';

export interface ListenerOptions extends DitroModuleOptions {
	emitter?: string | EventEmitter;
	event?: string;
	type?: 'on' | 'once';
}

export class Listener extends DitroModule {
	public handler!: ListenerHandler;
	public emitter: string | EventEmitter;
	public event: string;
	public type: 'on' | 'once';

	public constructor(id: string, {
		emitter,
		event,
		type = 'on',
		...rest
	}: ListenerOptions = {}) {
		super(id, { ...rest });

		if (!emitter) {
			throw new DitroError('MISSING_PARAMETER', this.constructor.name, this.id, 'emitter');
		}
		this.emitter = emitter;

		if (!event) {
			throw new DitroError('MISSING_PARAMETER', this.constructor.name, this.id, 'event');
		}
		this.event = event;
		this.type = type;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public exec(...args: any[]): void | Promise<void> {
		throw new DitroError('NO_ABSTRACT_EXEC', this.constructor.name, this.id);
	}
}
