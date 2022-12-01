const sdk = require('aws-sdk');
const crypto = require('crypto');

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

const passphrase = "cryptographyishard";
const keyPair = crypto.generateKeyPairSync('rsa', { 
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase
    }
});


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
            const request = getBatchUpdateRequest();

            // get 100 records from the database
            const parms = {
                TableName: tableName,
                Limit: 100
            };

            const records = await client.scan(parms).promise()
            
            records.Items.forEach(record => {
                record.public.S = 'signer';

                const signature = crypto.publicEncrypt({
                    key: keyPair.publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: "sha256",
                }, Buffer.from(record.message.S)).toString();
                record.signature.S = signature;
                addUpdateRequest(request, record);
            });

            console.log(request);

            await client.batchWriteItem(request).promise();

            return;
        } catch (error) {
            console.log(error);
            throw error;
        }
};
