import fs from "fs";
import path from "path";

const serverLcov = path.resolve("test-artifacts/server-coverage/lcov.info");
const clientLcov = path.resolve("test-artifacts/client-coverage/lcov.info");
const out = path.resolve("test-artifacts/lcov.info");

const parts = [];
if (fs.existsSync(serverLcov)) parts.push(fs.readFileSync(serverLcov, "utf8"));
if (fs.existsSync(clientLcov)) parts.push(fs.readFileSync(clientLcov, "utf8"));

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, parts.join("\n"), "utf8");

console.log(`[merge-lcov] gerado: ${out}`);