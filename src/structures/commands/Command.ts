import { Question } from 'inquirer';
import { DitroModule, DitroModuleOptions } from '../DitroModule';
import DitroError from '../../util/DitroError';

export interface CommandOptions extends DitroModuleOptions {
	aliases?: string[];
	description?: any;
	args?: Question[];
}

export class Command extends DitroModule {
	public aliases: string[];
	public description: any;
	public args: Question[] | undefined;

	public constructor(id: string, {
		aliases = [],
		description = undefined,
		args,
		...rest
	}: CommandOptions = {}) {
		super(id, { ...rest });

		this.aliases = aliases.map(a => a.toString().toLowerCase());
		this.description = description;
		this.args = args;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public exec(args: any): void | Promise<void> {
		throw new DitroError('NO_ABSTRACT_EXEC', this.constructor.name, this.id);
	}
}
