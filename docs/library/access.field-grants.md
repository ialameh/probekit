# access.field-grants

Who can read and edit this field, and is that access assigned to the user?

- Family: access
- Writes: no
- Orgs: any
- Rule: Check access before code: grants, then assignment, then page visibility.

## Run

```
probe run access.field-grants --org <org> --obj Account --field Industry
```

## Parameters

- obj: sobject, e.g. Account
- field: field, e.g. Industry
- user: username, optional, e.g. jane.doe@example.com

## Steps

### grants

```sql
SELECT Parent.Name, Parent.IsOwnedByProfile, Parent.Profile.Name, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE SobjectType = '{obj}' AND Field = '{obj}.{field}' ORDER BY Parent.Name
```

### field_exists (Tooling API)

Runs when: `grants.rows === 0`

```sql
SELECT QualifiedApiName, DataType FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = '{obj}' AND QualifiedApiName = '{field}'
```

### assignments

Runs when: `user !== undefined`

```sql
SELECT PermissionSet.Name, PermissionSet.IsOwnedByProfile, PermissionSetGroup.DeveloperName FROM PermissionSetAssignment WHERE Assignee.Username = '{user}'
```

## Verdicts

- When field_exists.rows === 0: {obj}.{field} does not exist on this org.
- When grants.rows === 0: {obj}.{field} exists, but nothing grants access to it. Raise with the permissions owner.
- When assignments.rows > 0 && overlap(grants.col('Parent.Name'), assignments.col('PermissionSet.Name')) === 0: Grants exist, but none is assigned to {user}. Raise with the permissions owner.
- When assignments.rows > 0: {user} holds a grant on {obj}.{field}. Next check page, component and record-type visibility.
- Otherwise: {grants.rows} permission set(s) or profile(s) carry a grant. Pass --user to check one person.

## Traps

- describe is filtered by field access: a field you cannot see reads as missing. Prove existence with FieldDefinition.
- Profile grants appear here as a permission set with IsOwnedByProfile true.
- A permission set deploy replaces the whole set, it does not add to it.

## Usage

0 logged run(s).

