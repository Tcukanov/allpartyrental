#!/bin/bash

# Find all .ts and .js files that import authOptions from the old location
FILES=$(grep -l "from '@/app/api/auth/\[...nextauth\]/route'" $(find src -name "*.ts" -o -name "*.js"))

# For each file, replace the import path
for file in $FILES; do
  echo "Updating $file"
  sed -i '' "s|from '@/app/api/auth/\[...nextauth\]/route'|from '@/lib/auth/auth-options'|g" "$file"
done

# Handle relative imports
REL_FILES=$(grep -l "from '../../auth/\[...nextauth\]/route'" $(find src -name "*.ts" -o -name "*.js"))
for file in $REL_FILES; do
  echo "Updating relative import in $file"
  sed -i '' "s|from '../../auth/\[...nextauth\]/route'|from '@/lib/auth/auth-options'|g" "$file"
done

REL_FILES=$(grep -l "from '../../../auth/\[...nextauth\]/route'" $(find src -name "*.ts" -o -name "*.js"))
for file in $REL_FILES; do
  echo "Updating relative import in $file"
  sed -i '' "s|from '../../../auth/\[...nextauth\]/route'|from '@/lib/auth/auth-options'|g" "$file"
done

REL_FILES=$(grep -l "from '../auth/\[...nextauth\]/route'" $(find src -name "*.ts" -o -name "*.js"))
for file in $REL_FILES; do
  echo "Updating relative import in $file"
  sed -i '' "s|from '../auth/\[...nextauth\]/route'|from '@/lib/auth/auth-options'|g" "$file"
done

echo "All imports updated." 