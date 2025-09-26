from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Simple in-memory storage (in production, use a database)
meetings_db = {}
users_db = {}

# Sample data with live transcript mock
sample_meeting = {
    "id": "meeting_1",
    "title": "Weekly Team Sync",
    "description": "Weekly team synchronization meeting",
    "date": "2024-01-15",
    "time": "10:00 AM",
    "duration": 60,
    "participants": ["john@example.com", "jane@example.com", "bob@example.com"],
    "status": "live",
    "meetingLink": "https://meet.example.com/abc123",
    "notes": "",
    "aiNotes": """🎤 Live Meeting Transcript

[10:00 AM] John: Good morning everyone, welcome to our weekly team sync. Let's start with the project updates.

[10:01 AM] Jane: Thanks John. I've completed the user authentication module and it's ready for testing. The login flow is working smoothly.

[10:02 AM] Bob: Great work Jane! On my end, I've been working on the database optimization. We've improved query performance by about 40%.

[10:03 AM] John: Excellent progress from both of you. Any blockers or issues we need to address?

[10:04 AM] Jane: I need access to the staging environment for testing. Can we get that set up by tomorrow?

[10:05 AM] Bob: I can help with that. I'll send you the credentials after this meeting.

[10:06 AM] John: Perfect. Let's also discuss the upcoming client presentation. Jane, you'll be presenting the new features?

[10:07 AM] Jane: Yes, I've prepared a demo of the authentication system. Should take about 15 minutes.

[10:08 AM] Bob: I'll have the performance metrics ready to show the improvements we've made.

[10:09 AM] John: Sounds good. Any other items for today's agenda?

[10:10 AM] Jane: I wanted to bring up the new design system. We should standardize our UI components.

[10:11 AM] Bob: Agreed. I've been noticing inconsistencies across different pages.

[10:12 AM] John: Good point. Let's schedule a design review session for next week. Jane, can you coordinate that?

[10:13 AM] Jane: Absolutely. I'll send out invites by end of day.

[10:14 AM] John: Perfect. Anything else before we wrap up?

[10:15 AM] Bob: Just wanted to mention that the server maintenance is scheduled for this weekend. We'll have some downtime on Sunday.

[10:16 AM] John: Thanks for the heads up. I'll make sure to communicate that to the stakeholders.

[10:17 AM] Jane: All set on my end.

[10:18 AM] Bob: Same here.

[10:19 AM] John: Great! Thanks everyone for the productive meeting. Let's reconvene next week at the same time.

[10:20 AM] Meeting ended.""",
    "manualNotes": "Key points:\n- Auth module completed\n- DB optimization 40% improvement\n- Need staging access\n- Design system standardization needed\n- Server maintenance this weekend"
}

# Add more sample meetings with different transcript scenarios
sample_meeting_2 = {
    "id": "meeting_2", 
    "title": "Product Planning Session",
    "description": "Quarterly product planning and roadmap discussion",
    "date": "2024-01-16",
    "time": "2:00 PM",
    "duration": 90,
    "participants": ["alice@example.com", "charlie@example.com", "diana@example.com"],
    "status": "live",
    "meetingLink": "https://meet.example.com/def456",
    "notes": "",
    "aiNotes": """🎤 Product Planning Session - Live Transcript

[2:00 PM] Alice: Welcome to our quarterly product planning session. Let's review our Q1 achievements and plan for Q2.

[2:01 PM] Charlie: Thanks Alice. I've prepared the metrics dashboard showing our key performance indicators.

[2:02 PM] Diana: Perfect. I can see we've exceeded our user acquisition targets by 15%.

[2:03 PM] Alice: That's fantastic! What were the main drivers of this growth?

[2:04 PM] Charlie: The new onboarding flow we implemented in December has significantly improved conversion rates.

[2:05 PM] Diana: Also, our social media campaign generated a lot of organic traffic.

[2:06 PM] Alice: Excellent. Now let's discuss our Q2 priorities. What are the top features we want to focus on?

[2:07 PM] Charlie: I think we should prioritize the mobile app development. Our users are increasingly mobile-first.

[2:08 PM] Diana: Agreed. The analytics show 70% of our traffic comes from mobile devices.

[2:09 PM] Alice: Makes sense. What's our timeline for the mobile app MVP?

[2:10 PM] Charlie: We're looking at 8-10 weeks for the initial version, including core features.

[2:11 PM] Diana: I can provide the design assets and user research data to support the development.

[2:12 PM] Alice: Perfect. Let's also consider the API improvements we discussed last month.

[2:13 PM] Charlie: Yes, the third-party integrations are becoming more important for our enterprise clients.

[2:14 PM] Diana: I've been getting requests for better webhook support and rate limiting.

[2:15 PM] Alice: Good point. Let's add API enhancements to our Q2 roadmap as well.

[2:16 PM] Charlie: I'll update the project timeline to include both mobile app and API improvements.

[2:17 PM] Diana: Should we also consider the AI features we've been researching?

[2:18 PM] Alice: That's a great question. The AI integration could be a differentiator, but we need to assess the development effort.

[2:19 PM] Charlie: I think we should prototype the AI features in parallel with the mobile app development.

[2:20 PM] Diana: Agreed. We can start with basic AI recommendations and expand from there.

[2:21 PM] Alice: Excellent. Let's set up a follow-up meeting to dive deeper into the AI implementation.

[2:22 PM] Charlie: I'll coordinate with the AI team and set up a technical review session.

[2:23 PM] Diana: Perfect. I'll prepare the user research findings for that session.

[2:24 PM] Alice: Great! Any other items we need to cover today?

[2:25 PM] Charlie: I wanted to mention the budget allocation for Q2. We have some flexibility for additional resources.

[2:26 PM] Diana: That's good to know. We might need to hire additional developers for the mobile app project.

[2:27 PM] Alice: Let's discuss resource planning in our next meeting. For now, let's focus on finalizing the Q2 roadmap.

[2:28 PM] Charlie: I'll have the updated roadmap ready by end of week.

[2:29 PM] Diana: I'll prepare the market research summary to support our decisions.

[2:30 PM] Alice: Perfect. Thanks everyone for the productive discussion. Let's reconvene next week to finalize the Q2 plan.

[2:31 PM] Meeting ended.""",
    "manualNotes": "Q2 Priorities:\n- Mobile app MVP (8-10 weeks)\n- API improvements\n- AI features prototype\n- Resource planning needed\n- Budget flexibility available"
}

