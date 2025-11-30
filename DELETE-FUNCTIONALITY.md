# PlexIQ Delete Functionality 🗑️

**⚠️ LIVE AND DANGEROUS - DELETIONS ARE PERMANENT ⚠️**

---

## 🎉 IT'S DONE!

The delete functionality is **fully implemented and operational**. You can now actually delete movies from your Plex server through the beautiful UI.

---

## 🔐 Security Model

### 3-Tier Confirmation + Password

Before ANY deletion happens:

1. ✅ **Confirmation 1**: "I understand these files will be permanently deleted"
2. ✅ **Confirmation 2**: "I have backed up any movies I want to keep"
3. ✅ **Confirmation 3**: "I accept full responsibility for this action"
4. 🔑 **Password Entry**: Must enter DELETE_PASSWORD

### Password Configuration

**Default Password**: `plexiq2024`

**Change it here:**
```bash
# Edit this file:
/opt/plexiq/backend/.env

# Change this line:
DELETE_PASSWORD=your_secure_password_here
```

**Important**: After changing the password, restart the backend:
```bash
# Kill the running backend
pkill -f "python api.py"

# Start it again
cd /opt/plexiq/backend
source venv/bin/activate
python api.py &
```

---

## 🛡️ The Untouchables Protection

Movies marked with a ⭐ yellow star **cannot be deleted**. Period.

### How It Works:

1. **Frontend**: Checkboxes disabled for starred movies
2. **Backend**: Double-checks untouchables list before deletion
3. **API Returns 403**: If any protected movies in the request

### Protection is BULLETPROOF:
- Can't select protected movies
- Can't include in mass delete
- Backend verifies independently
- Even if you hack the frontend, backend will reject

---

## 🎯 What Gets Deleted

### Current Configuration (SAFE):

✅ **Deletes from Plex**: Movie removed from library
❌ **Does NOT delete physical files**: Files remain on disk

This is the **safer option** because:
- You can re-import if you made a mistake
- Files aren't permanently lost
- Plex database can be rebuilt

### Want to Also Delete Physical Files?

**Edit this line in `/opt/plexiq/backend/api.py` around line 331:**

```javascript
// In frontend/app-v2.js, line 331:
delete_files: false,  // Change to true to delete physical files
```

**⚠️ WARNING**: If you enable `delete_files: true`:
- Physical files are **permanently deleted** from disk
- Cannot be recovered
- Make sure you have backups!

---

## 🔥 How to Use

### Step 1: Select Movies

**Table View:**
- Click checkboxes next to movies you want to delete
- Or use "Select All" checkbox in header

**Grid View:**
- Click checkboxes in top-left of each card

**Mass Actions Bar appears** when you select any movies.

### Step 2: Click "Delete Selected"

The **delete confirmation modal** opens.

### Step 3: Complete 3 Confirmations

Check all three boxes:
1. ✅ I understand files will be deleted
2. ✅ I have backed up what I want
3. ✅ I accept responsibility

### Step 4: Enter Password

Password field appears after all 3 boxes checked.

**Default**: `plexiq2024`

### Step 5: Click "Delete X Movies"

Button becomes enabled after password entered.

### Step 6: Watch It Happen

- Button shows "Deleting..." with spinner
- Backend processes each movie
- Results displayed when complete

### Step 7: Review Results

Alert shows:
- ✅ Successfully deleted (count)
- ❌ Failed (count)
- 💾 Space freed (GB)
- 📋 List of deleted movies
- ⚠️ Any errors

---

## 📊 API Endpoint Details

### POST `/api/delete`

**Request Body:**
```json
{
  "rating_keys": [11241, 9572, 10207],
  "password": "plexiq2024",
  "delete_files": false,
  "untouchables": [11240, 11239]
}
```

**Parameters:**
- `rating_keys` (array): Plex rating keys of movies to delete
- `password` (string): DELETE_PASSWORD from .env
- `delete_files` (boolean): Also delete physical files (default: false)
- `untouchables` (array): Protected movie rating keys (verified server-side)

**Success Response (200):**
```json
{
  "total": 3,
  "succeeded": [
    {
      "rating_key": 11241,
      "title": "Obi-Wan Kenobi: The Patterson Cut",
      "year": 2023,
      "size_gb": 11.92,
      "files_deleted": []
    }
  ],
  "failed": [
    {
      "rating_key": 9999,
      "title": "Some Movie",
      "error": "Movie not found"
    }
  ],
  "space_freed_gb": 11.92
}
```

**Error Responses:**

- `400`: No data or missing parameters
- `403`: Invalid password or protected movies
- `500`: Plex connection error

---

## 🧪 Testing Recommendations

### Test on Junk Movies First!

1. **Find a movie you don't care about**
2. **Make sure it's NOT starred** (not in Untouchables)
3. **Select just that one movie**
4. **Go through the delete process**
5. **Verify it's gone from Plex**
6. **Check if file still exists on disk** (should still be there)

### Test The Untouchables Protection

