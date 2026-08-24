# Product — Academic PWA

## 1. Description

This application is a mobile PWA that allows a student to quickly view their academic information.

The application should feel like a personal mobile application rather than a traditional administrative portal.

The main goal is to allow the student to open the application and immediately know:

- which class they currently have;
- what their next class is;
- what their grades are;
- how their academic progress is going;
- whether they have any relevant notification or outstanding balance.

The application consumes data through the TypeScript package `sith-api-client`.

---

## 2. User Experience Principles

The application should prioritize:

1. Fast access to information.
2. A mobile-first interface.
3. Relevant information without unnecessary navigation.
4. Persistence of the latest available data.
5. Refreshing through gestures instead of administrative-style controls.
6. Simple authentication after the first login.
7. A clean interface with minimal unnecessary information.

The application should not attempt to reproduce the institution's web portal.

It should only present the information that is useful to the student on a day-to-day basis.

---

## 3. Main Navigation

The application will have three main areas:

- Schedule
- Grades
- Student

The main navigation will be located at the bottom of the screen on mobile devices.

Icons and labels must clearly indicate which section is currently active.

---

## 4. Home Screen

The home screen will be dynamic.

The application will determine which of the two views is more relevant to the student:

- Schedule
- Grades

### If the student has no grades

The home screen will be:

### Schedule

This allows a student who does not yet have grades to immediately access the information that is most useful during the day.

### If the student has grades

The home screen will be:

### Grades

The position of the home screen within the navigation, as well as its icon and label, must reflect this change.

The other screen will remain available through the navigation.

This decision must be determined from the student's current data and not through a manual configuration.

---

## 5. Schedule

The schedule is one of the application's main features.

The default view displays the schedule for the current day.

The schedule is represented as a vertical timeline.

Each class should display, when the information is available:

- course name;
- start time;
- end time;
- classroom;
- professor;
- other relevant information.

---

## 5.1 Current Day

When opening the schedule, the current day must be displayed.

Classes must be organized chronologically.

Classes that have completely finished should not be displayed in the main view for the current day.

The application must keep visible:

- the class currently in progress;
- the next class;
- the remaining classes later in the day.

Information before the current time may be visually removed from the view to avoid unnecessary clutter.

---

## 5.2 Current Class

The class that is currently taking place must receive the highest visual priority.

Example:

If the current time is 10:30 and a class runs from 10:00 to 11:00:

```text
10:00 ┌────────────────────┐
      │ Mathematics        │
      │                    │
10:30 ├───────────────●────│ ← current time
      │                    │
11:00 └────────────────────┘
```
