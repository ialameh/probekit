# access.permset

What is this permission set: licence, type, key system permissions, and how much does it grant?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.permset --org <org> --permset Sales_Operations
```

## Parameters

- permset: name, e.g. Sales_Operations

## Steps

### ps

```sql
SELECT Id, Name, Label, Type, License.Name, IsCustom, NamespacePrefix, PermissionsModifyAllData, PermissionsViewAllData, PermissionsApiEnabled, PermissionsCustomizeApplication, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM PermissionSet WHERE Name = '{permset}'
```

### objects

Runs when: `ps.rows === 1`

```sql
SELECT SobjectType, PermissionsRead, PermissionsEdit, PermissionsDelete FROM ObjectPermissions WHERE ParentId IN ({@ps.Id}) ORDER BY SobjectType
```

### fields

Runs when: `ps.rows === 1`

```sql
SELECT Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE ParentId IN ({@ps.Id}) ORDER BY Field
```

## Verdicts

- When ps.rows === 0: No permission set {permset}.
- When ps.records[0].PermissionsModifyAllData: {permset} grants Modify All Data.
- Otherwise: {permset}: {objects.rows} object grant(s), {fields.rows} field grant(s).

## Traps

- Run on two orgs to see grant drift; a permission set deploy replaces the whole set, so drift here is what a deploy would overwrite.

## Usage

0 logged run(s).

