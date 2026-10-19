# omni.compiled

Has the active OmniScript been compiled since it last changed?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.compiled --org <org> --type Account --subtype Create
```

## Parameters

- type: name, e.g. Account
- subtype: name, e.g. Create

## Steps

### process

```sql
SELECT Id, Name, VersionNumber, LastModifiedDate FROM OmniProcess WHERE Type = '{type}' AND SubType = '{subtype}' AND IsActive = true
```

### compiled

Runs when: `process.rows === 1`

```sql
SELECT Name, CreatedDate, LastModifiedDate FROM OmniProcessCompilation WHERE OmniProcessId IN ({@process.Id}) ORDER BY LastModifiedDate DESC
```

## Verdicts

- When process.rows === 0: No active version of {type}/{subtype}.
- When compiled.rows === 0: {type}/{subtype} has no compiled copy: the page renders blank until it is compiled.
- When new Date(compiled.records[0].LastModifiedDate) < new Date(process.records[0].LastModifiedDate): {type}/{subtype} changed after its last compile.
- Otherwise: {type}/{subtype} compiled after its last change.

## Traps

- After a deploy, open the OmniScript in its own designer and preview it, which compiles it.

## Usage

0 logged run(s).

