import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Learning } from './pages/Learning';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Mentors } from './pages/Mentors';
import { MentorBooking } from './pages/MentorBooking';
import { Community } from './pages/Community';
import { Leaderboard } from './pages/Leaderboard';
import { LearningPath } from './pages/LearningPath';
import { Rewards } from './pages/Rewards';
import { ProfileSettings } from './pages/ProfileSettings';
import { Portfolio } from './components/Portfolio';
import { SkillGraphPage } from './pages/SkillGraphPage';
import { AssessmentPage } from './pages/AssessmentPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'courses', Component: Courses },
      { path: 'courses/:id', Component: CourseDetail },
      { path: 'courses/:courseId/lesson/:lessonId', Component: Learning },
      { path: 'projects', Component: Projects },
      { path: 'projects/:id', Component: ProjectDetail },
      { path: 'mentors', Component: Mentors },
      { path: 'mentors/:id/book', Component: MentorBooking },
      { path: 'community', Component: Community },
      { path: 'leaderboard', Component: Leaderboard },
      { path: 'learning-path', Component: LearningPath },
      { path: 'rewards', Component: Rewards },
      { path: 'settings', Component: ProfileSettings },
      { path: 'portfolio', Component: Portfolio },
      { path: 'skill-graph', Component: SkillGraphPage },
      { path: 'assessment', Component: AssessmentPage }
    ]
  }
]);
