const { spawn } = require("node:child_process");

const env = { ...process.env };
delete env.HTTP_PROXY;
delete env.HTTPS_PROXY;
delete env.ALL_PROXY;
delete env.http_proxy;
delete env.https_proxy;
delete env.all_proxy;

const builderBin = require.resolve("electron-builder/cli.js");
const args = [builderBin, ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