sample_meeting_3 = {
    "id": "meeting_3",
    "title": "Client Demo Session", 
    "description": "Demonstrating new features to key client",
    "date": "2024-01-17",
    "time": "11:00 AM",
    "duration": 45,
    "participants": ["client@company.com", "sales@example.com", "dev@example.com"],
    "status": "live",
    "meetingLink": "https://meet.example.com/ghi789",
    "notes": "",
    "aiNotes": """🎤 Client Demo Session - Live Transcript

[11:00 AM] Sales: Good morning! Thank you for joining us today. We're excited to show you our latest platform updates.

[11:01 AM] Client: Good morning! We're looking forward to seeing what's new.

[11:02 AM] Dev: Thanks for having us. I'll be walking you through the new dashboard features we've developed.

[11:03 AM] Sales: Let me start by sharing my screen. You can see our updated interface here.

[11:04 AM] Client: The interface looks much cleaner than before. I like the new layout.

[11:05 AM] Dev: Thank you! We've redesigned the dashboard based on user feedback. The navigation is now more intuitive.

[11:06 AM] Sales: One of the key improvements is the real-time analytics section. Let me show you that.

[11:07 AM] Client: This is impressive. How often does the data refresh?

[11:08 AM] Dev: The analytics update every 30 seconds automatically. You can also manually refresh if needed.

[11:09 AM] Sales: Another new feature is the customizable widgets. You can arrange them according to your workflow.

[11:10 AM] Client: That's very useful. Can we set up different views for different team members?

[11:11 AM] Dev: Absolutely! Each user can have their own personalized dashboard with relevant widgets.

[11:12 AM] Sales: The reporting functionality has also been enhanced. Let me demonstrate the new export options.

[11:13 AM] Client: I can see you now support multiple formats. That's exactly what we needed.

[11:14 AM] Dev: Yes, you can export to PDF, Excel, or CSV. The reports also include more detailed breakdowns.

[11:15 AM] Sales: We've also improved the collaboration features. Team members can now comment directly on reports.

[11:16 AM] Client: That's a great addition. How does the notification system work?

[11:17 AM] Dev: Users receive email notifications for comments and can also set up in-app notifications.

[11:18 AM] Sales: The mobile app has been updated as well. All these features are available on mobile devices.

[11:19 AM] Client: Perfect. When will these updates be available in our environment?

[11:20 AM] Sales: The updates will be deployed to your environment next week. We'll provide detailed documentation.

[11:21 AM] Dev: I'll also schedule a training session for your team to ensure smooth adoption.

[11:22 AM] Client: That sounds great. We're very excited about these improvements.

[11:23 AM] Sales: Is there anything specific you'd like to see or any questions about the new features?

[11:24 AM] Client: I think we've covered everything. The new features address all our requirements.

[11:25 AM] Dev: Excellent! I'll send you the deployment timeline and training materials.

[11:26 AM] Sales: Thank you for your time today. We look forward to your feedback after the deployment.

[11:27 AM] Client: Thank you for the excellent demo. We'll be in touch soon.

[11:28 AM] Meeting ended.""",
    "manualNotes": "Client Demo Notes:\n- New dashboard interface\n- Real-time analytics (30s refresh)\n- Customizable widgets\n- Multi-format exports\n- Collaboration features\n- Mobile app updates\n- Deployment next week\n- Training session scheduled"
}

