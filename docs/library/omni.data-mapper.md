# omni.data-mapper

What does this Data Mapper read and write, and is it the same across orgs?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.data-mapper --org <org> --name DRExtractAccount
```

## Parameters

- name: name, e.g. DRExtractAccount

## Steps

### mapper

```sql
SELECT Id, Name, Type, VersionNumber, IsActive, InputType, OutputType, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM OmniDataTransform WHERE Name = '{name}'
```

### items

Runs when: `mapper.rows > 0`

```sql
SELECT InputObjectName, InputFieldName, OutputObjectName, OutputFieldName, FilterOperator, FilterValue, FormulaExpression, IsDisabled FROM OmniDataTransformItem WHERE OmniDataTransformationId IN ({@mapper.Id}) ORDER BY OutputObjectName, OutputFieldName
```

## Verdicts

- When mapper.rows === 0: No Data Mapper {name}.
- Otherwise: {name}: {items.rows} mapping item(s).

## Traps

- In an extract filter, an unquoted $Vlocity.NULL on "=" silently skips the whole query. Quote it.

## Usage

0 logged run(s).

