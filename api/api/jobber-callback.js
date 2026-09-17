// Jobber sends the browser here automatically after you click "Allow Access"
// at /api/authorize. This page exchanges the one-time code Jobber gives us
// for a real, reusable connection, and saves it. You should see a plain
// "Connected!" message — once you do, this part is done for good.

import { exchangeCodeForTokens } from "../lib/jobber.js";

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    res.status(400).send(`Jobber said: ${error}. Nothing was connected — try /api/authorize again.`);
    return;
  }
  if (!code) {
    res.status(400).send("Missing code from Jobber. Try visiting /api/authorize again.");
    return;
  }

  try {
    await exchangeCodeForTokens(code);
    res.status(200).send(
      "<h1>Connected!</h1><p>Repair Iowa's website is now linked to Jobber. You can close this tab.</p>"
    );
  } catch (err) {
    res.status(500).send(`<h1>Something went wrong</h1><pre>${err.message}</pre>`);
  }
}
