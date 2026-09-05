# Reyaz Three-Tier Student Management Application

A three-tier AWS application with a React web tier, an Express/Node.js app tier, and a private MySQL RDS database.

## Architecture

![AWS three-tier architecture](Architecture.webp)

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

## Complete AWS Deployment Steps

### 1. Create the VPC

- Create a VPC with CIDR `192.168.0.0/16`.
- Use two Availability Zones, two public subnets, four private subnets, and one NAT Gateway.
- Use the private subnets as `APP1`, `APP2`, `DB1`, and `DB2`.

Create these five security groups:

1. `WebALB-SG`: allow HTTP and HTTPS from `0.0.0.0/0`.
2. `Web-SG`: allow HTTP and HTTPS from `WebALB-SG` or the VPC CIDR.
3. `AppALB-SG`: allow HTTP and HTTPS from `Web-SG` or the VPC CIDR.
4. `App-SG`: allow TCP `4000` from `AppALB-SG` or the VPC CIDR.
5. `Database-SG`: allow MySQL `3306` from `App-SG`.

### 2. Create the S3 Bucket

Create a private S3 bucket and upload the repository code, including `application-code` and `install.sh`.

Before deployment, update:

- `application-code/app-tier/DbConfig.js` with server environment variables.
- `application-code/nginx.conf` with the internal load balancer DNS name.

### 3. Create IAM Role

Create an EC2 role named `3-tier-role` with Session Manager permissions such as `AmazonSSMManagedInstanceCore`. Attach it to App and Web EC2 instances.

### 4. Create RDS MySQL

- Create a DB subnet group using `DB1` and `DB2` in both Availability Zones.
- Create a private MySQL RDS instance using `Database-SG`.
- Set public access to `No` and enable encryption.
- Create the database and tables:

```sql
CREATE DATABASE webappdb;
USE webappdb;

CREATE TABLE IF NOT EXISTS transactions (
    id INT NOT NULL AUTO_INCREMENT,
    amount DECIMAL(10,2),
    description VARCHAR(100),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS students (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    salary VARCHAR(100) NOT NULL,
    field VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
);
```

Set credentials only on the App Server:

```bash
export DB_HOST="your-rds-endpoint"
export DB_USER="your-database-user"
export DB_PWD="your-database-password"
export DB_DATABASE="webappdb"
```

### 5. Deploy the App Tier

Launch an Amazon Linux 2023 EC2 instance in a private App subnet with `App-SG` and the `3-tier-role` IAM role. Connect through Session Manager.

```bash
sudo dnf install -y mariadb105
curl -o- https://raw.githubusercontent.com/ReyazShaik/3tier-app-deployment-aws/main/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
npm install -g pm2

aws s3 cp s3://YOUR_BUCKET/application-code/app-tier/ app-tier --recursive
cd app-tier
npm install
pm2 start index.js --name student-api
pm2 save
pm2 startup
curl http://localhost:4000/health
```

Create an internal Application Load Balancer:

- Target group: `App-TG`, HTTP port `4000`, health check `/health`.
- Load balancer: internal, attached to `AppALB-SG`, across both App subnets.
- Update the `proxy_pass` value in `nginx.conf` with this internal ALB DNS name.

Student API routes are `GET /students`, `POST /students`, `PUT /students/:id`, and `DELETE /students/:id`.

### 6. Build and Deploy the Web Tier

Build the frontend on the development machine, not on the production Nginx server:

```bash
cd application-code/web-tier
npm install
npm run build
aws s3 sync build s3://YOUR_BUCKET/application-code/web-tier/build/ --delete
```

Launch an Amazon Linux 2023 Web Server in a public subnet with `Web-SG` and `3-tier-role`. Install Nginx and copy the build:

```bash
sudo dnf install -y nginx
sudo mkdir -p /home/ec2-user/web-tier/build
sudo aws s3 sync s3://YOUR_BUCKET/application-code/web-tier/build/ /home/ec2-user/web-tier/build/ --delete
sudo aws s3 cp s3://YOUR_BUCKET/application-code/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl enable --now nginx
sudo chmod -R 755 /home/ec2-user
```

Nginx must serve `/home/ec2-user/web-tier/build` and proxy `/api/` to the internal App ALB.

### 7. Create the External Load Balancer

- Create target group `Web-TG` on HTTP port `80` with health check `/`.
- Create an internet-facing Application Load Balancer across both public subnets.
- Attach `WebALB-SG` and register the Web Server.

### 8. HTTPS and DNS

- Request an ACM certificate in the same AWS Region as the external load balancer.
- Add an HTTPS listener using the certificate.
- Create a Route 53 alias record pointing the application domain to the external load balancer.

### 9. Optional Auto Scaling

- Create an App Server AMI and launch template using `App-SG` and `3-tier-role`.
- Create `App-ASG` across `APP1` and `APP2`, attached to the internal load balancer.
- Create a Web Server AMI and launch template using `Web-SG` and `3-tier-role`.
- Create `Web-ASG` across both public subnets, attached to the external load balancer.
- Configure minimum, desired, and maximum capacity and scale on average CPU utilization.

### 10. CloudFront

Optionally place CloudFront in front of the HTTPS application endpoint for caching and global delivery.

The original step-by-step reference is available in [3-Tier Architecture Application Steps.txt](3-Tier%20Architecture%20Application%20Steps.txt).
