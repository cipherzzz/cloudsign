# seed local dynamodb with test data
aws dynamodb batch-write-item --request-items file://seed.json --endpoint-url http://localhost:8000