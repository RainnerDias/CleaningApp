# API reference

All API routes are Next.js Route Handlers located in `src/app/api/`. Every route requires an authenticated Supabase session unless marked otherwise. Authentication is verified by calling `getCurrentUser()` at the start of each handler; an invalid or missing session returns `401 Unauthorized`.

Responses always follow this envelope:

```json
// Success
{ "data": <payload> }

// Error
{ "error": "<human-readable message>" }
```

---

## Auth

### `GET /api/auth/me`

Returns the currently authenticated user's profile.

- **Auth:** Any authenticated user
- **Request:** None
- **Response 200:**
  ```json
  {
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "user | admin",
      "avatarUrl": "https://...",
      "createdAt": "ISO-8601"
    }
  }
  ```
- **Response 401:** Session missing or invalid

---

## Rooms

### `GET /api/rooms`

Returns all rooms.

- **Auth:** Any authenticated user
- **Request:** None
- **Response 200:**
  ```json
  { "data": [{ "id": "uuid", "name": "Kitchen", "description": "...", "createdAt": "ISO-8601" }] }
  ```

### `POST /api/rooms`

Creates a new room.

- **Auth:** Admin only
- **Request body:**
  ```json
  { "name": "string (required)", "description": "string (optional)" }
  ```
- **Response 201:** `{ "data": <room> }`
- **Response 400:** Validation error (name missing or empty)
- **Response 403:** Caller is not an admin

### `GET /api/rooms/:id`

Returns a single room by ID.

- **Auth:** Any authenticated user
- **Response 200:** `{ "data": <room> }`
- **Response 404:** Room not found

### `PUT /api/rooms/:id`

Updates a room.

- **Auth:** Admin only
- **Request body:**
  ```json
  { "name": "string (optional)", "description": "string (optional)" }
  ```
- **Response 200:** `{ "data": <updatedRoom> }`
- **Response 403:** Caller is not an admin
- **Response 404:** Room not found

### `DELETE /api/rooms/:id`

Deletes a room. Fails if the room has tasks assigned to it.

- **Auth:** Admin only
- **Response 200:** `{ "data": { "id": "uuid" } }`
- **Response 400:** Room still has associated tasks
- **Response 403:** Caller is not an admin
- **Response 404:** Room not found

---

## Categories

### `GET /api/categories`

Returns all task categories.

- **Auth:** Any authenticated user
- **Response 200:**
  ```json
  { "data": [{ "id": "uuid", "name": "Deep Clean", "color": "#hex", "createdAt": "ISO-8601" }] }
  ```

### `POST /api/categories`

Creates a new category.

- **Auth:** Admin only
- **Request body:**
  ```json
  { "name": "string (required)", "color": "hex color string (optional)" }
  ```
- **Response 201:** `{ "data": <category> }`
- **Response 403:** Caller is not an admin

### `GET /api/categories/:id`

Returns a single category.

- **Auth:** Any authenticated user
- **Response 200:** `{ "data": <category> }`
- **Response 404:** Category not found

### `PUT /api/categories/:id`

Updates a category.

- **Auth:** Admin only
- **Request body:**
  ```json
  { "name": "string (optional)", "color": "string (optional)" }
  ```
- **Response 200:** `{ "data": <updatedCategory> }`
- **Response 403:** Caller is not an admin
- **Response 404:** Category not found

### `DELETE /api/categories/:id`

Deletes a category.

- **Auth:** Admin only
- **Response 200:** `{ "data": { "id": "uuid" } }`
- **Response 403:** Caller is not an admin
- **Response 404:** Category not found

---

## Tasks

### `GET /api/tasks`

Returns all tasks with their associated room, category, and frequency.

- **Auth:** Any authenticated user
- **Query params:**
  | Param        | Type            | Description        |
  | ------------ | --------------- | ------------------ |
  | `roomId`     | uuid (optional) | Filter by room     |
  | `categoryId` | uuid (optional) | Filter by category |
