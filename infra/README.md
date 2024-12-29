# Serverless Backend Template

This template sets up a serverless Express.js backend using AWS Lambda, API Gateway, and ECR, deployed with Pulumi.

## Prerequisites

- AWS Account
- Pulumi Account
- Node.js 20+
- PNPM
- Python 3.11+
- Docker

## Initial Setup

1. **Update Project Names**
   Replace "monorepo-example" in these files:
   ```bash
   # infra/Pulumi.yaml
   name: your-project-name

   # infra/__main__.py
   name="your-project-name"

   # .github/workflows/deploy.yaml
   ECR_REPOSITORY: your-project-name-backend
   stack-name: your-project-name
   ```

2. **Configure AWS Credentials**
   ```bash
   aws configure
   # Or set up these environment variables:
   # AWS_ACCESS_KEY_ID
   # AWS_SECRET_ACCESS_KEY
   # AWS_REGION
   ```

3. **Configure Pulumi**
   ```bash
   pulumi login
   # Get your PULUMI_ACCESS_TOKEN from Pulumi dashboard
   ```

4. **Set up Environment Variables**
   Create these SSM parameters in AWS:
   ```bash
   # Replace your-project-name with your actual project name
   aws ssm put-parameter --name "/your-project-name/notion_api_key" --value "your-value" --type SecureString
   aws ssm put-parameter --name "/your-project-name/notion_database_id" --value "your-value" --type SecureString
   aws ssm put-parameter --name "/your-project-name/stripe_api_key" --value "your-value" --type SecureString
   aws ssm put-parameter --name "/your-project-name/firebase_project_id" --value "your-value" --type SecureString
   aws ssm put-parameter --name "/your-project-name/firebase_client_email" --value "your-value" --type SecureString
   aws ssm put-parameter --name "/your-project-name/firebase_private_key" --value "your-value" --type SecureString
   ```

5. **GitHub Secrets**
   Add these secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `PULUMI_ACCESS_TOKEN`

## Local Development

1. **Install Dependencies**
   ```bash
   cd backend
   pnpm install
   ```

2. **Run Locally**
   ```bash
   pnpm run dev
   ```

## Deployment

The backend deploys automatically on pushes to main that change files in:
- `backend/**`
- `infra/**`
- `.github/workflows/deploy.yaml`

You can also trigger a manual deployment from the GitHub Actions tab.

## Infrastructure Details

- **AWS Lambda**: Runs the Express.js application
- **API Gateway**: Handles HTTP routing
- **ECR**: Stores Docker images
- **SSM**: Stores environment variables securely

## Adding New Environment Variables

1. Add the variable name to `infra/__main__.py`:
   ```python
   environment_vars=[
       "NEW_VARIABLE",
       # ... existing variables
   ]
   ```

2. Add the parameter to AWS SSM:
   ```bash
   aws ssm put-parameter \
       --name "/your-project-name/new_variable" \
       --value "your-value" \
       --type SecureString
   ```

## Monitoring & Logs

- View Lambda logs in CloudWatch Logs
- Monitor API Gateway metrics in CloudWatch Metrics
- Check deployment status in GitHub Actions

## Common Issues

1. **Docker Build Fails**: Ensure Docker daemon is running and you have sufficient permissions
2. **Pulumi Deploy Fails**: Check AWS credentials and Pulumi token
3. **Lambda Cold Start**: First request might be slow; subsequent requests will be faster

## Security Notes

- All environment variables are stored in AWS SSM as SecureString
- API Gateway endpoints are public by default
- Consider adding authentication/authorization as needed