# ops.event-subscribers

Are the subscribers to this platform event keeping up, and who do they run as?

- Family: ops
- Writes: no
- Orgs: any

## Run

```
probe run ops.event-subscribers --org <org> --topic Order_Event__e
```

## Parameters

- topic: name, e.g. Order_Event__e

## Steps

### subscribers

```sql
SELECT Name, Type, Topic, Position, Tip, Status, Retries, LastError FROM EventBusSubscriber WHERE Topic = '{topic}'
```

### configs (Tooling API)

```sql
SELECT DeveloperName, PlatformEventConsumerId, UserId, BatchSize FROM PlatformEventSubscriberConfig ORDER BY DeveloperName LIMIT 200
```

## Verdicts

- When subscribers.rows === 0: No subscribers on {topic}.
- When subscribers.records.some(r => r.Status !== "Running"): A subscriber on {topic} is not running.
- When subscribers.records.some(r => r.Position < r.Tip): A subscriber on {topic} is behind the tip.
- Otherwise: {subscribers.rows} subscriber(s) on {topic}, all running and caught up.

## Traps

- A trigger subscriber runs as the Automated Process user unless a subscriber config names another; a config change takes effect after the subscriber is suspended and resumed.

## Usage

0 logged run(s).

