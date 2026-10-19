# omni.document-template

Which versions of this document template exist, and which is active?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.document-template --org <org> --name Quote_Template
```

## Parameters

- name: name, e.g. Quote_Template

## Steps

### versions

```sql
SELECT Name, Type, VersionNumber, IsActive, Status, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM DocumentTemplate WHERE Name = '{name}' ORDER BY VersionNumber DESC
```

## Verdicts

- When versions.rows === 0: No document template {name}.
- Otherwise: {name}: {versions.rows} version(s).

## Usage

0 logged run(s).

