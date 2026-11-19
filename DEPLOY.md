# Deploy — FraudStream

## Option A: New GitHub + New Vercel (what Dhananjoy asked for)
1. Create a new repo in the OTHER GitHub account: name `fraud-detection-streaming-platform` (Public, no README - this repo already has one).
2. Tell Muse the new GitHub username + repo name, OR connect that account in Muse (Settings → Connectors → GitHub → Add account) and say "push it".
   Muse will push all files including `package-lock.json` in one commit.
3. In the OTHER Vercel account: Add New → Project → Import that GitHub repo.
   Framework: Next.js (auto-detected), Root: `./`, Build: `npm run build` (default). No env vars needed.
4. Deploy → live URL will be `fraud-detection-streaming-platform-*.vercel.app`.
5. Send Muse the live URL to verify (fingerprint check: header "FraudStream", LIVE STREAM badge, tabs).

## Option B: Vercel CLI (no GitHub)
```bash
npm i -g vercel && vercel login   # login with the OTHER account
vercel --prod
```

## Notes
- No secrets / env vars required. No database needed for the demo.
- `docker-compose.yml` is for the full local Kafka/Flink stack demo, NOT needed on Vercel.
