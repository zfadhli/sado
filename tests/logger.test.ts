import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import { createLogger } from "../src/logger.js";

describe("createLogger", () => {
	const mockLog = mock(() => {});
	const mockError = mock(() => {});

	afterEach(() => {
		mockLog.mockClear();
		mockError.mockClear();
	});

	// Replace console.log/error just for this test suite
	const originalLog = console.log;
	const originalError = console.error;

	beforeEach(() => {
		console.log = mockLog;
		console.error = mockError;
	});

	afterAll(() => {
		console.log = originalLog;
		console.error = originalError;
	});

	it("calls console.log for success()", () => {
		const logger = createLogger({ level: "debug" });
		logger.success("Done!");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("calls console.log for info()", () => {
		const logger = createLogger({ level: "debug" });
		logger.info("Started");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("calls console.log for warn()", () => {
		const logger = createLogger({ level: "debug" });
		logger.warn("Caution");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("calls console.error for error()", () => {
		const logger = createLogger({ level: "debug" });
		logger.error("Failed");
		expect(mockError).toHaveBeenCalledTimes(1);
	});

	it("calls console.log for debug()", () => {
		const logger = createLogger({ level: "debug" });
		logger.debug("Verbose");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("suppresses info and debug when level is warn", () => {
		const logger = createLogger({ level: "warn" });

		logger.info("should not appear");
		expect(mockLog).not.toHaveBeenCalled();

		logger.debug("should not appear");
		expect(mockLog).not.toHaveBeenCalled();

		logger.warn("should appear");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("suppresses debug when level is info (default)", () => {
		const logger = createLogger();

		logger.debug("should not appear");
		expect(mockLog).not.toHaveBeenCalled();

		logger.info("should appear");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("suppresses all output when level is silent", () => {
		const logger = createLogger({ level: "silent" });

		logger.info("no");
		logger.success("no");
		logger.warn("no");
		logger.error("no");
		logger.debug("no");

		expect(mockLog).not.toHaveBeenCalled();
		expect(mockError).not.toHaveBeenCalled();
	});

	it("forwards extra args to console.log", () => {
		const logger = createLogger({ level: "debug" });
		const extra = { key: "value" };
		logger.success("Done", extra);

		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(String),
			extra,
		);
	});

	it("withTag creates a child logger", () => {
		const logger = createLogger({ level: "debug" });
		const tagged = logger.withTag("db");

		tagged.info("Connected");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("tagged logger respects parent log level", () => {
		const logger = createLogger({ level: "warn" });
		const tagged = logger.withTag("db");

		tagged.info("should not appear");
		expect(mockLog).not.toHaveBeenCalled();

		tagged.warn("should appear");
		expect(mockLog).toHaveBeenCalledTimes(1);
	});

	it("level property returns the configured level", () => {
		const logger = createLogger({ level: "error" });
		expect(logger.level).toBe("error");
	});

	it("defaults level to info", () => {
		const logger = createLogger();
		expect(logger.level).toBe("info");
	});
});
