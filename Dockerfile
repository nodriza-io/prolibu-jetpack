# USAGE:

# docker build -t jetpack .
# docker run -it --name jetpack -p 3000:3000 -v "$(pwd)/accounts:/jetpack/accounts" jetpack /bin/bash

# Use the Node.js official image with your desired version and Ubuntu as base
FROM node:20.6.1-buster

# Set the working directory in the container to /jetpack
WORKDIR /jetpack

# Install git and other dependencies you might need
RUN apt-get update && apt-get install -y \
    git \
    build-essential

# Install nodemon globally
RUN npm install -g nodemon

# Expose port 3000
EXPOSE 3000