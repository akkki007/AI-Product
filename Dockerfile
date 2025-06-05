FROM node:18-alpine

WORKDIR /app

# Install dependencies separately for better caching
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Expose and run
EXPOSE 3000
CMD ["npm", "start"]