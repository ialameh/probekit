# access.permset-group

What is inside this permission set group, and has it finished recalculating?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.permset-group --org <org> --group Sales_Team
```

## Parameters

- group: name, e.g. Sales_Team

## Steps

### grp

```sql
SELECT Id, DeveloperName, MasterLabel, Status, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM PermissionSetGroup WHERE DeveloperName = '{group}'
```

### components

Runs when: `grp.rows === 1`

```sql
SELECT PermissionSet.Name, PermissionSet.Label FROM PermissionSetGroupComponent WHERE PermissionSetGroup.DeveloperName = '{group}' ORDER BY PermissionSet.Name
```

## Verdicts

- When grp.rows === 0: No permission set group {group}.
- When grp.records[0].Status !== 'Updated': {group} status is {= grp.records[0].Status}: grants are not final until it reads Updated.
- Otherwise: {group} holds {components.rows} permission set(s) and is up to date.

## Traps

- A muting permission set in the group removes grants; it appears here as a component.

## Usage

0 logged run(s).

