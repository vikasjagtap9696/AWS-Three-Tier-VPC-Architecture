# 🚀 3-Tier Architecture Application Deployment on AWS

A production-style **3-Tier Architecture on AWS** with:

- 🌐 Web Tier
- ⚙️ Application Tier
- 🗄️ Database Tier
- ⚖️ External Application Load Balancer
- 🔒 Internal Application Load Balancer
- 📈 Auto Scaling Groups
- 🔐 AWS Certificate Manager (ACM)
- 🌍 Amazon Route 53
- 🪣 Private Amazon S3 Bucket
- 🔑 IAM Role
- 🗄️ Amazon RDS MySQL
- 🔒 Security Groups
- 🔄 Multi-AZ architecture
- 🌐 NAT Gateway
- 🖥️ Amazon Linux 2023
- 🟢 Node.js + PM2
- 🔧 Nginx
- 📡 AWS Systems Manager Session Manager

---

## Package Installation For Current Code

### App Tier

```bash
cd application-code/app-tier
npm install
```

This installs the backend dependencies, including `express`, `mysql2`, `body-parser`, `cors`, and `node-fetch`.

### Web Tier

```bash
cd application-code/web-tier
npm install
npm start
```

For the production frontend build, run on the development machine:

```bash
cd application-code/web-tier
npm install
npm run build
```

The production Nginx server serves the generated `build` folder and does not run `npm start`.

# 🏗️ Architecture

![AWS three-tier architecture](Architecture.webp)

---

# 📐 AWS VPC Design

## VPC

```text
VPC CIDR: 192.168.0.0/16
```

Create VPC using **VPC and more**.

### Configuration

```text
Name:
3-tier-project

CIDR:
192.168.0.0/16

Tenancy:
Default

Availability Zones:
2

Public Subnets:
2

Private Subnets:
4

NAT Gateway:
1 - Zonal - In 1 AZ

VPC Endpoint:
None
```

---

# 🌎 Subnet Architecture

## Availability Zone 1

```text
Public Subnet 1
192.168.0.0/20

Private Subnet APP1
192.168.128.0/20

Private Subnet DB1
192.168.160.0/20
```

## Availability Zone 2

```text
Public Subnet 2
192.168.16.0/20

Private Subnet APP2
192.168.144.0/20

Private Subnet DB2
192.168.176.0/20
```

---

# 🔐 Security Groups

Create **5 Security Groups**:

```text
1. WebALB-SG
2. Web-SG
3. AppALB-SG
4. App-SG
5. Database-SG
```

---

## 1. WebALB-SG

External Load Balancer Security Group.

### Inbound

```text
HTTP   : 80
HTTPS  : 443
Source : 0.0.0.0/0
```

---

## 2. Web-SG

Web Server Security Group.

### Inbound

```text
HTTP
HTTPS

Source:
WebALB-SG

OR

192.168.0.0/16
```

---

## 3. AppALB-SG

Internal Application Load Balancer Security Group.

### Inbound

```text
HTTP
HTTPS

Source:
Web-SG

OR

192.168.0.0/16
```

---

## 4. App-SG

Application Server Security Group.

Node.js application is running on port `4000`.

### Inbound

```text
Custom TCP
Port: 4000

Source:
AppALB-SG

OR

192.168.0.0/16
```

---

## 5. Database-SG

RDS MySQL Security Group.

### Inbound

```text
MySQL
Port: 3306

Source:
App-SG

OR

192.168.0.0/16
```

The architecture allows VPC traffic as specified in the original deployment steps.

---

# 🪣 Amazon S3 Private Bucket

Create a private S3 bucket.

```text
Bucket:
3-tier-project-demo
```

Upload the application code.

Expected structure:

```text
application-code/
│
├── app-tier/
│   ├── index.js
│   ├── DbConfig.js
│   ├── package.json
│   └── ...
│
├── web-tier/
│   ├── package.json
│   ├── src/
│   └── ...
│
└── nginx.conf
```

Upload:

```text
application-code/
install.sh
```

---

# 🔧 Code Modifications

There are two important places where code needs modification.

## 1. Application Tier

File:

```text
App-Tier/DbConfig.js
```

Update the RDS credentials.

---

## 2. Web Tier

File:

```text
Web-Tier/nginx.conf
```

Update the Internal Load Balancer DNS name.

---

