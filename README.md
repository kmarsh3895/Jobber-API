# Repair Iowa — Jobber connection

This connects the quote form on your website to Jobber: when someone submits
the form, a new client and a draft quote appear in your Jobber account
automatically.

You don't need to understand or edit any of this code. Just follow the steps
below in order, one at a time.

## Setup checklist

**1. Upload this to GitHub**
Create a new repository (any name, e.g. `repair-iowa-jobber`), and upload
every file in this folder, keeping the `api` and `lib` folders intact.

**2. Import it into Vercel**
In Vercel, "Add New Project" → pick this GitHub repo → Deploy.
It'll deploy successfully even though nothing works yet — that's expected.

**3. Add storage**
In your new Vercel project: Storage tab → Browse Marketplace → search
"Redis" → pick the Upstash-backed option → connect it to this project.
This is where your Jobber connection gets safely remembered between visits.

**4. Add the Jobber settings**
Project → Settings → Environment Variables. Add:
- `JOBBER_CLIENT_ID` — from Jobber's Developer Center
- `JOBBER_CLIENT_SECRET` — from Jobber's Developer Center
- `JOBBER_REDIRECT_URI` — `https://YOUR-PROJECT-NAME.vercel.app/api/jobber-callback`
  (use your actual project's address, shown at the top of the Vercel dashboard)

Then redeploy (Deployments tab → ⋯ menu on the latest one → Redeploy).

**5. Update Jobber with the real callback URL**
Back in Jobber's Developer Center → your app → change the Callback URL
from the placeholder to the same `.../api/jobber-callback` address from
step 4.

**6. Connect it — one time only**
Visit `https://YOUR-PROJECT-NAME.vercel.app/api/authorize` in your browser.
Log into Jobber if asked, click **Allow Access**. You should land on a page
that says "Connected!" That's it — done for good, unless you disconnect the
app in Jobber later.

**7. Tell Claude you're here**
Once you see "Connected!", let me know — I'll wire the website's quote form
to actually send to this, and we'll test it together with a real submission.

## If something errors
Copy the exact error text and send it over — that's usually enough to fix
without needing to know what any of it means.
