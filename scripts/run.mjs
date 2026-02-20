import { spawn, exec } from "child_process";
import chalk from "chalk";
import cliProgress from "cli-progress";
import fs from "fs";
import path from "path";

console.clear();
console.log(chalk.cyan.bold("\n🚀 SDEV PIPELINE\n"));

const args = process.argv.slice(2);
let skipBuild = args.includes("-s");
const openBrowser = args.includes("-o");

const multibar = new cliProgress.MultiBar({
  format: `${chalk.cyan.bold("Overall Progress")} |${chalk.blue("{bar}")}| {percentage}% | Stage: {stage}`,
  barCompleteChar: "█",
  barIncompleteChar: "░",
  hideCursor: true,
});

const progress = multibar.create(100, 0, { stage: "Initializing" });

const runStep = (command, args, stageName, progressValue) => {
  return new Promise((resolve, reject) => {
    progress.update(progressValue, { stage: stageName });

    const fullCommand = `${command} ${args.join(" ")}`;
    const proc = spawn(fullCommand, {
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    proc.stdout.on("data", (data) => (output += data.toString()));
    proc.stderr.on("data", (data) => (output += data.toString()));

    proc.on("exit", (code) => {
      if (code === 0) {
        multibar.log(chalk.green(`✔ ${stageName} completed successfully.\n`));
        resolve();
      } else {
        multibar.log(chalk.red(`✖ ${stageName} failed with exit code ${code}.\n`));
        multibar.log(chalk.gray.dim(`\n--- Error Output ---\n${output}\n--------------------\n`));
        reject(new Error(`${stageName} failed`));
      }
    });
  });
};

const startServer = () => {
  return new Promise((resolve, reject) => {
    progress.update(90, { stage: "Launching Server" });

    const proc = spawn("npm run start", {
      stdio: "pipe",
      shell: true,
    });

    let resolved = false;

    const formatLogs = (chunk) => {
      let text = chunk.toString();
      text = text.replace(/(http:\/\/[^\s]+)/g, chalk.white.bold("$1"));
      return chalk.gray(text);
    };

    proc.stdout.on("data", (data) => {
      const chunkStr = data.toString();
      
      if (!resolved && (chunkStr.includes("Ready in") || chunkStr.includes("started server on") || chunkStr.includes("Ready on"))) {
        multibar.log(chalk.green("✔ Server is up and running!\n"));
        progress.update(100, { stage: "Live" });
        multibar.stop(); 
        
        console.log(chalk.green.bold("\n✅ Application is live and ready!\n"));

        if (openBrowser) {
          const startCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
          exec(`${startCmd} http://localhost:3000`);
          console.log(chalk.blue("ℹ Opening http://localhost:3000 in your browser...\n"));
        }

        console.log(chalk.gray("--- Server Logs ---"));
        resolved = true;
        resolve();
      }
      
      process.stdout.write(formatLogs(data));
    });

    proc.stderr.on("data", (data) => {
      process.stderr.write(formatLogs(data));
    });

    proc.on("exit", (code) => {
      if (!resolved) {
        multibar.log(chalk.red("✖ Server failed to start.\n"));
        reject(new Error("Server crashed before starting"));
      } else {
        console.log(chalk.yellow(`\nServer process exited with code ${code}`));
      }
    });
  });
};

// Main Execution
(async () => {
  try {
    // Check for the actual production build file, not just the directory
    const hasProdBuild = fs.existsSync(path.join(".next", "BUILD_ID"));

    if (skipBuild && !hasProdBuild) {
      multibar.log(chalk.yellow("⚠ No production build (BUILD_ID) found in '.next'. Ignoring -s flag and building anyway...\n"));
      skipBuild = false;
    }

    if (!skipBuild) {
      await runStep("npm", ["run", "build"], "Building Application", 50);
    } else {
      progress.update(50, { stage: "Skipping Build" });
      multibar.log(chalk.blue("ℹ Build skipped manually via -s flag.\n"));
    }
    
    await startServer();
  } catch (err) {
    multibar.stop();
    console.log(chalk.red.bold(`\n❌ Pipeline terminated: ${err.message}\n`));
    process.exit(1);
  }
})();