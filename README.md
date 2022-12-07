# Cloudsign
An aws serverless app using sqs/lambda/dynamodb to cryptographically sign data in batches

## Architecture
The app is composed of a single lambda function that is triggered by an sqs queue. The lambda function is responsible for signing data in batches and storing the signed data in a dynamodb table. The batch process is handled by a node script that is run locally.





## SETUP

### Local DB setup
You don't have to do this if you don't want to test locally

```sh
# Create local docker network
docker network create cipherz-network

# Run local dynamodb container in the network
docker run -d --network cipherz-network -v "$PWD":/dynamodb_local_db -p 8000:8000 \
    --network-alias=dynamodb --name dynamodb \
    amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb

# Create the following table in the local DynamoDB
aws dynamodb create-table --table-name messages-staging \
    --attribute-definitions AttributeName=guid,AttributeType=S \
    --key-schema AttributeName=guid,KeyType=HASH \
    --endpoint-url http://localhost:8000 \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Check previous step ran successfully
aws dynamodb list-tables --endpoint-url http://localhost:8000
aws dynamodb describe-table --table-name messages-staging --endpoint-url http://localhost:8000
aws dynamodb scan --table messages-staging --endpoint-url http://localhost:8000

```
### Local lambda setup
```sh
# Run local lambda
TABLE=messages-staging sam local invoke "PutMessageFunction" -e events/sqs_event_message.json  --docker-network cipherz-network

# check if record was inserted in local dynamodb
aws dynamodb scan --table messages-staging --endpoint-url http://localhost:8000


```


### Deploy via SAM CLI
```
# Create a bucket to hold deploy artifacts if it doesn't exist
aws s3 mb s3://cipherz-bucket

# Package the application and generate the cloudformation template
sam package --s3-bucket cipherz-bucket --s3-prefix cipherz --output-template-file out.yml

# Deploy the application/stack
sam deploy --template-file out.yml --stack-name cipherz-stack --parameter-overrides ParameterKey=Environment,ParameterValue=staging --capabilities CAPABILITY_IAM

# delete stack
sam delete --stack-name cipherz-stack

```

### Seed DB
```
# Generate records
# Note scripts/constants.js
cd scripts && node generate-seed.js

# Seed DB
./seed.sh
```

### Process Batch Signins
```
# Run batch signing process
node process-batches.js
```

### Helpers
aws dynamodb scan --table messages-staging || --endpoint-url http://localhost:8000

aws sqs send-message --queue-url "https://sqs.us-east-1.amazonaws.com/666449929814/message-events-staging" --message-body "{\"batchSize\":25,\"public\":\"b2489ec4-8484-4b63-b266-cb011354e65e\",\"lastGUID\":\"c4476385-c210-4bd6-bd50-271c38048487\"}"