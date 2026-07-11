export const microLearningFixtures = [
  {
    id: 'dcu-handover-spot-check',
    title: 'Day Care handover spot-check',
    ward: 'Day Care Unit',
    trust: 'Cityview Community Trust',
    professions: ['nursing', 'hca', 'physiotherapy'],
    topic: 'handover',
    format: 'micro',
    questions: [
      {
        id: 'dcu-handover-1',
        prompt: 'Which handover note is most complete for the next shift?',
        options: [
          'Room 4, keep watching',
          'Concern, action taken, next review time, and who was updated',
          'Patient seen already'
        ],
        correctIndex: 1,
        points: 2,
        explanation: 'A complete note links the concern, action, and next review point.'
      },
      {
        id: 'dcu-handover-2',
        prompt: 'What is the strongest spot-the-risk cue in a shift summary?',
        options: [
          'A tidy drug trolley',
          'A follow-up task left unsigned',
          'A printed ward map'
        ],
        correctIndex: 1,
        points: 2,
        explanation: 'An unsigned follow-up task shows the handover trail is not yet complete.'
      },
      {
        id: 'dcu-handover-3',
        prompt: 'Which action best supports shared learning after the handover?',
        options: [
          'Skip the note to save time',
          'Add a short review note for the next team',
          'Close the screen immediately'
        ],
        correctIndex: 1,
        points: 3,
        explanation: 'A short review note helps the next team see the learning point quickly.'
      }
    ]
  },
  {
    id: 'amu-documentation-sprint',
    title: 'AMU documentation sprint',
    ward: 'Acute Medical Unit',
    trust: 'Cityview Community Trust',
    professions: ['nursing', 'pharmacy', 'medicine'],
    topic: 'documentation',
    format: 'course',
    questions: [
      {
        id: 'amu-doc-1',
        prompt: 'Which entry best reduces a documentation gap?',
        options: [
          '“Reviewed”',
          '“Reviewed, concern noted, escalation message sent at 09:40”',
          'No entry'
        ],
        correctIndex: 1,
        points: 2,
        explanation: 'The note should show what happened and when it was shared.'
      },
      {
        id: 'amu-doc-2',
        prompt: 'What should be visible in a shared learning record?',
        options: [
          'Only initials',
          'Procedure, verifier role, and verification state',
          'A free-text joke'
        ],
        correctIndex: 1,
        points: 3,
        explanation: 'The learning record is clearer when the procedure, verifier role, and verification state are visible.'
      },
      {
        id: 'amu-doc-3',
        prompt: 'Which note shows the cleanest handover trail?',
        options: [
          'Task completed with no context',
          'Task updated, checked by nurse, and handed over to the next shift',
          'Maybe later'
        ],
        correctIndex: 1,
        points: 2,
        explanation: 'The cleanest trail shows completion, checking, and handover.'
      }
    ]
  },
  {
    id: 'community-discharge-risk-spotter',
    title: 'Community discharge risk spotter',
    ward: 'Community Frailty Team',
    trust: 'Riverbank Community Trust',
    professions: ['nursing', 'social care', 'occupational therapy'],
    topic: 'discharge',
    format: 'micro',
    questions: [
      {
        id: 'community-risk-1',
        prompt: 'Which detail is the clearest discharge-readiness blocker?',
        options: [
          'Transport booked',
          'Follow-up slot missing',
          'Tea has gone cold'
        ],
        correctIndex: 1,
        points: 2,
        explanation: 'A missing follow-up slot leaves the discharge plan incomplete.'
      },
      {
        id: 'community-risk-2',
        prompt: 'Which note best supports interprofessional learning?',
        options: [
          '“Fine”',
          '“Nurse, therapist, and social care update logged with next step”',
          'No shared note'
        ],
        correctIndex: 1,
        points: 3,
        explanation: 'The shared note makes the team working visible for the next reviewer.'
      }
    ]
  },
  {
    id: 'escalation-pathway-deterioration-spotter',
    title: 'Recognising deterioration',
    ward: 'Acute Medical Unit',
    trust: 'Cityview Community Trust',
    professions: ['nursing', 'medicine', 'hca'],
    topic: 'escalation-pathway learning scenario',
    format: 'micro',
    questions: [
      {
        id: 'escalation-pathway-deterioration-1',
        prompt: 'In this escalation-pathway learning scenario, which change should be named first?',
        options: [
          'Rising respiratory rate trend',
          'A tidy medicine trolley',
          'A fresh fruit bowl'
        ],
        correctIndex: 0,
        points: 2,
        explanation: 'The visible breathing change is the clearest fact to share first.'
      },
      {
        id: 'escalation-pathway-deterioration-2',
        prompt: 'Which other change belongs in the same learning scenario?',
        options: [
          'New-onset confusion',
          'A clean whiteboard',
          'A quiet handover desk'
        ],
        correctIndex: 0,
        points: 2,
        explanation: 'New confusion is another visible change that helps the team practise calm review language.'
      },
      {
        id: 'escalation-pathway-deterioration-3',
        prompt: 'Which final cue completes the deterioration pattern?',
        options: [
          'Falling oxygen saturation',
          'A fresh water jug',
          'A printed menu'
        ],
        correctIndex: 0,
        points: 3,
        explanation: 'The oxygen saturation trend completes the learning scenario as a classroom example.'
      }
    ]
  },
  {
    id: 'escalation-pathway-rrt-sbar',
    title: 'RRT SBAR practice',
    ward: 'General Medical Unit',
    trust: 'Riverbank Community Trust',
    professions: ['nursing', 'medicine'],
    topic: 'escalation-pathway learning scenario',
    format: 'micro',
    questions: [
      {
        id: 'escalation-pathway-rrt-sbar-1',
        prompt: 'Which opening line best fits the educational scenario?',
        options: [
          'I have a concern about a patient with a rising respiratory rate and I want a review',
          'The printer is working well',
          'Let us ignore the observation change'
        ],
        correctIndex: 0,
        points: 2,
        explanation: 'The call should name the visible concern and ask for a review.'
      },
      {
        id: 'escalation-pathway-rrt-sbar-2',
        prompt: 'Which SBAR section should hold the current facts?',
        options: [
          'Situation',
          'Ward poster',
          'Snack list'
        ],
        correctIndex: 0,
        points: 2,
        explanation: 'Situation is where the current visible change is named.'
      },
      {
        id: 'escalation-pathway-rrt-sbar-3',
        prompt: 'What should the Recommendation describe?',
        options: [
          'The next review step and who should take it',
          'A private opinion only',
          'A guess about the cause'
        ],
        correctIndex: 0,
        points: 3,
        explanation: 'The recommendation should point to the next review step.'
      }
    ]
  },
  {
    id: 'escalation-pathway-call-for-concern-note',
    title: 'Call-for-Concern SBAR note',
    ward: 'Day Care Unit',
    trust: 'Cityview Community Trust',
    professions: ['nursing', 'hca', 'medicine'],
    topic: 'escalation-pathway learning scenario',
    format: 'micro',
    questions: [
      {
        id: 'escalation-pathway-call-for-concern-1',
        prompt: 'What makes a Call-for-Concern note useful in this learning scenario?',
        options: [
          'It records the visible facts, time, and who reviewed it',
          'It replaces the conversation',
          'It hides the change in a long paragraph'
        ],
        correctIndex: 0,
        points: 2,
        explanation: 'A short factual note helps the team revisit the learning point.'
      },
      {
        id: 'escalation-pathway-call-for-concern-2',
        prompt: 'Which detail belongs in the Situation line?',
        options: [
          'The current visible change',
          "The patient's favourite TV show",
          'A label from the cupboard'
        ],
        correctIndex: 0,
        points: 2,
        explanation: 'Situation should describe what is happening now using visible facts.'
      },
      {
        id: 'escalation-pathway-call-for-concern-3',
        prompt: 'How does the module support Competency Passport credit?',
        options: [
          'By keeping the score in the learning hub',
          'By changing the patient chart',
          'By sending a message outside the training exercise'
        ],
        correctIndex: 0,
        points: 3,
        explanation: 'The module only awards learning points in the passport and leaves care unchanged.'
      }
    ]
  }
];
