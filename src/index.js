/**
 * This type describes the options that your connector expects to recieve
 * This could include username + password, host + port, etc
 * @typedef {Object} ConnectorOptions
 * @property {string} database
 * @property {string} catalog
 * @property {string} outputBucket
 * @property {string} testTableName
 */

import { AthenaClient, GetQueryExecutionCommand, GetQueryResultsCommand, StartQueryExecutionCommand } from "@aws-sdk/client-athena";
import { EvidenceType, TypeFidelity } from "@evidence-dev/db-commons";

const client = new AthenaClient();

export const options = {
  database: {
    title: "database",
    description:
      "AWS glue database to query",
    type: "string",
  },
  catalog: {
    title: "catalog",
    description:
      "AWS Athena catalog to use for the query, defaults to AWSDataCatalog",
    type: "string",
    default: "AWSDataCatalog"
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
  
  let allRows = [];
  let nextToken = null;
  let resultSetMetadata = null;

  do {
    if (nextToken) {
      params.NextToken = nextToken;
    }

    const command = new GetQueryResultsCommand(params);
    const response = await client.send(command);

    if (!resultSetMetadata) {
      resultSetMetadata = response.ResultSet.ResultSetMetadata;
    }

    allRows = allRows.concat(response.ResultSet.Rows);
    nextToken = response.NextToken;
  } while (nextToken);

  return {
    rows: allRows,
    resultSetMetadata: resultSetMetadata
  };
}


const mapAthenaTypeToEvidenceType = column => {
  let type;
  switch (column.Type) {
    case 'boolean':
      type = EvidenceType.BOOLEAN;
      break;
    case 'tinyint':
    case 'smallint':
    case 'int':
    case 'integer':
    case 'bigint':
    case 'double':
    case 'float':
    case 'real':
      type = EvidenceType.NUMBER;
      break;
    case 'date':
    case 'timestamp':
      type = EvidenceType.DATE;
      break;
    case 'string':
    case 'char':
    case 'varchar':
      type = EvidenceType.STRING;
      break;
    case 'array':
      type = EvidenceType.ARRAY;
      break;
    case 'map':
      type = EvidenceType.MAP;
      break;
    case 'struct':
      type = EvidenceType.STRUCT;
      break;
    case 'decimal':
      type = EvidenceType.DECIMAL;
      break;
    case 'binary':
      type = EvidenceType.BINARY;
      break;
    default:
      type = EvidenceType.STRING; // Default to STRING for unrecognized types
  }
  console.log(column.Name, type)
  return { name: column.Name, evidenceType: type, typeFidelity: TypeFidelity.PRECISE };
};

// Function to map query results to the specified format
function mapQueryResults(queryResults) {
  const columns = queryResults.resultSetMetadata.ColumnInfo;
  const rows = queryResults.rows.slice(1); // Exclude header row

  const mappedRows = rows.map(row => {
    const mappedRow = {};
    row.Data.forEach((data, index) => {
      const columnName = columns[index].Name;
      mappedRow[columnName] = data.VarCharValue; // Assuming all data types are strings for simplicity
    });
    return mappedRow;
  });

  const columnTypes = columns.map(column =>  mapAthenaTypeToEvidenceType(column));

  const output = {
    rows: mappedRows,
    columnTypes: columnTypes,
    expectedRowCount: mappedRows.length
  };

  return output;
}

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
  return async (queryText, queryPath) => {
    console.log(queryPath)
    const params = {
      QueryString: queryText,
      QueryExecutionContext: {
        Database: options.database,
        Catalog: options.catalog,
      },
      ResultConfiguration: {
        OutputLocation: 's3://' + options.outputBucket
      }
    };

    try {
      const command = new StartQueryExecutionCommand(params);
      const response = await client.send(command);
      const queryExecutionId = response.QueryExecutionId;

      // Wait for query to complete
      await waitForQueryCompletion(queryExecutionId);

      const queryResults = await getQueryResults(queryExecutionId);

      // Map the query results to the desired format
      const output = mapQueryResults(queryResults);

      for (const row of output.rows) {
        for (const column of output.columnTypes) {
					if (column.evidenceType === 'date') {
						row[column.name] = new Date(row[column.name]);
					}
				}
      }

      return output
    } catch (error) {
      console.error('Error executing query:', error);
    }
  };
};

/**
 * Implementing this function creates an "advanced" connector
 *
 *
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#advanced-interface-generator-functions
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async (options) => {
  const query = `SELECT * FROM "${options.testTableName}" LIMIT 1`;

  // Define parameters for query execution
  const params = {
    QueryString: query,
    QueryExecutionContext: {
      Database: options.database,
      Catalog: options.catalog,
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

    return true;
  } catch (error) {
    console.error('Error validating table connection:', error);
    return false;
  };
};
