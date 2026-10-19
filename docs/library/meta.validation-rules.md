# meta.validation-rules

Which validation rules run on this object, and which are active?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.validation-rules --org <org> --obj Account
```

## Parameters

- obj: sobject, e.g. Account
- name: name, optional, e.g. Require_Industry

## Steps

### rules (Tooling API)

```sql
SELECT ValidationName, Active, ErrorDisplayField, ErrorMessage, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = '{obj}' [[AND ValidationName = '{name}']] ORDER BY ValidationName
```

## Verdicts

- When rules.rows === 0: No validation rules matched on {obj}.
- Otherwise: {obj}: {= rules.records.filter(r => r.Active).length} active of {rules.rows} rule(s).

## Traps

- The formula itself is in the Metadata field, readable one rule at a time; retrieve the rule to compare formulas.

## Usage

0 logged run(s).

