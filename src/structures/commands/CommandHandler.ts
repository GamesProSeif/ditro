import { join } from 'path';
import { prompt } from 'inquirer';
// @ts-ignore
import * as ArgsAndFlags from 'args-and-flags';
import { DitroCli } from '../DitroCli';
import { DitroHandler, DitroHandlerOptions } from '../DitroHandler';
import { Command, CommandExecData } from './Command';
import DitroError from '../../util/DitroError';
import { EVENTS } from '../../util/Constants';

export interface CommandHandlerOptions extends DitroHandlerOptions {
	aliasReplacement?: RegExp;
}

export declare interface CommandHandler {
	on(event: 'load', listener: (command: Command, isReload: boolean) => void): this;
	on(event: 'remove', listener: (command: Command) => void): this;
	on(event: 'commandFinished', listener: (command: Command, argv: string, data: CommandExecData) => void): this;
	on(event: 'commandStarted' | 'promptStarted' | 'promptFinished', listener: (command: Command, argv: string[]) => void): this;
	on(event: 'invalidCommand', listener: (argv: string[]) => void): this;
	on(event: 'error', listener: (error: Error, command: Command, argv: string[], data: CommandExecData) => void): this;
}

export class CommandHandler extends DitroHandler {
	public modules!: Map<string, Command>;
	public aliases: Map<string, string>;
	public aliasReplacement: RegExp | undefined;

	public constructor(cli: DitroCli, {
		directory = join(process.cwd(), 'commands'),
		extensions = ['.js', '.ts'],
		aliasReplacement,
		...rest
	}: CommandHandlerOptions = {}) {
		super(cli, { directory, extensions, ...rest });

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

	private async handle(argv: string[]): Promise<boolean> {
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
		const data: CommandExecData = {
			argv,
			args: undefined,
			flags: undefined,
			prompt: undefined
		};

		if ((command.args && command.args.length) || (command.flags && command.flags.length)) {
			const parser = new ArgsAndFlags({
				args: command.args,
				flags: command.flags
			});
			const { args, flags } = parser.parse(argv.slice(1));
			data.args = args;
			data.flags = flags;
		}

		if (command.prompt && command.prompt.length) {
			this.emit(EVENTS.COMMAND_HANDLER.PROMPT_START, command, argv);
			data.prompt = await prompt(command.prompt);
			this.emit(EVENTS.COMMAND_HANDLER.PROMPT_FINISHED, command, argv);
		}

		this.emit(EVENTS.COMMAND_HANDLER.COMMAND_STARTED, command, argv, data);
		try {
			await command.exec(data);
		} catch (error) {
			this.emit(EVENTS.COMMAND_HANDLER.ERROR, error, command, argv, data);
			return false;
		}
		this.emit(EVENTS.COMMAND_HANDLER.COMMAND_FINISHED, command, argv, data);
		return true;
	}

	public async run(argv?: string[]) {
		if (!argv) {
			[,, ...argv] = process.argv;
		}
		const successful = await this.handle(argv);
		this.emit(EVENTS.DITRO_CLI.END, successful);
	}
}
