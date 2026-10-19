# access.permset-holders

Who holds this permission set or permission set group?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.permset-holders --org <org> --permset Sales_Operations
```

## Parameters

- permset: name, e.g. Sales_Operations
- limit: int, default 500, e.g. 500

## Steps

### holders

```sql
SELECT Assignee.Name, Assignee.Username, Assignee.IsActive, PermissionSet.Name, PermissionSetGroup.DeveloperName, ExpirationDate FROM PermissionSetAssignment WHERE PermissionSet.Name = '{permset}' OR PermissionSetGroup.DeveloperName = '{permset}' ORDER BY Assignee.Name LIMIT {limit}
```

## Verdicts

- When holders.rows === 0: Nobody holds {permset}, or no permission set or group has that name.
- Otherwise: {holders.rows} assignment(s), {= holders.records.filter(r => r["Assignee.IsActive"]).length} to active users.

## Traps

- A user given a group appears once per permission set inside the group.

## Usage

0 logged run(s).

