-- Add performance indexes for session table
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session" USING btree ("token");
CREATE INDEX IF NOT EXISTS "session_expires_at_idx" ON "session" USING btree ("expiresAt");

-- Add performance indexes for employee table
CREATE INDEX IF NOT EXISTS "employee_department_idx" ON "employee" USING btree ("department");
CREATE INDEX IF NOT EXISTS "employee_email_idx" ON "employee" USING btree ("email");
CREATE INDEX IF NOT EXISTS "employee_created_by_idx" ON "employee" USING btree ("createdBy");

-- Add performance indexes for audit_log table
CREATE INDEX IF NOT EXISTS "audit_log_user_id_idx" ON "audit_log" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "audit_log_resource_idx" ON "audit_log" USING btree ("resource");
CREATE INDEX IF NOT EXISTS "audit_log_resource_id_idx" ON "audit_log" USING btree ("resource", "resourceId");
CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log" USING btree ("createdAt");