- **Response 200:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Vacuum living room",
        "description": "...",
        "room": { "id": "...", "name": "Living Room" },
        "category": { "id": "...", "name": "Routine" },
        "frequency": { "type": "weekly", "daysOfWeek": [1, 4] },
        "createdAt": "ISO-8601"
      }
    ]
  }
  ```

### `POST /api/tasks`

Creates a new task with a frequency rule.

- **Auth:** Admin only
- **Request body:**
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "roomId": "uuid (required)",
    "categoryId": "uuid (required)",
    "frequency": {
      "type": "daily | weekly | biweekly | monthly | custom (required)",
      "daysOfWeek": "number[] (required for weekly/biweekly)",
      "interval": "number (required for custom)"
    }
  }
  ```
- **Response 201:** `{ "data": <task> }`
- **Response 400:** Validation error
- **Response 403:** Caller is not an admin

### `GET /api/tasks/:id`

Returns a single task with full details.

- **Auth:** Any authenticated user
- **Response 200:** `{ "data": <task> }`
- **Response 404:** Task not found

### `PUT /api/tasks/:id`

Updates a task's name, description, room, or category.

- **Auth:** Admin only
- **Request body:** Same shape as `POST /api/tasks`, all fields optional
- **Response 200:** `{ "data": <updatedTask> }`
- **Response 403:** Caller is not an admin
- **Response 404:** Task not found

### `DELETE /api/tasks/:id`

Deletes a task and its frequency record. Does not delete historical schedule records.

- **Auth:** Admin only
- **Response 200:** `{ "data": { "id": "uuid" } }`
- **Response 403:** Caller is not an admin
- **Response 404:** Task not found

### `PUT /api/tasks/:id/frequency`

Updates only the frequency rule for a task.

- **Auth:** Admin only
- **Request body:**
  ```json
  {
    "type": "daily | weekly | biweekly | monthly | custom",
    "daysOfWeek": "number[] (optional)",
    "interval": "number (optional)"
  }
  ```
- **Response 200:** `{ "data": <updatedFrequency> }`
- **Response 403:** Caller is not an admin
- **Response 404:** Task not found

---

## Users

### `GET /api/users`

Returns all users.

- **Auth:** Admin only
- **Response 200:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Jane Doe",
        "role": "user | admin",
        "isActive": true,
        "createdAt": "ISO-8601"
      }
    ]
  }
  ```
- **Response 403:** Caller is not an admin

### `GET /api/users/:id`

Returns a single user.

- **Auth:** Admin only
- **Response 200:** `{ "data": <user> }`
- **Response 403:** Caller is not an admin
- **Response 404:** User not found

### `PUT /api/users/:id`

Updates a user's name, role, or active status.

- **Auth:** Admin only
- **Request body:**
  ```json
  {
    "name": "string (optional)",
    "role": "user | admin (optional)",
    "isActive": "boolean (optional)"
  }
  ```
- **Response 200:** `{ "data": <updatedUser> }`
- **Response 403:** Caller is not an admin
- **Response 404:** User not found

---

## Schedules

### `GET /api/schedules`

Returns schedules with optional filters. Admins see all schedules; regular users see only their own.

- **Auth:** Any authenticated user
- **Query params:**
  | Param    | Type                                         | Description                          |
  | -------- | -------------------------------------------- | ------------------------------------ |
  | `date`   | ISO date string (optional)                   | Filter by scheduled date             |
  | `userId` | uuid (optional)                              | Filter by assigned user (admin only) |
  | `status` | `pending \| completed \| skipped` (optional) | Filter by status                     |
- **Response 200:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "task": { "id": "...", "name": "..." },
        "user": { "id": "...", "name": "..." },
        "scheduledDate": "ISO date",
        "status": "pending | completed | skipped",
        "completedAt": "ISO-8601 | null",
        "createdAt": "ISO-8601"
      }
    ]
  }
  ```

### `GET /api/schedules/today`

Returns the authenticated user's schedules for today, ordered by room then task name.

- **Auth:** Any authenticated user
- **Response 200:** `{ "data": [<schedule>] }`

