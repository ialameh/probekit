# meta.lwc

Is this Lightning web component the same across orgs, file by file?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.lwc --org <org> --name accountSummary
```

## Parameters

- name: name, e.g. accountSummary

## Steps

### bundle (Tooling API)

```sql
SELECT Id, DeveloperName, MasterLabel, ApiVersion, IsExposed, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM LightningComponentBundle WHERE DeveloperName = '{name}'
```

### files (Tooling API)

Runs when: `bundle.rows === 1`

```sql
SELECT FilePath, Format, LastModifiedDate, Source FROM LightningComponentResource WHERE LightningComponentBundleId IN ({@bundle.Id}) ORDER BY FilePath
```

## Verdicts

- When bundle.rows === 0: No component {name}.
- Otherwise: {name}: {files.rows} file(s).

## Usage

0 logged run(s).

