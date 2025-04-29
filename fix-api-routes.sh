#!/bin/bash

# Script to fix Next.js API route parameters using the correct destructuring format

# Find all API route files
find src/app/api -type f -name "*.ts" | while read -r file; do
  echo "Checking $file..."
  
  # 1. Fix any route using 'context: { params: ... }' format (incorrect)
  if grep -q "context: { params: { [a-zA-Z0-9]\+: string }" "$file"; then
    echo "Fixing incorrect context parameter format in $file"
    sed -i '' 's/context: { params: { \([a-zA-Z0-9]*\): string }/{ params }: { params: { \1: string }/g' "$file"
  fi
      
  # 2. Fix any context.params.id usage (incorrect)
  if grep -q "const [a-zA-Z0-9]\+ = context\.params\.[a-zA-Z0-9]\+;" "$file"; then
    echo "Fixing incorrect context.params access in $file"
    sed -i '' 's/const \([a-zA-Z0-9]*\) = context\.params\.\([a-zA-Z0-9]*\);/const \1 = params.\2;/g' "$file"
  fi
  
  # 3. Fix Promise variants with context (incorrect)
  if grep -q "context: { params: Promise<{ [a-zA-Z0-9]\+: string }>" "$file"; then
    echo "Fixing incorrect Promise context format in $file"
    sed -i '' 's/context: { params: Promise<{ \([a-zA-Z0-9]*\): string }>/{ params }: { params: Promise<{ \1: string }>/g' "$file"
      fi
      
  # 4. Fix Promise parameter access with context (incorrect)
  if grep -q "const [a-zA-Z0-9]\+ = (await context\.params)\.[a-zA-Z0-9]\+;" "$file"; then
    echo "Fixing incorrect Promise context.params access in $file"
    sed -i '' 's/const \([a-zA-Z0-9]*\) = (await context\.params)\.\([a-zA-Z0-9]*\);/const \1 = (await params).\2;/g' "$file"
  fi
done

echo "Done!" 