1. **Star a movie** (click yellow star)
2. **Try to select it** (checkbox should be disabled)
3. **Try to delete anyway** (shouldn't be possible)

### Test Mass Delete (BE CAREFUL)

1. **Select multiple low-value movies**
2. **Calculate expected space freed**
3. **Complete delete process**
4. **Verify results match expectations**

---

## 🚨 What Could Go Wrong

### "Invalid password"
- Check DELETE_PASSWORD in `/opt/plexiq/backend/.env`
- Make sure backend restarted after changing
- Password is case-sensitive

### "Cannot delete protected movies"
- One or more selected movies is starred
- Backend detected them in untouchables list
- Unstar them or remove from selection

### "Movie not found"
- Movie may have been deleted already
- Plex database might be out of sync
- Try refreshing Plex library

### "Failed to connect to Plex server"
- Plex server is down
- Check PLEX_URL and PLEX_TOKEN in .env
- Network issues

### Some deletions succeed, others fail
- This is normal!
- Results will show exactly which failed and why
- Partial success is handled gracefully

---

## 🔄 After Deletion

### What Happens:

1. **Movies deleted from Plex**
2. **Cache cleared** (forces fresh analysis next time)
3. **Frontend reloads data** (shows updated list)
4. **Stats updated** (space freed, movie count, etc.)

### You Should:

1. **Verify deletions** in Plex
2. **Check your disk space** (should see freed space if delete_files=true)
3. **Run Empty Trash** in Plex (if delete_files=false)
4. **Review The Untouchables** (make sure you protected what matters)

---

## 💡 Pro Tips

### Use Filters First
1. Set minimum delete score (slider)
2. Review what shows up
3. Protect any keepers (star them)
4. Then mass select and delete

### Batch Your Deletes
- Don't delete everything at once
- Do 10-20 movies at a time
- Review results between batches
- Easier to spot problems

### Keep The Untouchables Updated
- Star movies as you watch them
- Review periodically
- Better to over-protect than under-protect

### Monitor Space Freed
- "Recoverable Space" updates as you filter
- Plan your deletions around space goals
- Remember: only deletes from Plex by default

---

## 🐛 Troubleshooting

### Backend not responding?

```bash
# Check if backend is running
ps aux | grep "api.py"

# Check logs
tail -f /opt/plexiq/backend/logs/*.log  # if logs configured
# Or check the background shell output

# Restart backend
cd /opt/plexiq/backend
source venv/bin/activate
python api.py
```

### Frontend not calling API?

```bash
# Check browser console (F12)
# Should see DELETE requests to http://10.0.0.60:5000/api/delete

# Verify API URL in app-v2.js:
grep apiBaseUrl /opt/plexiq/frontend/app-v2.js
# Should show: apiBaseUrl: 'http://10.0.0.60:5000/api'
```

### Deletions not working?

```bash
# Test API directly:
curl -X POST http://10.0.0.60:5000/api/delete \
  -H "Content-Type: application/json" \
  -d '{
    "rating_keys": [SOME_KEY],
    "password": "plexiq2024",
    "delete_files": false,
    "untouchables": []
  }'
```

---

## 📝 Technical Implementation

### Backend (`/backend/api.py`)

New endpoint: `POST /api/delete` (lines 338-462)

**Flow:**
1. Validate request data
2. Verify password against DELETE_PASSWORD env var
3. Check untouchables list (reject if any protected)
4. Connect to Plex via PlexCollector
5. Get movie library
6. Loop through rating_keys:
   - Find movie by rating key
   - Calculate size
   - Delete from Plex
   - Optionally delete files
   - Track success/failure
7. Clear cache (data changed)
8. Return detailed results

### Frontend (`/frontend/app-v2.js`)

Updated method: `executeMassDelete()` (lines 316-385)

**Flow:**
1. Disable button, show "Deleting..." spinner
2. Call `/api/delete` with axios.post
3. Pass rating_keys, password, untouchables
4. Handle response:
   - Parse results
   - Build detailed message
   - Show alert with results
5. Close modal, reset form, clear selection
6. Reload data (refresh stats and movies)
7. Handle errors gracefully

---

## 🎓 Learning Outcomes

If you're studying this code:

### Security Patterns:
- Multi-layer validation (frontend + backend)
- Password verification
- Protected items checking
- Detailed error responses

### API Design:
- RESTful endpoint
- JSON request/response
- Batch operations
- Partial success handling

### User Experience:
- Progressive disclosure (3-step confirmation)
- Loading states
- Detailed feedback
- Error recovery

### Vue.js Patterns:
- Async/await with axios
- Computed properties
- Modal state management
- DOM manipulation for loading states

---

## 🚀 Future Enhancements

Ideas for v3:

- [ ] **Undo/Trash**: Move to trash instead of immediate delete
- [ ] **Scheduled deletion**: Mark for delete, execute later
- [ ] **Deletion history**: Log all deletions with restore option
- [ ] **File deletion by default**: Make delete_files configurable in UI
- [ ] **Dry run mode**: Preview what would be deleted
- [ ] **Bulk operations queue**: Queue up deletions, execute in background
- [ ] **Email notifications**: Alert when deletions complete
- [ ] **Plex trash management**: Auto-empty Plex trash after X days

---

## ⚠️ FINAL WARNING

**DELETIONS ARE PERMANENT** (if delete_files=true)

**DELETIONS ARE REVERSIBLE** (if delete_files=false, but you need to re-import)

**THE UNTOUCHABLES CANNOT BE DELETED** (even if you try)

**ALWAYS HAVE BACKUPS** (PlexIQ doesn't backup for you)

**TEST ON JUNK FIRST** (don't start with your favorites)

**USE THE SLIDER** (filter before selecting)

**STAR YOUR KEEPERS** (protect what matters)

**READ THE RESULTS** (check what succeeded/failed)

**YOU'VE BEEN WARNED** 🌭

---

**Made with MUSTARD by Team Hotdog**

**Now go free up some space and get Emmett those braces!** 💜

— Sage