# 🔑 IAM Role

Create an IAM Role and attach it to EC2 instances.

The role is required to connect to private App Servers using **AWS Systems Manager Session Manager**.

### Configuration

```text
Trusted Entity:
EC2

Permissions:
AmazonEC2RoleforSSM

OR

Admin

Role Name:
3-tier-role
```

---

# 🏷️ Rename Private Subnets

Go to:

```text
AWS Console
→ VPC
→ Subnets
```

Rename the private subnets according to the architecture:

```text
Private1 → APP1
Private2 → APP2
Private3 → DB1
Private4 → DB2
```

---

# 🗄️ RDS MySQL

Create an Amazon RDS MySQL database.

Because the VPC is newly created, first create a DB Subnet Group.

---

## RDS Subnet Group

```text
Name:
tier-Subnet-Group

Description:
tier-Subnet-Group

VPC:
3-tier-project-vpc

Availability Zones:
1a
1b

Subnets:
DB1
DB2
```

---

# 🗄️ Create RDS DB Instance

Database Engine:

```text
MySQL
```

Configuration:

```text
DB Identifier:
my3tierdb

VPC:
3-tier-vpc-project

Security Group:
Database-SG

DB Subnet Group:
tier-Subnet-Group

Public Access:
NO

Sample DB:
NO

Backups:
NO

Encryption:
YES
```

---

# 🔑 RDS Credentials

```text
Endpoint:
my3tierdb.cdbmlufgqkjd.ap-south-1.rds.amazonaws.com

Username:
admin

Password:
root123456
```

> ⚠️ For a production environment, never commit database passwords to GitHub. Use AWS Secrets Manager or another secure secrets-management solution.

---

# 📝 Update Database Configuration

Update:

```text
App-Tier/DbConfig.js
```

with the RDS credentials.

The current `DbConfig.js` reads these values from environment variables:

```bash
export DB_HOST="your-rds-endpoint"
export DB_USER="your-database-user"
export DB_PWD="your-database-password"
export DB_DATABASE="webappdb"
```

After modification:

```text
Upload the updated code back to S3.
```

---

# ⚙️ Application Tier

The Application Tier contains:

```text
EC2
Node.js
PM2
Internal Application Load Balancer
Auto Scaling Group
```

---

# 🖥️ Launch Application Server

Launch:

```text
Amazon Linux 2023
```

Configuration:

```text
Name:
App-Server

Instance Type:
t3.micro

VPC:
3-tier-vpc-project

Subnet:
APP1

Public IP:
Disable

Security Group:
App-SG

Instance Profile:
3-tier-role
```

The App Server is located inside a private subnet.

Instead of using a Bastion/Jump Server, connect using:

```text
AWS Systems Manager Session Manager
```

---

# 🔌 Connect to App Server

Using Session Manager:

```bash
sudo -s
cd /home/ec2-user
```

---

# 🐬 Install MySQL Client

Install MariaDB/MySQL client:

```bash
sudo dnf install -y mariadb105
```

---

# 🔗 Connect to RDS

```bash
mysql -h my3tierdb.cdbmlufgqkjd.ap-south-1.rds.amazonaws.com -u admin -p
```

Password:

```text
root123456
```

---

# 🗃️ Create Database

Inside MySQL:

```sql
CREATE DATABASE webappdb;

SHOW DATABASES;

USE webappdb;
```

---

# 📋 Create Transactions Table

```sql
CREATE TABLE IF NOT EXISTS transactions(
  id INT NOT NULL AUTO_INCREMENT,
  amount DECIMAL(10,2),
  description VARCHAR(100),
  PRIMARY KEY(id)
);
```

Current student table used by the application:

```sql
CREATE TABLE IF NOT EXISTS students (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  salary VARCHAR(100) NOT NULL,
  field VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
);
```

Example:

```sql
INSERT INTO students (name, salary, field)
VALUES ('Aarav Mehta', '25000', 'AWS');
```

Check tables:

```sql
SHOW TABLES;
```

Insert sample data:

```sql
INSERT INTO transactions
(amount, description)
VALUES
('400', 'awsbill');
```

Check data:

```sql
SELECT * FROM transactions;
```

Exit:

```sql
exit
```

---

# 🟢 Install Node.js and PM2

Install Node.js environment:

