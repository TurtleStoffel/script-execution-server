# Script Execution Server

This is a simple Node.js backend using Express. It exposes an API endpoint to start a script, accepting a single string argument.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node index.js
   ```

## API

### POST /start-script
- **Body:** `{ "argument": "<string>" }`
- **Description:** Starts a script with the provided string argument.

## Example
```
curl -X POST http://localhost:3000/start-script -H "Content-Type: application/json" -d '{"argument": "hello world"}'
```
