# User guide

This guide covers how to use Casa Limpa. It is split into two sections: the **Admin Guide** for household administrators, and the **User Guide** for household members who complete tasks.

---

## Admin guide

Administrators have full access to the application: they set up the household, manage users, control the task schedule, and access reports and audit history.

---

### Logging in

1. Open the app in your browser.
2. On the login page, enter your email address and password.
3. Click **Sign in**.

If you forget your password, use the **Forgot password** link on the login page. A reset link will be sent to your email address.

---

### Setting up rooms

Rooms represent the physical spaces in your household (e.g., Kitchen, Living Room, Bathroom).

**To add a room:**

1. In the left sidebar, click **Rooms**.
2. Click the **Add room** button in the top-right corner.
3. Enter a room name and an optional description.
4. Click **Save**.

**To edit or delete a room:**

1. On the Rooms page, find the room in the list.
2. Click the three-dot menu on the right side of the room card.
3. Select **Edit** to change the name or description, or **Delete** to remove it.

> A room cannot be deleted while it still has tasks assigned to it. Remove or reassign those tasks first.

---

### Setting up categories

Categories group tasks by type (e.g., Routine, Deep Clean, Seasonal). They are used in reports and calendar views to filter by task type.

**To add a category:**

1. In the left sidebar, click **Categories**.
2. Click **Add category**.
3. Enter a name and choose a color for the category label.
4. Click **Save**.

---

### Creating tasks

Tasks are the specific cleaning activities assigned to rooms (e.g., "Vacuum living room floor").

**To create a task:**

1. In the left sidebar, click **Tasks**.
2. Click **Add task**.
3. Fill in the form:
   - **Name** — a clear, action-oriented name (e.g., "Mop kitchen floor")
   - **Description** — optional notes or instructions for the person completing the task
   - **Room** — select the room where the task is performed
   - **Category** — select the task's category
4. Under **Frequency**, define how often the task should occur:
   - **Daily** — the task fires every day
   - **Weekly** — select the days of the week (e.g., Monday and Thursday)
   - **Biweekly** — select the days of the week; the task fires every two weeks
   - **Monthly** — the task fires once per month
   - **Custom** — set a numeric interval (e.g., every 10 days)
5. Click **Save**.

---

### Managing users

**To view all users:**

1. In the left sidebar, click **Users**.
2. The table shows all household members, their roles, and their active status.

**To edit a user:**

1. Click the three-dot menu next to a user's name.
2. Select **Edit**.
3. You can change the user's display name, role (user or admin), and active status.
4. Click **Save**.

**To disable a user:**

1. Click the three-dot menu next to the user's name.
2. Select **Edit**.
3. Toggle **Active** to off.
4. Click **Save**.

Disabled users cannot log in, but their historical task completion records are preserved.

> To invite a new user, they must create an account directly through the login page using the email you share with them. Once they sign up, their account appears in the Users list where you can assign their role.

---

### Generating the schedule

The schedule must be generated before users will see tasks in their Today view.

**To generate a schedule:**

1. In the left sidebar, click **Calendar**.
2. Click the **Generate schedule** button.
3. Select a start date and end date (maximum 90-day range).
4. Click **Generate**.

The scheduling engine evaluates each task's frequency rule and creates task assignments for each qualifying date. Tasks are distributed across active users in a round-robin pattern. You can re-run generation for the same date range safely — existing schedule entries will not be duplicated.

---

### Viewing the calendar

The calendar shows all scheduled tasks for the selected month or week, color-coded by status:

| Color  | Meaning                                         |
| ------ | ----------------------------------------------- |
| Gray   | Pending (not yet due)                           |
| Green  | Completed                                       |
| Red    | Overdue (due date has passed and not completed) |
| Yellow | Skipped                                         |

Click any event on the calendar to see the task name, assigned user, and current status.

Use the **Week** and **Month** buttons in the top-right of the calendar to switch views.

---

### Reading the dashboard

