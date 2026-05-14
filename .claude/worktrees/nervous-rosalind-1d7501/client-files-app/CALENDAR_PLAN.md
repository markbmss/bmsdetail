# Plan: יומן + תורים (Calendar & appointments)

**Status:** מומש באפליקציה — אחרי התחברות יש טאבים **קבצי לקוחות** | **יומן**. SQL מלא לתיעוד: `supabase-schema.sql` (טבלת `appointments`).

**אם ה-SQL בפרויקט שלך שונה** (שמות עמודות) — עדכן את `src/lib/appointments.js` ואת המודלים בהתאם.

**הערת סנכרון:** אם שמות העמודות בטבלה שונים ממה שמופיע כאן — עדכן את השלבים בהתאם ל-SQL שביצעת (העתק את ה-`CREATE TABLE` לקובץ `supabase-schema.sql` בפרויקט לתיעוד).

---

## 1. מטרות (גרסה ראשונה — v1)

| מטרה | תיאור |
|------|--------|
| שני מסכים | **קבצי לקוחות** (כמו היום) + **יומן** עם תורים |
| תצוגת זמן | שבוע נוכחי (או רשימה לפי יום) — פשוט לתחזוקה |
| קריאה/כתיבה | טעינת תורים מטבלת `appointments`, יצירה/עריכה/מחיקה |
| מתוך לקוח | מסך/מודל "קביעת תור" מתוך `ClientDetail` עם `client_id` מוכן |
| עברית + RTL | כמו שאר האפליקציה; שעות ב-`Asia/Jerusalem` בתצוגה |
| מטבע / תשלומים | ללא שינוי — רק יומן נפרד |

**מחוץ ל-v1 (אופציונלי מאוחר יותר):** התראות WhatsApp, Realtime בין מכשירים, חפיפות אוטומטיות, משתמשים נפרדים (Supabase Auth).

---

## 2. הנחות לגבי Supabase

התכנון מניח טבלה בשם **`appointments`** (או שם שווה-ערך) עם לפחות:

- `id` (uuid)
- `client_id` (uuid → `clients`)
- `start_at`, `end_at` (`timestamptz`, UTC במסד)
- אופציונלי: `notes`, `status`, `title`, `created_at`

אם השמות שונים — מיפוי שדות בשכבת ה-API ב-React בלבד.

**פעולה מומלצת:** להדביק את ה-SQL הסופי בסוף `supabase-schema.sql` (או קובץ `supabase-appointments.sql`) כדי שהריפו ישקף את המציאות.

---

## 3. ארכיטקטורת אפליקציה

### ניווט

- להוסיף **`react-router-dom`** (גרסה תואמת React 18), או
- **בלי 라אוטר:** state פשוט `activeView: 'clients' | 'calendar'` + כפתורי טאב בסרגל — מהיר ל-v1.

המלצה ל-v1: **טאבים פנימיים** ב-`App` אחרי התחברות — פחות תלות, אותו `netlify.toml` SPA.

### טעינת נתונים

- **לקוחות:** כבר קיים `loadClients()`.
- **תורים:** פונקציה חדשה `loadAppointments({ from, to })` — טווח לפי השבוע המוצג.
- אפשר למזג בטעינה אחת: `appointments` + `clients` ב-`select` עם join:  
  `from('appointments').select('*, clients(name, phone, car)')`  
  (אם ה-FK מוגדר ב-Supabase — שם היחס לפי הסכימה שלך).

### אזור זמן

- שמירה: ISO string מ-`Date` בזמן מקומי ישראל → Supabase שומר UTC.
- תצוגה: `toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', ... })` או `Intl` עקבי עם `src/lib/format.js`.

---

## 4. שלבי מימוש (סדר עבודה)

### שלב A — תשתית UI

1. אחרי `Login`, להוסיף **בר ניווט עליון** (או ליד הסרגל): **קבצי לקוחות** | **יומן**.
2. `activeView === 'clients'` → התוכן הקיים (סרגל + `ClientDetail`).
3. `activeView === 'calendar'` → קומפוננטה חדשה `CalendarView` (או `AppointmentsCalendar`).

### שלב B — שכבת נתונים

1. קובץ עזר `src/lib/appointments.js` (אופציונלי):  
   `fetchAppointmentsRange(supabase, start, end)`,  
   `createAppointment`, `updateAppointment`, `deleteAppointment`.
2. ב-`App` (או ב-context פשוט): state `appointments`, `calendarWeekStart` (Date).
3. `useEffect` כשעוברים ליומן או משנים שבוע — `loadAppointments`.

### שלב C — מסך יומן (v1)

1. כותרת: שבוע נוכחי + כפתורי **השבוע הקודם / הבא**.
2. רשת 7 עמודות (א–ש) או רשימה מקובצת לפי יום.
3. בכל תא/יום: רשימת כרטיסים קטנים — שעה, שם לקוח, רכב (מידע מה-join או ממפת `clientId → client`).
4. לחיצה על תור → מודל **עריכה** (זמן, הערות, מחיקה) או מחיקה עם `confirm`.

