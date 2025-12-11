# API Reference

All endpoints require a Supabase JWT and respect Row Level Security. Example requests assume `Authorization: Bearer <access_token>`.

## GET `/api/threads`
Query parameters:
- `mailbox_id` (optional)
- `status` (optional; open\|pending\|waiting_on_customer\|resolved\|closed)
- `q` (optional search on subject)

Returns the latest 50 threads ordered by `last_message_at`.

## GET `/api/threads/:id`
Fetch a single thread with metadata.

## POST `/api/actions/:id/approve`
Marks the action as `approved`, inserting an approval record for the caller.

## POST `/api/actions/:id/execute`
Enqueues a `send_action` work queue job for asynchronous execution.

## POST `/api/mailboxes`
Creates a new mailbox for the caller's organisation. Admin membership required.
```
{
  "address": "support@example.com",
  "provider": "gmail"
}
```

## PUT `/api/policies/:mailboxId`
Upserts a validated policy spec for the mailbox. Payload must satisfy the `PolicySchema`.

## POST `/api/reindex`
Queues a `reindex_kb` job for the caller's org.
