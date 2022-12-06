const BATCH_SIZE = 25;
const TOTAL_RECORDS = 100;
const TABLE_NAME = "messages-staging";
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/666449929814/message-events-staging';

module.exports = {
    BATCH_SIZE,
    TOTAL_RECORDS,
    TABLE_NAME,
    QUEUE_URL
};