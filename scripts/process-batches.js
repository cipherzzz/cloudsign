const sdk = require('aws-sdk');
const constants = require('./constants');
const lruKeys = require('./lru-keys');

const dynamo = new sdk.DynamoDB({ apiVersion: '2012-08-10' });
var sqs = new sdk.SQS({ apiVersion: '2012-11-05' });

async function processBatch(batchSize, lastGUID) {

    const keyId = lruKeys.getNextKey();

    console.log(`Processing batch of ${batchSize} records - starting at ${JSON.stringify(lastGUID)} with keyId ${keyId}`);

    const job = {
        batchSize,
        public: keyId,
        lastGUID: lastGUID
    };
    await sqs.sendMessage({
        QueueUrl: constants.QUEUE_URL,
        MessageBody: JSON.stringify(job)
    }).promise();
}

async function processBatches(batchSize) {

    if (batchSize > constants.TOTAL_RECORDS || batchSize <= 0) {
        throw new Error(`Batch size ${batchSize} is an invalid value`);
    }

    let lastGUID = null;

    // process first batch
    await processBatch(batchSize, lastGUID);

    // populate the first starting point
    const params = {
        TableName: constants.TABLE_NAME,
        Limit: batchSize,
        FilterExpression: "signed = :signed",
        ExpressionAttributeValues: {
            ":signed": { "BOOL": false }
        }
    };
    const data = await dynamo.scan(params).promise();
    lastGUID = data.LastEvaluatedKey;

    while (lastGUID) {

        await processBatch(batchSize, lastGUID);

        const params = {
            TableName: constants.TABLE_NAME,
            Limit: batchSize,
            ExclusiveStartKey: lastGUID,
            FilterExpression: "signed = :signed",
            ExpressionAttributeValues: {
                ":signed": { "BOOL": false }
            }
        };

        const data = await dynamo.scan(params).promise();
        lastGUID = data.LastEvaluatedKey;
    }
}


processBatches(constants.BATCH_SIZE).then(() => {
    console.log('done');
});



