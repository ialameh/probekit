# access.tab-settings

Which permission sets and profiles show or hide this tab?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.tab-settings --org <org> --tab standard-Account
```

## Parameters

- tab: name, e.g. standard-Account

## Steps

### tabs

```sql
SELECT Parent.Name, Parent.IsOwnedByProfile, Visibility FROM PermissionSetTabSetting WHERE Name = '{tab}' ORDER BY Parent.Name
```

## Verdicts

- When tabs.rows === 0: No profile or permission set has a setting for {tab}.
- Otherwise: {tabs.rows} setting(s) for {tab}.

## Traps

- Standard tabs are named standard-<Object>; custom object tabs use the object API name.

## Usage

0 logged run(s).

