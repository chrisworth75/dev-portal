FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js ./
COPY public ./public
COPY postman-collections ./postman-collections

# Expose port 9000
EXPOSE 9000

# Start the server
CMD ["npm", "start"]
