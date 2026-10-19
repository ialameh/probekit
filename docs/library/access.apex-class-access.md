# access.apex-class-access

Which profiles and permission sets may run this Apex class?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.apex-class-access --org <org> --name AccountService
```

## Parameters

- name: name, e.g. AccountService

## Steps

### cls

```sql
SELECT Id, Name FROM ApexClass WHERE Name = '{name}'
```

### grants

Runs when: `cls.rows === 1`

```sql
SELECT Parent.Name, Parent.IsOwnedByProfile, Parent.Profile.Name FROM SetupEntityAccess WHERE SetupEntityId IN ({@cls.Id}) ORDER BY Parent.Name
```

## Verdicts

- When cls.rows === 0: No class {name}.
- When grants.rows === 0: {name} exists but no profile or permission set grants it.
- Otherwise: {grants.rows} profile(s) or permission set(s) grant {name}.

## Traps

- Class access matters for Apex called from the UI (Aura, LWC, Visualforce); triggers and system-context calls ignore it.

## Usage

0 logged run(s).