### `POST /api/schedules/generate`

Triggers the scheduling engine to generate schedule records for a date range.

- **Auth:** Admin only
- **Request body:**
  ```json
  { "startDate": "ISO date (required)", "endDate": "ISO date (required)" }
  ```
- **Behavior:** Idempotent — re-running for an already-generated range does not create duplicates.
- **Response 200:** `{ "data": { "created": 42, "skipped": 8 } }`
- **Response 400:** Date range invalid (start after end, or range exceeds 90 days)
- **Response 403:** Caller is not an admin

### `GET /api/schedules/:id`

Returns a single schedule with task, user, comments, and photos.

- **Auth:** Owner of the schedule or admin
- **Response 200:** `{ "data": <scheduleWithDetails> }`
- **Response 403:** Caller does not own the schedule and is not an admin
- **Response 404:** Schedule not found

### `PATCH /api/schedules/:id/status`

Updates the completion status of a schedule. Regular users can only update their own schedules.

- **Auth:** Owner of the schedule or admin
- **Request body:**
  ```json
  { "status": "completed | skipped (required)" }
  ```
- **Response 200:** `{ "data": <updatedSchedule> }`
- **Response 403:** Caller does not own the schedule
- **Response 404:** Schedule not found

### `POST /api/schedules/:id/comments`

Adds a text comment to a schedule.

- **Auth:** Owner of the schedule or admin
- **Request body:**
  ```json
  { "content": "string (required, max 1000 chars)" }
  ```
- **Response 201:** `{ "data": <comment> }`
- **Response 400:** Content missing or exceeds limit
- **Response 403:** Caller does not own the schedule

### `POST /api/schedules/:id/photos`

Uploads a photo for a completed task. The request must be `multipart/form-data`.

- **Auth:** Owner of the schedule or admin
- **Request body:** `FormData` with a `file` field (JPEG, PNG, or WebP; max 5 MB)
- **Behavior:** Uploads to Supabase Storage `task-photos` bucket and creates a `task_photos` record.
- **Response 201:** `{ "data": { "id": "uuid", "url": "https://..." } }`
- **Response 400:** File missing, wrong type, or exceeds size limit
- **Response 403:** Caller does not own the schedule

### `DELETE /api/schedules/:id/photos/:photoId`

Deletes a photo from a schedule.

- **Auth:** Owner of the schedule or admin
- **Response 200:** `{ "data": { "id": "uuid" } }`
- **Response 403:** Caller does not own the schedule
- **Response 404:** Photo not found

---

## Settings

### `GET /api/settings`

Returns the application-wide settings record.

- **Auth:** Admin only
- **Response 200:**
  ```json
  {
    "data": {
      "id": "uuid",
      "appName": "Casa Limpa",
      "defaultScheduleWeeks": 4,
      "updatedAt": "ISO-8601"
    }
  }
  ```

### `PUT /api/settings`

Updates application-wide settings.

- **Auth:** Admin only
- **Request body:**
  ```json
  { "appName": "string (optional)", "defaultScheduleWeeks": "number (optional, 1–52)" }
  ```
- **Response 200:** `{ "data": <updatedSettings> }`
- **Response 403:** Caller is not an admin

---

## Profile

### `GET /api/profile`

Returns the authenticated user's own profile.

- **Auth:** Any authenticated user
- **Response 200:** `{ "data": <user> }`

### `PUT /api/profile`

Updates the authenticated user's display name.

- **Auth:** Any authenticated user
- **Request body:**
  ```json
  { "name": "string (required)" }
  ```
- **Response 200:** `{ "data": <updatedUser> }`

### `PUT /api/profile/password`

Changes the authenticated user's password.

- **Auth:** Any authenticated user
- **Request body:**
  ```json
  { "currentPassword": "string (required)", "newPassword": "string (required, min 8 chars)" }
  ```
- **Response 200:** `{ "data": { "message": "Password updated" } }`
- **Response 400:** New password too short, or current password incorrect

### `POST /api/profile/avatar`

