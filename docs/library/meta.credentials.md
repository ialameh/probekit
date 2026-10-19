# meta.credentials

Which named and external credentials exist, and what do they point at?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.credentials --org <org> 
```

## Parameters

- like: text, default %, e.g. %

## Steps

### named

```sql
SELECT DeveloperName, MasterLabel, Endpoint, PrincipalType FROM NamedCredential WHERE DeveloperName LIKE '{like}' ORDER BY DeveloperName
```

### external (Tooling API)

```sql
SELECT DeveloperName, MasterLabel, AuthenticationProtocol FROM ExternalCredential WHERE DeveloperName LIKE '{like}' ORDER BY DeveloperName
```

## Verdicts

- When named.rows === 0 && external.rows === 0: No credentials matched {like}.
- Otherwise: {named.rows} named and {external.rows} external credential(s).

## Traps

- Endpoints and principals are bound to one org. A difference across orgs is expected; set them by hand per org, never by deploy.

## Usage

0 logged run(s).

