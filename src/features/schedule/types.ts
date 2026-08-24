export interface ClassMeeting {
  subjectName: string;
  classroom: string;
  professor: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
}

export type WeekSchedule = ClassMeeting[];