```bash
curl -o- https://raw.githubusercontent.com/ReyazShaik/3tier-app-deployment-aws/main/install.sh | bash
```

Reload shell:

```bash
source ~/.bashrc
```

Install Node.js 16:

```bash
nvm install 16
```

Use Node.js 16:

```bash
nvm use 16
```

Install PM2:

```bash
npm install -g pm2
```

PM2 is used to run the Node.js application as a process/service.

---

# 📥 Download Application Code from S3

```bash
aws s3 cp s3://3-tier-project-demo-6pm/application-code/app-tier/ app-tier --recursive
```

Go to the application directory:

```bash
cd app-tier
```

Install dependencies:

```bash
npm install
```

Start application:

```bash
pm2 start index.js
```

Check PM2:

```bash
pm2 status
```

```bash
pm2 list
```

View logs:

```bash
pm2 logs
```

Configure startup:

```bash
pm2 startup
```

---

# ❤️ Application Health Check

Test the Node.js application:

```bash
curl http://localhost:4000/health
```

Expected response:

```text
This is the health check
```

Current student CRUD routes:

```text
GET    /students       Read all students
POST   /students       Insert name, salary, and field
PUT    /students/:id   Update name, salary, and field
DELETE /students/:id  Delete one student
```

---

# ⚖️ Internal Application Load Balancer

Create an Internal Load Balancer for the Application Tier.

---

# 🎯 App Target Group

Create Target Group:

```text
Target Type:
Instance

Target Group Name:
App-TG

Protocol:
HTTP

Port:
4000

VPC:
3-tier-vpc-project

Health Check:
 /health
```

Select:

```text
App-Server
```

Create Target Group.

---

# 🔒 Internal ALB

Create:

```text
Name:
app-internal-alb

Scheme:
Internal

VPC:
3-tier-vpc-project

AZ 1:
1a = APP1

AZ 2:
1b = APP2

Security Group:
AppALB-SG

Listener:
HTTP : 80

Target Group:
App-TG
```

---

# 🌐 Update Nginx Configuration

After creating the Internal ALB, update:

```text
nginx.conf
```

Example:

```nginx
location /api/ {
    proxy_pass http://internal-app-internal-alb-432718895.ap-south-1.elb.amazonaws.com:80/;
}
```

Upload the updated configuration/code back to S3.

---

# 🌐 Web Tier

The Web Tier contains:

```text
EC2
Nginx
External ALB
Auto Scaling Group
```

---

# 🖥️ Launch Web Server

Launch:

```text
Amazon Linux 2023
```

Configuration:

```text
Name:
Web-Server

VPC:
3-tier-vpc-project

Subnet:
public1

Auto Public IP:
Enable

Security Group:
Web-SG

Instance Role:
3-tier-role
```

Connect using:

```text
AWS Systems Manager Session Manager
```

---

# ⚙️ Web Server Setup

```bash
sudo -s
cd /home/ec2-user
```

Install Node.js:

```bash
curl -o- https://raw.githubusercontent.com/ReyazShaik/3tier-app-deployment-aws/main/install.sh | bash
```

Reload:

```bash
source ~/.bashrc
```

Install Node.js 16:

```bash
nvm install 16
```

Use Node.js 16:

```bash
nvm use 16
```

---

# 📥 Download Web Application

```bash
aws s3 cp s3://3-tier-project-demo-6pm/application-code/web-tier/ web-tier --recursive
```

Go to directory:

```bash
cd ~/web-tier
```

Install dependencies:

```bash
npm install
```

Build the application:

```bash
npm run build
```

> Run the production build on the development machine before uploading the final production code when required by the project workflow.

---

# 🔧 Install Nginx

```bash
sudo dnf install -y nginx
```

Go to Nginx directory:

```bash
cd /etc/nginx
```

Check files:

```bash
ls
```

Remove default configuration:

```bash
sudo rm nginx.conf
```

Download custom Nginx configuration from S3:

```bash
sudo aws s3 cp s3://3-tier-project-demo-1030/application-code/nginx.conf .
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

Set permissions:

```bash
chmod -R 755 /home/ec2-user
```

Enable Nginx:

```bash
sudo chkconfig nginx on
```

---

# ⚖️ External Application Load Balancer

Create Target Group.

---

# 🎯 Web Target Group

```text
Target Type:
Instance

Target Group Name:
Web-TG

Protocol:
HTTP

