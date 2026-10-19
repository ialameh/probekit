# meta.org

Which org is this: name, type, instance, sandbox or production?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.org --org <org> 
```

## Parameters

None.

## Steps

### org

```sql
SELECT Id, Name, OrganizationType, InstanceName, IsSandbox, TrialExpirationDate, NamespacePrefix, LanguageLocaleKey, TimeZoneSidKey FROM Organization LIMIT 1
```

## Verdicts

- When org.records[0].IsSandbox: This is a sandbox: {= org.records[0].Name} on {= org.records[0].InstanceName}.
- Otherwise: This is PRODUCTION: {= org.records[0].Name} on {= org.records[0].InstanceName}.

## Traps

- The platform release is not here; read it from /services/data on the instance.

## Usage

0 logged run(s).

