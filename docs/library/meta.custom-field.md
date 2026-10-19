# meta.custom-field

Who created and last changed this custom field?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.custom-field --org <org> --obj Account --name Region
```

## Parameters

- obj: sobject, e.g. Account
- name: field, e.g. Region

## Steps

### entity

```sql
SELECT DurableId FROM EntityDefinition WHERE QualifiedApiName = '{obj}'
```

### field (Tooling API)

Runs when: `entity.rows === 1`

```sql
SELECT Id, DeveloperName, TableEnumOrId, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM CustomField WHERE TableEnumOrId IN ({@entity.DurableId}) AND DeveloperName = '{name}'
```

## Verdicts

- When entity.rows === 0: No object {obj}.
- When field.rows === 0: No custom field {name} on {obj}. Give the name without __c.
- Otherwise: {obj}.{name}__c created by {= field.records[0]["CreatedBy.Name"]}.

## Traps

- DeveloperName has no __c suffix.
- On an org the field was deployed to, CreatedBy is the deployer. Read authorship on the org where it was built.

## Usage

0 logged run(s).

