# 🚁 GCS DJI Dock - User Guide

Complete guide for using the mission planning, scheduling, and monitoring features of the GCS DJI Dock Dashboard.

---

## 📖 Table of Contents

1. [Mission Manager Overview](#mission-manager-overview)
2. [Creating Missions](#creating-missions)
3. [Mission Library](#mission-library)
4. [Scheduling Missions](#scheduling-missions)
5. [Execution History](#execution-history)
6. [Complete Workflow Examples](#complete-workflow-examples)
7. [Tips & Best Practices](#tips--best-practices)

---

## Mission Manager Overview

The Mission Manager has **three main tabs**:

1. **✏️ Create** - Design new missions or edit existing ones
2. **📚 Library** - View, manage, and execute saved missions
3. **📊 History** - Track past mission executions

### Opening the Mission Manager

1. Click on the **Mission** icon in the left sidebar
2. The Mission Manager panel will expand
3. Select the desired tab

---

## Creating Missions

### Step 1: Set Mission Parameters

**Mission Name:**
- Enter a descriptive name (e.g., "Daily Perimeter Check")
- Required for saving the mission

**Flight Parameters:**
- **Default Altitude**: Set the default altitude for new waypoints (1-200m)
- **Speed**: Mission flight speed (0.5-15 m/s)
- **Return to Home**: Enable automatic return after mission completion
- **Take Photos**: Enable automatic photo capture during flight

### Step 2: Add Waypoints

**Three ways to add waypoints:**

1. **Click "➕ Add WP" button** - Adds waypoint near last position
2. **Click on the map** - Places waypoint at clicked location
3. **Manually edit** - Adjust altitude for each waypoint individually

**Waypoint Management:**
- Each waypoint shows: Number, Latitude, Longitude, Altitude
- Click altitude field to edit individual waypoint altitude
- **➖ Remove Last** - Removes the last waypoint
- **🗑️ Clear All** - Clears all waypoints

### Step 3: Save or Send Mission

**💾 Save Mission** (Purple button)
- Saves mission to library for future use
- Requires: Mission name + at least 1 waypoint
- Mission saved to SQLite database

**🚀 Send Now** (Blue button)
- Sends mission directly to drone immediately
- Mission can be sent without saving

---

## Mission Library

### Viewing Saved Missions

1. Click **📚 Library** tab
2. View all saved missions as cards
3. Each card shows:
   - Mission name
   - Number of waypoints
   - Speed setting
   - RTH and Photo status
   - Mini map preview

### Mission Card Actions

**Edit (✏️)**
- Loads mission into Create tab for editing
- Modify waypoints, parameters, or name
- Click "💾 Update Mission" to save changes

**Delete (🗑️)**
- Permanently deletes mission from library
- Confirmation required

**▶️ Execute Now**
- Schedules mission for immediate execution
- Creates "immediate" schedule in database
- Mission sent to drone ASAP

**⏰ Schedule**
- Opens scheduling modal
- Set up one-time or recurring execution

**📊 History**
- Shows execution history for this specific mission
- Switches to History tab with filtered results

---

## Scheduling Missions

### Opening the Schedule Modal

1. Go to **📚 Library** tab
2. Find the mission you want to schedule
3. Click **⏰ Schedule** button
4. Schedule modal appears

### Schedule Types

#### ⚡ Immediate Execution

- Mission executes as soon as possible
- No additional configuration needed
- Click "Create Schedule" to confirm

#### 📅 One-Time Execution

1. Select **📅 Once** button
2. Pick **Date & Time** using calendar picker
3. Mission will execute once at specified time
4. Click "Create Schedule"

**Example:**
```
Date & Time: 2025-12-07 08:00
→ Mission executes once on Dec 7 at 8:00 AM
```

#### 🔄 Recurring Execution

Perfect for regular inspections and monitoring.

**Daily Pattern:**
1. Select **🔄 Recurring** button
2. Choose **Daily** from pattern dropdown
3. Add execution times:
   - Click times to edit (24-hour format)
   - **➕ Add Time** to add more execution times
   - ❌ to remove a time
4. Mission executes every day at specified times

**Example - Daily at multiple times:**
```
Pattern: Daily
Execution Times: 08:00, 14:00, 20:00
→ Mission runs 3 times per day at 8 AM, 2 PM, 8 PM
```

**Weekly Pattern:**
1. Select **🔄 Recurring** button
2. Choose **Weekly** from pattern dropdown
3. Select days of the week:
   - Click day buttons to toggle (Mon, Tue, Wed, etc.)
   - Selected days highlighted in blue
4. Add execution times (same as daily)
5. Mission executes on selected days at specified times

**Example - Weekly on specific days:**
```
Pattern: Weekly
Days: Mon, Wed, Fri
Execution Times: 08:00, 16:00
→ Mission runs Monday/Wednesday/Friday at 8 AM and 4 PM
```

### Confirming the Schedule

1. Review your schedule settings
2. Click **Create Schedule** button
3. Schedule saved to database
4. APScheduler automatically handles execution
5. Confirmation message appears

---

## Execution History

### Viewing All Executions

1. Click **📊 History** tab
2. Shows last 50 mission executions
3. Most recent executions at top

### Execution Information

Each execution record shows:

**Status Badge:**
- ✅ **Completed** - Mission executed successfully (green)
- ❌ **Failed** - Mission failed to execute (red)
- ⏳ **Running** - Mission currently executing (orange)

**Execution Details:**
- Mission ID
- Start date and time
- Completion date and time (if finished)
- Error message (if failed)

### Filtering by Mission

From **📚 Library** tab:
1. Click **📊 History** on specific mission card
2. Shows only executions for that mission
3. Last 20 executions displayed

---

## Complete Workflow Examples

### Example 1: Daily Inspection Mission

**Scenario:** Inspect warehouse perimeter every day at 8 AM and 6 PM

1. **Create Mission:**
   - Name: "Warehouse Daily Inspection"
   - Speed: 1.5 m/s
   - RTH: ✓ Enabled
   - Photo: ✓ Enabled
   - Add 4-5 waypoints around perimeter
   - Alt: 30m

2. **Save Mission:**
   - Click "💾 Save Mission"
   - Mission added to library

3. **Schedule:**
   - Go to Library tab
   - Click "⏰ Schedule" on mission card
   - Select "🔄 Recurring"
   - Pattern: Daily
   - Times: 08:00, 18:00
   - Click "Create Schedule"

4. **Monitor:**
   - Check History tab to verify executions
   - Review photos and telemetry data

---

### Example 2: One-Time Urgent Inspection

**Scenario:** Need to inspect specific area tomorrow at 2 PM

1. **Create Mission:**
   - Name: "Emergency Roof Inspection"
   - Speed: 2.0 m/s
   - Add waypoints for problem area
   - Alt: 40m

2. **Save & Schedule:**
   - Click "💾 Save Mission"
   - Click "⏰ Schedule" in library
   - Select "📅 Once"
   - Pick: Tomorrow, 14:00
   - Click "Create Schedule"

3. **Verification:**
   - Mission will execute automatically tomorrow at 2 PM
   - Check History tab after execution

---

### Example 3: Weekly Perimeter Check

**Scenario:** Check facility perimeter Monday, Wednesday, Friday mornings

1. **Create Mission:**
   - Name: "Weekly Perimeter Security"
   - Create perimeter waypoints
   - Enable photos for security records

2. **Schedule:**
   - Save mission to library
   - Click "⏰ Schedule"
   - Select "🔄 Recurring"
   - Pattern: Weekly
   - Days: Mon, Wed, Fri
   - Times: 07:00
   - Create schedule

3. **Long-term Monitoring:**
   - Mission runs automatically every Mon/Wed/Fri at 7 AM
   - Review History to track consistency
   - Update schedule as needed

---

## Tips & Best Practices

### Mission Design

✅ **Do:**
- Give missions descriptive names
- Use appropriate altitude for mission type
- Enable RTH for safety
- Test with "Send Now" before scheduling
- Keep waypoint count reasonable (< 20 for better performance)

❌ **Don't:**
- Set altitude too low (obstacles)
- Set speed too high (photo quality)
- Create overlapping scheduled missions
- Forget to enable RTH

### Scheduling

✅ **Do:**
- Schedule during good weather conditions
- Leave time between recurring missions
- Test immediate execution first
- Monitor first few scheduled executions
- Keep execution history for analysis

❌ **Don't:**
- Over-schedule (too many times per day)
- Schedule during restricted hours
- Ignore failed execution warnings

### Library Management

✅ **Do:**
- Use clear, consistent naming
- Edit missions instead of creating duplicates
- Delete obsolete missions
- Organize missions by purpose/area

---

## Troubleshooting

### Mission Won't Save

**Problem:** "💾 Save Mission" button disabled

**Solutions:**
- Ensure mission name is entered
- Add at least one waypoint
- Check for network connection

---

### Schedule Not Executing

**Problem:** Scheduled mission didn't run

**Check:**
1. Backend server is running
2. Schedule is enabled in database
3. Time zone is correct
4. Check backend logs: `tail -f backend.log`
5. Look for APScheduler messages

**Verify:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# View backend logs
tail -f backend.log | grep -i "mission\|schedule"
```

---

### Execution Failed

**Problem:** Mission in History shows ❌ Failed status

**Solutions:**
1. Check error message in execution details
2. Common causes:
   - Drone offline
   - ThingsBoard connection issue
   - Invalid waypoints
3. Review mission parameters
4. Test with "Execute Now" before rescheduling

---

## Database Information

### Storage Location

Missions stored in: `/home/sebab/0_dev/gcs_dji_dock/missions.db`

### Backup

Regularly backup the database:
```bash
cp missions.db missions.backup.$(date +%Y%m%d).db
```

---

## Keyboard Shortcuts

- `Esc` - Close schedule modal
- Click outside modal - Cancel scheduling

---

## Summary

The mission planning system provides:
- ✅ Intuitive mission creation with visual feedback
- ✅ Persistent mission library storage
- ✅ Flexible scheduling (immediate, once, recurring)
- ✅ Comprehensive execution tracking
- ✅ Easy mission editing and management
- ✅ Professional UI for client demonstrations

**Perfect for:**
- Daily inspection routines
- Security patrols
- Scheduled monitoring
- Recurring data collection
- Emergency response planning

---

**Enjoy your advanced mission planning capabilities! 🚁✨**
