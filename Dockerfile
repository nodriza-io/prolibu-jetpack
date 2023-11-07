# USAGE: docker build -t jetpack .

# Use the Node.js official image with your desired version and Ubuntu as base
FROM node:20.6.1-buster

# Set the working directory in the container to /jetpack
WORKDIR /jetpack

# Install git and other dependencies you might need
RUN apt-get update && apt-get install -y \
    git \
    build-essential

# Clone the specific GitHub repository into the working directory
RUN git clone https://github.com/nodriza-io/prolibu-jetpack.git .

# Install nodemon globally
RUN npm install -g nodemon

# Install app dependencies
# Assumes package.json is in the root of the cloned repository
RUN npm install

# Expose port 3000
EXPOSE 3000
