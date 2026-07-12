FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (better-sqlite3 will use prebuilt glibc binaries)
RUN npm install

# Copy the rest of the server source code
COPY . .

# The backend runs on port 5000
EXPOSE 5000

# Start the application using the start script
CMD ["npm", "start"]
