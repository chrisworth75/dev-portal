FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY public ./public

# Create postman-collections directory
# Collections are populated by Jenkins build stage
RUN mkdir -p postman-collections

# Copy collections if they exist (using wildcard that may match nothing)
COPY postman-collections/ ./postman-collections/

# Expose port 9000
EXPOSE 9000

# Start the server
CMD ["npm", "start"]
