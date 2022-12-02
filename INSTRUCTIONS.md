# Cloudsign
An aws serverless app using sqs/lambda/dynamodb to cryptographically sign data in batches

## SETUP

### Local DB setup
You don't have to do this if you don't want to test locally

```sh
# Create local docker network
docker network create aws-local

# Run local dynamodb container in the network
docker run -d --network aws-local -v "$PWD":/dynamodb_local_db -p 8000:8000 \
    --network-alias=dynamodb --name dynamodb \
    amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb

# Create the following table in the local DynamoDB
aws dynamodb create-table --table-name messages \
    --attribute-definitions AttributeName=guid,AttributeType=S \
    --key-schema AttributeName=guid,KeyType=HASH \
    --endpoint-url http://localhost:8000 \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Check previous step ran successfully
aws dynamodb list-tables --endpoint-url http://localhost:8000
aws dynamodb describe-table --table-name books --endpoint-url http://localhost:8000

```
### Local lambda setup
```sh
# Run local lambda
TABLE=messages sam local invoke "PutBookFunction" -e events/sqs_event_message.json  --docker-network aws-local

# check if record was inserted in local dynamodb
aws dynamodb scan --table messages --endpoint-url http://localhost:8000


```


### Deploy via SAM CLI
```
# Create a bucket to hold deploy artifacts if it doesn't exist
aws s3 mb s3://cipherz-bucket

# Package the application and generate the cloudformation template
sam package --s3-bucket cipherz-bucket --s3-prefix cipherz --output-template-file out.yml

# Deploy the application/stack
sam deploy --template-file out.yml --stack-name cipherz-stack --parameter-overrides ParameterKey=Environment,ParameterValue=staging --capabilities CAPABILITY_IAM


aws dynamodb scan --table books --endpoint-url http://localhost:8000

aws sqs send-message --queue-url "https://sqs.us-east-1.amazonaws.com/666449929814/message-events-staging" --message-body "{\"batchSize\": 100,\"public\":\"publickey0\",\"lastGUID\":\"080cee5c-66d5-4a00-bea7-4b6523ba39aa\"}"