meetings_db["meeting_1"] = sample_meeting
meetings_db["meeting_2"] = sample_meeting_2  
meetings_db["meeting_3"] = sample_meeting_3

# ---------------- API Routes ----------------

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'meeting-api'})

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    """Get all meetings"""
    return jsonify(list(meetings_db.values()))

@app.route('/api/meetings/<meeting_id>', methods=['GET'])
def get_meeting(meeting_id):
    """Get a specific meeting by ID"""
    if meeting_id in meetings_db:
        return jsonify(meetings_db[meeting_id])
    else:
        return jsonify({'error': 'Meeting not found'}), 404

@app.route('/api/meetings', methods=['POST'])
def create_meeting():
    """Create a new meeting"""
    data = request.get_json()
    
    # Generate a simple ID
    meeting_id = f"meeting_{len(meetings_db) + 1}"
    
    meeting = {
        "id": meeting_id,
        "title": data.get('title', 'New Meeting'),
        "description": data.get('description', ''),
        "date": data.get('date', datetime.now().strftime('%Y-%m-%d')),
        "time": data.get('time', '10:00 AM'),
        "duration": data.get('duration', 60),
        "participants": data.get('participants', []),
        "status": data.get('status', 'scheduled'),
        "meetingLink": data.get('meetingLink', f"https://meet.example.com/{meeting_id}"),
        "notes": data.get('notes', ''),
        "aiNotes": data.get('aiNotes', ''),
        "manualNotes": data.get('manualNotes', '')
    }
    
    meetings_db[meeting_id] = meeting
    return jsonify(meeting), 201

@app.route('/api/meetings/<meeting_id>', methods=['PUT'])
def update_meeting(meeting_id):
    """Update an existing meeting"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    data = request.get_json()
    
    # Update the meeting
    for key, value in data.items():
        if key in meetings_db[meeting_id]:
            meetings_db[meeting_id][key] = value
    
    return jsonify(meetings_db[meeting_id])

@app.route('/api/meetings/<meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    """Delete a meeting"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    del meetings_db[meeting_id]
    return jsonify({'message': 'Meeting deleted successfully'})

@app.route('/api/meetings/<meeting_id>/start', methods=['POST'])
def start_meeting(meeting_id):
    """Start a meeting"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    meetings_db[meeting_id]['status'] = 'live'
    return jsonify(meetings_db[meeting_id])

@app.route('/api/meetings/<meeting_id>/end', methods=['POST'])
def end_meeting(meeting_id):
    """End a meeting"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    meetings_db[meeting_id]['status'] = 'completed'
    return jsonify(meetings_db[meeting_id])

@app.route('/api/meetings/<meeting_id>/notes', methods=['POST'])
def update_meeting_notes(meeting_id):
    """Update meeting notes"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    data = request.get_json()
    notes_type = data.get('type', 'manual')  # 'manual' or 'ai'
    notes_content = data.get('notes', '')
    
    if notes_type == 'manual':
        meetings_db[meeting_id]['manualNotes'] = notes_content
    elif notes_type == 'ai':
        meetings_db[meeting_id]['aiNotes'] = notes_content
    
    return jsonify(meetings_db[meeting_id])

@app.route('/api/meetings/<meeting_id>/transcript', methods=['GET'])
def get_live_transcript(meeting_id):
    """Get live transcript for a meeting"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    meeting = meetings_db[meeting_id]
    return jsonify({
        'meeting_id': meeting_id,
        'transcript': meeting.get('aiNotes', ''),
        'status': meeting.get('status', 'scheduled'),
        'participants': meeting.get('participants', [])
    })

@app.route('/api/meetings/<meeting_id>/transcript/update', methods=['POST'])
def update_live_transcript(meeting_id):
    """Simulate live transcript updates"""
    if meeting_id not in meetings_db:
        return jsonify({'error': 'Meeting not found'}), 404
    
    data = request.get_json()
    new_text = data.get('text', '')
    
    # Append new text to existing transcript
    current_transcript = meetings_db[meeting_id].get('aiNotes', '')
    if current_transcript:
        meetings_db[meeting_id]['aiNotes'] = current_transcript + '\n\n' + new_text
    else:
        meetings_db[meeting_id]['aiNotes'] = new_text
    
    return jsonify({
        'meeting_id': meeting_id,
        'transcript': meetings_db[meeting_id]['aiNotes'],
        'status': 'updated'
    })

# ---------------- Entry Point ----------------
if __name__ == "__main__":
    print("🚀 Starting AI Buddy API Server...")
    print("📡 API available at: http://localhost:5000")
    print("🔗 Health check: http://localhost:5000/api/health")
    print("📋 Meetings API: http://localhost:5000/api/meetings")
    app.run(host='0.0.0.0', port=5000, debug=True)
