# Ditro

An OOP CLI package that will ease your CLI production.

<div align="center">
	<a href="https://github.com/GamesProSeif/ditro"><img src="https://i.imgur.com/5L9cFIW.png" alt="Ditro Banner">
	<a href="https://www.npmjs.com/package/acrus"><img src="https://img.shields.io/npm/v/ditro.svg?maxAge=3600" alt="NPM version" /></a>
	<a href="https://www.npmjs.com/package/acrus"><img src="https://img.shields.io/npm/dt/ditro.svg?maxAge=3600" alt="NPM downloads" /></a>
	<a href="https://david-dm.org/GamesProSeif/ditro"><img src="https://img.shields.io/david/GamesProSeif/ditro.svg?maxAge=3600" alt="Dependencies" /></a>
</div></a>

> This package was mainly inspired by [Akairo](https://github.com/discord-akairo/discord-akairo).

## Table Of Content
1. [Introduction](#introduction)
1. [Getting Started](#getting-started)
	1. [Setup](#setup)
	1. [Creating CLI](#creating-cli)
	1. [Creating Commands](#creating-commands)
	1. [Creating Listeners](#creating-listeners)
1. [Credits](#credits)


## Introduction

Create CLI applications with ease like you never did before. Using similar structure to the famous known [discord.js](https://github.com/discordjs/discord.js) framework, [Akairo](https://github.com/discord-akairo/discord-akairo).

The aim of this package is to make prompting and argument collecting easier for the developer.

It also gives the developer access to other commands in different scopes. This means you can make commands that use sub-commands, or have your own custom help command.

The package also makes use of [event emitters](https://nodejs.org/api/events.html), so you might use them for statistics purposes, or replying to the CLI user. It really opens different paths to the developer.

## Getting Started

#### Setup

First install the package using:

```bash
$ npm i ditro
# or
$ yarn add ditro
```

You need to setup your project structure like this:
```
Project/
	package.json
	src/
		index.js
		cli/
			Cli.js
		commands/
		listeners/
```

Inside `package.json`, add a `main` field, with the value of `src/index.js`.

You can also add a `bin` object specifying the name of the cli as the key, and path to main file as the value.

```json
"main": "src/index.js",
"bin": {
	"mycli": "src/index.js"
}
```

> Note: `mycli` will be used as the cli bin name. It can be ran after doing `npm link` as "`mycli ...args`". You can rename it to your desire.

#### Creating CLI

Inside `src/cli/Cli.js`, you have to import `DitroCli` from `ditro`, and create a class extending `DitroClass`, supplying valid options, then exporting it.

> You will create placeholder methods to use later on in the "Getting Started" guide.

```js
const { DitroCli } = require('ditro');
const pkg = require('../../package.json');

class MyCli extends DitroCli {
	constructor() {
		super('My Cli Name', { pkg });
	}

	_init() {
		// placeholder method
	}

	start() {
		this._init();
		// placeholder method
	}
}

module.exports = MyCli;
```

Inside `src/index.js` you will create an instance of your custom CLI, and start it.

```js
const MyCli = require('./cli/Cli');

const cli = new MyCli();

cli.start();
```

#### Creating Commands

First you have to create a `CommandHandler` instance (imported from `ditro`), supplying valid options and attaching it to the `cli` as the property `MyCli#commandHandler`.

> `CommandHandler` expects two arguments, a DitroCli instance and valid options.

You can choose which commands to load or load everything in the directory you specify. We are going to stick with the latter for now.

In the `MyCli#start` method, we will call `CommandHandler#run` which parses the user input and the corresponding command.

```js
const { DitroCli, CommandHandler } = require('ditro');
const { join } = require('path');
const pkg = require('../../package.json');

class MyCli extends DitroCli {
	constructor() {
		super('My Cli Name', { pkg });

		this.commandHandler = new CommandHandler(this, {
			directory: join(__dirname, '..', 'commands/')
		});
	}

	_init() {
		this.commandHandler.loadAll();
	}

	start() {
		this._init();
		this.commandHandler.run();
	}
}

module.exports = MyCli;
```

You can now create a very basic command. Create a new file `src/commands/greet.js`. Import `Command` from `ditro`, create a class extending `Command` and export it.

This command will prompt the user for their name and greet them.

Currently, there are three ways for collecting input from a user.
- args - Uses [ArgsAndFlags](https://github.com/sethvincent/args-and-flags) (due to change in future). This parses arguments passed when running the cli, for example, `node start greet GamesProSeif`, here, `GamesProSeif` is an argument.
- flags - Also uses [ArgsAndFlags](https://github.com/sethvincent/args-and-flags) (due to change in future). This parses flags passed when running the cli, for example, `node start adduser --age 15 --is-male`, here, `age` is a flag with the value of `15` and `is-male` is a flag with value of `true`.
- prompt - Uses [Inquirer](https://github.com/SBoudrias/Inquirer.js), which is a very helpful package for prompting users. Their [README](https://github.com/SBoudrias/Inquirer.js#readme) has its documentation and relative information.

You can pass any of `args`, `flags` or `prompt` in the command options (second parameter when calling super), as an array of input data, each respective to their relative packages [ArgsAndFlags](https://github.com/sethvincent/args-and-flags) for `args` and `flags`, [Inquirer](https://github.com/SBoudrias/Inquirer.js) for `prompt`.
In this example we will use `prompt`.

> The super call expects two arguments, first is the `id` of the command, next is the `CommandOptions`.

```js
const { Command } = require('ditro');

class GreetCommand extends Command {
	constructor() {
		super('greet', {
			aliases: ['greet', 'g'],
			description: 'Greets a user.',
			prompt: [
				{
					name: 'username',
					message: 'What is your name?'
				}
			]
		});
	}

	exec(data) {
		console.log(`Hello ${data.prompt.username}`);
	}
}

module.exports = GreetCommand;
```

Explaining the options:
- `aliases` - Array of strings. This is what is used to run the command. The `id` is for storing purposes, calling the `id` as a command will not run it.
- `description` - You can pass anything in this option, it will always be stored in `Command#description`. You set it as a string, or set it as an object containing multiple values. I generally do the latter, passing three properties, `content`; `usage`; `examples`.
- prompt - Array of [Inquirer](https://github.com/SBoudrias/Inquirer.js) questions.

The `Command#exec` method will be called passing it a `CommandExecData` object.

Now you should be able to run the command, `node . greet`.

#### Creating Listeners

First you have to create a `ListenerHandler` instance (imported from `ditro`), supplying valid options and attaching it to the `cli` as the property `MyCli#listenerHandler`.

> `ListenerHandler` expects two arguments, a DitroCli instance and valid options.

You can choose which listeners to load or load everything in the directory you specify. We are going to stick with the latter again.

You will need to call `ListenerHandler#setEmitter` supplying valid [`EventEmitter`](https://nodejs.org/api/events.html) instances in the format
```js
{
	emittername: anActualEventEmitter
}
```

You can use `emittername` later inside listeners as `Listener#emitter`.

```js
const { DitroCli, CommandHandler } = require('ditro');
const { join } = require('path');
const pkg = require('../../package.json');

class MyCli extends DitroCli {
	constructor() {
		super('My Cli Name', { pkg });

		this.listenerHandler = new ListenerHandler(this, {
			directory: join(__dirname, '..', 'listeners/')
		});

		this.commandHandler = new CommandHandler(this, {
			directory: join(__dirname, '..', 'commands/')
		});
	}

	_init() {
		this.listenerHandler.setEmitters({
			commandHandler: this.commandhandler
		});

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
	}

	start() {
		this._init();
		this.commandHandler.run();
	}
}

module.exports = MyCli;
```

You can now head to creating your first listener. Create a new file `src/listeners/end.js`. Import `Listener` from `ditro`, create a class extending `Listener` and export it.

This listener will listen to the event `Cli#end` which gets emitted when the cli finishes processing, and is about to exit.

> The super call expects two arguments, first is the `id` of the listener, next is the `ListenerOptions`.

```js
const { Listener } = require('ditro');

class EndListener extends Listener {
	constructor() {
		super('end', {
			emitter: 'cli', // the event emitter
			event: 'end', // event name
			type: 'on' // either "on or "once" (default: "on")
		});
	}

	// parameters here are ones passed in EventEmitter.on('event' (...args));
	exec(successful) {
		console.log('Processing ended - successful:', successful);
	}
}

module.exports = EndListener;
```

`successful` is a boolean which indicates whether a command was ran and was successful. If you try running the cli, when it finishes processing, the `Cli#end` event will get emitted.

You can listen to other commands too.
Events:
- Cli
	- end
		- desc: emitted when cli finishes processing and is about to exit.
		- params: (successful: boolean)
- CommandHandler
	- commandStarted
		- desc: emitted immediately before a command starts.
		- params: (command: Command, argv: string[], data: CommandExecData)
	- commandFinished
		- desc: emitted immediately after a command finishes successfully.
		- params: (command: Command, argv: string[], data: CommandExecData)
	- error
		- desc: emitted when the `Command#exec` method throws an uncatched error.
		- params: (error: Error, command: Command, argv: string[], data: CommandExecData)
	- promptStarted
		- desc: emitted immediately before the user is prompted for data.
		- params: (command: Command, argv: string[], promptData: Question[])
	- promptFinished
		- desc: emitted immediately after user answers all prompt questions.
		- params: (command: Command, argv: string[], promptData: Question[])
	- invalidCommand
		- desc: emitted when no command is found (no alias for it).
		- params: (argv: string[])

## Credits

This package is authored and maintained with <3 by [GamesProSeif](https://github.com/GamesProSeif)