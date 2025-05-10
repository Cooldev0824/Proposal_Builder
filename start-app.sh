#!/bin/bash

# Start the server in the background
cd "$(dirname "$0")/server" && node index.js &
SERVER_PID=$!

# Start the frontend
cd "$(dirname "$0")" && npm run dev

# When the frontend is stopped, also stop the server
kill $SERVER_PID
