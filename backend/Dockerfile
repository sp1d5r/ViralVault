# Use Node.js 20 Lambda base image
FROM public.ecr.aws/lambda/nodejs:20

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install pnpm
RUN npm install -g pnpm@latest

# Copy source code
COPY shared ./shared
COPY backend ./backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package first
RUN cd shared && pnpm run build

# Build backend
RUN cd backend && pnpm run build

# Prepare Lambda deployment
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy both built files
RUN cp -r backend/dist/* ./
RUN mkdir -p ./shared/src/config
RUN cp -r shared/dist/* ./shared/src/config/

# Fresh install of production dependencies
RUN rm -rf node_modules
RUN cp backend/package.json ./
RUN pnpm install --prod --no-frozen-lockfile

# Clean up unnecessary files
RUN rm -rf backend pnpm-workspace.yaml package.json

# Set the handler
CMD [ "index.handler" ]