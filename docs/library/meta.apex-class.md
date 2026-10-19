# meta.apex-class

Which version of this Apex class is on the org, and who built and last changed it?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.apex-class --org <org> --name AccountTriggerHandler
```

## Parameters

- name: name, e.g. AccountTriggerHandler

## Steps

### apex

```sql
SELECT Name, ApiVersion, Status, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, LengthWithoutComments, Body FROM ApexClass WHERE Name = '{name}'
```

## Verdicts

- When apex.rows === 0: No class named {name} on this org.
- Otherwise: {name} is present. Compare the Body hash across orgs, not the dates.

## Traps

- LastModifiedDate can read hours stale after a deploy. The Body hash is the reliable comparison.
- On a deploy target, CreatedBy is the deployer and CreatedDate the deploy date. Read authorship on the org where it was built.

## Usage

0 logged run(s).

