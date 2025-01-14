#!/bin/bash

# Check if a file path is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path-to-env-file>"
    exit 1
fi

ENV_FILE="$1"

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: File $ENV_FILE does not exist"
    exit 1
fi

# Prompt for stack name
read -p "Enter stack name: " STACK_NAME

# Validate stack name is not empty
if [ -z "$STACK_NAME" ]; then
    echo "Error: Stack name cannot be empty"
    exit 1
fi

# Read .env file and process each line
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi

    # Extract key and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"

        # Remove any surrounding quotes from the value
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"

        # Convert key to lowercase
        key_lower=$(echo "$key" | tr '[:upper:]' '[:lower:]')

        # Create SSM parameter
        echo "Creating parameter /${STACK_NAME}/${key_lower}"
        aws ssm put-parameter \
            --name "/${STACK_NAME}/${key_lower}" \
            --value "$value" \
            --type "SecureString" \
            --overwrite

        # Check if the command was successful
        if [ $? -eq 0 ]; then
            echo "✓ Successfully uploaded /${STACK_NAME}/${key_lower}"
        else
            echo "✗ Failed to upload /${STACK_NAME}/${key_lower}"
        fi
    fi
done < "$ENV_FILE"

echo "Finished processing $ENV_FILE"