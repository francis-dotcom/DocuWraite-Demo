For next time: run two processes from the project folder:

npm run server — leave this running
npm start — then open web or your simulator

If `npm run server` fails with `EADDRINUSE` on port 8787, another Node process is already listening. Example PID: `21189`.

Fix:

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
kill 21189
npm run server
```

Use the PID from `lsof` if it is not `21189`.
