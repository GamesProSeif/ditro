import { Question } from 'inquirer';
import { CommandHandler } from './CommandHandler';
import { DitroModule, DitroModuleOptions } from '../DitroModule';
import DitroError from '../../util/DitroError';

export interface ArgumentData {
	name?: string;
	type?: string;
	help?: string;
	required?: boolean;
	default?: any | (() => any);
}

export interface FlagsData {
	name?: string;
	alias?: string | string[];
	type?: string;
	help?: string;
	default?: any | (() => any);
	required?: boolean;
}

export interface CommandOptions extends DitroModuleOptions {
	aliases?: string[];
	description?: any;
	args?: ArgumentData[];
	flags?: FlagsData[];
	prompt?: Question[];
}

export interface CommandExecData {
	argv: string[];
	args?: any;
	flags?: any;
	prompt?: any;
}

export class Command extends DitroModule {
	public handler!: CommandHandler;
	public aliases: string[];
	public description: any;
	public args?: ArgumentData[] | undefined;
	public flags?: FlagsData[] | undefined;
	public prompt: Question[] | undefined;

	public constructor(id: string, {
		aliases = [],
		description = undefined,
		args,
		flags,
		prompt,
		...rest
	}: CommandOptions = {}) {
		super(id, { ...rest });

		this.aliases = aliases.map(a => a.toString().toLowerCase());
		this.description = description;
		this.args = args;
		this.flags = flags;
		this.prompt = prompt;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public exec(data: CommandExecData): void | Promise<void> {
		throw new DitroError('NO_ABSTRACT_EXEC', this.constructor.name, this.id);
	}
}
