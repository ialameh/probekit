# ops.setup-audit

What changed in Setup recently, and who changed it?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.setup-audit --org <org> 
```

## Parameters

- days: int, default 7, e.g. 7
- section: text, optional, e.g. Manage Users
- user: username, optional, e.g. jane.doe@example.com
- limit: int, default 100, e.g. 100

## Steps

### changes

```sql
SELECT CreatedDate, CreatedBy.Name, Action, Section, Display, DelegateUser FROM SetupAuditTrail WHERE CreatedDate = LAST_N_DAYS:{days} [[AND Section = '{section}']] [[AND CreatedBy.Username = '{user}']] ORDER BY CreatedDate DESC LIMIT {limit}
```

## Verdicts

- When changes.rows === 0: No Setup changes matched in the last {days} day(s).
- Otherwise: {changes.rows} Setup change(s).

## Traps

- Deployments show up here under the deploying user, so a deploy and a hand edit can look alike; check ops.deploys at the same time.

## Usage

0 logged run(s).

