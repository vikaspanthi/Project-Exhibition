# Project Exhibition website — GitHub Pages

Developed by Dr. Vikas Panthi.

This package contains a real HTML/CSS/JavaScript website for GitHub Pages and a Supabase PostgreSQL backend. Student and faculty records are shared across devices. It does not require Java, JSP, Tomcat, npm, or a build step to deploy the website.

## Included features

- Email/password registration and login, with email confirmation.
- Each student registers a unique registration number, email ID and 10-digit Indian mobile number. Names can repeat.
- Choice-based groups of 1–5 students, including the group leader. Each student first creates and confirms their account; the leader then enters each member's matching details.
- A student can belong to only one group. Database transactions prevent concurrent duplicate membership.
- Coordinator imports faculty details from .xlsx or .xls; updates match Faculty ID.
- Each group receives one supervisor, Reviewer 1 and Reviewer 2, all different faculty.
- Students can see the allotted faculty names, emails and mobile numbers.
- Supervisors sign in and see only their allotted groups, including groups where they are reviewers.
- Only the currently allotted supervisor can save individual student marks for Reviews 1, 2 and 3. Reviewers, students and the coordinator can view but cannot change those marks.
- Maximum marks are entered separately for each review. Zero is valid; blank and out-of-range marks are rejected.
- Marks update atomically for every student in the group. Previous saved values remain in the database history.
- Coordinator exports marks to an Excel workbook.

## 1. Create a Supabase backend

1. Create a project at https://supabase.com/dashboard. This must be your own project; the package contains no connected database or accounts.
2. Open `backend/setup.sql` in a text editor.
3. Replace `REPLACE_WITH_YOUR_EMAIL@example.com` with your actual coordinator email. This is the only account automatically granted the coordinator role. Use the same email when you register on the website.
4. Open the project's **SQL Editor**, paste the edited SQL, and run it once in a NEW project. The script creates the application tables and database functions. Do not rerun it over an existing installation.
5. In **Authentication**, enable the Email provider and keep **Confirm email** enabled. Roles rely on verified email ownership.
6. Configure **Custom SMTP** in Authentication to send confirmations to your students and faculty. Supabase's default email service is intended for limited testing and may restrict recipients; configure a real mail provider for the exhibition. Apply a password policy of at least 12 characters.
7. In **Authentication → URL Configuration**, set **Site URL** to your GitHub Pages website URL, for example `https://YOUR_USERNAME.github.io/project-exhibition/`. Add the same exact URL, including its trailing slash, to the allowed **Redirect URLs**.
8. In the project settings, copy the **Project URL** and the browser-safe **publishable key** (or legacy `anon` key).
9. Edit `config.js` and replace its two placeholders:

```js
window.PROJECT_CONFIG = {
  supabaseUrl: 'https://your-project-ref.supabase.co',
  supabaseKey: 'your-publishable-or-anon-key'
};
```

Use only the publishable/anon key. Never upload a `service_role` key, a key beginning `sb_secret_`, a database password or SMTP credentials. SMTP settings belong in Supabase, not in this repository. The public browser key is expected to be visible; database permissions enforce access.

## 2. Upload to GitHub and enable Pages

1. Create a GitHub repository, for example **project-exhibition**.
2. Extract this ZIP on your computer.
3. Upload the CONTENTS of the `github-project-exhibition` folder into the repository root. `index.html` must appear directly in the repository root, alongside `config.js` and `assets/`. Do not upload the ZIP itself or put everything inside an extra folder.
4. Include `.nojekyll` from the package. It is an intentionally empty file. If your upload interface hides it, create a new file named `.nojekyll` in GitHub.
5. Go to **Repository → Settings → Pages**.
6. For **Source**, select **Deploy from a branch**. Select **main** and **/(root)**, then **Save**.
7. Open the published URL shown by GitHub Pages after deployment finishes.
8. Confirm that this URL matches the Site URL and allowed redirect URL in Supabase.

No npm install or build is required for GitHub Pages. `package.json` and `tests/` are only for optional developer verification.

## 3. Create your coordinator account

1. Open the website.
2. Click **Faculty / coordinator**.
3. Register using the exact coordinator email entered in the SQL script and choose your own password.
4. Confirm your email from the received message.
5. Sign in. The coordinator dashboard appears automatically; the browser cannot choose or elevate roles.

## 4. Import supervisors and reviewers

1. In the coordinator dashboard, click **Download Excel template**.
2. Replace the example row with your real faculty data. Keep the four headers exactly as follows:

