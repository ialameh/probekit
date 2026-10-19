# data.files

Which files are attached to this record, and who can see them?

- Family: data
- Writes: no
- Orgs: any

## Run

```
probe run data.files --org <org> --id 001000000000000AAA
```

## Parameters

- id: id, e.g. 001000000000000AAA

## Steps

### files

```sql
SELECT ContentDocument.Title, ContentDocument.FileExtension, ContentDocument.ContentSize, ShareType, Visibility, ContentDocument.LastModifiedDate FROM ContentDocumentLink WHERE LinkedEntityId = '{id}' ORDER BY ContentDocument.LastModifiedDate DESC
```

## Verdicts

- When files.rows === 0: No files on {id}.
- Otherwise: {files.rows} file(s) on {id}.

## Traps

- Visibility AllUsers is needed for portal and community users to see a file.

## Usage

0 logged run(s).

