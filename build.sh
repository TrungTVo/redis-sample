echo "Building and packaging the project..."

# Build the TypeScript code, it will create dist/ folder with the compiled JavaScript code
npx tsc

echo "Done. Output is in dist/ folder"