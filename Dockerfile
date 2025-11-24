# File: Dockerfile

########## Stage 1: Builder ##########
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (caching layer)
COPY package*.json ./

# Install all dependencies (including devDependencies) for building
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the NestJS application (TypeScript -> dist)
RUN npm run build


########## Stage 2: Development Runner ##########
FROM node:22-alpine AS runner

# Set environment
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies (Without devDependencies)
RUN npm ci --omit=dev

# Copy built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
