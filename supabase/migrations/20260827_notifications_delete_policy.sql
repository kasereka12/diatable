-- notifications has RLS enabled but never had a DELETE policy, so the
-- vendor "Supprimer toutes les notifications" action has nothing to delete
-- against (RLS blocks it, 0 rows affected, no error surfaced). Let a user
-- delete only their own notifications.

create policy "Utilisateur peut supprimer ses notifications"
  on notifications for delete using (auth.uid() = user_id);