### שלב D — יצירת תור

**מיומן:** כפתור "תור חדש" → מודל: בחירת לקוח (חיפוש מהרשימה שכבר נטענת), תאריך, שעת התחלה, משך (ברירת מחדל 90 דקות לדוגמה) → `insert`.

**מלקוח:** ב-`ClientDetail` כפתור **קביעת תור** → אותו מודל עם `client_id` נעול או מוסתר.

### שלב E — בדיקות ופריסה

1. `npm run build` מקומי.
2. בדיקה ב-Supabase Table Editor שורות נוצרות/מתעדכנות.
3. Netlify: אין משתני סביבה חדשים (אותו anon) — רק **deploy** אחרי push.

---

## 5. קבצים צפויים

| פעולה | קובץ |
|--------|------|
| חדש | `src/components/CalendarView.jsx` (או `.js`) |
| חדש | `src/components/AppointmentModal.js` — יצירה/עריכה |
| חדש (אופציונלי) | `src/lib/appointments.js` |
| עדכון | `src/App.js` — ניווט, state, טעינת תורים |
| עדכון | `src/components/ClientDetail.js` — כפתור + פתיחת מודל |
| עדכון | `src/lib/format.js` — פונקציות עזר לשעה/תאריך בעברית (אופציונלי) |
| תיעוד | `supabase-schema.sql` או קובץ SQL נפרד — העתקת DDL של `appointments` |

---

## 6. צ׳קליסט לפני סגירת v1

- [ ] תור חדש נשמר ומופיע ביומן באותו שבוע.
- [ ] תור שנוצר ממסך לקוח מקושר ל-`client_id` הנכון.
- [ ] מעבר שבועות מרענן נתונים (אין "תורים חסרים").
- [ ] עריכה/מחיקה עובדות ו-UI בעברית.
- [ ] מובייל: גלילה אופקית או רשימה — לא שבור על מסך צר.

---

## 7. סיכון והקלה עתידית

- **חפיפות:** v1 יכול רק להציג אזהרה ב-UI אם שני תורים חופפים (השוואת טווחים בצד לקוח), או להשאיר ללא בדיקה.
- **Realtime:** הפעלה על הטבלה ב-Supabase + `supabase.channel` — שלב נפרד.

---

כשתרצה להתחיל לממש בפועל, אפשר לעבור צעד-אחר-צעד לפי השלבים A→E (או לצמצם ל-A+C+D לדמו מהיר).

---

## Google Calendar (מומש חלקית)

### הטמעת יומן עסקי (מעל הגריד)
1. ב-Google Calendar: **הגדרות** → היומן הרצוי → **שתף לכולם** (זמינות לציבור) או קבל קישור iframe.
2. ב-Netlify (וב־`.env.local` לפני `npm run build`) הוסף:
   - `REACT_APP_GOOGLE_CALENDAR_EMBED_SRC` — **אימייל היומן** (למשל `studio@company.com`) או **כתובת iframe מלאה** שמתחילה ב־`https://`.
3. בנה מחדש ופרוס. בלי משתנה זה — בלוק ההטמעה לא מוצג.

### קישור "Google Calendar" ליד כל תור + במודל
נפתח **Google Calendar → יצירת אירוע** בחשבון Google המחובר בדפדפן. זה **לא** מעתיק אוטומטית ליומן העסקי ולא מסנכרן ל-Supabase.

### סנכרון אוטומטי ל-Google (Edge Function)
מומש: `supabase/functions/google-calendar-sync` + קריאה מ-`AppointmentModal` אחרי שמירה/מחיקה.

**SQL חדש (הרץ ב-Supabase SQL Editor):**  
[`supabase/migrations/20250504120000_appointment_google_sync.sql`](supabase/migrations/20250504120000_appointment_google_sync.sql) — עמודות `google_event_id`, `google_sync_error`, `google_last_synced_at`.

**Secrets (Dashboard → Edge Functions → Secrets, בלי להדביק בריפו):**
| משתנה | מקור |
|--------|------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` מה-JSON של ה-service account |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` (שורות כ-`\n` אם צריך) |
| `GOOGLE_CALENDAR_ID` | Calendar ID מהגדרות היומן ב-Google |
| `SERVICE_ROLE_KEY` | Project Settings → API → **`service_role`** (Supabase forbids custom secret names starting with `SUPABASE_`) |

שתף את היומן עם אימייל ה-service account עם הרשאה **לערוך אירועים**. הפעל Calendar API בפרויקט Google Cloud.

**פריסה:** מתיקיית `client-files-app`:  
`supabase link --project-ref <ref>` (פעם אחת)  
`supabase functions deploy google-calendar-sync`

ב-`supabase/config.toml` מוגדר `verify_jwt = false` (האפליקציה משתמשת בסיסמת אפליקציה, לא ב-Supabase Auth).

**כיוון Google → האפליקציה** (עריכה ביומן מחוץ לאפליקציה) — לא מיושם; אפשר webhook / polling בשלב עתידי.
