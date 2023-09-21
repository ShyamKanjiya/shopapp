# Use an official Node.js runtime as a parent image with version 16
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose a port if your Node.js application listens on a specific port
EXPOSE 3000

# Define the command to start your Node.js application
CMD ["node", "app.js"]