/* Script for migrating DynamoDB data from one table to another in a different account or region */

const AWS = require('aws-sdk');

const sourceDynamoDB = new AWS.DynamoDB({ /* Source AWS account credentials */
  region: '', /* AWS Region */
  credentials: {
    accessKeyId: '', /* Access key ID */
    secretAccessKey: '', /* Secret Access Key */
    sessionToken: '', /* Session Token */
  },
});

const destinationDynamoDB = new AWS.DynamoDB({ /* Destination AWS account credentials */
  region: '', /* AWS Region */
  credentials: {
    accessKeyId: '', /* Access key ID */
    secretAccessKey: '', /* Secret Access Key */
    sessionToken: '', /* Session Token */
  },
});

const sourceTable = ''; /* Source table name */
const destinationTable = ''; /* Destination table name */

let unprocessedItems = 0;

/**
 * Function to scan a table
 * @param {String} tableName Table name
 * @param {String} lastKey The ast evaluated key to result the next results from
 * @returns {Promise<AWS.DynamoDB.ScanOutput>}
 */
const scanItems = (tableName, lastKey) => new Promise((resolve, reject) => {
  sourceDynamoDB.scan({
    TableName: tableName,
    ExclusiveStartKey: lastKey,
  }, (err, data) => {
    if (err) {
      console.error('An error occurred while fetching all items');
      return reject(err);
    }
    return resolve(data);
  });
});

/**
 * Function to scan for all items of a DynamoDB table
 * @param {String} tableName Table name
 * @returns {Promise<Object[]>}
 */
const fetchAllItems = async (tableName) => {
  let lastKey = null;
  let iteration = 1;
  let count = 0;
  const itemLists = [];
  do {
    console.log('Scan Iteration number:', iteration);
    const response = await scanItems(tableName, lastKey);
    itemLists.push(response.Items);
    lastKey = response.LastEvaluatedKey;
    iteration += 1;
    count += response.Items.length;
    console.log('Entries fetched:', count);
  } while (lastKey);
  console.log('Fetched all items from table.');
  console.log(`Total entries fetched: ${count}`);
  return itemLists;
};

/**
 * Function to make a batch write call to a dynamoDb table
 * @param {String} tableName Table name
 * @param {AWS.DynamoDB.BatchWriteItemInput} params The parameters to send to dynamodb batch write call.
 * @returns {Promise<AWS.DynamoDB.BatchWriteItemRequestMap>}
 */
const batchWrite = (tableName, params) => new Promise((resolve, reject) => {
  destinationDynamoDB.batchWriteItem(params, (err, data) => {
    if (err) {
      console.error('An error occurred in batch write call');
      return reject(err);
    }
    if (Object.keys(data.UnprocessedItems).length) {
      unprocessedItems += data.UnprocessedItems[tableName].length;
    }
    return resolve(data.UnprocessedItems);
  });
});

/**
 * Function to add a delay
 * @param {Number} ms The number of milliseconds to delay.
 * @returns {Promise<>}
 */
const delay = ms => new Promise((resolve) => {
  setTimeout(() => resolve(), ms);
});

/**
 * Main function to perform all operations
 */
const main = async () => {
  console.log(`Fetching all items from table ${sourceTable}`);
  const itemLists = await fetchAllItems(sourceTable);
  let promiseArray = [];
  console.log(`Sending batch requests to add items to table ${destinationTable}`);
  itemLists.forEach((list) => {
    // Looping over all items to create batches of 25 and sending them to batch write call
    const chunk = 25;
    for (let index = 0; index < list.length; index += chunk) {
      const slicedList = list.slice(index, index + chunk);
      // Formatting items for the format that batch write command expects
      const formattedItems = slicedList.map(item => ({ PutRequest: { Item: item } }));
      const params = { RequestItems: {} };
      params.RequestItems[destinationTable] = formattedItems;
      promiseArray.push(batchWrite(destinationTable, params));
    }
  });
  console.log('Total batch calls sent:', promiseArray.length);
  let results = await Promise.all(promiseArray);
  console.log('Number of unprocessed items:', unprocessedItems);
  // Checking if there are any unprocessed items and sending calls again for them with an exponential backoff algorithm
  if (unprocessedItems) {
    console.log('Sending calls on unprocessed items with an exponential backoff algorithm');
    let iterations = 1;
    let timeout = 1000;
    do {
      promiseArray = [];
      console.log('Iteration number:', iterations);
      unprocessedItems = 0;
      console.log(`Waiting for ${timeout / 1000} seconds`);
      await delay(timeout);
      console.log('Sending call to add items');
      for (let index = 0; index < results.length; index += 1) {
        if (results[index] && Object.keys(results[index]).length) {
          promiseArray.push(batchWrite(destinationTable, { RequestItems: results[index] }));
        }
      }
      results = await Promise.all(promiseArray);
      timeout *= 2;
      iterations += 1;
      console.log('Unprocessed Items after batch call:', unprocessedItems);
    } while (unprocessedItems);
    console.log('All batch calls completed');
  }
  console.log(`All items added to ${destinationTable} table successfully`);
};

main().catch((err) => {
  console.error('An error occurred while running the process\n', err);
});
