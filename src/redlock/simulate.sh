#!/bin/bash

# Send 10 concurrent /buy requests on the same product based on product ID, spread across all 3 instances
for i in {1..10}; do
  curl -s -X POST http://localhost:300$((RANDOM % 3 + 1))/$1/buy | jq &
done
wait