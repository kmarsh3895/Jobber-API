// Visit this page ONE TIME in your browser (after everything is deployed)
// to connect your Jobber account. It sends you to Jobber, you click
// "Allow Access", and Jobber sends you back to /api/jobber-callback,
// which saves your connection. You never need to visit this again unless
// you disconnect the app in Jobber.

export default function handler(req, res) {
  const url =
    "https://api.getjobber.com/api/oauth/authorize" +
    `?client_id=${encodeURIComponent(process.env.JOBBER_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(process.env.JOBBER_REDIRECT_URI)}` +
    `&response_type=code`;

  res.writeHead(302, { Location: url });
  res.end();
}
