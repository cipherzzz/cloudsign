# seed local dynamodb with test data

# local dynamodb
# aws dynamodb batch-write-item --request-items file://scripts/seed.json --endpoint-url http://localhost:8000

# remote dynamodb
# aws dynamodb batch-write-item --request-items file://$f

#!/bin/bash
# NOTE : Quote it else use array to avoid problems #
FILES="data/*"
for f in $FILES
do
  echo "Processing $f file..."
  aws dynamodb batch-write-item --request-items file://$f --endpoint-url http://localhost:8000
done