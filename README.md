# tdldot

**ToDo List Data Organize Tool**

## Introduction

There are already many **To-Do lists** in the world, and I think that more than email providers or health management devices, different people use different ones.

Most people probably use Apple Reminder, Todoist, or TickTick.

However, app developers need to meet the integration needs of each to-do list, and doing so individually is extremely difficult. **tdldot** is an API platform that consolidates the APIs of multiple todo lists and can support multiple todo list apps simply by implementing the **tdldot API**.

## Features

- 🔗 **Unified API** - Single API for multiple ToDo services
- 🛠️ **Developer-friendly** - Simple REST API with consistent data format
- 🚀 **Easy Integration** - Just implement one API instead of many
- 📊 **Standardized Data** - Consistent task format across all services
- ⚡ **Real-time Sync** - Keep tasks synchronized across platforms

## Supported Services

- ✅ **Todoist** - Full CRUD operations
- 🚧 **Google Tasks** - Coming soon
- 🚧 **Microsoft To Do** - Coming soon
- 🚧 **Apple Reminders** - Coming soon
- 🚧 **TickTick** - Coming soon

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/tdldot.git
cd tdldot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.local.example .env.local
# Add your API credentials
```

### 4. Run the development server
```bash
npm run dev
```

### 5. Open your browser
Visit [http://localhost:3000](http://localhost:3000) to see the test interface.

## API Usage

### Get Tasks
```bash
curl -X GET "https://api.tdldot.com/api/tasks?user_id=your_user_id" \
  -H "x-todoist-token: your_todoist_token"
```

### Create Task
```bash
curl -X POST "https://api.tdldot.com/api/tasks" \
  -H "Content-Type: application/json" \
  -H "x-todoist-token: your_todoist_token" \
  -d '{
    "user_id": "your_user_id",
    "title": "Complete tdldot integration",
    "description": "Implement the unified ToDo API",
    "priority": "high"
  }'
```

## Response Format

All API responses follow this consistent format:

```json
{
  "data": {
    "id": "tdldot_unique_id",
    "external_id": "service_specific_id",
    "service_type": "todoist",
    "title": "Task title",
    "description": "Task description",
    "priority": "high",
    "status": "pending",
    "due_date": "2025-07-30T10:00:00Z",
    "labels": ["work", "urgent"],
    "project": {
      "id": "project_id",
      "name": "Work Project"
    },
    "created_at": "2025-07-29T15:30:00Z",
    "updated_at": "2025-07-29T15:30:00Z"
  },
  "meta": {
    "service": "todoist",
    "timestamp": "2025-07-29T15:30:00Z"
  }
}
```

## Why tdldot?

**Before tdldot:**
```
Your App → Todoist API (different format)
Your App → Google Tasks API (different format) 
Your App → Microsoft To Do API (different format)
Your App → Apple Reminders API (different format)
```

**After tdldot:**
```
Your App → tdldot API → All ToDo Services
```

- **Single Integration**: Implement once, support all services
- **Consistent Format**: Same data structure for all services  
- **Reduced Complexity**: No need to learn multiple APIs
- **Future-proof**: New services added without code changes

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │────│   tdldot API     │────│   Auth Service  │
└─────────────────┘    │   (Gateway)      │    └─────────────────┘
                       └──────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼─────┐
            │ Todoist   │ │Google │ │Microsoft│
            │ Adapter   │ │Adapter│ │ Adapter │
            └───────────┘ └───────┘ └─────────┘
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [x] Todoist integration
- [ ] Google Tasks integration
- [ ] Microsoft To Do integration
- [ ] Apple Reminders integration
- [ ] OAuth authentication
- [ ] Webhook support
- [ ] Rate limiting improvements
- [ ] Caching layer
- [ ] Documentation site

## Support

- 📖 [Documentation](https://docs.tdldot.com)
- 💬 [Discord Community](https://discord.gg/tdldot)
- 🐛 [Issue Tracker](https://github.com/yourusername/tdldot/issues)
- 📧 [Email Support](mailto:support@tdldot.com)

---

Made with ❤️ by the tdldot team