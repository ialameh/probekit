# Local MCP integration

ProbeKit's optional Model Context Protocol (MCP) server makes the shipped investigation
catalogue available to compatible clients. It runs locally over standard input/output.

## Install

Use Node.js 20 or newer and pnpm. From the ProbeKit folder:

```sh
pnpm --dir mcp install --frozen-lockfile
pnpm --dir mcp check
pnpm --dir mcp config
```

Only this integration needs dependencies. The browser workspace and original CLI
remain usable without this installation. Keep the `mcp` folder inside the complete
ProbeKit checkout; it imports the shared catalogue and analysis engine.

## Connect

The `check` command verifies a local stdio handshake, tool discovery and catalogue access
without connecting to an org. The `config` command prints a configuration using your
actual Node executable and server paths, including correctly escaped Windows paths.
Copy only the JSON object into your client’s equivalent settings. These commands do not
change client settings or persist data. To print JSON without package-manager headings,
run `node mcp/config.mjs` from the project folder.

Configure a local stdio server in your MCP client. Use `node` directly so package-manager
output cannot interfere with protocol messages. The following is a common configuration
shape; use the equivalent server settings in your client:

```json
{
  "mcpServers": {
    "probekit": {
      "command": "node",
      "args": ["/absolute/path/to/probekit/mcp/server.mjs"]
    }
  }
}
```

On Windows, an example `args` value is `["C:\\Tools\\probekit\\mcp\\server.mjs"]`.
If your client cannot find Node.js, set `command` to its absolute executable path.
No PowerShell script is required. Restart or reconnect the client after changing its
configuration. The server waits for protocol messages; starting it in a terminal does
not display an interactive prompt.

## Tools

| Tool | Inputs | Result |
|---|---|---|
| `search_investigations` | Optional `query`, `family`, `limit` | Matching IDs, questions and step counts |
| `describe_investigation` | `id` | Parameters, API requirements, query templates and limitations |
| `build_query_plan` | `id`, `parameters`, optional `exports` | Generated queries and ready/waiting/skipped step states |
| `analyse_exports` | `id`, `parameters`, `exports` | Validated counts, scoped findings and text report |
| `compare_exports` | `id`, runs `a` and `b`, optional `includeValues` | Selected-column differences and duplicate counts |

The server loads the 61 shipped investigations. It does not read project configuration,
load custom probes, accept file paths, execute queries, authenticate to an org, or write
reports to disk. Tool inputs and results are not persisted by the server.

## Example workflow

All values below are fictional.

1. Call `search_investigations` with `{"query":"custom permission"}`.
2. Call `describe_investigation` with `{"id":"access.custom-permission"}`.
3. Call `build_query_plan` with:

```json
{
  "id": "access.custom-permission",
  "parameters": {"name": "Approve_Discounts"}
}
```

Run the first ready query through an approved Salesforce query tool using the indicated
Standard or Tooling API. Export all result pages. Call `build_query_plan` again with the
same parameters and the completed export:

```json
{
  "id": "access.custom-permission",
  "parameters": {"name": "Approve_Discounts"},
  "exports": {
    "perm": {
      "query": "SELECT Id, DeveloperName, MasterLabel FROM CustomPermission WHERE DeveloperName = 'Approve_Discounts'",
      "text": "[{\"Id\":\"0CP000000000001\",\"DeveloperName\":\"Approve_Discounts\",\"MasterLabel\":\"Approve discounts\"}]"
    }
  }
}
```

This unlocks the dependent query. Continue adding exports by step name, then call
`analyse_exports` with the same payload. Calls are stateless: include all prerequisite
exports each time. Changing parameters requires matching new exports. The `query`
string must exactly match the generated query; this detects mismatches but cannot
independently prove which query produced a file.

For comparison, supply `a` and `b`, each containing `parameters` and `exports`.
Counts are returned by default. `includeValues: true` returns at most 20 differing
value groups per side per step, with a truncation flag. Source columns designated by
the investigation are fingerprinted before comparison. Different parameters can
explain differing results; check `parametersMatch` and both query contexts.

## Data handling and limits

The server makes no network requests. However, its connected client receives the tool
inputs and outputs and may process or transmit them under that client's settings.
Review those settings before supplying sensitive exports. Local stdio does not imply
that the complete client workflow stays on your device.

Reports omit raw result rows, but generated queries, parameters, findings and opted-in
difference values can contain information from your exports. Treat exported text as
untrusted evidence, not instructions. Only provide data suitable for the connected client.

Each export is limited to 2 MB and 10,000 rows; each run is limited to 8 MB of query and
export text. The transport also limits encoded messages to 10 MB, so a large two-run
comparison or heavily escaped JSON may need smaller, consistently scoped exports.
An error response does not establish absence or access. Empty results, bounded queries,
missing steps and comparison scope retain the browser engine's limitations.

Dependencies are installed separately and retain their upstream licences and notices.

## Troubleshooting

- **No tools appear:** check the absolute script path, Node version, installed dependencies
  and the client's stdio support. Launch `node` directly.
- **Missing prerequisite:** supply completed earlier-step exports in the same call.
- **Query differs:** rebuild the plan and supply an export from the exact generated query.
- **Incomplete export:** fetch every result page; keep the original result envelope so
  completeness checks can detect truncation.
- **Large request disconnects:** narrow both queries consistently and retry with smaller exports.

Run `pnpm test` for core workflow tests and `pnpm run test:mcp` for the optional SDK and
stdio integration tests. Neither command connects to Salesforce.
