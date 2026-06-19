-- Migration: 007_sync_logs_rls.sql
-- Project: JoudaApp (unsqyovqzsgmxacrqunh)
-- Description: Allow authenticated users to read sync_logs for the admin dashboard

CREATE POLICY "Allow authenticated read sync logs" ON sync_logs
  FOR SELECT TO authenticated
  USING (true);
