const sdk = require('aws-sdk');

const ddbOptions = {
    apiVersion: '2012-08-10'
};

if (process.env.AWS_SAM_LOCAL) {
    ddbOptions.endpoint = new sdk.Endpoint('http://dynamodb:8000')
}

if (process.env.E2E_TEST) {
    ddbOptions.endpoint = new sdk.Endpoint('http://localhost:8000')
}

const kms = new sdk.KMS();
const client = new sdk.DynamoDB(ddbOptions);
const tableName = process.env.TABLE;


async function sign(keyId, message) {
    const params = {
        KeyId: keyId,
        Message: message,
        SigningAlgorithm: 'ECDSA_SHA_256',
        MessageType: 'RAW'
    };

    const data = await kms.sign(params).promise();
    return data.Signature.toString('base64');
}


function getBatchUpdateRequest() {

    return {
        RequestItems: {
            [tableName]: []
        }
    };
}

function addUpdateRequest(request, record) {
    request.RequestItems[tableName].push({
        PutRequest: {
            Item: record
        }
    });
}


exports.handler = async event => {
    try {
        const job = JSON.parse(event.Records[0].body);
        const { batchSize, public, lastGUID } = job;
        let request = getBatchUpdateRequest();

        params = {
            TableName: tableName,
            Limit: batchSize,
            // ExclusiveStartKey: {
            //     "guid": { "S": lastGUID }
            // },
        };

        console.log(`Processing batch of ${batchSize} records - starting at ${JSON.stringify(lastGUID)} with keyId ${public}`)

        const records = await client.scan(params).promise()
        console.log(`Found ${records.Items.length} records to sign`);

        // records.Items.forEach(async record => {

        //     record.signature.S = await sign(public, record.message.S);
        //     record.public.S = public;
        //     record.signed.BOOL = true;

        //     addUpdateRequest(request, record);

        // });

        for(let i=0; i<records.Items.length; i++) {
            const record = records.Items[i];
            record.signature.S = await sign(public, record.message.S);
            record.public.S = public;
            record.signed.BOOL = true;

            addUpdateRequest(request, record);
        }

        await client.batchWriteItem(request).promise();

        return;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
