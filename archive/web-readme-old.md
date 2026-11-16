# khabo web (Next.js)

The real khabo website: diner site, owner panel, khabo team panel and the QR table menu.
It is rebuilt from the approved prototype in `../website/` with the same features and content.

```
npm install
npm run dev -- -p 3100
```

Open http://localhost:3100 (it goes to /en or /bn).

How it is built and the rules every page follows: [BUILDING.md](BUILDING.md).
Data is local demo data in `data/catalog/` for now; the backend (Supabase) comes next and replaces `lib/data/catalog.ts` only.
