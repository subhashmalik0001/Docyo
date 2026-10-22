# Docyo Analytics

Website analytics run on **GoatCounter**, in a dedicated Railway project. No PostHog integration remains.

- [Activity page](https://subhashmalik0001.github.io/Docyo/stats.html): public release package requests, stars, forks, issues, links to reports.
- [Private website dashboard](https://goatcounter-production-7a2a.up.railway.app/): visits, referral sources/campaigns, approximate countries, and explicit download/repository/release clicks.
- [Railway project](https://railway.com/project/5db2c531-9d9d-43fb-a7ca-0840f5fabac2): Docyo Analytics.
- SQLite lives on its own persistent volume at `/home/goatcounter/goatcounter-data/db.sqlite3`.
- Sign-in email: `Subhashmalik1000@gmail.com`. Never commit passwords.

Collection is opt-in; DNT/GPC override consent. The footer supports withdrawal. Only the consent choice and expiry (180 days) are stored in the browser. Old visitor/session identifiers are removed. No SDK or replay is loaded. The count endpoint receives only clean paths, a referrer domain or simple `utm_source` label, an event flag/title and random cache buster. It receives normal network IP/browser information; GoatCounter estimates visits without persistent client IDs.

Events: page path, `docyo_download_click/<release>`, `docyo_releases_click`, `docyo_repository_click`. Use `?utm_source=reddit` on shared links. QA events use `utm_source=qa`.

[GitHub Traffic](https://github.com/subhashmalik0001/Docyo/graphs/traffic) reports repository views/clones/referrers for a rolling 14 days. The native Mac and Desktop apps send no analytics.

Run `node scripts/test-analytics.cjs`, `node scripts/test-site.cjs`, and `node scripts/test-demo.cjs` before publishing.
