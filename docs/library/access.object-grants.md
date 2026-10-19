# access.object-grants

Which profiles and permission sets grant access to this object, and at what level?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.object-grants --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account

## Steps

### grants

```sql
SELECT Parent.Name, Parent.IsOwnedByProfile, Parent.Profile.Name, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords FROM ObjectPermissions WHERE SobjectType = '{obj}' ORDER BY Parent.Name
```

## Verdicts

- When grants.rows === 0: Nothing grants access to {obj}.
- Otherwise: {grants.rows} profile(s) or permission set(s) grant access to {obj}.

## Traps

- Profile grants appear as a permission set with IsOwnedByProfile true.

## Usage

0 logged run(s).