Port:
80

VPC:
3-tier-vpc-project

Health Check:
/ 
```

Select:

```text
Web-Server
```

Create Target Group.

---

# 🌍 Internet-Facing Load Balancer

Create an Internet-facing ALB.

```text
Name:
app-external-alb

Scheme:
Internet-facing

VPC:
3-tier-vpc-project

AZ 1:
1a = Public1

AZ 2:
1b = Public2

Security Group:
WebALB-SG

Listener:
HTTP : 80

Target Group:
Web-TG
```

---

# 🔐 HTTPS with AWS Certificate Manager

Go to:

```text
AWS Certificate Manager
```

Create an SSL/TLS certificate for your domain.

Example:

```text
https://boom.reyazawstrainer.com
```

The certificate is used by the External Application Load Balancer for HTTPS.

---

# 🔒 Add HTTPS Listener

Go to:

```text
External ALB
→ Listeners and rules
→ Add listener
→ HTTPS
```

Configure:

```text
Protocol:
HTTPS

Port:
443

Certificate:
Select ACM Certificate
```

Forward traffic to:

```text
Web-TG
```

---

# 🌍 Route 53

Create/configure a Route 53 hosted zone for the domain.

Example:

```text
boom.reyazawstrainer.com
```

Create an Alias record pointing to:

```text
External Application Load Balancer
```

Traffic flow:

```text
User
  ↓
Route 53
  ↓
External ALB
  ↓
Web ASG
  ↓
Internal ALB
  ↓
App ASG
  ↓
RDS MySQL
```

---

# 📈 Auto Scaling

Auto Scaling is configured for:

```text
Web Tier
Application Tier
```

---

# ⚙️ Application Server AMI

Create an AMI from the configured:

```text
App-Server
```

AMI Name:

```text
App-Server-AMI
```

---

# 🚀 Application Launch Template

Create Launch Template:

```text
Name:
App-LT

AMI:
App-Server-AMI

Instance Type:
t3.micro

Subnet:
Don't include

Security Group:
App-SG

Instance Role:
3-tier-role
```

---

# 📈 Application Auto Scaling Group

Create:

```text
Name:
App-ASG

Launch Template:
App-LT

VPC:
3-tier-vpc-project

Availability Zones:
APP1
APP2
```

Attach existing Load Balancer:

```text
Internal Load Balancer
```

Capacity:

```text
Desired Capacity:
4

Minimum Capacity:
2

Maximum Capacity:
6
```

Scaling policy:

```text
Average CPU:
70%
```

---

# 🌐 Web Server AMI

Create an AMI from the configured:

```text
Web-Server
```

AMI Name:

```text
Web-Server-AMI
```

---

# 🚀 Web Launch Template

Create Launch Template:

```text
Name:
Web-LT

AMI:
Web-Server-AMI

Instance Type:
t2.micro

Subnet:
Don't include

Security Group:
Web-SG

Instance Role:
3-tier-role
```

---

# 📈 Web Auto Scaling Group

Create:

```text
Name:
Web-ASG

Launch Template:
Web-LT

VPC:
3-tier-vpc-project

Availability Zones:
Public1
Public2
```

Attach existing Load Balancer:

```text
External Load Balancer
```

Capacity:

```text
Desired Capacity:
4

Minimum Capacity:
2

Maximum Capacity:
6
```

Scaling policy:

```text
Average CPU:
70%
```

---

# 🔄 Complete Traffic Flow

```text
                         INTERNET
                            │
                            ▼
                     ┌─────────────┐
                     │   Route 53  │
                     │    DNS      │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │     ACM     │
                     │ SSL/TLS     │
                     └──────┬──────┘
                            │
                         HTTPS :443
                            │
                            ▼
                  ┌────────────────────┐
                  │   External ALB     │
                  │   Internet-facing  │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │      Web-ASG       │
                  │  Nginx + EC2       │
                  │  Min: 2 / Max: 6   │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │    Internal ALB    │
                  │       :80          │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │      App-ASG       │
                  │ Node.js :4000      │
                  │ PM2 + EC2          │
                  │  Min: 2 / Max: 6   │
                  └─────────┬──────────┘
                            │
                         MySQL :3306
                            │
                            ▼
                  ┌────────────────────┐
                  │     Amazon RDS     │
                  │       MySQL        │
                  │     Private DB     │
                  └────────────────────┘
