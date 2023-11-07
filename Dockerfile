# Use the official Ubuntu base image
FROM ubuntu:latest

# Set the working directory in the container to /jetpack
WORKDIR /jetpack

# Update and install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    build-essential \
    git # Install git

# Install Node.js v20.x (including npm)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Clone the specific GitHub repository into the working directory
RUN git clone https://github.com/nodriza-io/prolibu-jetpack.git .

# Install nodemon globally
RUN npm install -g nodemon

# Install app dependencies
# Assumes package.json is in the root of the cloned repository
RUN npm install

# Expose port 3000
EXPOSE 3000
