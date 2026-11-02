# CloudStay

CloudStay is a property booking and rental management web application built for the DDAC group project.

## Tech Stack

- Frontend: React + Vite
- Backend: ASP.NET Core Web API (.NET 8)
- Database: PostgreSQL
- Development DB: NeonDB
- Cloud Deployment: AWS EC2 / Elastic Beanstalk
- Future Cloud Services: S3, Lambda, API Gateway, SNS/SQS, CloudWatch

## Project Structure

```txt
cloudstay/
├── client/
├── server/
└── docs/


To initiate Server:

cd server
dotnet ef database update
dotnet run

If dotnet ef is missing:
dotnet tool install --global dotnet-ef
dotnet ef database update

///////////////////////////////////////
To initate Client:
cd client 
npm run build
npm run lint
npm run dev





To use S3, first must add these credentials in cd server:

{
$env:AWS_ACCESS_KEY_ID="..."
$env:AWS_SECRET_ACCESS_KEY="..."
$env:AWS_SESSION_TOKEN="..."
}

These credentials are inserted each time the server is started in powershell, the credentials are obtained in AWS Learner Lab, in AWS Details.

dotnet run
