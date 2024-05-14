/**
 * This type describes the options that your connector expects to recieve
 * This could include username + password, host + port, etc
 * @typedef {Object} ConnectorOptions
 * @property {string} SomeOption
 */

import { EvidenceType } from "@evidence-dev/db-commons";

/**
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#options-specification
 * @see https://github.com/evidence-dev/evidence/blob/main/packages/postgres/index.cjs#L316
 */
export const options = {
  SomeOption: {
    title: "Some Option",
    description:
      "This object defines how SomeOption should be displayed and configured in the Settings UI",
    type: "string", // options: 'string' | 'number' | 'boolean' | 'select' | 'file'
  },
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
  console.debug(`SomeOption = ${options.SomeOption}`);

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

// Uncomment to use the advanced source interface
// This uses the `yield` keyword, and returns the same type as getRunner, but with an added `name` and `content` field (content is used for caching)
// sourceFiles provides an easy way to read the source directory to check for / iterate through files
// /** @type {import("@evidence-dev/db-commons").ProcessSource<ConnectorOptions>} */
// export async function* processSource(options, sourceFiles, utilFuncs) {
//   yield {
//     title: "some_demo_table",
//     content: "SELECT * FROM some_demo_table", // This is ONLY used for caching
//     rows: [], // rows can be an array
//     columnTypes: [
//       {
//         name: "someInt",
//         evidenceType: EvidenceType.NUMBER,
//         typeFidelity: "inferred",
//       },
//     ],
//   };
//   yield {
//     title: "some_demo_table",
//     content: "SELECT * FROM some_demo_table", // This is ONLY used for caching
//     rows: async function* () {}, // rows can be a generator function for returning batches of results (e.g. if an API is paginated, or database supports cursors)
//     columnTypes: [
//       {
//         name: "someInt",
//         evidenceType: EvidenceType.NUMBER,
//         typeFidelity: "inferred",
//       },
//     ],
//   };

//  throw new Error("Process Source has not yet been implemented");
// }

/**
 * Implementing this function creates an "advanced" connector
 *
 *
 * @see https://docs.evidence.dev/plugins/creating-a-plugin/datasources#advanced-interface-generator-functions
 * @type {import("@evidence-dev/db-commons").GetRunner<ConnectorOptions>}
 */

/** @type {import("@evidence-dev/db-commons").ConnectionTester<ConnectorOptions>} */
export const testConnection = async (opts) => {
  throw new Error("Connection test has not yet been implemented");
};
