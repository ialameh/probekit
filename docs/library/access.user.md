# access.user

Who is this user: profile, role, licence, active or frozen, permission sets and licences?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.user --org <org> --user jane.doe@example.com
```

## Parameters

- user: username, e.g. jane.doe@example.com

## Steps

### user

```sql
SELECT Id, Username, Name, IsActive, UserType, Profile.Name, UserRole.Name, Profile.UserLicense.Name, LastLoginDate, CreatedDate FROM User WHERE Username = '{user}'
```

### frozen

Runs when: `user.rows === 1`

```sql
SELECT UserId, IsFrozen FROM UserLogin WHERE UserId IN ({@user.Id})
```

### assignments

Runs when: `user.rows === 1`

```sql
SELECT PermissionSet.Name, PermissionSet.Label, PermissionSetGroup.DeveloperName, ExpirationDate FROM PermissionSetAssignment WHERE Assignee.Username = '{user}' AND PermissionSet.IsOwnedByProfile = false ORDER BY PermissionSet.Name
```

### licences

Runs when: `user.rows === 1`

```sql
SELECT PermissionSetLicense.DeveloperName, PermissionSetLicense.MasterLabel FROM PermissionSetLicenseAssign WHERE Assignee.Username = '{user}' ORDER BY PermissionSetLicense.DeveloperName
```

## Verdicts

- When user.rows === 0: No user {user} on this org. Sandbox usernames carry a suffix.
- When user.records[0].IsActive === false: {user} is inactive.
- When frozen.records.some(r => r.IsFrozen): {user} is frozen.
- Otherwise: {user}: {= user.records[0]["Profile.Name"]}, {assignments.rows} permission set(s), {licences.rows} licence(s).

## Traps

- A sandbox refresh rewrites usernames, so the same person has a different username per org.

## Usage

0 logged run(s).

