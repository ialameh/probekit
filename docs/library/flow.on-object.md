# flow.on-object

Which flows fire on this object or event?

- Family: flow
- Writes: no
- Orgs: any

## Run

```
probe run flow.on-object --org <org> --label Account
```

## Parameters

- label: text, e.g. Account
- active: name, default true, e.g. true

## Steps

### flows

```sql
SELECT ApiName, Label, ProcessType, TriggerType, IsActive, LastModifiedBy, LastModifiedDate FROM FlowDefinitionView WHERE TriggerObjectOrEventLabel = '{label}' AND IsActive = {active} ORDER BY TriggerType, ApiName
```

## Verdicts

- When flows.rows === 0: No matching flows on {label}.
- Otherwise: {flows.rows} flow(s) on {label}.

## Traps

- The filter is the object or event label, not its API name.
- Pass --active false to list inactive ones.

## Usage

0 logged run(s).

