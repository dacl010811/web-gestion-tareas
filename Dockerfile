# Dockerfile for the landing page application
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]