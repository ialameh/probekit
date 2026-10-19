# meta.installed-packages

Which managed packages are installed, at which version?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.installed-packages --org <org> 
```

## Parameters

None.

## Steps

### packages (Tooling API)

```sql
SELECT SubscriberPackage.Name, SubscriberPackage.NamespacePrefix, SubscriberPackageVersion.MajorVersion, SubscriberPackageVersion.MinorVersion, SubscriberPackageVersion.PatchVersion FROM InstalledSubscriberPackage ORDER BY SubscriberPackage.Name LIMIT 500
```

## Verdicts

- Otherwise: {packages.rows} package(s) installed.

## Usage

0 logged run(s).

