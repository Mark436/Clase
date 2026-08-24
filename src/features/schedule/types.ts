export interface ClassMeeting {
  subjectName: string;
  group: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export type WeekSchedule = ClassMeeting[];
