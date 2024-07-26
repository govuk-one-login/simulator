import { createApp } from "./app";
import { logger } from "./logger";

const port = process.env.PORT || 3000;

(async () => {
  const app = createApp();

  app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
  });
})();
