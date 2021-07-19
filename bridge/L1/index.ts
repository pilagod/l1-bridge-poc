import schedule from "node-schedule";
import logger from "@logger";
import watcher from "./watcher";
import worker from "./worker";

export async function main() {
  await watcher();
  try {
    await worker();
  } catch (e) {
    logger.error(e);
  }
  schedule.scheduleJob("*/5 * * * *", worker);
}

main();
