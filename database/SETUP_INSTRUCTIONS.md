# How to Setup Project History in Supabase

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (the one with URL: `gmjcqjzvdavafticeqgc.supabase.co`)

## Step 2: Open SQL Editor

1. In the left sidebar, click on **SQL Editor** (icon looks like `</>`)
2. Click **+ New Query** button

## Step 3: Run the Migration Script

1. Open the file: `engineer/database/add_project_history.sql`
2. Copy ALL the SQL content from that file
3. Paste it into the SQL Editor query window
4. Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)

## Step 4: Verify Success

You should see success messages at the bottom:
- "project_history table created successfully!"
- "project-images bucket created successfully!"

## Step 5: Verify in Supabase

### Check Table:
1. Click **Table Editor** in the left sidebar
2. You should see `project_history` in the table list
3. Click on it to see the structure

### Check Storage:
1. Click **Storage** in the left sidebar
2. You should see `project-images` bucket
3. Click on it to confirm it's created

## Step 6: Test in Your App

1. Make sure your dev server is running: `npm run dev` (in the `engineer` folder)
2. Log in to your app
3. Click on **History** in the header navigation
4. The history page should load without errors

## Troubleshooting

### If you get an error about `update_updated_at_column()` function:
This function should already exist from your main schema. If not, run this first:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### If storage policies fail:
The storage.objects policies may need adjustment based on your Supabase version. Check the Supabase logs for specific error messages.

### If you need to reset:
To drop everything and start over:

```sql
-- Drop the table
DROP TABLE IF EXISTS public.project_history CASCADE;

-- Delete the storage bucket (do this in Storage UI)
-- Or run: DELETE FROM storage.buckets WHERE id = 'project-images';
```

## What This Adds

✅ **project_history** table - stores all user-generated projects  
✅ **project-images** bucket - stores project images (5MB limit)  
✅ Row-level security - users can only see their own history  
✅ Automatic timestamps - tracks when projects are created/updated  
✅ Favorites feature - star important projects  

## Next Steps

After the database is set up, you can:
1. Generate a project on the home page
2. It will automatically save to history (you'll need to integrate the save function)
3. View all your projects in the History page
4. Star favorites, delete old projects, or re-open them

---

**Need Help?** Check the Supabase documentation at [https://supabase.com/docs](https://supabase.com/docs)
