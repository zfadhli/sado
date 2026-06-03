import { program, spinner } from './src/index.js'

const cli = program('my-cli')

// --- Auto-spinner (recommended) ---
// `.spinner('text')` wraps the action with an ora spinner.
// Succeeds (✔) on resolve, fails (✖) on reject.

cli
  .command('build', 'Build the project')
  .spinner('Building...')
  .action(async () => {
    await new Promise((r) => setTimeout(r, 2000))
  })

cli
  .command('deploy', 'Deploy to production')
  .spinner('Deploying...')
  .action(async () => {
    await new Promise((r) => setTimeout(r, 1000))
    throw new Error('Connection refused')
  })

// --- Manual spinner (full control) ---
// Use the re-exported `spinner()` from ora directly.

cli
  .command('publish', 'Publish package')
  .action(async () => {
    const s = spinner('Publishing...').start()
    await new Promise((r) => setTimeout(r, 1500))
    s.succeed('Published!')
  })

// --- Plain cac command (no spinner) ---

cli
  .command('status', 'Check status')
  .action(() => {
    console.log('All systems operational')
  })

// --- Standard cac features ---
cli.version('1.0.0')
cli.help()
cli.parse()
