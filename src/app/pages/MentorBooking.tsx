import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { Star, Calendar, Clock, Video, DollarSign, Award, MessageCircle, CheckCircle } from 'lucide-react';

export function MentorBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [topic, setTopic] = useState('');

  const mentor = {
    id: 1,
    name: 'Sarah Chen',
    role: 'Senior Frontend Engineer',
    company: 'Google',
    rating: 4.9,
    sessions: 127,
    rate: 80,
    availability: 'Available',
    expertise: ['React', 'TypeScript', 'Performance', 'Architecture'],
    bio: 'Passionate about building scalable web applications and mentoring the next generation of developers. 8+ years of experience in frontend development.',
    languages: ['English', 'Mandarin'],
    timezone: 'PST (UTC-8)'
  };

  const availableSlots = [
    { date: '2026-04-29', slots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'] },
    { date: '2026-04-30', slots: ['09:00 AM', '11:00 AM', '03:00 PM'] },
    { date: '2026-05-01', slots: ['10:00 AM', '01:00 PM', '03:30 PM', '05:00 PM'] },
    { date: '2026-05-02', slots: ['09:30 AM', '02:00 PM', '04:30 PM'] }
  ];

  const topicSuggestions = [
    'React Performance Optimization',
    'State Management Best Practices',
    'Component Architecture',
    'TypeScript Advanced Patterns',
    'Career Guidance',
    'Code Review',
    'Custom - Describe your topic'
  ];

  const reviews = [
    {
      student: 'Alex Morgan',
      rating: 5,
      comment: 'Sarah provided excellent guidance on React performance. Very knowledgeable and patient!',
      date: 'Mar 10, 2026'
    },
    {
      student: 'John Doe',
      rating: 5,
      comment: 'Great mentor! Helped me understand complex state management concepts.',
      date: 'Feb 28, 2026'
    },
    {
      student: 'Jane Smith',
      rating: 4.5,
      comment: 'Very helpful session on TypeScript. Would definitely book again.',
      date: 'Feb 15, 2026'
    }
  ];

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !topic) {
      alert('Please select date, time, and topic');
      return;
    }
    console.log('Booking:', { date: selectedDate, time: selectedTime, topic });
    alert('Session booked successfully!');
  };

  return (
    <div>
      <button
        onClick={() => navigate('/mentors')}
        className="text-sm text-primary hover:underline mb-4"
      >
        ← Back to Mentors
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl flex-shrink-0">
                {mentor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl mb-2">{mentor.name}</h1>
                <p className="text-lg text-muted-foreground mb-3">
                  {mentor.role} @ {mentor.company}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-medium">{mentor.rating}</span>
                    <span className="text-muted-foreground">({mentor.sessions} sessions)</span>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded">
                    {mentor.availability}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3">About</h3>
              <p className="text-muted-foreground">{mentor.bio}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.expertise.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-muted text-sm rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {mentor.languages.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-muted text-sm rounded">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Timezone: {mentor.timezone}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-4">Book a Session</h2>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Select Topic</label>
                <div className="grid grid-cols-2 gap-2">
                  {topicSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setTopic(suggestion)}
                      className={`p-3 text-sm text-left rounded-lg border transition-colors ${
                        topic === suggestion
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                {topic === 'Custom - Describe your topic' && (
                  <textarea
                    placeholder="Describe what you'd like to discuss..."
                    className="w-full mt-3 px-4 py-3 border border-border rounded-lg bg-background resize-none"
                    rows={3}
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Select Date & Time</label>
                <div className="space-y-3">
                  {availableSlots.map((day) => (
                    <div key={day.date} className="border border-border rounded-lg p-4">
                      <div className="text-sm font-medium mb-3">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {day.slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => {
                              setSelectedDate(day.date);
                              setSelectedTime(slot);
                            }}
                            className={`px-3 py-2 text-sm rounded border transition-colors ${
                              selectedDate === day.date && selectedTime === slot
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Session Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>60 minutes session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span>Video call via Google Meet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${mentor.rate} per session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-2xl mb-4">Student Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="pb-4 border-b border-border last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium">{review.student}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(review.rating)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h3 className="mb-4">Booking Summary</h3>
            <div className="space-y-4 mb-6">
              {selectedDate && selectedTime ? (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-muted-foreground">{selectedTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">Topic</div>
                      <div className="text-muted-foreground">{topic || 'Not selected'}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Select date, time, and topic above
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Session fee</span>
                <span className="text-sm">${mentor.rate}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Platform fee</span>
                <span className="text-sm">$5</span>
              </div>
              <div className="flex items-center justify-between font-medium pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-lg">${mentor.rate + 5}</span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!selectedDate || !selectedTime || !topic}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Booking
            </button>

            <div className="mt-4 text-xs text-center text-muted-foreground">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Free cancellation up to 24 hours before
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