```

---

# 🔐 Security Architecture

```text
Internet
   │
   ▼
WebALB-SG
   │
   ▼
Web-SG
   │
   ▼
AppALB-SG
   │
   ▼
App-SG
   │
   ▼
Database-SG
   │
   ▼
RDS
```

---

# 📊 Auto Scaling Architecture

## Web Tier

```text
Web-ASG

Desired:
4

Minimum:
2

Maximum:
6

Scaling Metric:
Average CPU 70%

Availability Zones:
Public1
Public2
```

## Application Tier

```text
App-ASG

Desired:
4

Minimum:
2

Maximum:
6

Scaling Metric:
Average CPU 70%

Availability Zones:
APP1
APP2
```

---

# 🗂️ Recommended Project Structure

```text
3-tier-project/
│
├── README.md
│
├── application-code/
│   │
│   ├── app-tier/
│   │   ├── index.js
│   │   ├── DbConfig.js
│   │   ├── package.json
│   │   └── ...
│   │
│   ├── web-tier/
│   │   ├── package.json
│   │   ├── src/
│   │   └── ...
│   │
│   └── nginx.conf
│
└── install.sh
```

---

# 🪣 S3 Application Code Structure

```text
s3://3-tier-project-demo-6pm/

application-code/
│
├── app-tier/
│
├── web-tier/
│
└── nginx.conf
```

---

# 🧪 Application Testing

## 1. Test App Server

From App Server:

```bash
curl http://localhost:4000/health
```

Expected:

```text
This is the health check
```

---

## 2. Check PM2

```bash
pm2 status
```

```bash
pm2 list
```

---

## 3. Check PM2 Logs

```bash
pm2 logs
```

---

## 4. Test RDS Connection

```bash
mysql -h my3tierdb.cdbmlufgqkjd.ap-south-1.rds.amazonaws.com -u admin -p
```

---

## 5. Test Database

```sql
USE webappdb;

SHOW TABLES;

SELECT * FROM transactions;
```

---

## 6. Test Nginx

```bash
sudo systemctl status nginx
```

---

## 7. Test Application Load Balancer

Verify:

```text
External ALB
    ↓
Web Target Group
    ↓
Web EC2 Instances
```

Then:

```text
External ALB
    ↓
Internal ALB
    ↓
App Target Group
    ↓
