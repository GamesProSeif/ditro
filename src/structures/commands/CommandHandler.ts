import { join } from 'path';
import { prompt } from 'inquirer';
import { DitroHandler, DitroHandlerOptions } from '../DitroHandler';
import { Command } from './Command';
import DitroError from '../../util/DitroError';
import { EVENTS } from '../../util/Constants';

export interface CommandHandlerOptions extends DitroHandlerOptions {
	aliasReplacement?: RegExp;
}

export class CommandHandler extends DitroHandler {
	public modules!: Map<string, Command>;
	public aliases: Map<string, string>;
	public aliasReplacement: RegExp | undefined;

	public constructor({
		directory = join(process.cwd(), 'commands'),
		extensions = ['.js', '.ts'],
		aliasReplacement,
		...rest
	}: CommandHandlerOptions = {}) {
		super({ directory, extensions, ...rest });

		this.aliases = new Map();
		this.aliasReplacement = aliasReplacement;
	}

	public register(command: Command, filepath: string) {
		super.register(command, filepath);

		for (let alias of command.aliases) {
			const conflict = this.aliases.get(alias.toString().toLowerCase());

			if (conflict) {
				throw new DitroError('ALIAS_CONFLICT', alias, command.id, conflict);
			}

			alias = alias.toLowerCase();
			this.aliases.set(alias, command.id);
			if (this.aliasReplacement) {
				const replacement = alias.replace(this.aliasReplacement, '');

				if (replacement !== alias) {
					const replacementConflict = this.aliases.get(replacement);
					if (replacementConflict) {
						throw new DitroError('ALIAS_CONFLICT', replacement, command.id, replacementConflict);
					}
					this.aliases.set(replacement, command.id);
				}
			}
		}
	}

	public deregister(command: Command) {
		for (const alias of command.aliases) {
			this.aliases.delete(alias);

			if (this.aliasReplacement) {
				const replacement = alias.replace(this.aliasReplacement, '');
				if (replacement !== alias) this.aliases.delete(replacement);
			}
		}

		super.deregister(command);
	}

	public async handle(argv?: string[]): Promise<boolean> {
		if (!argv) {
			[,, ...argv] = process.argv;
		}
		if (!argv.length) {
			this.emit(EVENTS.COMMAND_HANDLER.INVALID_COMMAND, argv);
			return false;
		}

		const commandID = this.aliases.get(argv[0]);
		if (!commandID) {
			this.emit(EVENTS.COMMAND_HANDLER.INVALID_COMMAND, argv);
			return false;
		}

		const command = this.modules.get(commandID)!;
		let args: any;

		if (command.args && command.args.length) {
			this.emit(EVENTS.COMMAND_HANDLER.PROMPT_START, command, argv);
			args = await prompt(command.args);
			this.emit(EVENTS.COMMAND_HANDLER.PROMPT_FINISHED, command, argv);
		}

		this.emit(EVENTS.COMMAND_HANDLER.COMMAND_STARTED, command, argv, args);
		try {
			await command.exec(args);
		} catch (error) {
			this.emit(EVENTS.COMMAND_HANDLER.ERROR, error, command, argv, args);
			return false;
		}
		this.emit(EVENTS.COMMAND_HANDLER.COMMAND_FINISHED, command, argv, args);
		return true;
	}
}
