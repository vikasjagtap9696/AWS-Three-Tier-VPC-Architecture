# Reyaz Three-Tier Student Management Application

A three-tier AWS application with a React web tier, an Express/Node.js app tier, and a private MySQL RDS database.

## Features

- Full-screen student management interface
- Student fields: `name`, `salary` as text, and `field` such as `AWS`
- Create, read, update, and delete student records
- React frontend served by Nginx
- Express API behind an internal load balancer
- MySQL access through `mysql2`

## Repository Structure

```text
application-code/
├── app-tier/
│   ├── DbConfig.js
│   ├── TransactionService.js
│   ├── index.js
│   ├── students.sql
│   ├── package.json
│   └── .env.example
├── nginx.conf
└── web-tier/
    ├── public/
    ├── src/
    ├── package.json
    └── package-lock.json
```

## Database Setup

Run the SQL file in MySQL:

```bash
mysql -h YOUR_RDS_ENDPOINT -u YOUR_DB_USER -p
```

Then run the statements in `application-code/app-tier/students.sql`.

The student table contains:

```text
id     INT AUTO_INCREMENT PRIMARY KEY
name   VARCHAR(100)
salary VARCHAR(100)
field  VARCHAR(100)
```

## App Tier

On the App Server:

```bash
cd application-code/app-tier
npm install
export DB_HOST="your-rds-endpoint"
export DB_USER="your-database-user"
export DB_PWD="your-database-password"
export DB_DATABASE="webappdb"
node index.js
```

For production, use PM2:

```bash
pm2 start index.js --name student-api
pm2 save
```

## Web Tier

```bash
cd application-code/web-tier
npm install
npm run build
```

For local development, use `npm start` after the package install. The local frontend proxy sends `/api` requests to `http://localhost:4000`.

## Production Web Deployment

Build the frontend on the development machine:

```bash
cd application-code/web-tier
npm install
npm run build
```

Upload only the generated `build` folder to the web server or S3. Nginx serves:

```text
/home/ec2-user/web-tier/build
```

The production web server does not need `npm start` or `node_modules`; Nginx serves the generated `build` folder.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/students` | Read all students |
| `POST` | `/students` | Insert a student |
| `PUT` | `/students/:id` | Update a student |
| `DELETE` | `/students/:id` | Delete a student |
| `GET` | `/health` | App tier health check |

When accessed through Nginx, use the `/api` prefix, for example `/api/students`.

## Security

Do not commit database passwords or real RDS credentials. Copy `.env.example` values into the App Server environment instead. The repository ignores `.env` files, `node_modules`, and generated `build` output.

## AWS Deployment Guide

Detailed AWS VPC, security group, RDS, load balancer, S3, Nginx, and Auto Scaling steps are documented in [3-Tier Architecture Application Steps.txt](3-Tier%20Architecture%20Application%20Steps.txt).
