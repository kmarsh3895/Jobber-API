// This is what the website's quote form sends its data to.
// It: 1) creates (or reuses) a client in Jobber, 2) starts a draft quote
// for them with the job description, so it's sitting in Jobber ready for
// you to price out and send.

import { jobberGraphQL } from "../lib/jobber.js";

const CREATE_CLIENT = `
  mutation CreateClient($firstName: String!, $lastName: String, $phone: String, $note: String) {
    clientCreate(
      input: {
        firstName: $firstName
        lastName: $lastName
        phones: [{ description: MAIN, primary: true, number: $phone }]
      }
    ) {
      client { id firstName lastName }
      userErrors { message path }
    }
  }
`;

const CREATE_QUOTE = `
  mutation CreateQuote($attributes: QuoteCreateAttributes!) {
    quoteCreate(attributes: $attributes) {
      quote { id quoteNumber }
      userErrors { message path }
    }
  }
`;

export default async function handler(req, res) {
  // Allow the website (hosted elsewhere) to call this endpoint.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Use POST" }); return; }

  const { name, phone, jobDescription } = req.body || {};
  if (!name) {
    res.status(400).json({ error: "Missing name" });
    return;
  }

  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || null;

  try {
    const clientResult = await jobberGraphQL(CREATE_CLIENT, {
      firstName,
      lastName,
      phone: phone || null,
    });
    const clientErrors = clientResult.clientCreate.userErrors;
    if (clientErrors && clientErrors.length) {
      res.status(422).json({ step: "create client", errors: clientErrors });
      return;
    }
    const client = clientResult.clientCreate.client;

    const quoteResult = await jobberGraphQL(CREATE_QUOTE, {
      attributes: {
        clientId: client.id,
        message: jobDescription || "Submitted from the website — no details given.",
      },
    });
    const quoteErrors = quoteResult.quoteCreate.userErrors;
    if (quoteErrors && quoteErrors.length) {
      // The client WAS created successfully even if the quote step needs a fix —
      // say so clearly rather than pretending nothing happened.
      res.status(207).json({
        step: "create quote",
        note: "Client was created in Jobber, but the draft quote step needs adjusting.",
        client,
        errors: quoteErrors,
      });
      return;
    }

    res.status(200).json({
      ok: true,
      client,
      quote: quoteResult.quoteCreate.quote,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
