# meta.static-resource

Is this static resource the same across orgs?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.static-resource --org <org> --name AppStyles
```

## Parameters

- name: name, e.g. AppStyles

## Steps

### res

```sql
SELECT Name, ContentType, BodyLength, CacheControl, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM StaticResource WHERE Name = '{name}'
```

## Verdicts

- When res.rows === 0: No static resource {name}.
- Otherwise: {name}: {= res.records[0].BodyLength} bytes, {= res.records[0].ContentType}.

## Traps

- Equal BodyLength does not prove equal content. Retrieve both copies and diff when it matters.

## Usage

0 logged run(s).

