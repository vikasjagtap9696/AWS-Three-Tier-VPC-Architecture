# App Tier

Express API for student records and MySQL RDS access.

## Install and Run

```bash
cd application-code/app-tier
npm install
node index.js
```

For production:

```bash
pm2 start index.js --name student-api
pm2 save
```

Set `DB_HOST`, `DB_USER`, `DB_PWD`, and `DB_DATABASE` before starting the API. Do not commit database credentials.

