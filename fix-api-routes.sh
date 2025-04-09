#!/bin/bash

# This script updates all API route files to use Promise-based params for Next.js 15 compatibility

# Process one file at a time
process_file() {
  local file=$1
  echo "Processing $file..."
  
  # Check if the file has a params parameter with a non-Promise type
  if grep -q "{ params }: { params: { [a-zA-Z0-9]\+: string " "$file"; then
    echo "  Updating params type in $file"
    
    # First, capture the param name
    param_name=$(grep -o "params: { \([a-zA-Z0-9]\+\): string" "$file" | sed -E 's/params: \{ ([a-zA-Z0-9]+): string.*/\1/')
    
    if [ -n "$param_name" ]; then
      echo "  Found param name: $param_name"
      
      # Replace the params type with Promise-based type
      sed -i '' "s/{ params }: { params: { $param_name: string }/{ params }: { params: Promise<{ $param_name: string }> }/g" "$file"
      
      # Update code to unwrap the params Promise
      # First, check if there's a line extracting the param from params
      if grep -q "const { $param_name } = params" "$file"; then
        # Replace the extraction with unwrapping code
        sed -i '' "/const { $param_name } = params/c\\
    // Unwrap the params Promise\\
    const unwrappedParams = await params;\\
    const { $param_name } = unwrappedParams;" "$file"
      else
        # Add the unwrapping code after the params type
        sed -i '' "/{ params }: { params: Promise<{ $param_name: string }>/a\\
  try {\\
    // Unwrap the params Promise\\
    const unwrappedParams = await params;\\
    const { $param_name } = unwrappedParams;" "$file"
      fi
      
      # Replace direct params access with the variable name
      sed -i '' "s/params.$param_name/$param_name/g" "$file"
      
      echo "  Updated $file"
    else
      echo "  Could not determine param name in $file"
    fi
  else
    echo "  No params to update in $file"
  fi
}

# Find all directories with dynamic route parameters
find src/app/api -path "*\[*" -type d | while read dir; do
  # Look for route files in these directories
  for route_file in "$dir/route.ts" "$dir/route.js"; do
    if [ -f "$route_file" ]; then
      process_file "$route_file"
    fi
  done
done

echo "All API route files processed." 