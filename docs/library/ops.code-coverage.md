# ops.code-coverage

How much of this class or trigger do tests cover?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.code-coverage --org <org> --name AccountService
```

## Parameters

- name: name, e.g. AccountService

## Steps

### coverage (Tooling API)

```sql
SELECT ApexClassOrTrigger.Name, NumLinesCovered, NumLinesUncovered FROM ApexCodeCoverageAggregate WHERE ApexClassOrTrigger.Name = '{name}'
```

## Verdicts

- When coverage.rows === 0: No coverage recorded for {name}. Run its tests first.
- Otherwise: {name}: {= Math.round(100 * coverage.records[0].NumLinesCovered / ((coverage.records[0].NumLinesCovered + coverage.records[0].NumLinesUncovered) || 1))}% covered.

## Traps

- Coverage reflects the last test run on this org, not the current code if it changed since.

## Usage

0 logged run(s).

