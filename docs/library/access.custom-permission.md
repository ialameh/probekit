# access.custom-permission

Which permission sets grant this custom permission, and who holds them?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.custom-permission --org <org> --name Approve_Discounts
```

## Parameters

- name: name, e.g. Approve_Discounts

## Steps

### perm

```sql
SELECT Id, DeveloperName, MasterLabel FROM CustomPermission WHERE DeveloperName = '{name}'
```

### grants

Runs when: `perm.rows === 1`

```sql
SELECT ParentId, Parent.Name, Parent.IsOwnedByProfile, Parent.Profile.Name FROM SetupEntityAccess WHERE SetupEntityId IN ({@perm.Id}) ORDER BY Parent.Name
```

### holders

Runs when: `grants.rows > 0`

```sql
SELECT Assignee.Name, Assignee.Username, PermissionSet.Name FROM PermissionSetAssignment WHERE PermissionSetId IN ({@grants.ParentId}) AND Assignee.IsActive = true ORDER BY Assignee.Name LIMIT 500
```

## Verdicts

- When perm.rows === 0: No custom permission {name}.
- When grants.rows === 0: {name} exists but nothing grants it.
- Otherwise: {name}: {grants.rows} grant(s), {holders.rows} active holder(s).

## Usage

0 logged run(s).

