#!/bin/bash

# Create extension directory structure
mkdir -p extension

# Copy required files
cp ../manifest.json extension/
cp ../content.js extension/
cp ../background.js extension/
cp ../config.js extension/
cp -r ../assets extension/
cp -r ../popup extension/
cp -r ../services extension/

# Remove any development files
rm -rf extension/**/.DS_Store
rm -rf extension/**/*.map

# Create ZIP file
cd extension
zip -r ../linkedin-roast-v1.0.0.zip .
cd ..

echo "Package created: linkedin-roast-v1.0.0.zip" 