-- =============================================================================
-- Row Level Security (RLS) Policies — Household Cleaning Planner
-- =============================================================================
-- Run this entire file in the Supabase SQL Editor after `prisma db push`.
-- It enables RLS on every application table and creates fine-grained policies
-- that enforce: users see/edit only their own data; admins have full access.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: get the role of the currently authenticated user
-- SECURITY DEFINER so it always queries with full access regardless of RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- USERS
-- =============================================================================

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (get_user_role() = 'admin');

-- =============================================================================
-- ROOMS — read for all authenticated users, write for admins only
-- =============================================================================

CREATE POLICY "Authenticated users can view rooms"
  ON rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage rooms"
  ON rooms FOR ALL
  USING (get_user_role() = 'admin');

-- =============================================================================
-- CATEGORIES — read for all authenticated users, write for admins only
-- =============================================================================

CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (get_user_role() = 'admin');

-- =============================================================================
-- TASKS — read for all authenticated users, write for admins only
-- =============================================================================

CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  USING (get_user_role() = 'admin');

-- =============================================================================
-- FREQUENCIES — read for all authenticated users, write for admins only
-- =============================================================================

CREATE POLICY "Authenticated users can view frequencies"
  ON frequencies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage frequencies"
  ON frequencies FOR ALL
  USING (get_user_role() = 'admin');

-- =============================================================================
-- SCHEDULES — users see own, admins see all
-- =============================================================================

CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins can view all schedules"
  ON schedules FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can manage schedules"
  ON schedules FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Users can update their own schedule status"
  ON schedules FOR UPDATE
  USING (assigned_to = auth.uid());

-- =============================================================================
-- TASK_COMMENTS — users read/write on their own schedules, admins have full access
-- =============================================================================

CREATE POLICY "Users can view comments on their schedules"
  ON task_comments FOR SELECT
  USING (
    schedule_id IN (SELECT id FROM schedules WHERE assigned_to = auth.uid())
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Users can add comments to their schedules"
  ON task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND schedule_id IN (SELECT id FROM schedules WHERE assigned_to = auth.uid())
  );

CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all comments"
  ON task_comments FOR ALL
  USING (get_user_role() = 'admin');

-- =============================================================================
-- TASK_PHOTOS — same access pattern as task_comments
-- =============================================================================

CREATE POLICY "Users can view photos on their schedules"
  ON task_photos FOR SELECT
  USING (
    schedule_id IN (SELECT id FROM schedules WHERE assigned_to = auth.uid())
    OR get_user_role() = 'admin'
  );

CREATE POLICY "Users can upload photos to their schedules"
  ON task_photos FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND schedule_id IN (SELECT id FROM schedules WHERE assigned_to = auth.uid())
  );

CREATE POLICY "Admins can manage all photos"
  ON task_photos FOR ALL
  USING (get_user_role() = 'admin');

-- =============================================================================
-- AUDIT_LOGS — admins read, authenticated system insert
-- =============================================================================

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- SETTINGS — all authenticated users read, only admins write
-- =============================================================================

CREATE POLICY "Authenticated users can view settings"
  ON settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (get_user_role() = 'admin');
