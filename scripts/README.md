# Testing Scripts

This directory contains scripts for testing and managing test data in the All Party Rent application.

## Available Scripts

### `list-providers.js`

Lists all provider users in the database, showing their email addresses and basic information.

**Usage:**
```
node scripts/list-providers.js
```

Use this script to find a provider email address to use with the `create-test-services.js` script.

### `create-test-services.js`

Creates a set of test services for a specified provider. The services will be created with random properties and metadata for testing filters and search functionality.

**Configuration:**
Before running this script, open it and set the following variables in the configuration section:
- `NUMBER_OF_SERVICES`: How many test services to create (default: 10)
- `PROVIDER_EMAIL`: Email of the provider to create services for (use `list-providers.js` to find this)
- `SERVICE_NAME_PREFIX`: Prefix for service names (default: "Test Service")

**Usage:**
```
node scripts/create-test-services.js
```

### `delete-test-services.js`

Deletes test services created with the `create-test-services.js` script. This script will safely delete all dependencies (offers, transactions, etc.) to avoid foreign key constraint errors.

**Configuration:**
Before running, you can edit the following variables in the script:
- `TEST_SERVICE_PREFIX`: The prefix used when creating test services (default: "Test Service")
- `PROMPT_FOR_CONFIRMATION`: Whether to ask for confirmation before deleting (default: true)

**Usage:**
```
node scripts/delete-test-services.js
```

## Testing Workflow

1. Run `list-providers.js` to find a provider email to use
2. Update the `PROVIDER_EMAIL` in `create-test-services.js`
3. Run `create-test-services.js` to create test services
4. Test your application with the newly created data
5. When done, run `delete-test-services.js` to clean up

## Other Useful Scripts

### `create-initial-filters.js`

Creates category filters for the "Soft play" category. This script should be run first if you want to test filter functionality, as it sets up the filter definitions.

**Usage:**
```
node scripts/create-initial-filters.js
``` 