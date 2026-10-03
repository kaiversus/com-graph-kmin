import { Video, Calendar, User } from 'lucide-react';

interface MentorSessionCardProps {
  mentorName: string;
  mentorRole: string;
  topic: string;
  date: string;
  time: string;
  platform: string;
}

export function MentorSessionCard({ mentorName, mentorRole, topic, date, time, platform }: MentorSessionCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="truncate">{mentorName}</h4>
          <p className="text-sm text-muted-foreground">{mentorRole}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-sm"><span className="text-muted-foreground">Topic:</span> {topic}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{date} at {time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="w-4 h-4" />
          <span>{platform}</span>
        </div>
      </div>
      <button className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
        Join Session
      </button>
    </div>
  );
}
