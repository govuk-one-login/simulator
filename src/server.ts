import { createApp } from "./app.js";
import { logger } from "./logger.js";

const port = process.env.PORT || 3000;

(async () => {
  const app = createApp();

  app.listen(port, () => {
    logger.info(`[server]: Server is running at http://localhost:${port}`);
  });
})();