Uploads or replaces the authenticated user's avatar. The request must be `multipart/form-data`.

- **Auth:** Any authenticated user
- **Request body:** `FormData` with a `file` field (JPEG, PNG, or WebP; max 2 MB)
- **Behavior:** Uploads to Supabase Storage `avatars` bucket and updates `users.avatar_url`.
- **Response 200:** `{ "data": { "avatarUrl": "https://..." } }`
- **Response 400:** File missing, wrong type, or exceeds size limit

### `GET /api/profile/stats`

Returns the authenticated user's personal task completion statistics.

- **Auth:** Any authenticated user
- **Response 200:**
  ```json
  {
    "data": {
      "totalAssigned": 120,
      "totalCompleted": 105,
      "totalSkipped": 8,
      "completionRate": 0.875,
      "currentStreak": 5
    }
  }
  ```

---

## Admin

### `GET /api/admin/dashboard`

Returns aggregated metrics for the admin dashboard.

- **Auth:** Admin only
- **Response 200:**
  ```json
  {
    "data": {
      "pendingToday": 12,
      "completedToday": 34,
      "overdueCount": 3,
      "completionRateLast7Days": 0.91,
      "tasksByRoom": [{ "room": "Kitchen", "completed": 10, "pending": 2 }],
      "completionTrend": [{ "date": "2026-07-10", "rate": 0.88 }]
    }
  }
  ```
- **Response 403:** Caller is not an admin

### `GET /api/admin/reports`

Returns paginated task completion history for reporting.

- **Auth:** Admin only
- **Query params:**
  | Param       | Type                                   | Description                           |
  | ----------- | -------------------------------------- | ------------------------------------- |
  | `startDate` | ISO date (optional)                    | Range start (defaults to 30 days ago) |
  | `endDate`   | ISO date (optional)                    | Range end (defaults to today)         |
  | `userId`    | uuid (optional)                        | Filter by user                        |
  | `roomId`    | uuid (optional)                        | Filter by room                        |
  | `page`      | number (optional, default 1)           | Page number                           |
  | `pageSize`  | number (optional, default 50, max 200) | Records per page                      |
- **Response 200:**
  ```json
  {
    "data": {
      "records": [<schedule>],
      "total": 340,
      "page": 1,
      "pageSize": 50
    }
  }
  ```
- **Response 403:** Caller is not an admin

### `GET /api/admin/reports/export`

Exports the report data in a downloadable format.

- **Auth:** Admin only
- **Query params:** Same filters as `GET /api/admin/reports`, plus:
  | Param    | Type                             | Description   |
  | -------- | -------------------------------- | ------------- |
  | `format` | `pdf \| excel \| csv` (required) | Export format |
- **Response 200:** Binary file download with appropriate `Content-Type` header
  - PDF: `application/pdf`
  - Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - CSV: `text/csv`
- **Response 400:** Format missing or invalid
- **Response 403:** Caller is not an admin

### `GET /api/admin/audit-logs`

Returns paginated audit log entries.

- **Auth:** Admin only
- **Query params:**
  | Param      | Type                                    | Description                                 |
  | ---------- | --------------------------------------- | ------------------------------------------- |
  | `page`     | number (optional, default 1)            | Page number                                 |
  | `pageSize` | number (optional, default 50, max 200)  | Records per page                            |
  | `actorId`  | uuid (optional)                         | Filter by the user who performed the action |
  | `table`    | string (optional)                       | Filter by table name                        |
  | `action`   | `create \| update \| delete` (optional) | Filter by action type                       |
- **Response 200:**
  ```json
  {
    "data": {
      "records": [
        {
          "id": "uuid",
          "actor": { "id": "uuid", "name": "Jane Doe" },
          "table": "tasks",
          "action": "update",
          "recordId": "uuid",
          "before": {},
          "after": {},
          "createdAt": "ISO-8601"
        }
      ],
      "total": 1200,
      "page": 1,
      "pageSize": 50
    }
  }
  ```
- **Response 403:** Caller is not an admin
