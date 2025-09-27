import type { User, Meeting, Task, Notification, Presentation } from '../types';

const DB_KEY = 'aiMeetingBuddyDB';

interface Database {
  user: User;
  meetings: Meeting[];
  tasks: Task[];
  notifications: Notification[];
  // Fix: Add presentations to the database interface.
  presentations: Presentation[];
}

const getInitialData = (): Database => {
    const now = new Date();
    const userEmail = 'alex.doe@example.com';
    
    // Create specific dates for consistent data across components
    // Using September 2024 as the base month for testing
    const baseDate = new Date(2024, 8, 27); // September 27, 2024
    const today = new Date(baseDate);
    const tomorrow = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
        user: {
            id: 'user-1',
            name: 'Vishal',
            email: userEmail,
            company: 'Innovate Inc.',
            timezone: 'America/New_York',
        },
        meetings: [
            // LIVE MEETING (happening now)
            { 
              id: 'm-live', 
              title: 'Q4 Strategy Finalization', 
              description: 'Final review of the Q4 strategic plan. All stakeholders to be present for sign-off.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'sara.lee@example.com', 'bob.jones@example.com', 'sam.wilson@example.com', 'olivia.davis@example.com', 'david.brown@example.com', 'emily.white@example.com'], 
              startTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // Started 15 mins ago
              endTime: new Date(now.getTime() + 45 * 60 * 1000).toISOString(), // Ends in 45 mins
              documents: [
                { name: 'Q4_Strategic_Plan_Draft_v3.pdf', url: '#' },
                { name: 'Marketing_Budget_Projections.xlsx', url: '#' }
              ],
              waitingRoom: true,
              passcode: 'q4strat',
              aiNotes: `[00:01:15] Alex Doe: Alright, let's kick off the Q4 strategy finalization meeting. Thanks everyone for joining. The main goal today is to get full sign-off on the plan.
[00:02:30] Jane Smith: Morning all. From marketing, the budget projections are locked. We're looking at a 15% increase in digital ad spend, focused on the 'Nova' campaign.
[00:04:10] Bob Jones: Is that budget approved? Last I heard, finance was pushing back.
[00:04:55] Jane Smith: It was approved yesterday afternoon. I've uploaded the final numbers to the shared folder.
[00:05:45] Mike Chen: Good to hear, Jane. From the product side, the new feature roadmap is aggressive but achievable. We must prioritize the 'Phoenix' module to support the 'Nova' campaign.
[00:07:00] Sam Wilson: What's the impact on Project Griffin? It's currently slated for a Q4 start.
[00:08:15] Mike Chen: Griffin will have to be pushed to early Q1. Phoenix is the revenue driver for this quarter, we can't split focus.
[00:09:20] Sara Lee: Operations are ready. We have the resources allocated for Phoenix, assuming the timeline is confirmed today. A delay on Griffin is fine from our end, we'll just re-allocate those resources.
[00:12:10] Alex Doe: Okay, consensus is to lock in the 'Phoenix' module as priority one. Mike, can your team deliver the beta by November 1st? That's the hard deadline.
[00:14:05] Mike Chen: Yes, that's feasible, but it's tight. We'll need the final marketing assets from Jane's team by mid-October to integrate into the user onboarding.
[00:15:30] Alex Doe: That's a clear dependency. Action item: Jane to provide all marketing assets for Phoenix to Mike by October 15th.
[00:17:50] Jane Smith: Understood. We can do that. I'll sync with my content creators this week to get that scheduled.
[00:19:00] Olivia Davis: On the client-facing side, my team needs talking points about the Griffin delay. When can we expect those?
[00:20:15] Alex Doe: Good point, Olivia. I'll draft the internal and external comms regarding the updated roadmap. Action item: Alex to circulate draft roadmap communications by end of day Friday.
[00:22:45] David Brown: I've reviewed the technical specs for Phoenix. The integration with the new payment gateway looks complex. We should budget extra time for QA.
[00:24:00] Alex Doe: Agreed. Let's add a buffer week. Sara, can operations support a slightly extended QA cycle?
[00:24:45] Sara Lee: Yes, we can accommodate that. Just keep us in the loop on the timeline.
... AI is actively listening ...`,
              manualNotes: 'Confirmed Phoenix is P1. Need to circle back on the resource allocation for the \'Griffin\' module, which is now secondary.'
            },
            
            // TODAY'S MEETINGS (September 27, 2024)
            { 
              id: 'm-today-1', 
              title: 'Daily Standup', 
              description: 'Morning standup with the development team.', 
              participants: [userEmail, 'mike.chen@example.com', 'sam.wilson@example.com', 'david.brown@example.com'], 
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(), // 9:00 AM today
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(), // 9:30 AM today
              waitingRoom: false,
              aiNotes: "Daily standup agenda:\n- Review yesterday's progress\n- Today's priorities\n- Blockers and impediments\n- Quick updates from each team member"
            },
            { 
              id: 'm-today-4', 
              title: 'Design Review Session', 
              description: 'Review of new UI/UX designs for the upcoming feature release.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'olivia.davis@example.com'], 
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(), // 10:00 AM today
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(), // 11:00 AM today
              waitingRoom: false,
              aiNotes: "Design Review Session agenda:\n- Present new UI mockups\n- Review user experience flows\n- Discuss design feedback\n- Plan implementation timeline"
            },
            { 
              id: 'm-today-5', 
              title: 'Performance Metrics Review', 
              description: 'Weekly review of application performance metrics and optimization opportunities.', 
              participants: [userEmail, 'mike.chen@example.com', 'david.brown@example.com', 'sam.wilson@example.com'], 
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(), // 11:30 AM today
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString(), // 12:30 PM today
              waitingRoom: false,
              aiNotes: "Performance Metrics Review agenda:\n- Review current performance data\n- Identify optimization opportunities\n- Plan performance improvements\n- Assign optimization tasks"
            },
            { 
              id: 'm-today-2', 
              title: 'Client Check-in: TechCorp', 
              description: 'Weekly check-in with TechCorp to review project status.', 
              participants: [userEmail, 'olivia.davis@example.com'], 
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(), // 2:00 PM today
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(), // 3:00 PM today
              waitingRoom: true,
              passcode: 'techcorp123',
              aiNotes: "TechCorp check-in agenda:\n- Review weekly deliverables\n- Address any concerns\n- Plan next week's priorities\n- Discuss upcoming milestones"
            },
            { 
              id: 'm-today-3', 
              title: 'Product Review Meeting', 
              description: 'Review of current product features and upcoming releases.', 
              participants: [userEmail, 'mike.chen@example.com', 'jane.smith@example.com'], 
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(), // 4:00 PM today
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(), // 5:00 PM today
              waitingRoom: false,
              aiNotes: "Product review agenda:\n- Current feature status\n- Upcoming release timeline\n- User feedback analysis\n- Feature prioritization"
            },
            
            // TOMORROW'S MEETINGS (September 28, 2024)
            { 
              id: 'm-tomorrow-1', 
              title: 'Project Phoenix Planning', 
              description: 'Deep dive into Project Phoenix requirements and timeline.', 
              participants: [userEmail, 'mike.chen@example.com', 'jane.smith@example.com', 'sara.lee@example.com'], 
              startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(), // 10:00 AM tomorrow
              endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0).toISOString(), // 12:00 PM tomorrow
              waitingRoom: true,
              passcode: 'phoenix2024',
              aiNotes: "Project Phoenix planning session:\n- Review technical requirements\n- Discuss resource allocation\n- Set realistic timelines\n- Identify potential risks"
            },
            { 
              id: 'm-tomorrow-2', 
              title: 'Marketing Strategy Review', 
              description: 'Review Q4 marketing strategy and budget allocation.', 
              participants: [userEmail, 'jane.smith@example.com', 'david.brown@example.com'], 
              startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0).toISOString(), // 3:00 PM tomorrow
              endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 0).toISOString(), // 4:00 PM tomorrow
              waitingRoom: false,
              aiNotes: "Marketing strategy review:\n- Q4 campaign performance\n- Budget utilization\n- ROI analysis\n- Next quarter planning"
            },
            
            // DAY AFTER TOMORROW
            { 
              id: 'm-dayafter-1', 
              title: 'Team Building Workshop', 
              description: 'Quarterly team building and collaboration workshop.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'sara.lee@example.com', 'bob.jones@example.com', 'sam.wilson@example.com', 'olivia.davis@example.com', 'david.brown@example.com', 'emily.white@example.com'], 
              startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 9, 0).toISOString(), // 9:00 AM day after
              endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 17, 0).toISOString(), // 5:00 PM day after
              waitingRoom: false,
              aiNotes: "Team building workshop agenda:\n- Ice breaker activities\n- Collaboration exercises\n- Team dynamics discussion\n- Goal setting for next quarter"
            },
            
            // ADDITIONAL UPCOMING MEETINGS (Next 3 days)
            { 
              id: 'm-upcoming-1', 
              title: 'Sprint Planning Session', 
              description: 'Planning the next development sprint with the engineering team.', 
              participants: [userEmail, 'mike.chen@example.com', 'sam.wilson@example.com', 'david.brown@example.com'], 
              startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0).toISOString(), // 2:00 PM tomorrow
              endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30).toISOString(), // 3:30 PM tomorrow
              waitingRoom: false,
              aiNotes: "Sprint planning agenda:\n- Review previous sprint results\n- Plan next sprint goals\n- Estimate story points\n- Assign tasks and responsibilities"
            },
            { 
              id: 'm-upcoming-2', 
              title: 'Client Demo: Acme Corp', 
              description: 'Product demonstration for potential client Acme Corp.', 
              participants: [userEmail, 'jane.smith@example.com', 'olivia.davis@example.com'], 
              startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 10, 0).toISOString(), // 10:00 AM day after
              endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 11, 0).toISOString(), // 11:00 AM day after
              waitingRoom: true,
              passcode: 'acme2024',
              aiNotes: "Acme Corp demo agenda:\n- Product overview presentation\n- Key features demonstration\n- Q&A session\n- Next steps discussion"
            },
            { 
              id: 'm-upcoming-3', 
              title: 'Weekly Team Sync', 
              description: 'Weekly synchronization meeting with all team leads.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'sara.lee@example.com'], 
              startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 15, 0).toISOString(), // 3:00 PM day after
              endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 16, 0).toISOString(), // 4:00 PM day after
              waitingRoom: false,
              aiNotes: "Weekly team sync agenda:\n- Review progress on current projects\n- Discuss any blockers\n- Plan next week's priorities\n- Team updates and announcements"
            },
            { 
              id: 'm-upcoming-4', 
              title: 'UX Research Review', 
              description: 'Review of user experience research findings and recommendations.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'olivia.davis@example.com'], 
              startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 1, 11, 0).toISOString(), // 11:00 AM day after + 1
              endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 1, 12, 0).toISOString(), // 12:00 PM day after + 1
              waitingRoom: false,
              aiNotes: "UX Research Review agenda:\n- Present research findings\n- Discuss user feedback\n- Review design recommendations\n- Plan implementation timeline"
            },
            { 
              id: 'm-upcoming-5', 
              title: 'Budget Planning Meeting', 
              description: 'Q1 2025 budget planning and resource allocation discussion.', 
              participants: [userEmail, 'sara.lee@example.com', 'bob.jones@example.com', 'david.brown@example.com'], 
              startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 1, 14, 0).toISOString(), // 2:00 PM day after + 1
              endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 1, 15, 30).toISOString(), // 3:30 PM day after + 1
              waitingRoom: true,
              passcode: 'budget2025',
              aiNotes: "Budget Planning Meeting agenda:\n- Review current budget status\n- Plan Q1 2025 allocations\n- Discuss resource requirements\n- Approve budget proposals"
            },
            { 
              id: 'm-upcoming-6', 
              title: 'Security Audit Review', 
              description: 'Review of security audit findings and implementation plan.', 
              participants: [userEmail, 'mike.chen@example.com', 'david.brown@example.com', 'sam.wilson@example.com'], 
              startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 2, 9, 0).toISOString(), // 9:00 AM day after + 2
              endTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate() + 2, 10, 30).toISOString(), // 10:30 AM day after + 2
              waitingRoom: false,
              aiNotes: "Security Audit Review agenda:\n- Present audit findings\n- Discuss security vulnerabilities\n- Plan remediation steps\n- Assign security tasks"
            },
            
            // NEXT WEEK MEETINGS
            { 
              id: 'm-nextweek-1', 
              title: 'Quarterly Business Review', 
              description: 'Comprehensive review of Q4 performance and Q1 planning.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'sara.lee@example.com', 'bob.jones@example.com'], 
              startTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0).toISOString(), // 9:00 AM next week
              endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 17, 0).toISOString(), // 5:00 PM next week
              waitingRoom: true,
              passcode: 'qbr2024',
              aiNotes: "Quarterly Business Review agenda:\n- Q4 performance metrics\n- Financial review\n- Q1 strategic planning\n- Resource allocation\n- Risk assessment"
            },
            { 
              id: 'm-nextweek-2', 
              title: 'Product Launch: Nova Campaign', 
              description: 'Final preparations for the Nova product launch campaign.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'olivia.davis@example.com'], 
              startTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1, 14, 0).toISOString(), // 2:00 PM next week + 1 day
              endTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1, 16, 0).toISOString(), // 4:00 PM next week + 1 day
              waitingRoom: false,
              aiNotes: "Nova campaign launch prep:\n- Finalize marketing materials\n- Review launch timeline\n- Coordinate with all teams\n- Prepare for go-live"
            },
            
            // ADDITIONAL MEETINGS FOR BETTER COVERAGE
            { 
              id: 'm-sep25', 
              title: 'Weekly Team Sync', 
              description: 'Weekly synchronization meeting with all team leads.', 
              participants: [userEmail, 'jane.smith@example.com', 'mike.chen@example.com', 'sara.lee@example.com'], 
              startTime: new Date(2024, 8, 25, 10, 0).toISOString(), // September 25, 2024
              endTime: new Date(2024, 8, 25, 11, 0).toISOString(), // September 25, 2024
              waitingRoom: false,
              aiNotes: "Weekly team sync agenda:\n- Review progress on current projects\n- Discuss any blockers\n- Plan next week's priorities\n- Team updates"
            },
            { 
              id: 'm-sep26', 
              title: 'Client Demo: Acme Corp', 
              description: 'Product demonstration for potential client Acme Corp.', 
              participants: [userEmail, 'jane.smith@example.com', 'sam.wilson@example.com'], 
              startTime: new Date(2024, 8, 26, 14, 0).toISOString(), // September 26, 2024
              endTime: new Date(2024, 8, 26, 15, 30).toISOString(), // September 26, 2024
              waitingRoom: true,
              passcode: 'acme2024',
              aiNotes: "Acme Corp demo agenda:\n- Product overview\n- Key features demonstration\n- Q&A session\n- Next steps discussion"
            },
            { 
              id: 'm-sep29', 
              title: 'Sprint Planning', 
              description: 'Planning session for the next development sprint.', 
              participants: [userEmail, 'mike.chen@example.com', 'sam.wilson@example.com', 'david.brown@example.com'], 
              startTime: new Date(2024, 8, 29, 9, 0).toISOString(), // September 29, 2024
              endTime: new Date(2024, 8, 29, 12, 0).toISOString(), // September 29, 2024
              waitingRoom: false,
              aiNotes: "Sprint planning agenda:\n- Review previous sprint\n- Plan next sprint goals\n- Estimate story points\n- Assign tasks"
            },
            
            // PAST MEETINGS (for historical context)
            { 
              id: 'm-past-1', 
              title: 'Q3 Performance Review', 
              description: 'Review of the sales and marketing team performance for Q3.', 
              participants: [userEmail, 'jane.smith@example.com', 'sara.lee@example.com'], 
              startTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 10, 0).toISOString(), // 10:00 AM last week
              endTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 11, 30).toISOString(), // 11:30 AM last week
              aiNotes: 'AI summary: The team exceeded the lead generation target by 12%. The conversion rate was slightly below target at 4.5%. Key takeaway: Focus on conversion optimization in Q4. Action item: Jane to prepare a report on underperforming channels by next week.', 
              manualNotes: 'Great quarter for the marketing team. Sales team needs more support with qualified leads. We discussed implementing a new CRM tool in the next budget cycle.' 
            },
            {
                id: 'm-past-2',
                title: 'Technical Deep Dive on API',
                description: 'Discussing API endpoints for the new integration.',
                participants: [userEmail, 'mike.chen@example.com', 'sam.wilson@example.com'],
                startTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() + 1, 14, 0).toISOString(), // 2:00 PM last week + 1 day
                endTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() + 1, 16, 0).toISOString(), // 4:00 PM last week + 1 day
                aiNotes: 'API specification for v2.0 was finalized. Key decision was to use GraphQL over REST. Sam to provide the updated documentation by EOD Friday.',
                manualNotes: 'We need to make sure the authentication layer is robust.'
            },
        ],
        tasks: [
            { id: 't1', text: 'Prepare slides for Project Phoenix Planning', completed: false, meetingId: 'm-tomorrow-1' },
            { id: 't2', text: 'Send updated agenda for Daily Standup', completed: true, meetingId: 'm-today-1' },
            { id: 't3', text: 'Finalize UI mockups for TechCorp demo', completed: false, meetingId: 'm-today-2' },
            { id: 't4', text: 'Follow up with Jane on marketing strategy', completed: false, meetingId: 'm-tomorrow-2' },
            { id: 't5', text: 'Draft Q1 2025 budget proposal', completed: false },
            { id: 't6', text: 'Review new CRM tool options', completed: false, meetingId: 'm-past-1'},
            { id: 't7', text: 'Get API documentation from Sam', completed: true, meetingId: 'm-past-2' },
            { id: 't8', text: 'Prepare team building activities', completed: false, meetingId: 'm-dayafter-1' },
            { id: 't9', text: 'Compile Q4 performance metrics', completed: false, meetingId: 'm-nextweek-1' },
            { id: 't10', text: 'Finalize Nova campaign materials', completed: false, meetingId: 'm-nextweek-2' },
        ],
        notifications: [
            { id: 'n1', type: 'meeting_request', from: 'jane.smith@example.com', meetingTitle: 'Marketing Strategy Review', meetingId: 'm-tomorrow-2' },
            { id: 'n2', type: 'meeting_request', from: 'mike.chen@example.com', meetingTitle: 'Project Phoenix Planning', meetingId: 'm-tomorrow-1' },
            { id: 'n3', type: 'meeting_request', from: 'sara.lee@example.com', meetingTitle: 'Team Building Workshop', meetingId: 'm-dayafter-1' },
            { id: 'n4', type: 'meeting_request', from: 'bob.jones@example.com', meetingTitle: 'Quarterly Business Review', meetingId: 'm-nextweek-1' },
        ],
        // Fix: Add mock presentations data to the initial database state.
        presentations: [
            {
                id: 'pres-1',
                title: 'Q4 Marketing Strategy',
                description: 'A deep dive into our marketing plan for the final quarter.',
                slides: [
                    { id: 's1-1', title: 'Introduction', content: 'Welcome to the Q4 Marketing Strategy presentation. We will cover key initiatives, budget allocation, and expected outcomes.' },
                    { id: 's1-2', title: 'Key Initiatives', content: '1. Project Nova Launch\n2. Holiday Season Campaign\n3. Partner Co-marketing with Acme Corp' },
                    { id: 's1-3', title: 'Budget Allocation', content: '- Digital Ads: 40%\n- Content Creation: 25%\n- Influencer Marketing: 15%\n- Events: 20%' },
                    { id: 's1-4', title: 'Expected Outcomes', content: '- 20% increase in lead generation\n- 15% growth in social media engagement\n- Successful launch of Project Nova with 10k sign-ups.' },
                    { id: 's1-5', title: 'Q&A', content: 'Open floor for questions.' },
                ]
            },
            {
                id: 'pres-2',
                title: 'Product Roadmap 2025',
                description: 'An overview of the planned features and updates for the upcoming year.',
                slides: [
                    { id: 's2-1', title: 'Vision for 2025', content: 'Our vision is to become the leading platform for AI-assisted productivity and collaboration.' },
                    { id: 's2-2', title: 'Q1: Project Phoenix', content: 'The main focus for Q1 will be the launch and stabilization of Project Phoenix, our next-generation core feature.' },
                    { id: 's2-3', title: 'Q2: Integration & Expansion', content: 'In Q2, we will focus on expanding our third-party integrations and improving the API for developers.' },
                    { id: 's2-4', title: 'H2: User Experience Overhaul', content: 'The second half of the year will be dedicated to a major UI/UX overhaul to improve usability and modernise the interface.' },
                ]
            }
        ],
    };
};
export const initializeDB = (): void => {
    console.log('Initializing database in localStorage with fresh data...');
    localStorage.setItem(DB_KEY, JSON.stringify(getInitialData()));
  };
  
  // Helper to update DB
  export const setDB = (db: Database): void => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  };
  
  export const getDB = (): Database => {
    const dbString = localStorage.getItem(DB_KEY);
    if (!dbString) {
      const initialData = getInitialData();
      localStorage.setItem(DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
  
    const db: Database = JSON.parse(dbString);
  
    // Fix: Ensure backward compatibility (presentations always exist)
    if (!db.presentations) {
      db.presentations = getInitialData().presentations;
      setDB(db);
    }
  
    return db;
  };