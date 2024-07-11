import { createApp } from "./app";

const port = process.env.PORT || 3000;

(async () => {
  const app = createApp();

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`); // eslint-disable-line
  });
})();
