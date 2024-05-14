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

Open the [schema explorer](http://localhost:3000/explore/schema) to see the new tables imported.

For more information see the [Evidence.dev datasource docs](https://docs.evidence.dev/core-concepts/data-sources/)


## Configuration 

| Field         | Description                                                                                  | Type   |
|---------------|----------------------------------------------------------------------------------------------|--------|
| database      | AWS glue database to query                                                                   | string |
| outputBucket  | AWS S3 Output bucket name for athena query                                                   | string |
| testTableName | Name of a athena table name to do a test query (select first row) to validate the connection | string |