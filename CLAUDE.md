@AGENTS.md

# Working Rules

## External System Actions
If a task requires any action in an external system (e.g. running SQL in Supabase, creating storage buckets, setting RLS policies, configuring environment variables), always call it out explicitly at the **end** of the response in a clearly labeled section, separate from the code changes. The user must not have to hunt for it.
