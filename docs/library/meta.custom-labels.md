# meta.custom-labels

Which custom labels match this name or text?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.custom-labels --org <org> 
```

## Parameters

- name: name, optional, e.g. Error_Required
- text: text, optional, e.g. required

## Steps

### labels (Tooling API)

```sql
SELECT Name, Value, Language, NamespacePrefix FROM ExternalString WHERE Name != null [[AND Name = '{name}']] [[AND Value LIKE '%{text}%']] ORDER BY Name LIMIT 200
```

## Verdicts

- When labels.rows === 0: No labels matched.
- Otherwise: {labels.rows} label(s) matched.

## Traps

- Pass --text to find where a message shown to a user comes from.

## Usage

0 logged run(s).

