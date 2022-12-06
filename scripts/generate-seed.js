const constants =  require('./constants');

const { faker } = require("@faker-js/faker")
const fs = require('fs');

const seed = (totalRecords, batchSize) => {

    const batches = Math.ceil(totalRecords / batchSize);
    const tableName = constants.TABLE_NAME;

    for (let i = 0; i < batches; i++) {
        const payload = {}
        payload[tableName] = []
        for (let j = 0; j < batchSize; j++) {
            payload[tableName].push(
                {
                    PutRequest: {
                        Item: {
                            "guid": {
                                "S": faker.datatype.uuid()
                            },
                            "message": {
                                "S": faker.lorem.sentence()
                            },
                            "public": {
                                "S": ""
                            },
                            "signature": {
                                "S": ""
                            },
                            "signed": {
                                "BOOL": false
                            }
                        }
                    }
                });
        }

        console.log("batch:", i, "size:", payload[tableName].length)
        const fileName = `./data/seed-${i}-of-${batches}.json`;
        fs.writeFile(fileName, JSON.stringify(payload, null, 2), (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log(fileName, ' created');
            }
        });
    }
}

seed(constants.TOTAL_RECORDS, constants.BATCH_SIZE)