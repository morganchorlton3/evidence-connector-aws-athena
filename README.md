# Evidence Athena DataSource

Evidence data source to vizualize and explore your AWS Athena data.

## How to use

Install this package into your Evidence project

```
npm i evidence-connector-aws-athena
```

Update your **evidence.plugins.yaml**

```
datasources:
    # ...
    evidence-connector-aws-athena: {}
```

Run your Evidence project, and navigate to the [settings page](http://localhost:3000/settings), and add a new athena data source.

or add it manually by creating a new dir with the source name and adding the connection.yaml

```yaml
name: {name}
type: athena
options:
  database: {database}
  outputBucket: {outputBucket}
  testTableName: {testTableName}
```

Open the [schema explorer](http://localhost:3000/explore/schema) to see the new tables imported.

For more information see the [Evidence.dev datasource docs](https://docs.evidence.dev/core-concepts/data-sources/)

## Configuration

| Field         | Description                                                                                   | Type   |
|---------------|-----------------------------------------------------------------------------------------------|--------|
| database      | AWS glue database to query                                                                    | string |
| catalog       | AWS Athena catalog to use for the query, defaults to AWSDataCatalog                           | string |
| workgroup     | AWS Athena workgroup to use for the query, defaults to primary                                | string |
| outputBucket  | AWS S3 Output bucket name for athena query                                                    | string |
| testTableName | Name of a athena table name to do a test query (select first row) to validate the connection  | string |

## Source Configuration
