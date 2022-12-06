const sdk = require('aws-sdk');
//const crypto = require('crypto');

const ddbOptions = {
    apiVersion: '2012-08-10'
};

if (process.env.AWS_SAM_LOCAL) {
    ddbOptions.endpoint = new sdk.Endpoint('http://dynamodb:8000')
}

if (process.env.E2E_TEST) {
    ddbOptions.endpoint = new sdk.Endpoint('http://localhost:8000')
}

const client = new sdk.DynamoDB(ddbOptions);
const tableName = process.env.TABLE;


// function mockGetKeyPairFromSecretsManager(publicKey) {
//     const passphrase = "cryptographyishard";
//     const keyPair = crypto.generateKeyPairSync('rsa', {
//         modulusLength: 2048,
//         publicKeyEncoding: {
//             type: 'spki',
//             format: 'pem'
//         },
//         privateKeyEncoding: {
//             type: 'pkcs8',
//             format: 'pem',
//             cipher: 'aes-256-cbc',
//             passphrase
//         }
//     });
//     return keyPair;
// }


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
        //const keyPair = mockGetKeyPairFromSecretsManager(public);
        const request = getBatchUpdateRequest();

        params = {
            TableName: tableName,
            Limit: batchSize,
            // ExclusiveStartKey: {
            //     "guid": { "S": lastGUID}
            // },
        };

        console.log(`Processing batch of ${batchSize} records - starting at ${JSON.stringify(lastGUID)} with keyId ${public}`)

        const records = await client.scan(params).promise()
        console.log(`Found ${records.Items.length} records to sign`);

        records.Items.forEach(record => {

            // const signature = crypto.publicEncrypt({
            //     key: keyPair.publicKey,
            //     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            //     oaepHash: "sha256",
            // }, Buffer.from(record.message.S)).toString();

            record.signature.S = "static signature";
            record.public.S = public;
            record.signed.BOOL = true;

            addUpdateRequest(request, record);

        });

        await client.batchWriteItem(request).promise();

        return;
    } catch (error) {
        console.log(error);
        throw error;
    }
};
