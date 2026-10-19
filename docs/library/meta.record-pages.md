# meta.record-pages

Which Lightning record pages exist for this object?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.record-pages --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### entity

```sql
SELECT DurableId FROM EntityDefinition WHERE QualifiedApiName = '{obj}'
```

### pages (Tooling API)

Runs when: `entity.rows === 1`

```sql
SELECT DeveloperName, MasterLabel, Type FROM FlexiPage WHERE EntityDefinitionId IN ({@entity.DurableId}) ORDER BY DeveloperName
```

## Verdicts

- When entity.rows === 0: No object {obj}.
- Otherwise: {obj}: {pages.rows} Lightning page(s).

## Traps

- Which page a user sees is set by app, record type and profile activation; retrieve the page and its activations to answer that.
- A page built with Dynamic Forms ignores page layout field changes.

## Usage

0 logged run(s).

