# Hyperfy

3D multiplayer metaverse game engine. Buildless, hot-reloading development via MCP protocol.

## Development

Start the dev server **only via MCP tool**:

```
hyperfy-dev: start_dev_server
```

Available MCP tools:
- `start_dev_server` - Start server (returns logs path and PID)
- `stop_dev_server` - Stop server gracefully or force kill
- `get_dev_logs` - Stream recent log output
- `dev_server_status` - Check if server running

**DO NOT** use CLI commands, Bash, or scripts. MCP tool is the only interface.

## Architecture

- **Buildless**: Direct ES module loading, no transpilation
- **Hot reload**: File changes trigger full-page reload via WebSocket
- **MCP-only**: All development operations through MCP protocol
- **Issues exposed**: Logs continuously show all errors and state changes

## How It Works

1. Start server via MCP
2. Browser loads client modules directly (no bundling)
3. File changes broadcast over WebSocket
4. Browser auto-reloads on save
5. Logs expose all issues in real-time
