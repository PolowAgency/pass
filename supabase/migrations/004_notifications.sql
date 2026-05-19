-- Préférences de notifications (dans profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reminder_time TEXT DEFAULT '20:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_streak_alert BOOLEAN DEFAULT TRUE;
