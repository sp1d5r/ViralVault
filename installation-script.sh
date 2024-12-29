#!/bin/bash

# Install dependencies in the root directory
echo "Installing root dependencies..."
npm install

# Navigate to the frontend directory and install dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Navigate back to the root and then to the backend directory
echo "Installing backend dependencies..."
cd ../backend
npm install

# Return to the root directory
cd ..

echo "Installation complete!"