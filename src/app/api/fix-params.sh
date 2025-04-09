#!/bin/bash

# Find all API route files with params in square brackets
find src/app/api -name "route.ts" -o -name "route.js" | xargs grep -l "params: { params: { " | while read file; do
  echo "Updating $file"
  
  # Update params type to use Promise
  sed -i '' 's/{ params }: { params: { \([a-zA-Z0-9]*\): string }/{ params }: { params: Promise<{ \1: string }> }/g' "$file"
  
  # Add necessary code to unwrap the params Promise
  sed -i '' '/params }: { params: Promise<{/a\\
  try {\
    // Unwrap the params Promise\
    const unwrappedParams = await params;\
    const { \1 } = unwrappedParams;\
    ' "$file"
  
  # Replace direct params access with unwrapped variable
  sed -i '' 's/const { \([a-zA-Z0-9]*\) } = params;//' "$file"
  sed -i '' "s/params\.\([a-zA-Z0-9]*\)/\1/g" "$file"
done

echo "All route files updated to use Promise-based params." 