# omni.elements

What steps does the active version of this OmniScript or Integration Procedure run?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.elements --org <org> --type Account --subtype Create
```

## Parameters

- type: name, e.g. Account
- subtype: name, e.g. Create

## Steps

### process

```sql
SELECT Id, Name, VersionNumber FROM OmniProcess WHERE Type = '{type}' AND SubType = '{subtype}' AND IsActive = true
```

### elements

Runs when: `process.rows === 1`

```sql
SELECT Name, Type, Level, SequenceNumber, IsActive, PropertySetConfig FROM OmniProcessElement WHERE OmniProcessId IN ({@process.Id}) ORDER BY Level, SequenceNumber
```

## Verdicts

- When process.rows === 0: No active version of {type}/{subtype}.
- Otherwise: {type}/{subtype} v{= process.records[0].VersionNumber}: {elements.rows} element(s).

## Traps

- Run on two orgs to see which steps differ; the PropertySetConfig hash shows a changed step.
- Presence is not execution: an element that is inactive, or behind a condition, may never run.

## Usage

0 logged run(s).