| faculty_id | name | email | mobile |
|---|---|---|---|
| F001 | Faculty full name | faculty@institution.edu | 9876543210 |

3. Keep Faculty IDs and mobile numbers as text in Excel. Use complete 10-digit Indian mobile numbers without `+91` or spaces. Do not put formulas in the import sheet.
4. Put the data on the first sheet, with headers on row 1. Import at most 500 faculty per file; the file must be under 5 MB.
5. Upload it using **Import faculty**.
6. Ask each faculty member to open **Faculty / coordinator**, create a password using their imported email address, confirm the email, and sign in.
7. Importing faculty DOES NOT send invitations or email messages. No passwords are needed in the Excel file.
8. Imports update existing rows by Faculty ID. Once a faculty account exists, its email cannot be changed by this import; name and mobile updates are supported.

## 5. Register groups and allot faculty

1. Each student opens **Student registration** and enters registration number, name, email, mobile and a password.
2. Every student confirms their email, then signs in.
3. One student forms the group and enters the registered details of up to four teammates. The signed-in student is included as group leader.
4. All members must agree to the group. A member already in another group is rejected.
5. In the coordinator dashboard, select the group and choose its supervisor and two different reviewers. Click **Save allocation**.
6. Group members sign in to view contacts. Click **Refresh** to retrieve the latest allocation or marks.

## 6. Supervisor review workflow

1. Sign in using the email imported by the coordinator.
2. Select an allotted group.
3. Select **Review 1**, **Review 2** or **Review 3**.
4. Enter the maximum marks for the review, then separate marks and optional feedback for every student.
5. Click **Save review**. Saving replaces that round's current marks and retains the previous submission in `project_mark_history`.
6. A faculty member allotted only as a reviewer has a read-only marks view. The backend independently checks the supervisor assignment even if someone edits the browser JavaScript.

## Data and access

The website is publicly reachable on GitHub Pages, but group details require an authenticated, verified account. Application tables have Row Level Security enabled and direct browser table access is revoked. Only the supplied database functions can read or write records, and they check the signed-in identity and role. Students see their own group, faculty see allotted groups, and the coordinator sees all groups. Session tokens are kept in the browser tab's session storage; student records and marks remain in Supabase.

Keep the existing Supabase project when updating website files. Uploading newer HTML/CSS/JavaScript does not remove saved data. Do not delete/recreate tables to perform an update.

Changing Supabase Auth email addresses separately from application profiles is not supported by this version. Accounts should retain their original registered email. Password changes are supported after sign-in.

## Troubleshooting

- **Connect the application:** fill both placeholders in `config.js`, commit the change, and refresh the deployed site.
- **Confirmation email not received:** check spam, enable the Email provider, and check Supabase SMTP settings and email delivery logs.
- **Invalid redirect:** add the exact deployed URL, including repository path and trailing slash, to Supabase's allowed redirect URLs.
- **Faculty cannot create an account:** import that email before faculty registration. If an email was previously registered as a student, resolve that account before reusing it for faculty.
- **Duplicate details:** registration numbers, email IDs and mobile numbers are unique. Use the student's existing account rather than registering again.
- **Student cannot join a group:** every member must confirm their account and must not belong to another group. Names, emails and mobiles must match their account details.
- **Supervisor cannot enter marks:** verify that the logged-in faculty is the group's supervisor, rather than Reviewer 1 or Reviewer 2.
- **Login/account help:** administrators can manage authentication in Supabase's Authentication dashboard. This UI does not include a forgotten-password email flow.

## Optional developer checks

Install Node.js 22 or later, then run:

```sh
npm install
npm test
npm run check
```

The database tests execute this actual SQL in an isolated PostgreSQL runtime with a minimal mock of Supabase's Auth schema. They test duplicate constraints, transactions, roles, group limits, three review rounds, supervisor permissions, contact visibility and denial of direct table access. They do not test a real Supabase project's email delivery or a deployed GitHub Pages account.

## Files

- `index.html`: website shell.
- `assets/style.css`: responsive styling.
- `assets/app.js`: coordinator, student and supervisor UI.
- `assets/backend.js`: Supabase authentication and database calls.
- `config.js`: your browser-safe connection settings.
- `backend/setup.sql`: schema, signup trigger and authorized database functions.
- `assets/xlsx.full.min.js`: bundled Excel reading/writing library; its license is included.
- `tests/`: optional verification tests.

## Official references

- GitHub Pages setup: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Supabase password login and email confirmation: https://supabase.com/docs/guides/auth/passwords
- Supabase email configuration: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase database access controls: https://supabase.com/docs/guides/database/postgres/row-level-security
