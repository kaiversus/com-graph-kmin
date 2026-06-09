import { Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  title: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  timeLeft: string;
  thumbnail: string;
}

export function CourseCard({ title, progress, lessonsCompleted, totalLessons, timeLeft, thumbnail }: CourseCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-white opacity-50" />
        </div>
      </div>
      <div className="p-4">
        <h4 className="mb-3">{title}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Clock className="w-4 h-4" />
          <span>{timeLeft} left</span>
          <span className="ml-auto">{lessonsCompleted}/{totalLessons} lessons</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
      </div>
    </div>
  );
}
