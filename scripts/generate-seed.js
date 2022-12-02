// generate faker seed

const { faker } = require("@faker-js/faker")
const fs = require('fs');

const seed = (totalRecords, batchSize) => {

    const batches = Math.ceil(totalRecords / batchSize);

    for (let i = 0; i < batches; i++) {
        const payload = { "messages-staging": [] };
        for (let j = 0; j < batchSize; j++) {
            payload["messages-staging"].push(
                {
                    PutRequest: {
                        Item: {
                            "guid": {
                                "S": faker.datatype.uuid()
                            },
                            "message": {
                                "S": faker.lorem.paragraph()
                            },
                            "public": {
                                "S": ""
                            },
                            "signature": {
                                "S": ""
                            }
                        }
                    }
                });
        }

        console.log("batch:", i, "size:", payload["messages-staging"].length)
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

seed(100, 25)