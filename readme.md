# Amazon DynamoDB Data Migration Tool

This tool can be used to migrate data from one DynamoDB table to another in a different AWS account or region without needing any other services like S3.

The tool has been developed by [Xgrid](http://xgrid.co/) in collaboration with [copebit AG](https://www.copebit.ch/en/home/).

The tool performs DB insert operations asynchronously to reduce time for migration of tables with large number of items. The tool has been tested with a table containing approximately 200,000 items with average item size of 150 bytes. The script took around 6 minutes to execute to migrate data from this table.

## Prerequisites

- Install NodeJs and NPM from the [official site](https://nodejs.org/en/download/).

- Run `npm install` in the folder to install the required modules.

- AWS IAM credentials for source and destination accounts with appropriate permissions to perform read and write operations on the relevant DynamoDB tables are required.

## Configuration

- Edit the `main.js` file and enter values for `region`, `accessKeyId`, `secretAccessKey` and `sessionToken` in blocks for `sourceDynamoDB` and `destinationDynamoDB`.

```

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

```

- If credentials are configured in AWS config then comment out the relevant parameters. For example if the credentials for the source AWS account are configured in AWS config then comment out or remove the credentials block for `sourceDynamoDb` as shown below:

```

const sourceDynamoDB = new AWS.DynamoDB({ /* Source AWS account credentials */
  region: '', /* AWS Region */
  // credentials: {
  //   accessKeyId: '', /* Access key ID */
  //   secretAccessKey: '', /* Secret Access Key */
  //  sessionToken: '', /* Session Token */
  // },
});

```

- Add source and destination DynamoDB table names in the values for the `sourceTable` and `destinationTable` variables respectively.

```

const sourceTable = '<Source table name>'; /* Source table name */
const destinationTable = '<Destination table name>'; /* Destination table name */

```

## Usage

- Start the script using: `node main.js`


## To do

 - [ ] Create module for the script that can be passed the required parameters.
 - [ ] Create CLI tool for the module.
 - [ ] Create and publish NPM package.
 - [ ] Optimize the script to further reduce execution time.
 - [ ] Add unit and lint tests.

## License

Use of this source code is governed by the Apache v2.0 license that can be found in the LICENSE file.

## Issues

For any issues create a new issue in the issues section of the repository or send an email to this address: `aahmad@xgrid.co`.