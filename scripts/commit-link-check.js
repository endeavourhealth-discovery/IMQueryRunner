import { execSync } from "node:child_process";

const filesToCheck = ["package.json", "pnpm-lock.yaml"];

for (const file of filesToCheck) {
  try {
    // Get the staged version of the file from the index
    const content = execSync(`git show :${file}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    if (
      /['"]@endeavour\/vue-library['"]\s*:\s*(?:file|link):/.test(content)
    ) {
      console.error(
        `\n${file} contains a local @endeavour/vue-library dependency.\n`
      );
      process.exit(1);
    }
  } catch {
    // File is not in the index (not tracked/staged), skip it
  }
}