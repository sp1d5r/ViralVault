# Backend Service

This backend service is part of our monorepo structure, designed to work seamlessly with the frontend while sharing common types and utilities.

## Directory Structure

```
backend/
├── src/
│   ├── config/ (any configuration files needed)
│   ├── controllers/ (any logic used in the endpoints are here)
│   │   ├── articleController.ts
│   │   └── userController.ts
│   ├── routes/ ()
│   │   ├── articleRoutes.ts
│   │   └── userRoutes.ts
│   ├── services/ (Backend specific business logic, for shared functionality use /shared directory)
│   │   ├── notionService.ts
│   │   └── databaseService.ts
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── utils/
│   │   └── logger.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

### Key Directories and Files

- `src/`: Contains all the source code for the backend service.
  - `config/`: Configuration files for various services and databases.
  - `controllers/`: Handle the logic for each route, processing requests and sending responses.
  - `routes/`: Define API endpoints and link them to controllers.
  - `services/`: Contain business logic and interactions with external services or databases.
  - `middleware/`: Custom middleware functions for Express.
  - `utils/`: Utility functions and helpers used across the backend.
  - `app.ts`: The main application file that sets up the Express server.

- `.env`: Environment variables (not committed to version control).
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

## Shared Types and Utilities

This backend service uses shared types and utilities from our monorepo's shared directory. These are imported as an npm package, ensuring consistency between frontend and backend.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up your `.env` file with necessary environment variables. In this instance it includes blog information see section below:

3. Run the development server:
   ```
   npm run dev
   ```

4. For production, build and start:
   ```
   npm run build
   npm start
   ```

## Adding New Features

When adding new features:
1. Create appropriate controllers in `src/controllers/`.
2. Define new routes in `src/routes/`.
3. Implement business logic in `src/services/`.
4. Update `src/app.ts` to include new routes if necessary.

Remember to use shared types from the shared npm package when defining data structures used across frontend and backend.

## Testing

[Add information about your testing setup and how to run tests]

## Deployment

[Add information about your deployment process]


# Adding to SEO Articles

For SEO we're using Notion as our CMS, this handles all the articles created and hosts them. 

### Step 1 - Get your access token

Follow the official integration guide.

1) Go to https://www.notion.com/my-integrations.
2) Click the + New integration button.
3) Give your integration a name, for example My Gatsby Website.
4) Select the workspace where you want this plugin to get content from.
5) Click Submit to create the integration.
6) Copy the Internal Integration Token on the next page and export it to the NOTION_API_KEY environment variable.

### Step 2 - Creating a Notion database

Just create a new full page database and it will open a new page with the database. For the table schema it should look like this;
```
| Name | Slug | Description | Tags | Published | Date |
```

Now hit '...' and then add a new connection being the integration you made.

### Step 3 - Connecting this db to backend

When you hit share you'll see a URL like this

```
https://www.notion.so/XXXXXXXXXXXXXXXXXXXXXX?v=YYYYYYYYYYYYY&pvs=Z
```

That first `XXXXXXXXXXXXXXXXXXXXXX` is your database ID so update your NOTION_DATABASE_ID in the README.md.

