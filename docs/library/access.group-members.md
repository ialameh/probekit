# access.group-members

Who is in this public group or queue, and which objects does the queue serve?

- Family: access
- Writes: no
- Orgs: any

## Run

```
probe run access.group-members --org <org> --group Sales_Queue
```

## Parameters

- group: name, e.g. Sales_Queue

## Steps

### grp

```sql
SELECT Id, DeveloperName, Name, Type FROM Group WHERE DeveloperName = '{group}'
```

### members

Runs when: `grp.rows > 0`

```sql
SELECT UserOrGroupId, GroupId FROM GroupMember WHERE GroupId IN ({@grp.Id})
```

### users

Runs when: `members.rows > 0`

```sql
SELECT Name, Username, IsActive FROM User WHERE Id IN ({@members.UserOrGroupId}) ORDER BY Name
```

### queue_objects

Runs when: `grp.rows > 0`

```sql
SELECT SobjectType FROM QueueSobject WHERE QueueId IN ({@grp.Id})
```

## Verdicts

- When grp.rows === 0: No group or queue {group}.
- Otherwise: {group} has {members.rows} member(s): {users.rows} user(s), the rest are groups or roles.

## Usage

0 logged run(s).

