# omni.decision-matrix

Which versions of this decision matrix are enabled, and what rows does the enabled one hold?

- Family: omni
- Writes: no
- Orgs: any

## Run

```
probe run omni.decision-matrix --org <org> --name Discount_Matrix
```

## Parameters

- name: name, e.g. Discount_Matrix

## Steps

### versions

```sql
SELECT Id, Name, VersionNumber, IsEnabled, StartDateTime, EndDateTime, LastModifiedDate FROM CalculationMatrixVersion WHERE CalculationMatrix.Name = '{name}' ORDER BY VersionNumber DESC
```

### rows

Runs when: `versions.rows > 0`

```sql
SELECT InputData, OutputData FROM CalculationMatrixRow WHERE CalculationMatrixVersion.CalculationMatrix.Name = '{name}' AND CalculationMatrixVersion.IsEnabled = true LIMIT 2000
```

## Verdicts

- When versions.rows === 0: No decision matrix {name}.
- When versions.records.filter(r => r.IsEnabled).length === 0: {name} has no enabled version.
- Otherwise: {name}: {rows.rows} row(s) in the enabled version(s).

## Traps

- An enabled matrix is not proof it runs. Confirm an active process looks it up before treating it as live.

## Usage

0 logged run(s).

