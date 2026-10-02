-- Cover the activity actor foreign key for account lifecycle operations.
create index activity_events_actor_idx on public.activity_events(actor_id);
