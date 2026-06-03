import { appendFileSync } from "node:fs";
import logSymbols from "log-symbols";
import color from "picocolors";

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LOG_LEVELS: Record<LogLevel, number> = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
};

export interface Logger {
	/**
	 * Current log level. Messages below this threshold are suppressed.
	 */
	level: LogLevel;

	/**
	 * Log an info message (blue).
	 */
	info: (message: string, ...args: unknown[]) => void;

	/**
	 * Log a success message (green).
	 */
	success: (message: string, ...args: unknown[]) => void;

	/**
	 * Log a warning message (yellow).
	 */
	warn: (message: string, ...args: unknown[]) => void;

	/**
	 * Log an error message (red). Writes to stderr.
	 */
	error: (message: string, ...args: unknown[]) => void;

	/**
	 * Log a debug message (dim). Suppressed at level `info` or above.
	 */
	debug: (message: string, ...args: unknown[]) => void;

	/**
	 * Create a child logger with a tagged prefix.
	 *
	 * @example
	 * const db = logger.withTag("db")
	 * db.info("Connected") // [db] ℹ Connected
	 */
	withTag: (tag: string) => Logger;
}

export interface LoggerConfig {
	level?: LogLevel;
	tag?: string;
	/** Optional file path to append log lines (plain text, no ANSI codes). */
	file?: string;
	/** Output function for stdout lines (default: console.log). */
	stdout?: (message: string, ...args: unknown[]) => void;
	/** Output function for stderr lines (default: console.error). */
	stderr?: (message: string, ...args: unknown[]) => void;
}

/**
 * Create a configurable logger instance.
 *
 * @example
 * const logger = createLogger({ level: "info" })
 * logger.success("Done!")
 */
export function createLogger(config: LoggerConfig = {}): Logger {
	const state = { level: config.level ?? ("info" as LogLevel) };
	const tag = config.tag;
	const file = config.file;
	const stdout = config.stdout ?? console.log;
	const stderr = config.stderr ?? console.error;

	function log(
		method: "log" | "error",
		threshold: LogLevel,
		symbol: string,
		message: string,
		colorFn: (text: string) => string,
		label: string,
		args: unknown[],
	): void {
		if (LOG_LEVELS[threshold] > LOG_LEVELS[state.level]) return;

		const prefix = tag ? `${color.dim(`[${tag}]`)} ` : "";
		const output = method === "error" ? stderr : stdout;
		output(prefix + symbol, colorFn(message), ...args);

		if (file) {
			const ts = new Date().toISOString();
			const plainTag = tag ? ` [${tag}]` : "";
			try {
				appendFileSync(file, `${ts}${plainTag} ${label} ${message}\n`);
			} catch {
				// ignore file write errors
			}
		}
	}

	return {
		get level() {
			return state.level;
		},
		set level(l: LogLevel) {
			state.level = l;
		},

		info(message: string, ...args: unknown[]) {
			log("log", "info", logSymbols.info, message, color.white, "INFO", args);
		},

		success(message: string, ...args: unknown[]) {
			log(
				"log",
				"info",
				logSymbols.success,
				message,
				color.green,
				"SUCCESS",
				args,
			);
		},

		warn(message: string, ...args: unknown[]) {
			log(
				"log",
				"warn",
				logSymbols.warning,
				message,
				color.yellow,
				"WARN",
				args,
			);
		},

		error(message: string, ...args: unknown[]) {
			log(
				"error",
				"error",
				logSymbols.error,
				message,
				color.red,
				"ERROR",
				args,
			);
		},

		debug(message: string, ...args: unknown[]) {
			log("log", "debug", "", message, color.dim, "DEBUG", args);
		},

		withTag(newTag: string): Logger {
			return createLogger({
				level: state.level,
				tag: newTag,
				file,
				stdout: config.stdout,
				stderr: config.stderr,
			});
		},
	};
}

/**
 * Default logger instance at level `info`.
 *
 * @example
 * import { logger } from 'kowu-cli'
 * logger.success("Deployment complete!")
 */
export const logger: Logger = createLogger();
