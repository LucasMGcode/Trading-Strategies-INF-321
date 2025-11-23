const fs = require("fs");
const path = require("path");

class DualStreamReporter {
    constructor(globalConfig, options) {
        this._options = options || {};
        this._logBuffer = [];
        this._errorBuffer = [];
        this._passedTests = [];
        this._failedTests = [];

        this.logsPath = this._options.logsPath || "logs.txt";
        this.errorsPath = this._options.errorsPath || "errors.txt";
        this.stdoutPath = this._options.stdoutPath || "stdout.txt";
        this.stderrPath = this._options.stderrPath || "stderr.txt";
    }

    onTestResult(test, testResult) {
        if (testResult.console && testResult.console.length) {
            for (const entry of testResult.console) {
                const msg = (entry.message || "").trimRight();
                const type = entry.type || "log";

                const line =
                    `[${type.toUpperCase()}] ${testResult.testFilePath}\n` +
                    msg +
                    "\n";

                if (type === "error") this._errorBuffer.push(line);
                else this._logBuffer.push(line);
            }
        }

        for (const ar of testResult.testResults) {
            const line = `${ar.status.toUpperCase()} :: ${ar.fullName}`;
            if (ar.status === "passed") this._passedTests.push(line);
            else if (ar.status === "failed") this._failedTests.push(line);
        }
    }

    onRunComplete() {
        const ensureDir = (p) => {
            const dir = path.dirname(p);
            if (dir && dir !== "." && !fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        };

        [this.logsPath, this.errorsPath, this.stdoutPath, this.stderrPath].forEach(ensureDir);

        fs.writeFileSync(this.logsPath, this._logBuffer.join("\n") + "\n", "utf8");
        fs.writeFileSync(this.errorsPath, this._errorBuffer.join("\n") + "\n", "utf8");
        fs.writeFileSync(this.stdoutPath, this._passedTests.join("\n") + "\n", "utf8");
        fs.writeFileSync(this.stderrPath, this._failedTests.join("\n") + "\n", "utf8");
    }
}

module.exports = DualStreamReporter;
