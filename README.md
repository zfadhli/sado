<div align="center">

# sado

**CLI toolkit combining cac (command parsing) + ora (terminal spinners)**

[![npm version](https://img.shields.io/npm/v/sado?style=flat-square)](https://www.npmjs.com/package/sado)
[![Node version](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [API](#api) • [Examples](#examples)

</div>

Write CLI apps with [cac](https://github.com/cacjs/cac) and get automatic ora spinners on your commands — no boilerplate. Just describe your command, call `.spinner('text')`, and sado handles the rest.

```ts
import { program } from 'sado'

const cli = program('my-app')

cli
  .command('build', 'Build the project')
  .spinner('Building...')
  .action(async () => {
    await runBuild()
    // spinner auto-succeeds (✔) or auto-fails (✖)
  })

cli.parse()
```

## Features

- **Zero boilerplate** — add `.spinner()` to any command and get automatic start/succeed/fail behavior
- **Drop-in compatible** — built on top of cac; every existing cac feature still works
- **No lock-in** — use the auto-spinner when you want it, or import `spinner()` for full manual control
- **Fully typed** — written in TypeScript with complete type definitions

## Installation

```bash
npm install sado
```

```bash
bun add sado
```

## Usage

### Auto-spinner (recommended)

The `.spinner()` method enables automatic spinner wrapping for a command. The spinner starts before the action, succeeds on resolve, and fails on reject.

```ts
import { program } from 'sado'

const cli = program('deploy-tool')

cli
  .command('deploy', 'Deploy to production')
  .spinner('Deploying...')
  .action(async (options) => {
    await deploy(options)
    // ✔ Deploying...  (on success)
    // ✖ Deploying...  (on error, with error message)
  })

cli.version('1.0.0')
cli.help()
cli.parse()
```

### Manual spinner

When you need finer control, import `spinner()` directly — it's the default export from [ora](https://github.com/sindresorhus/ora), re-exported for convenience.

```ts
import { program, spinner } from 'sado'

const cli = program('publish-tool')

cli
  .command('publish', 'Publish package')
  .action(async () => {
    const s = spinner('Publishing...').start()
    try {
      await publish()
      s.succeed('Published!')
    } catch (err) {
      s.fail(String(err))
    }
  })

cli.parse()
```

### Plain cac commands (no spinner)

If a command doesn't call `.spinner()`, the action behaves exactly like a regular cac command — no wrapping applied.

```ts
cli
  .command('status', 'Check status')
  .action(() => {
    console.log('All systems operational')
  })
```

## API

### `program(name?)`

Creates a CLI program. Returns an enhanced [cac](https://github.com/cacjs/cac) instance whose `.command()` method returns `CoraCommand` objects with spinner support.

- `name` — program name displayed in help and version messages (defaults to the script name)

```ts
const cli = program('my-cli')
```

All standard cac methods (`cli.option()`, `cli.version()`, `cli.help()`, `cli.parse()`, etc.) work as expected.

### `command.spinner(text)`

Enables the auto-spinner for a command. The spinner starts before the action callback runs.

- `text` — the text displayed next to the spinner

**Auto-behavior:**

| Event | Result |
|---|---|
| Action resolves | `spinner.succeed()` — shows green ✔ and stops |
| Action rejects | `spinner.fail(error.message)` — shows red ✖ and error message, then re-throws |

```ts
cli
  .command('build', 'Build project')
  .spinner('Building...')
  .action(async () => { /* ... */ })
```

### `spinner(options?)`

Direct re-export of [ora](https://github.com/sindresorhus/ora#oraoptions)'s default export. Returns an `Ora` instance.

```ts
const s = spinner('Loading...').start()
s.succeed('Done!')
```

### `oraPromise(action, options?)`

Direct re-export of [ora's promise-based spinner](https://github.com/sindresorhus/ora#orapromiseaction-options).

```ts
await oraPromise(someAsyncWork, { text: 'Working...' })
```

## Examples

For a complete runnable example, see [`example.ts`](./example.ts):

```bash
bun run example.ts build    # auto-spinner, succeeds
bun run example.ts deploy   # auto-spinner, fails
bun run example.ts publish  # manual spinner via re-exported ora
bun run example.ts --help   # help output
```
