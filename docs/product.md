# Product — Academic PWA

## 1. Mission

Academic PWA is a mobile-first application that gives students fast access to the academic information they need throughout the day.

The application should feel like a personal mobile application rather than a traditional institutional administrative portal.

The primary goal is that, when the student opens the application, they can immediately understand:

- which class they are currently attending;
- what their next class is;
- what their grades are;
- how their academic progress is going;
- whether they have relevant notices;
- whether they have an outstanding balance.

The application consumes academic data through the TypeScript package `sith-api-client`.

The product should prioritize useful information and day-to-day usability over reproducing the functionality or structure of the institution's web portal.

## 2. Users

### Primary User

Enrolled students who need quick access to their own academic information, primarily from a mobile device.

### Secondary Users

None are currently defined.

## 3. Problems

Students using traditional institutional portals may need to navigate through several administrative screens to answer simple day-to-day questions.

The application addresses the following problems:

- It takes too long to determine which class is currently in progress.
- The next class is not immediately visible.
- Academic information is distributed across different sections of an institutional portal.
- Repeated authentication creates unnecessary friction on mobile devices.
- Poor connectivity can make previously available academic information inaccessible.
- Administrative interfaces contain information and controls that are not relevant to everyday student use.

## 4. Product Principles

The application should follow these principles:

1. Fast access to information.
   - The most relevant information should be visible immediately after opening the application.

2. Mobile first.
   - The primary experience is designed for mobile devices.
   - Desktop support should not compromise the mobile experience.

3. Context over navigation.
   - Students should not need to navigate through several screens to answer common questions.

4. Personal application, not administrative portal.
   - The interface should feel focused, lightweight, and personal.
   - The application should not reproduce the institution's portal structure.

5. Latest known data.
   - Previously retrieved valid data should remain available when a refresh fails or connectivity is unavailable.

6. Gesture-first interaction.
   - Pull-to-refresh is the primary manual refresh interaction.
   - Administrative-style refresh buttons should not be a prominent part of the interface.

7. Minimal authentication friction.
   - The application should avoid requiring the student to repeatedly enter credentials when a secure alternative is available.

8. Data-driven behavior.
   - Important application behavior should be determined from the student's current data rather than manual configuration.

## 5. Main Navigation

The application has three primary areas:

1. Schedule
2. Grades
3. Student

Navigation is located at the bottom of the screen on mobile devices.

The active destination must be clearly identifiable through both icon and label.

The first navigation item represents the application's contextual home.

The contextual home is determined automatically from the student's academic data: Schedule is the default home, and Grades opens first only when there are unseen grade changes to review (see section 6).

The other primary area remains accessible through navigation.

Notices and outstanding balances are not primary navigation destinations. They should appear contextually within the appropriate screens or as alerts.

## 6. Contextual Home

The home experience is determined automatically from the student's current academic data.

The student must not manually configure which section is the home screen.

### 6.1 Default Home: Schedule

Schedule is the contextual home by default because it provides immediate day-to-day value.

The home screen should show the current day's relevant schedule, including:

- current class, when applicable;
- next class;
- remaining classes for the day.

### 6.2 Grades First With Unseen Changes

Grades becomes the contextual home only when all of the following hold:

- local grade tracking has detected unseen changes since the last review (a subject appearing for the first time after the baseline, or a modified grade);
- the period average exists as a numeric value;
- that value is not zero.

In any other case — nothing pending to review, changes already consumed, an empty or non-numeric average, or a zero average — Schedule is the home.

Changes are considered consumed when the student opens the Grades area. Subsequent app launches return to Schedule until the next change is detected. The first successful data load only establishes the tracking baseline and never triggers the Grades home.

When Grades is the home, the view should prioritize the student's academic status and progress. Schedule remains accessible through the main navigation.

### 6.3 Home Transition

The transition between Schedule and Grades must be data-driven.

It should not require:

- a user preference;
- a configuration setting;
- an administrator setting.

The application determines the appropriate home from the latest available student data each time the application starts.

## 7. Schedule

Schedule is one of the application's primary features.

The default schedule view represents the current day.

The schedule is presented as a vertical timeline.

Each class should display, when available:

- course name;
- start time;
- end time;
- classroom;
- professor;
- other relevant academic information.

The schedule should prioritize temporal context over displaying unnecessary historical information.

### 7.1 Current Day

When the student opens Schedule, the current day is displayed by default.

Classes must be ordered chronologically.

For the current day:

- completely finished classes should not appear in the primary contextual view;
- the class currently in progress must remain visible;
- the next upcoming class must remain visible;
- later classes must remain visible.

Information that occurred earlier in the day may be visually collapsed or removed from the contextual view to reduce clutter.

The student should always be able to understand:

1. what is happening now;
2. what happens next;
3. what remains later today.

### 7.2 Current Class

The class currently in progress receives the highest visual priority.

For example, if the current time is 10:30 and a class runs from 10:00 to 11:00:

10:00 ┌────────────────────┐
│ Mathematics │
│ │
10:30 ├───────────────●────│ ← current time
│ │
11:00 └────────────────────┘

The current class should be visually distinguishable from upcoming classes.

The UI should communicate:

- that the class is currently in progress;
- how much time has elapsed;
- how much time remains;
- the current time relative to the class interval.

The visual treatment should update as time passes without requiring the student to manually refresh the screen.

### 7.3 Next Class

When there is no class currently in progress, the next upcoming class becomes the primary schedule item.

When a class is currently in progress, the next class should remain visible immediately after it.

The next class should provide enough information for the student to know where and when they need to go.

### 7.4 End of Day

When all classes for the current day have finished, the schedule should communicate that there are no remaining classes today.

The application should not present an empty screen without context.

The student may still navigate to other schedule days through the available day-navigation mechanism.

### 7.5 Schedule Days

The initial experience is centered on the current day.

The application supports navigation between schedule days. A three-dot menu shows
[previous, selected, next] and always centers the day being viewed; the window
moves freely (infinite scrolling) as the student changes days. The student can
switch days by swiping horizontally over the class list or by tapping one of the
three dots.

Horizontal swiping on the class list changes the day; the tap targets provide the
accessible non-gesture alternative required whenever gestures are supported.

The initial MVP should not require a two-day simultaneous schedule view.

## 8. Grades

Grades are one of the application's primary areas and may become the contextual home once grades are available.

The Grades experience should allow the student to quickly understand:

- current grades;
- courses associated with those grades;
- overall academic progress;
- relevant academic status.

The interface should prioritize summary information first and detailed information second.

The application should avoid reproducing every field available in the institutional portal unless that information is necessary for the student's day-to-day academic use.

### 8.1 Academic Progress

Academic progress should be presented in a way that is understandable without requiring the student to navigate through administrative reports.

Where sufficient data is available, the application should communicate:

- progress toward academic completion;
- relevant totals or percentages;
- current academic standing.

If progress data is unavailable, the UI should gracefully omit the unavailable metric rather than display misleading values.

## 9. Student

The Student area contains information and actions related to the student's identity and account.

It may include, when available:

- student name;
- student identification information;
- academic program;
- institution-related information;
- authentication/session actions.

The Student section should not become a replica of the institution's account portal.

Only information relevant to the student's use of this application should be included.

## 10. Notices

Relevant academic notices should be surfaced contextually.

Notices are not a primary navigation destination.

The application should prioritize notices that require the student's attention.

A notice should communicate enough information to understand:

- what happened or what is being announced;
- whether action is required;
- whether the notice is relevant or urgent.

The application should avoid turning notices into an administrative inbox unless that functionality is explicitly required.

## 11. Outstanding Balance

Outstanding balances should be surfaced as relevant alerts or contextual information.

Debt or payment information is not a primary navigation destination.

When a balance exists, the application should make it visible without overwhelming the primary academic experience.

The application should clearly distinguish:

- no outstanding balance;
- an outstanding balance;
- unavailable or outdated balance information.

## 12. Authentication

Authentication should be simple and appropriate for repeated mobile use.

The first authentication may require the student's credentials.

After successful authentication, the application should avoid unnecessary repeated credential entry when a secure mechanism is available.

The application may remember the student's username locally to reduce friction; the password is never persisted.

The application must not store the student's password in:

- localStorage;
- sessionStorage;
- IndexedDB;
- or equivalent browser storage.

Future authentication improvements may use WebAuthn/passkeys when supported by the backend.

The product should not depend on storing the student's password as a shortcut for authentication.

## 13. Data and Persistence

The application should prioritize continuity of the student experience.

After academic data has been successfully retrieved, the latest valid data should be persisted locally.

When the application is reopened:

1. previously stored valid data should be displayed as soon as possible;
2. the application should attempt to obtain newer data when appropriate;
3. fresh data should replace the cached data after a successful refresh.

If refreshing fails:

- previously valid data must not be deleted;
- the student should continue to see the latest known information;
- the interface should communicate that the displayed information may not be current when necessary.

The student should never be presented with an unnecessarily blank application simply because a refresh failed.

The specific persistence technology is an implementation concern and is defined separately in the architecture documentation.

## 14. Refresh

Pull-to-refresh is the primary manual refresh interaction.

The interface should not rely on a prominent administrative-style "Refresh" or "Actualizar" button.

A refresh should update the application's academic data coherently.

The application should avoid situations where individual screens display inconsistent versions of the student's data.

A failed refresh must not remove valid cached information.

## 15. Loading and Empty States

Every primary area must have an appropriate state for:

- initial loading;
- cached data being displayed while refreshing;
- no available data;
- failed refresh;
- unavailable data fields.

Loading states should communicate activity without unnecessarily blocking information that is already available from local persistence.

Empty states should explain what the absence of data means rather than simply displaying an empty container.

## 16. Offline and Poor Connectivity

The application should remain useful when connectivity is limited.

When valid cached information exists:

- the application should display it immediately;
- a background or subsequent refresh may attempt to retrieve newer information;
- failed network requests must not erase the cached information.

The offline experience should prioritize information that is useful without a live connection, especially:

- today's schedule;
- grades;
- academic progress;
- student information.

The interface should distinguish cached information from successfully refreshed information when that distinction is relevant to the student.

## 17. Notifications and Alerts

The application surfaces outstanding-balance alerts locally: when freshly loaded data reveals an outstanding balance that was not present before, and after the student opts in, the app may notify through the platform's local notification mechanism.

When there is no outstanding balance, the application stays silent.

Local alerts fire only while the application runs or checks data. Silent background push would require server-side credential handling and remains out of scope pending backend token support (see `docs/api.md`).

The application also surfaces short in-app messages when a data refresh detects a relevant event: new or changed grades (including which subject and grade changed), a newly appearing outstanding balance, and career progress gains. These in-app messages are informational, require no permission, and are independent of the opt-in for platform notifications.

By default these events surface through the persistent context capsule, which expands on its own, shows the event detail first (for grades: subject and grade), then the period average, and collapses back. A development setting switches the channel to classic toasts; both channels show the same events exactly once per real fetch detection.

Relevant notices and important academic information continue to be surfaced within the application.

## 18. PWA Experience

The application is intended to behave as a mobile PWA.

The experience should support:

- installation on compatible devices;
- application-like navigation;
- persistence of useful data;
- appropriate loading behavior when launched;
- resilience to temporary connectivity loss.

The PWA should feel like a personal application rather than a website wrapped in an application shell.

Specific PWA implementation details belong in the architecture documentation.

## 19. Accessibility

Important interactions must not depend exclusively on gestures.

For example, if schedule-day navigation supports swiping, an accessible non-gesture alternative must also be provided.

Navigation labels and icons must clearly communicate their purpose.

Information conveyed through color should also be distinguishable through text, position, iconography, or other visual cues.

The application should remain usable with appropriate text scaling and assistive technologies.

## 20. Scope

The initial product includes:

- contextual Home;
- Schedule;
- Grades;
- Student;
- academic progress;
- relevant notices;
- outstanding balance information;
- authentication;
- local persistence of valid academic data;
- pull-to-refresh;
- offline/poor-connectivity resilience;
- mobile-first PWA behavior.

## 21. Non-Goals

The application should not attempt to:

- reproduce the institution's complete web portal;
- expose every field available through the academic API;
- turn notices into a primary navigation area;
- turn debts into a primary navigation area;
- store student passwords in browser storage;
- require a two-day simultaneous schedule view in the initial MVP;
- implement push notifications in the initial MVP;
- implement biometric authentication by storing or reusing the student's password.

Additional institutional functionality should only be added when it provides clear day-to-day value to the student.

## 22. Product Decisions

The following decisions are intentional.

### Schedule Is the Default Home

Schedule provides immediate day-to-day value, so it remains the contextual home unless there is something specific to review in Grades.

### Grades First Only With Unseen Changes

When local tracking detects new or changed grades and the period average is non-zero, Grades becomes the contextual home until the student reviews them. This keeps academic progress as a meaningful primary signal exactly when it changes.

### No Dedicated Notices Tab

Notices are contextual information rather than a primary daily destination.

### No Dedicated Debt Tab

Outstanding balances are alerts or contextual information rather than a primary academic workflow.

### Pull-to-Refresh

Refreshing should feel like a modern mobile interaction rather than an administrative portal operation.

### Cached Data

Previously retrieved information should remain useful even when the network is unavailable or a refresh fails.

### No Stored Passwords

Convenience must not come from storing sensitive authentication credentials in browser storage.

## 23. Product Success

The product should ultimately be evaluated by whether students can answer common questions quickly.

Initial success signals should include:

- time required to identify the current class;
- time required to identify the next class;
- time required to find current grades;
- frequency of daily usage;
- successful use when connectivity is unavailable;
- frequency of failed or repeated authentication;
- ability to understand academic status without navigating the institutional portal.

These metrics should be defined and measured once the application is available to real students.

## 24. Out of Scope for This Document

This document defines product behavior and user-facing scope.

The following should be documented separately:

- React component architecture;
- folder structure;
- API implementation details;
- sith-api-client internals;
- AppData implementation;
- IndexedDB schema;
- service worker configuration;
- Vite configuration;
- PWA plugin configuration;
- API caching implementation;
- authentication token implementation;
- backend-specific WebAuthn behavior.

Those details belong in the architecture and engineering documentation.

## 25. Source of Truth

This document should be the primary source of truth for product behavior and scope.

Engineering documentation may describe how the product is implemented, but should not silently introduce product behavior that contradicts this document.

If another document conflicts with this one, the conflict should be resolved explicitly rather than allowing different interpretations of the product to coexist.

Implementation-specific facts, repository status, TODOs, and technical assumptions should remain outside this document unless they change the product requirements themselves.
