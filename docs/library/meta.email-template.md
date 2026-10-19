# meta.email-template

Is this email template the same across orgs, and is it active?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.email-template --org <org> --name Welcome_Email
```

## Parameters

- name: name, e.g. Welcome_Email

## Steps

### tpl

```sql
SELECT DeveloperName, Name, UiType, TemplateType, IsActive, FolderName, Subject, CreatedBy.Name, CreatedDate, LastModifiedBy.Name, LastModifiedDate, Body, HtmlValue FROM EmailTemplate WHERE DeveloperName = '{name}'
```

## Verdicts

- When tpl.rows === 0: No email template {name}.
- When tpl.records[0].IsActive === false: {name} is inactive.
- Otherwise: {name} is active.

## Usage

0 logged run(s).

