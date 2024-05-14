/**
 * This type describes the options that your connector expects to recieve
 * This could include username + password, host + port, etc
 * @typedef {Object} ConnectorOptions
 * @property {string} database
 * @property {string} outputBucket
 * @property {string} testTableName
 */

import { EvidenceType } from "@evidence-dev/db-commons";
import { AthenaClient, GetQueryExecutionCommand, GetQueryResultsCommand, StartQueryExecutionCommand } from "@aws-sdk/client-athena";

const client = new AthenaClient();

/**
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#options-specification
 * @see https://github.com/evidence-dev/evidence/blob/main/packages/postgres/index.cjs#L316
 */
export const options = {
  database: {
    title: "database",
    description:
      "AWS glue database to query",
    type: "string",
  },
  outputBucket: {
    title: "output_bucket",
    description:
      "AWS S3 Output bucket name for athena query",
    type: "string",
  },
  testTableName: {
    title: "test_table_name",
    description:
      "Name of a athena table name to do a test query (select first row) to validate the connection",
    type: "string",
  }
};

/**
 * Implementing this function creates a "simple" connector
 *
 * Each file in the source directory will be passed to this function, and it will return
 * either an array, or an async generator {@see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*}
 * that contains the query results
 *
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#simple-interface-arrays
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */
export const getRunner = (options) => {
  // This function will be called for EVERY file in the sources directory
  // If you are expecting a specific file type (e.g. SQL files), make sure to filter
  // to exclude others.

  // If you are using some local database file (e.g. a sqlite or duckdb file)
  // You may also need to filter that file out as well
  return async (queryText, queryPath) => {
    // Example output
    const output = {
      rows: [
        { someInt: 1, someString: "string" },
        { someInt: 2, someString: "string2" },
      ],
      columnTypes: [
        {
          name: "someInt",
          evidenceType: EvidenceType.NUMBER,
          typeFidelity: "inferred",
        },
        {
          name: "someString",
          evidenceType: EvidenceType.STRING,
          typeFidelity: "inferred",
        },
      ],
      expectedRowCount: 2,
    };

    throw new Error("Query Runner has not yet been implemented");
  };
};

async function waitForQueryCompletion(queryExecutionId) {
  while (true) {
    
    const command = new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId });
    const result = await client.send(command);
    const status = result.QueryExecution.Status.State;

    if (status === 'SUCCEEDED') {
      break;
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      throw new Error(`Query execution failed or was cancelled: ${queryExecutionId}`);
    }

    // Sleep for a few seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function getQueryResults(queryExecutionId) {
  const params = {
    QueryExecutionId: queryExecutionId
  };

  const command = new GetQueryResultsCommand(params);
  const result = await client.send(command);

  return result;
}

/**
 * Implementing this function creates an "advanced" connector
 *
 *
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#advanced-interface-generator-functions
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async (options) => {
  const query = `SELECT * FROM ${options.testTableName} LIMIT 1`;

  // Define parameters for query execution
  const params = {
    QueryString: query,
    QueryExecutionContext: {
      Database: options.database
    },
    ResultConfiguration: {
      OutputLocation: 's3://' + options.outputBucket
    }
  };

  try {
    // Execute the query
    const command = new StartQueryExecutionCommand(params);
    const response = await client.send(command);
    const queryExecutionId = response.QueryExecutionId;

    // Wait for query to complete
    await waitForQueryCompletion(queryExecutionId);

    console.log('Connection to table is working.');
    return true;
  } catch (error) {
    console.error('Error validating table connection:', error);
    return false;
  };
};
