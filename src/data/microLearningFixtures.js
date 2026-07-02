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
  }
];
