import type { CAC } from "cac";
import { Command } from "cac";
import ora from "ora";

interface CommandConfig {
	allowUnknownOptions?: boolean;
	ignoreOptionDefaultValue?: boolean;
}

export class CoraCommand extends Command {
	private _spinnerText: string | undefined;

	constructor(
		rawName: string,
		description: string,
		config: CommandConfig | undefined,
		cli: CAC,
	) {
		super(rawName, description, config, cli);
	}

	/** Enable auto-spinner for this command with the given text. */
	spinner(text: string): this {
		this._spinnerText = text;
		return this;
	}

	/**
	 * Register a callback as the command action.
	 *
	 * If `.spinner()` was called on this command, the callback is automatically
	 * wrapped with an ora spinner that starts before the action and
	 * succeeds/fails when the action resolves/rejects.
	 */
	override action(
		// biome-ignore lint/suspicious/noExplicitAny: matches cac's Command.action() signature
		callback: (...args: any[]) => any,
	): this {
		if (this._spinnerText) {
			const spinnerText = this._spinnerText;
			// biome-ignore lint/suspicious/noExplicitAny: matches cac's variadic callback signature
			const wrappedCallback = async (...args: any[]) => {
				const spinner = ora(spinnerText).start();
				try {
					const result = await callback(...args);
					spinner.succeed();
					return result;
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					spinner.fail(message);
					throw err;
				}
			};
			return super.action(wrappedCallback);
		}
		return super.action(callback);
	}
}
