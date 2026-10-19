# meta.dependencies

What uses this component, and what does it use?

- Family: meta
- Writes: no
- Orgs: any

## Run

```
probe run meta.dependencies --org <org> --name AccountService
```

## Parameters

- name: name, e.g. AccountService
- type: sobject, default ApexClass, e.g. ApexClass
- namefield: field, default Name, e.g. Name

## Steps

### component (Tooling API)

```sql
SELECT Id FROM {type} WHERE {namefield} = '{name}'
```

### used_by (Tooling API)

Runs when: `component.rows > 0`

```sql
SELECT MetadataComponentName, MetadataComponentType FROM MetadataComponentDependency WHERE RefMetadataComponentId IN ({@component.Id}) ORDER BY MetadataComponentType, MetadataComponentName LIMIT 2000
```

### uses (Tooling API)

Runs when: `component.rows > 0`

```sql
SELECT RefMetadataComponentName, RefMetadataComponentType FROM MetadataComponentDependency WHERE MetadataComponentId IN ({@component.Id}) ORDER BY RefMetadataComponentType, RefMetadataComponentName LIMIT 2000
```

## Verdicts

- When component.rows === 0: No {type} named {name}.
- When used_by.rows === 0 && uses.rows === 0: Nothing tracked references {name} and it references nothing tracked. Search the source as well.
- Otherwise: {name}: used by {used_by.rows}, uses {uses.rows}.

## Traps

- Filter by component Id: the name columns cannot be filtered on.
- For types named by DeveloperName (Flow definitions, LWC, custom objects) pass --namefield DeveloperName.
- References built at run time (a class name in a string, OmniStudio JSON, custom metadata values) are not tracked here.

## Usage

0 logged run(s).