The dashboard is the first page you see after logging in as an admin. It shows:

- **Today's summary** — count of pending, completed, and overdue tasks for today
- **7-day completion rate** — percentage of tasks completed over the last seven days
- **Tasks by room** — a bar chart showing completion vs. pending count per room
- **Completion trend** — a line chart showing daily completion rate for the last 30 days

The dashboard refreshes automatically every few minutes. You can also reload it manually.

---

### Exporting reports

**To export a report:**

1. In the left sidebar, click **Reports**.
2. Use the filters to narrow down the data:
   - **Date range** — select a start and end date
   - **User** — optionally filter by a specific household member
   - **Room** — optionally filter by room
3. Review the data table to confirm the results.
4. Click the **Export** button and choose a format:
   - **PDF** — formatted report suitable for printing or sharing
   - **Excel** — spreadsheet with full data, suitable for further analysis
   - **CSV** — raw comma-separated data for importing into other tools
5. The file downloads automatically.

---

### Audit logs

The audit log records every create, update, and delete action performed in the app, along with the actor (who did it), the timestamp, and the before/after values.

**To view audit logs:**

1. In the left sidebar, click **Audit Logs**.
2. Use the filters to search by actor, table, or action type.
3. Click any row to expand it and see the full before/after values.

---

## User guide

Regular users can see their daily tasks, mark them complete, and review their history.

---

### Logging in

1. Open the app in your browser.
2. Enter your email address and password on the login page.
3. Click **Sign in**.

---

### Completing today's tasks

After logging in, you land on the **Today** page. This page lists all tasks assigned to you for the current day.

**To complete a task:**

1. Find the task in the list.
2. Click the checkbox or the **Complete** button next to the task name.
3. Optionally, add a comment (e.g., "Used the new mop head").
4. Optionally, take or upload a photo to document the completed work.
5. Click **Save**.

The task moves to the completed section of the list. Completed tasks show your name and the time of completion.

**To skip a task:**

1. Click the three-dot menu on the task card.
2. Select **Skip**.
3. Optionally enter a reason.
4. Click **Save**.

Skipped tasks are recorded in your history. Your administrator can see skipped tasks in reports.

---

### Viewing week and month calendars

The **Week** and **Month** pages show your task schedule in calendar form.

- Tasks you have completed appear in green.
- Tasks that are pending (not yet due today) appear in gray.
- Overdue tasks (past their due date and not completed) appear in red.
- Skipped tasks appear in yellow.

Click any task in the calendar to open a detail view. From there you can mark the task complete if it is still open.

---

### Checking your history

The **History** page shows a list of all tasks you have been assigned, organized by date. You can:

- Filter by date range using the date pickers at the top.
- See the status of each task (completed, skipped, or pending).
- View any comments or photos attached to completed tasks.

---

### Editing your profile

**To update your display name:**

1. Click your name or avatar in the top-right corner of the screen.
2. Select **Profile**.
3. Edit the **Name** field.
4. Click **Save**.

**To upload or change your avatar:**

1. Go to your **Profile** page.
2. Click the avatar image (or the placeholder silhouette).
3. Select an image file from your device (JPEG, PNG, or WebP; maximum 2 MB).
4. The avatar updates automatically after upload.

**To change your password:**

1. Go to your **Profile** page.
2. Scroll to the **Change password** section.
3. Enter your current password, then your new password (minimum 8 characters), then confirm the new password.
4. Click **Update password**.

You will remain logged in after a password change.

---

## Glossary

| Term            | Definition                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------- |
| Schedule        | A specific assignment linking one task to one user on one date                               |
| Frequency       | A rule that defines how often a task recurs (daily, weekly, etc.)                            |
| RLS             | Row-Level Security — a database-level rule that prevents users from seeing each other's data |
| Round-robin     | A distribution method where tasks are assigned to users in a rotating sequence               |
| Completion rate | The percentage of assigned tasks that were completed within the reporting period             |
