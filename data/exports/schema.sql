PRAGMA foreign_keys = ON;

CREATE TABLE wards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ward_type TEXT NOT NULL CHECK (ward_type IN ('surgical', 'general medical', 'acute medical', 'day care', 'community frailty team', 'rehab', 'care-of-the-elderly', 'paediatrics', 'maternity', 'ICU/HDU', 'ED')),
  ward_group TEXT NOT NULL,
  bed_count INTEGER NOT NULL CHECK (bed_count >= 0),
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1))
);

CREATE TABLE flags (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'moderate', 'high')),
  description TEXT NOT NULL,
  trigger_signals TEXT NOT NULL,
  rationale_template TEXT NOT NULL,
  applicable_ward_types TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1))
);

CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  ward_type TEXT NOT NULL CHECK (ward_type IN ('surgical', 'general medical', 'acute medical', 'day care', 'community frailty team', 'rehab', 'care-of-the-elderly', 'paediatrics', 'maternity', 'ICU/HDU', 'ED')),
  description TEXT NOT NULL,
  review_cues TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1))
);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  ward_id TEXT NOT NULL,
  patient_ref TEXT NOT NULL UNIQUE,
  fictional_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0),
  pronouns TEXT NOT NULL,
  demographic_context TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  news2 INTEGER NOT NULL CHECK (news2 >= 0),
  responsible_nurse TEXT NOT NULL,
  next_action TEXT NOT NULL,
  escalation TEXT NOT NULL CHECK (escalation IN ('None', 'Monitoring', 'Active')),
  handover_complete INTEGER NOT NULL CHECK (handover_complete BETWEEN 0 AND 100),
  discharge_ready INTEGER NOT NULL CHECK (discharge_ready IN (0, 1)),
  baseline TEXT NOT NULL,
  current_state TEXT NOT NULL,
  trajectory TEXT NOT NULL,
  uncertainty TEXT NOT NULL,
  clinical_use TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1)),
  FOREIGN KEY (ward_id) REFERENCES wards(id)
);

CREATE TABLE scenario_patients (
  scenario_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  PRIMARY KEY (scenario_id, patient_id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE patient_flags (
  patient_id TEXT NOT NULL,
  flag_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  PRIMARY KEY (patient_id, flag_id),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (flag_id) REFERENCES flags(id) ON DELETE RESTRICT
);

CREATE TABLE journey_events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vital', 'intervention', 'note', 'escalation', 'handover')),
  label TEXT NOT NULL,
  detail TEXT NOT NULL,
  news2 INTEGER,
  missing_information TEXT NOT NULL,
  limitations TEXT NOT NULL,
  simulation_label TEXT NOT NULL,
  clinical_use TEXT NOT NULL,
  simulation_only INTEGER NOT NULL CHECK (simulation_only IN (0, 1)),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_scenarios_ward_type ON scenarios(ward_type);
CREATE INDEX idx_patients_ward_id ON patients(ward_id);
CREATE INDEX idx_patient_flags_flag_id ON patient_flags(flag_id);
CREATE INDEX idx_journey_events_patient_time ON journey_events(patient_id, timestamp);
