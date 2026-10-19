# meta.layouts

Which page layouts does this object have, and which profile gets which?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.layouts --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### entity

```sql
SELECT DurableId FROM EntityDefinition WHERE QualifiedApiName = '{obj}'
```

### layouts (Tooling API)

Runs when: `entity.rows === 1`

```sql
SELECT Name, LayoutType, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM Layout WHERE TableEnumOrId IN ({@entity.DurableId}) ORDER BY Name
```

### assignments (Tooling API)

Runs when: `entity.rows === 1`

```sql
SELECT Profile.Name, Layout.Name, RecordType.Name FROM ProfileLayout WHERE TableEnumOrId IN ({@entity.DurableId}) ORDER BY Profile.Name LIMIT 2000
```

## Verdicts

- When entity.rows === 0: No object {obj}.
- Otherwise: {obj}: {layouts.rows} layout(s), {assignments.rows} assignment(s).

## Traps

- A record page built with Dynamic Forms ignores the layout's fields; check meta.record-pages first.

## Usage

0 logged run(s).

