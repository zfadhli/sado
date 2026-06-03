import { afterAll, describe, expect, it, mock } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createLogger } from "../src/logger.js";

describe("createLogger", () => {
	it("calls stdout for info()", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "debug", stdout });
		logger.info("Started");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("calls stdout for success()", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "debug", stdout });
		logger.success("Done!");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("calls stdout for warn()", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "debug", stdout });
		logger.warn("Caution");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("calls stderr for error()", () => {
		const stderr = mock(() => {});
		const logger = createLogger({ level: "debug", stderr });
		logger.error("Failed");
		expect(stderr).toHaveBeenCalledTimes(1);
	});

	it("calls stdout for debug()", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "debug", stdout });
		logger.debug("Verbose");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("suppresses info and debug when level is warn", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "warn", stdout });

		logger.info("should not appear");
		expect(stdout).not.toHaveBeenCalled();

		logger.debug("should not appear");
		expect(stdout).not.toHaveBeenCalled();

		logger.warn("should appear");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("suppresses debug when level is info (default)", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ stdout });

		logger.debug("should not appear");
		expect(stdout).not.toHaveBeenCalled();

		logger.info("should appear");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("suppresses all output when level is silent", () => {
		const stdout = mock(() => {});
		const stderr = mock(() => {});
		const logger = createLogger({ level: "silent", stdout, stderr });

		logger.info("no");
		logger.success("no");
		logger.warn("no");
		logger.error("no");
		logger.debug("no");

		expect(stdout).not.toHaveBeenCalled();
		expect(stderr).not.toHaveBeenCalled();
	});

	it("forwards extra args to stdout", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "debug", stdout });
		const extra = { key: "value" };
		logger.success("Done", extra);

		expect(stdout).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(String),
			extra,
		);
	});

	it("withTag creates a child logger", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "debug", stdout });
		const tagged = logger.withTag("db");

		tagged.info("Connected");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("tagged logger respects parent log level", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "warn", stdout });
		const tagged = logger.withTag("db");

		tagged.info("should not appear");
		expect(stdout).not.toHaveBeenCalled();

		tagged.warn("should appear");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("tagged logger uses parent stdout/stderr", () => {
		const stdout = mock(() => {});
		const stderr = mock(() => {});
		const logger = createLogger({ level: "debug", stdout, stderr });
		const tagged = logger.withTag("child");

		tagged.info("msg");
		expect(stdout).toHaveBeenCalled();

		tagged.error("err");
		expect(stderr).toHaveBeenCalled();
	});

	it("level property returns the configured level", () => {
		const logger = createLogger({ level: "error" });
		expect(logger.level).toBe("error");
	});

	it("defaults level to info", () => {
		const logger = createLogger();
		expect(logger.level).toBe("info");
	});

	it("setting level at runtime affects log filtering", () => {
		const stdout = mock(() => {});
		const logger = createLogger({ level: "info", stdout });

		logger.info("should appear");
		expect(stdout).toHaveBeenCalledTimes(1);

		stdout.mockClear();
		logger.level = "warn";
		logger.info("should be suppressed");
		expect(stdout).not.toHaveBeenCalled();

		logger.warn("should appear");
		expect(stdout).toHaveBeenCalledTimes(1);
	});

	it("setting level at runtime is reflected by the level property", () => {
		const logger = createLogger({ level: "info" });
		expect(logger.level).toBe("info");
		logger.level = "error";
		expect(logger.level).toBe("error");
	});

	describe("file transport", () => {
		const tmpDir = mkdtempSync("/tmp/kowu-cli-test-");
		const logFile = join(tmpDir, "test.log");
		const silent = () => {};

		afterAll(() => {
			rmSync(tmpDir, { recursive: true, force: true });
		});

		it("writes to file with level prefix", () => {
			const logger = createLogger({
				level: "debug",
				file: logFile,
				stdout: silent,
			});
			logger.info("Info message");
			logger.success("Success message");

			const content = readFileSync(logFile, "utf-8");
			expect(content).toContain("INFO Info message");
			expect(content).toContain("SUCCESS Success message");
		});

		it("writes tag prefix in file when provided", () => {
			const logger = createLogger({
				level: "debug",
				file: logFile,
				tag: "app",
				stdout: silent,
			});
			logger.warn("Warning message");

			const content = readFileSync(logFile, "utf-8");
			expect(content).toContain("[app]");
			expect(content).toContain("WARN Warning message");
		});

		it("includes ISO timestamp in file output", () => {
			const logger = createLogger({
				level: "debug",
				file: logFile,
				stdout: silent,
			});
			logger.info("Timestamp check");

			const content = readFileSync(logFile, "utf-8");
			expect(content).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it("does not write to file when level suppresses the message", () => {
			const logger = createLogger({
				level: "error",
				file: logFile,
				stdout: silent,
			});
			logger.info("Should not appear");

			const content = readFileSync(logFile, "utf-8");
			expect(content).not.toContain("Should not appear");
		});

		it("child logger inherits file from parent", () => {
			const logger = createLogger({
				level: "debug",
				file: logFile,
				stdout: silent,
			});
			const child = logger.withTag("child");
			child.info("Child message");

			const content = readFileSync(logFile, "utf-8");
			expect(content).toContain("[child]");
			expect(content).toContain("INFO Child message");
		});
	});
});
