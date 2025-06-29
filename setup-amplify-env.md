# Amplify Environment Variables Setup Guide

## Required Environment Variables

### Frontend Variables (VITE_*)
Add these in Amplify Console > App Settings > Environment Variables:

```
VITE_API_KEY=your_firebase_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_measurement_id
VITE_API_URL=https://your-backend-url.com
```

### Backend Variables (if deploying backend)
```
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_notion_database_id
STRIPE_API_KEY=your_stripe_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
CLAUDE_API_KEY=your_claude_api_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Steps to Configure:

1. Go to AWS Amplify Console
2. Select your app
3. Go to "App settings" > "Environment variables"
4. Add each variable with the correct name and value
5. Save and redeploy

## Notes:
- Make sure to use the correct Firebase project credentials
- The VITE_* variables are for the frontend build
- Backend variables are only needed if you're deploying the backend with Amplify
- After adding environment variables, trigger a new build 