App EC2 Instances
```

---

# ✅ Final Architecture Checklist

## VPC

* [x] VPC created
* [x] CIDR `192.168.0.0/16`
* [x] 2 Availability Zones
* [x] 2 Public Subnets
* [x] 4 Private Subnets
* [x] NAT Gateway
* [x] Internet Gateway

## Security

* [x] WebALB-SG
* [x] Web-SG
* [x] AppALB-SG
* [x] App-SG
* [x] Database-SG

## Storage & IAM

* [x] Private S3 Bucket
* [x] IAM Role
* [x] SSM access

## Database

* [x] RDS MySQL
* [x] DB Subnet Group
* [x] Private Access
* [x] Database Security Group
* [x] Encryption enabled

## Application Tier

* [x] Amazon Linux 2023
* [x] Node.js
* [x] PM2
* [x] Application deployed
* [x] Port `4000`
* [x] `/health` endpoint
* [x] Internal ALB
* [x] App Target Group
* [x] App AMI
* [x] App Launch Template
* [x] App ASG

## Web Tier

* [x] Amazon Linux 2023
* [x] Nginx
* [x] Web application
* [x] External ALB
* [x] Web Target Group
* [x] Web AMI
* [x] Web Launch Template
* [x] Web ASG

## HTTPS & DNS

* [x] ACM Certificate
* [x] HTTPS Listener
* [x] Route 53
* [x] DNS → External ALB

---

# ☁️ AWS Services Used

```text
Amazon VPC
Amazon EC2
Amazon S3
AWS IAM
AWS Systems Manager
Amazon RDS
Application Load Balancer
Auto Scaling
AWS Certificate Manager
Amazon Route 53
NAT Gateway
Internet Gateway
Nginx
Node.js
PM2
```

---

# 🏆 Architecture Benefits

### 🔒 Secure

Private Application and Database tiers reduce direct internet exposure.

### 📈 Scalable

Auto Scaling Groups automatically maintain EC2 capacity based on the configured CPU target.

### ⚖️ Load Balanced

External ALB distributes web traffic and Internal ALB distributes application traffic.

### 🌎 Highly Available

Resources are distributed across two Availability Zones.

### 🗄️ Database Isolation

RDS is deployed in private database subnets.

### 🔐 HTTPS

ACM provides the SSL/TLS certificate used by the External ALB.

### 🌍 Custom Domain

Route 53 provides DNS routing to the application.

---

# 🔮 Future Enhancement

The original deployment notes also mention:

```text
Implement CloudFront
```

CloudFront can be added as a future enhancement in front of the application architecture.

---

# 📌 Important Production Notes

The deployment notes contain example database credentials and sample endpoints. Before publishing this README in a public GitHub repository:

1. Replace real credentials with placeholders.
2. Never commit passwords or secrets.
3. Use AWS Secrets Manager for database credentials.
4. Rotate any credential that has already been exposed.
5. Replace example ALB DNS names with the actual environment-specific DNS name.
6. Replace example domain names with your own domain.

---

# 🎯 Final Architecture

```text
                    ┌─────────────────────┐
                    │        USER         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      ROUTE 53       │
                    │        DNS          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        ACM          │
                    │     SSL / TLS       │
                    └──────────┬──────────┘
                               │
                         HTTPS :443
                               │
                               ▼
                 ┌──────────────────────────┐
                 │      EXTERNAL ALB        │
                 │    Internet Facing       │
                 └────────────┬─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
             ┌─────────────┐     ┌─────────────┐
             │   WEB-ASG   │     │   WEB-ASG   │
             │    AZ-1     │     │    AZ-2     │
             │   Nginx     │     │   Nginx     │
             └──────┬──────┘     └──────┬──────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │      INTERNAL ALB         │
                 │        Port :80           │
                 └────────────┬─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
             ┌─────────────┐     ┌─────────────┐
             │   APP-ASG   │     │   APP-ASG   │
             │    AZ-1     │     │    AZ-2     │
             │ Node.js:4000│     │ Node.js:4000│
             │    PM2      │     │    PM2      │
             └──────┬──────┘     └──────┬──────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                         MySQL :3306
                              │
                              ▼
                 ┌──────────────────────────┐
                 │       AMAZON RDS          │
                 │          MySQL            │
                 │      Private Subnets     │
                 └──────────────────────────┘
```

---

# 🚀 Project Summary

This project demonstrates a complete AWS **3-Tier Application Architecture** using separate Web, Application, and Database layers.

The architecture uses **Route 53 for DNS, ACM for HTTPS, External and Internal Application Load Balancers for traffic distribution, Auto Scaling Groups for scalability, private subnets for application/database isolation, S3 for application code storage, IAM/SSM for secure server access, and Amazon RDS MySQL for persistent database storage.**

```text
3-Tier Architecture
        +
Route 53
        +
ACM HTTPS
        +
External ALB
        +
Web Auto Scaling
        +
Internal ALB
        +
App Auto Scaling
        +
Amazon RDS MySQL
        =
Highly Available + Scalable + Secure AWS Architecture
```

---

# 👨‍💻 Deployment Flow

```text
1. Create VPC
2. Create Subnets
3. Create Internet Gateway
4. Create NAT Gateway
5. Create Security Groups
6. Create Private S3 Bucket
7. Create IAM Role
8. Create RDS MySQL
9. Configure Application Server
10. Configure Node.js + PM2
11. Create Internal ALB
12. Configure Web Server + Nginx
13. Create External ALB
14. Configure ACM Certificate
15. Configure HTTPS
16. Configure Route 53
17. Create App AMI
18. Create App Launch Template
19. Create App ASG
20. Create Web AMI
21. Create Web Launch Template
22. Create Web ASG
23. Test Application
24. Implement CloudFront
```

---

## ⭐ Result

```text
                 AWS 3-TIER APPLICATION
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
      WEB              APP              DB
      TIER              TIER            TIER
        │                │                │
    Auto Scaling     Auto Scaling       RDS
        │                │                │
      ALB              ALB             MySQL
        │                │                │
        └────────────────┴────────────────┘
                         │
                  Route 53 + ACM
                         │
                       HTTPS
```

**Production-style AWS 3-Tier Architecture — Highly Available, Scalable, Secure, and Load Balanced.**
