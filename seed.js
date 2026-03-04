import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

// ─── Models ──────────────────────────────────────────────────────────────────
import User from "./models/User.js";
import Patient from "./models/Patient.js";
import Appointment from "./models/Appointment.js";
import Prescription from "./models/Prescription.js";
import DiagnosisLog from "./models/DiagnosisLog.js";
import DoctorSchedule from "./models/DoctorSchedule.js";
import TokenQueue, { TokenCounter } from "./models/TokenQueue.js";

const log = (msg) => console.log(`\x1b[36m[SEED]\x1b[0m ${msg}`);
const ok = (msg) => console.log(`\x1b[32m[✓]\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m[!]\x1b[0m ${msg}`);

// ─── Helper ─────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const dateStr = (d = new Date()) => d.toISOString().split("T")[0];
const pastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const PASS = await bcrypt.hash("demo1234", 12);

// ────────────────────────────────────────────────────────────────────────────
//  DATA DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const ADMIN_DATA = [
  {
    fullname: "Dr. Zafar Iqbal",
    email: "admin@smartcare.com",
    role: "Admin",
    gender: "Male",
    subscriptionPlan: "Pro",
  },
  {
    fullname: "Dr. Nadia Hussain",
    email: "superadmin@smartcare.com",
    role: "Admin",
    gender: "Female",
    subscriptionPlan: "Pro",
  },
];

const DOCTOR_DATA = [
  {
    fullname: "Dr. Ahmed Khan",
    email: "ahmed.khan@smartcare.com",
    specialization: "Cardiologist",
    gender: "Male",
    experience: 12,
    department: "Cardiology",
  },
  {
    fullname: "Dr. Sana Malik",
    email: "sana.malik@smartcare.com",
    specialization: "Gynecologist",
    gender: "Female",
    experience: 9,
    department: "Gynecology",
  },
  {
    fullname: "Dr. Ali Raza",
    email: "ali.raza@smartcare.com",
    specialization: "Orthopedic",
    gender: "Male",
    experience: 8,
    department: "Orthopedics",
  },
  {
    fullname: "Dr. Hina Qureshi",
    email: "hina.qureshi@smartcare.com",
    specialization: "Dermatologist",
    gender: "Female",
    experience: 6,
    department: "Dermatology",
  },
  {
    fullname: "Dr. Salman Sheikh",
    email: "salman.sheikh@smartcare.com",
    specialization: "Neurologist",
    gender: "Male",
    experience: 14,
    department: "Neurology",
  },
  {
    fullname: "Dr. Ayesha Farooq",
    email: "ayesha.farooq@smartcare.com",
    specialization: "Pediatrician",
    gender: "Female",
    experience: 7,
    department: "Pediatrics",
  },
  {
    fullname: "Dr. Faraz Siddiqui",
    email: "faraz.siddiqui@smartcare.com",
    specialization: "ENT Specialist",
    gender: "Male",
    experience: 10,
    department: "ENT",
  },
  {
    fullname: "Dr. Bilal Aslam",
    email: "bilal.aslam@smartcare.com",
    specialization: "Emergency Medicine",
    gender: "Male",
    experience: 5,
    department: "Emergency",
  },
  {
    fullname: "Dr. Maria Zahid",
    email: "maria.zahid@smartcare.com",
    specialization: "General Physician",
    gender: "Female",
    experience: 11,
    department: "General Medicine",
  },
  {
    fullname: "Dr. Fahad Mahmood",
    email: "fahad.mahmood@smartcare.com",
    specialization: "General Physician",
    gender: "Male",
    experience: 4,
    department: "Diagnostics",
  },
];

const RECEPTIONIST_DATA = [
  {
    fullname: "Rabia Noor",
    email: "reception1@smartcare.com",
    gender: "Female",
  },
  {
    fullname: "Kamran Baig",
    email: "reception2@smartcare.com",
    gender: "Male",
  },
  {
    fullname: "Saima Jabeen",
    email: "reception3@smartcare.com",
    gender: "Female",
  },
];

// ── Demo Patient Users (for login testing) ──────────────────────────────────
const PATIENT_USER_DATA = [
  {
    fullname: "Ali Hassan",
    email: "patient@smartcare.com",
    gender: "Male",
    role: "Patient",
    subscriptionPlan: "Free",
  },
  {
    fullname: "Fatima Noor",
    email: "patient2@smartcare.com",
    gender: "Female",
    role: "Patient",
    subscriptionPlan: "Free",
  },
];

const PATIENT_NAMES = [
  ["Ali Hassan", "Male"],
  ["Fatima Noor", "Female"],
  ["Usman Tariq", "Male"],
  ["Areeba Khan", "Female"],
  ["Hamza Ali", "Male"],
  ["Maryam Ahmed", "Female"],
  ["Zaid Siddiqui", "Male"],
  ["Nida Rashid", "Female"],
  ["Bilal Mirza", "Male"],
  ["Hira Zafar", "Female"],
  ["Omer Khurshid", "Male"],
  ["Saba Iqbal", "Female"],
  ["Talha Mehmood", "Male"],
  ["Zara Hussain", "Female"],
  ["Asad Raza", "Male"],
  ["Aliza Shah", "Female"],
  ["Waheed Akhtar", "Male"],
  ["Samina Butt", "Female"],
  ["Junaid Nawaz", "Male"],
  ["Mehwish Anwar", "Female"],
  ["Rehan Khalid", "Male"],
  ["Noor Fatima", "Female"],
  ["Saad Baig", "Male"],
  ["Amna Shahid", "Female"],
  ["Faisal Mirza", "Male"],
  ["Rabia Saleem", "Female"],
  ["Kashif Javed", "Male"],
  ["Uzma Tahir", "Female"],
  ["Danish Sheikh", "Male"],
  ["Shumaila Rehman", "Female"],
  ["Imran Qureshi", "Male"],
  ["Bushra Nasir", "Female"],
  ["Waqar Ahmad", "Male"],
  ["Tayyaba Malik", "Female"],
  ["Adil Farooq", "Male"],
  ["Saira Lodhi", "Female"],
  ["Hammad Gondal", "Male"],
  ["Iqra Younas", "Female"],
  ["Shoaib Dar", "Male"],
  ["Madiha Awan", "Female"],
  ["Farhan Chaudhry", "Male"],
  ["Kiran Liaqat", "Female"],
  ["Muneeb Sohail", "Male"],
  ["Tehreem Rao", "Female"],
  ["Umar Gill", "Male"],
  ["Naila Pervez", "Female"],
  ["Shahbaz Hassan", "Male"],
  ["Rida Azhar", "Female"],
  ["Jawad Saleh", "Male"],
  ["Komal Bhatti", "Female"],
];

const PHONE_PREFIXES = [
  "0300",
  "0301",
  "0302",
  "0303",
  "0311",
  "0312",
  "0313",
  "0321",
  "0322",
  "0332",
  "0333",
  "0345",
];
const phone = () => `${rand(PHONE_PREFIXES)}-${randInt(1000000, 9999999)}`;

const MEDICAL_HISTORIES = [
  "Patient has a known history of hypertension, currently on Amlodipine 5mg.",
  "Type 2 Diabetes Mellitus diagnosed 3 years ago. On Metformin 500mg twice daily.",
  "Mild asthma, uses salbutamol inhaler as needed. No recent attacks.",
  "Previous appendectomy in 2019. No current major complaints.",
  "Chronic lower back pain. Physiotherapy ongoing.",
  "Seasonal allergic rhinitis, responds well to antihistamines.",
  "No significant past medical history. Routine checkup patient.",
  "Hyperthyroidism managed with Propylthiouracil. TSH levels stable.",
  "Mild iron-deficiency anemia. On iron supplements.",
  "History of kidney stones (2021). Dietary modifications advised.",
  "Anxiety disorder, on Escitalopram 10mg. Regular psychiatric follow-up.",
  "Migraine sufferer. Uses Sumatriptan during acute episodes.",
  "Recent viral fever, recovered. Follow-up for weakness.",
  "Post-operative care after knee replacement surgery (left knee).",
  "Chronic gastritis on omeprazole. H. pylori negative.",
];

const MEDICINES = [
  {
    name: "Paracetamol",
    dosage: "500mg",
    frequency: "Three times daily",
    duration: "5 days",
  },
  {
    name: "Amoxicillin",
    dosage: "500mg",
    frequency: "Every 8 hours",
    duration: "7 days",
  },
  {
    name: "Amlodipine",
    dosage: "5mg",
    frequency: "Once daily (morning)",
    duration: "30 days",
  },
  {
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily with meals",
    duration: "30 days",
  },
  {
    name: "Omeprazole",
    dosage: "20mg",
    frequency: "Once daily before breakfast",
    duration: "14 days",
  },
  {
    name: "Cetirizine",
    dosage: "10mg",
    frequency: "Once daily at night",
    duration: "10 days",
  },
  {
    name: "Azithromycin",
    dosage: "500mg",
    frequency: "Once daily",
    duration: "3 days",
  },
  {
    name: "Ibuprofen",
    dosage: "400mg",
    frequency: "Twice daily after food",
    duration: "5 days",
  },
  {
    name: "Vitamin D3",
    dosage: "1000 IU",
    frequency: "Once daily",
    duration: "30 days",
  },
  {
    name: "Calcium Carbonate",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "30 days",
  },
  {
    name: "Metronidazole",
    dosage: "400mg",
    frequency: "Three times daily",
    duration: "7 days",
  },
  {
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily at night",
    duration: "30 days",
  },
  {
    name: "Clopidogrel",
    dosage: "75mg",
    frequency: "Once daily",
    duration: "30 days",
  },
  {
    name: "Bisoprolol",
    dosage: "5mg",
    frequency: "Once daily",
    duration: "30 days",
  },
  {
    name: "Salbutamol Inhaler",
    dosage: "2 puffs",
    frequency: "As needed (max 4x/day)",
    duration: "Ongoing",
  },
];

const SYMPTOMS_LIST = [
  {
    symptoms: "Fever, Cough, Fatigue, Headache",
    riskLevel: "Medium",
    aiResponse:
      "Based on the symptoms of fever, cough, and fatigue, the patient may be experiencing a viral upper respiratory tract infection. Differential diagnoses include influenza, COVID-19, or bacterial pneumonia. Recommended: CBC, CRP, chest X-ray. Start empirical treatment with paracetamol and antihistamines. Isolate if COVID-19 suspected.",
  },
  {
    symptoms: "Chest Pain, Dizziness, Shortness of Breath",
    riskLevel: "High",
    aiResponse:
      "The presenting symptoms of chest pain, dizziness, and shortness of breath suggest possible cardiac involvement. Urgently rule out acute coronary syndrome (ACS), pulmonary embolism, or hypertensive crisis. Immediately perform 12-lead ECG, troponin levels, and BP check. Patient requires emergency evaluation.",
  },
  {
    symptoms: "Skin Rash, Itching, Redness on Arms",
    riskLevel: "Low",
    aiResponse:
      "Skin rash with itching and localized redness is consistent with contact dermatitis or urticaria. Assess for recent exposure to allergens (soap, food, medication). Recommended: Apply hydrocortisone 1% cream. Prescribe oral cetirizine 10mg at night. Avoid suspected triggers.",
  },
  {
    symptoms: "Joint Pain, Swelling, Morning Stiffness",
    riskLevel: "Medium",
    aiResponse:
      "Symptoms of joint pain with morning stiffness and swelling are suggestive of early rheumatoid arthritis or reactive arthritis. Recommended: CBC, ESR, CRP, Anti-CCP antibodies, X-rays. Start NSAIDs for symptomatic relief and refer to rheumatology.",
  },
  {
    symptoms: "Severe Headache, Blurred Vision, Nausea",
    riskLevel: "High",
    aiResponse:
      "Severe headache with blurred vision and nausea warrants urgent evaluation for hypertensive emergency, migraine with aura, or raised intracranial pressure. Immediate BP measurement essential. If BP >180/120, treat as hypertensive emergency and refer to ER.",
  },
  {
    symptoms: "Abdominal Pain, Nausea, Vomiting",
    riskLevel: "Medium",
    aiResponse:
      "Abdominal pain accompanied by nausea and vomiting suggests gastroenteritis, peptic ulcer disease, or appendicitis. Assess pain location (RLQ - appendicitis concern). Recommended: Abdominal ultrasound, LFTs, amylase/lipase. Start IV hydration if dehydrated.",
  },
  {
    symptoms: "Frequent Urination, Burning, Lower Back Pain",
    riskLevel: "Low",
    aiResponse:
      "Symptoms are classic for urinary tract infection (UTI), possibly ascending to pyelonephritis. Recommended: Urine R/E, culture & sensitivity. Empirical treatment: Nitrofurantoin 100mg twice daily for 5 days or Cephalexin 500mg three times daily.",
  },
  {
    symptoms: "Chronic Cough, Blood in Sputum, Night Sweats, Weight Loss",
    riskLevel: "High",
    aiResponse:
      "Productive cough with hemoptysis, night sweats, and significant weight loss strongly suggests pulmonary tuberculosis or malignancy. Immediate referral required. Perform sputum AFB smear (×3), Mantoux test, chest X-ray PA view. Contact tracing required if TB confirmed.",
  },
];

const INSTRUCTIONS = [
  "Take medicines with a full glass of water. Avoid cold drinks.",
  "Rest adequately. Maintain good fluid intake (2-3 liters/day).",
  "Avoid spicy food during treatment course. Eat light meals.",
  "Do not drive or operate machinery as medicines may cause drowsiness.",
  "Avoid direct sunlight on treated area. Use sunscreen SPF 50+.",
  "Complete the full antibiotic course even if symptoms improve.",
  "Monitor blood pressure at home and record readings daily.",
  "Blood sugar monitoring: check fasting and 2-hour post-meal readings.",
  "Apply ointment after washing area with mild soap and patting dry.",
  "Follow up in 7 days if symptoms do not improve.",
];

// ────────────────────────────────────────────────────────────────────────────
//  SEEDER FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

async function seedUsers() {
  log("Seeding users...");
  await User.deleteMany({});

  const admins = await User.insertMany(
    ADMIN_DATA.map((u) => ({ ...u, password: PASS })),
  );

  const doctors = await User.insertMany(
    DOCTOR_DATA.map((u) => ({
      ...u,
      password: PASS,
      role: "Doctor",
      subscriptionPlan: "Pro",
    })),
  );

  const receptionists = await User.insertMany(
    RECEPTIONIST_DATA.map((u) => ({
      ...u,
      password: PASS,
      role: "Receptionist",
      subscriptionPlan: "Free",
    })),
  );

  // Demo patient users (so login page patient demo works)
  const patientUsers = await User.insertMany(
    PATIENT_USER_DATA.map((u) => ({
      ...u,
      password: PASS,
    })),
  );

  ok(
    `Users seeded: ${admins.length} admins, ${doctors.length} doctors, ${receptionists.length} receptionists, ${patientUsers.length} patient users`,
  );
  return { admins, doctors, receptionists };
}

async function seedSchedules(doctors) {
  log("Seeding doctor schedules...");
  await DoctorSchedule.deleteMany({});

  const today = dateStr();
  // Mark 2 random doctors on leave today
  const leaveIndices = [randInt(0, 4), randInt(5, 9)];
  warn(
    `Doctors on leave today: ${doctors[leaveIndices[0]].fullname}, ${doctors[leaveIndices[1]].fullname}`,
  );

  const schedules = await DoctorSchedule.insertMany(
    doctors.map((doc, i) => ({
      doctorId: doc._id,
      workingDays: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      startTime: "09:00",
      endTime: "17:00",
      maxPatientsPerDay: randInt(20, 35),
      isOnLeave: leaveIndices.includes(i),
      leaveDate: leaveIndices.includes(i) ? new Date() : null,
      leaveDates: leaveIndices.includes(i) ? [new Date()] : [],
    })),
  );

  ok(`Schedules seeded: ${schedules.length} doctor schedules`);
  return leaveIndices;
}

async function seedPatients(adminId) {
  log("Seeding patients (new identity model)...");
  await Patient.deleteMany({});

  const CHRONIC = [
    "Hypertension on Amlodipine 5mg",
    "Type 2 Diabetes on Metformin 500mg",
    "Asthma — uses Salbutamol inhaler",
    "Chronic gastritis on Omeprazole",
    "Hyperthyroidism managed with PTU",
    "Iron-deficiency anemia on supplements",
    "No significant past history",
    "Anxiety disorder on Escitalopram",
    "Migraine — uses Sumatriptan",
    "History of kidney stones (2021)",
  ];
  const ALLERGIES = [
    "Penicillin",
    "Sulpha drugs",
    "NSAIDs",
    "Shellfish",
    "Latex",
    "Aspirin",
    "None known",
    "Dust mites",
    "Pollen",
    "Eggs",
  ];
  const RELATIONS = [
    "Muhammad Tariq",
    "Abdul Rehman",
    "Ghulam Hassan",
    "Sardar Khan",
    "Zafar Iqbal",
    "Asif Hussain",
    "Riaz Ahmed",
    "Usman Ghani",
    "Bashir Ahmad",
    "Khalid Mehmood",
  ];
  const ADDRESSES = [
    "House 12, Street 4, Model Town, Lahore",
    "Flat 3B, Al-Noor Apartments, Gulshan-e-Iqbal, Karachi",
    "Village Dhok Padhal, Rawalpindi",
    "Plot 45, Phase 6, DHA, Lahore",
    "Mohalla Islampura, Near Masjid, Faisalabad",
    "Block C, Satellite Town, Gujranwala",
    "House 7, Quid-e-Azam Colony, Multan",
    "Street 9, G-11/3, Islamabad",
    "Flat 2A, Shah Faisal Colony, Karachi",
    "Canal Road, Opposite Jinnah Hospital, Lahore",
  ];

  const patientData = PATIENT_NAMES.slice(0, 10).map(([name, gender], i) => ({
    fullName: name,
    fatherOrHusbandName: RELATIONS[i % RELATIONS.length],
    age: randInt(18, 70),
    gender,
    phone: phone(),
    address: ADDRESSES[i % ADDRESSES.length],
    chronicConditions: CHRONIC[i % CHRONIC.length],
    allergies: ALLERGIES[i % ALLERGIES.length],
    department: rand(["General OPD", "Cardiology", "Dental", "Diabetology"]),
    password: "demo1234", // will be hashed by pre-save hook
    createdBy: adminId,
  }));

  const patients = [];
  for (const pd of patientData) {
    const p = await new Patient(pd).save(); // save one by one so pre-save hook runs
    patients.push(p);
    ok(`  Patient: ${p.fullName} → UID: ${p.uid}`);
  }

  ok(`Patients seeded: ${patients.length} (new identity model)`);
  return patients;
}

async function seedVisitsAndClinical(doctors, patients, adminId) {
  log("Seeding visits and linked clinical records...");

  const Visit = (await import("./models/Visit.js")).default;
  const LabTest = (await import("./models/LabTest.js")).default;
  const UltrasoundReport = (await import("./models/UltrasoundReport.js"))
    .default;
  const PharmacyRecord = (await import("./models/PharmacyRecord.js")).default;

  await Visit.deleteMany({});
  await LabTest.deleteMany({});
  await UltrasoundReport.deleteMany({});
  await PharmacyRecord.deleteMany({});

  const DEPARTMENTS = ["General OPD", "Cardiology", "Dental", "Diabetology"];
  const SYMPTOMS_VISIT = [
    "Fever, cough and body aches for 3 days",
    "Chest pain, palpitations",
    "Toothache, gum swelling",
    "Excessive thirst, frequent urination, blurred vision",
    "Abdominal pain, nausea, vomiting",
    "Joint pain, morning stiffness",
    "Skin rash, itching on arms",
    "Severe headache, blurred vision",
    "Frequent urination with burning sensation",
    "Lower back pain radiating to left leg",
  ];
  const DIAGNOSES = [
    "Viral upper respiratory tract infection — symptomatic treatment",
    "Hypertensive emergency — BP 190/110 — IV labetalol initiated",
    "Acute dental abscess — tooth 36 — extraction planned",
    "Uncontrolled Type 2 DM — HbA1c 9.2% — insulin initiation",
    "Acute gastroenteritis — IV fluids, antiemetics",
    "Early rheumatoid arthritis — ESR elevated, anti-CCP positive",
    "Allergic contact dermatitis — topical hydrocortisone",
    "Migraine with aura — Sumatriptan prescribed",
    "UTI — Nitrofurantoin 100mg BD × 5 days",
    "Lumbar disc herniation — L4-L5 — physiotherapy referral",
  ];
  const LAB_TESTS = [
    { testName: "Complete Blood Count (CBC)", testType: "Blood" },
    { testName: "Fasting Blood Sugar", testType: "Blood" },
    { testName: "Urine Routine/Examination", testType: "Urine" },
    { testName: "Liver Function Tests (LFTs)", testType: "Blood" },
    { testName: "HbA1c", testType: "Blood" },
    { testName: "Thyroid Profile (TSH)", testType: "Blood" },
    { testName: "Urine C&S", testType: "Urine" },
    { testName: "ESR", testType: "Blood" },
  ];
  const SCAN_TYPES = ["Abdominal", "Pelvic", "Thyroid", "Cardiac Echo"];
  const FINDINGS_LIST = [
    "No significant abnormality detected. Liver, spleen and kidneys normal in size.",
    "Mild diffuse heterogeneity of thyroid. No discrete nodule.",
    "Mild pericardial effusion. LV function preserved (EF 55%).",
    "Small right ovarian cyst (2.1 cm) — likely follicular.",
  ];
  const LAB_STATUSES = ["Done", "Done", "Processing", "Pending"];
  const US_STATUSES = ["Reported", "Reported", "Pending"];
  const PHARM_MEDS = [
    [{ name: "Paracetamol", dosage: "500mg", quantity: 15, price: 5 }],
    [
      { name: "Amoxicillin", dosage: "500mg", quantity: 21, price: 12 },
      { name: "Omeprazole", dosage: "20mg", quantity: 10, price: 15 },
    ],
    [
      { name: "Metformin", dosage: "500mg", quantity: 60, price: 8 },
      { name: "Atorvastatin", dosage: "20mg", quantity: 30, price: 18 },
    ],
    [
      { name: "Cetirizine", dosage: "10mg", quantity: 10, price: 7 },
      { name: "Ibuprofen", dosage: "400mg", quantity: 15, price: 6 },
    ],
    [{ name: "Azithromycin", dosage: "500mg", quantity: 3, price: 45 }],
  ];

  const visits = [];
  log("Creating 20 visits...");

  // 2 visits per patient (10 patients × 2)
  for (let i = 0; i < 20; i++) {
    const patient = patients[Math.floor(i / 2)]; // 2 visits per patient
    const doctor = rand(doctors);
    const daysAgo = i < 10 ? randInt(10, 90) : randInt(1, 9);

    const visit = await Visit.create({
      patientId: patient._id,
      doctorId: doctor._id,
      department: rand(DEPARTMENTS),
      visitDate: pastDate(daysAgo),
      symptoms: SYMPTOMS_VISIT[i % SYMPTOMS_VISIT.length],
      diagnosis: DIAGNOSES[i % DIAGNOSES.length],
      notes: "Follow up in 7 days if no improvement.",
      status: daysAgo > 0 ? "Completed" : "Scheduled",
      createdBy: adminId,
    });
    visits.push(visit);

    // Seed 1 Lab Test per visit
    const labData = LAB_TESTS[i % LAB_TESTS.length];
    await LabTest.create({
      patientId: patient._id,
      visitId: visit._id,
      doctor: doctor._id,
      testName: labData.testName,
      testType: labData.testType,
      status: LAB_STATUSES[i % LAB_STATUSES.length],
      result:
        i % 3 === 0
          ? "Within normal limits"
          : i % 3 === 1
            ? "Mildly elevated — see notes"
            : "",
      fee: randInt(300, 1200),
      department: "Lab",
      processedBy: adminId,
    });

    // 50% chance: add Ultrasound
    if (i % 2 === 0) {
      await UltrasoundReport.create({
        patientId: patient._id,
        visitId: visit._id,
        doctor: doctor._id,
        scanType: rand(SCAN_TYPES),
        findings: rand(FINDINGS_LIST),
        impression: "No acute pathology. Routine follow-up advised.",
        status: rand(US_STATUSES),
        fee: randInt(800, 2500),
        reportedBy: adminId,
      });
    }

    // Seed pharmacy for this visit
    const meds = rand(PHARM_MEDS);
    const totalAmount = meds.reduce((sum, m) => sum + m.price * m.quantity, 0);
    await PharmacyRecord.create({
      patientId: patient._id,
      visitId: visit._id,
      medicines: meds,
      totalAmount,
      status: "Dispensed",
      dispensedBy: adminId,
    });
  }

  ok(`Visits seeded: ${visits.length}`);
  ok(
    `Lab tests: ${visits.length} | Ultrasounds: ${Math.ceil(visits.length / 2)} | Pharmacy: ${visits.length}`,
  );
  return visits;
}

async function seedAppointments(doctors, patients) {
  log("Seeding appointments...");
  await Appointment.deleteMany({});

  const statuses = [
    "Scheduled",
    "Completed",
    "Cancelled",
    "Completed",
    "Completed",
    "Scheduled",
  ];
  const appointments = [];

  for (let i = 0; i < 150; i++) {
    const daysOffset = randInt(-90, 14); // past 90 days to 2 weeks future
    const apptDate =
      daysOffset < 0 ? pastDate(-daysOffset) : futureDate(daysOffset);
    const status =
      daysOffset < -1
        ? rand(["Completed", "Completed", "Cancelled"])
        : daysOffset === 0
          ? rand(["Scheduled", "Completed"])
          : "Scheduled";

    appointments.push({
      patientId: rand(patients)._id,
      doctorId: rand(doctors)._id,
      date: apptDate,
      status,
    });
  }

  const inserted = await Appointment.insertMany(appointments);
  ok(`Appointments seeded: ${inserted.length}`);
  return inserted;
}

async function seedTokens(doctors, patients, appointments, leaveIndices) {
  log("Seeding today's token queue...");
  await TokenQueue.deleteMany({});
  await TokenCounter.deleteMany({});

  const today = dateStr();
  const todayAppts = appointments.filter((a) => dateStr(a.date) === today);
  const availableDoctors = doctors.filter((_, i) => !leaveIndices.includes(i));

  const tokens = [];
  const counters = {};

  for (const doc of availableDoctors) {
    const docId = doc._id.toString();
    counters[docId] = 0;
    const statuses = [
      "Completed",
      "Completed",
      "Completed",
      "Completed",
      "Serving",
      "Waiting",
      "Waiting",
      "Waiting",
      "Waiting",
      "Waiting",
      "Waiting",
    ];

    for (let t = 0; t < 10; t++) {
      counters[docId]++;
      const patient = rand(patients);
      const appt = rand(todayAppts.length > 0 ? todayAppts : appointments);
      tokens.push({
        doctorId: doc._id,
        patientId: patient._id,
        appointmentId: appt._id,
        tokenNumber: counters[docId],
        date: today,
        status: statuses[t] || "Waiting",
        createdBy: doc._id, // self-created for seed
        arrivedAt: ["Completed", "Serving"].includes(statuses[t])
          ? pastDate(0)
          : null,
        completedAt: statuses[t] === "Completed" ? pastDate(0) : null,
      });
    }
  }

  await TokenQueue.insertMany(tokens);

  // Create counters
  for (const [docId, count] of Object.entries(counters)) {
    await TokenCounter.create({ _id: `${docId}_${today}`, counter: count });
  }

  ok(
    `Token queue seeded: ${tokens.length} tokens for ${availableDoctors.length} doctors`,
  );
}

async function seedPrescriptions(doctors, patients) {
  log("Seeding prescriptions...");
  await Prescription.deleteMany({});

  const prescriptions = [];
  for (let i = 0; i < 30; i++) {
    const numMeds = randInt(1, 4);
    const meds = [];
    const usedMeds = new Set();
    for (let m = 0; m < numMeds; m++) {
      let med;
      do {
        med = rand(MEDICINES);
      } while (usedMeds.has(med.name));
      usedMeds.add(med.name);
      meds.push(med);
    }

    prescriptions.push({
      patientId: rand(patients)._id,
      doctorId: rand(doctors)._id,
      medicines: meds,
      instructions: rand(INSTRUCTIONS),
      pdfUrl: `https://res.cloudinary.com/smartcare/demo/prescription_${i + 1}.pdf`,
      createdAt: pastDate(randInt(0, 60)),
    });
  }

  const inserted = await Prescription.insertMany(prescriptions);
  ok(`Prescriptions seeded: ${inserted.length}`);
  return inserted;
}

async function seedDiagnosisLogs(doctors) {
  log("Seeding AI diagnosis logs...");
  await DiagnosisLog.deleteMany({});

  const logs = [];
  for (let i = 0; i < 40; i++) {
    const symptomSet = rand(SYMPTOMS_LIST);
    logs.push({
      symptoms: symptomSet.symptoms,
      aiResponse: symptomSet.aiResponse,
      riskLevel: symptomSet.riskLevel,
      doctorId: rand(doctors)._id,
      createdAt: pastDate(randInt(0, 45)),
    });
  }

  const inserted = await DiagnosisLog.insertMany(logs);
  ok(`AI Diagnosis logs seeded: ${inserted.length}`);
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    "\n\x1b[35m╔══════════════════════════════════════════════╗\x1b[0m",
  );
  console.log(
    "\x1b[35m║  SmartCare Hospital — Demo Data Seeder v1.0  ║\x1b[0m",
  );
  console.log(
    "\x1b[35m╚══════════════════════════════════════════════╝\x1b[0m\n",
  );

  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    ok("MongoDB connected");

    const { admins, doctors, receptionists } = await seedUsers();
    const leaveIndices = await seedSchedules(doctors);
    const patients = await seedPatients(admins[0]._id);
    await seedVisitsAndClinical(doctors, patients, admins[0]._id);
    const appointments = await seedAppointments(doctors, patients);
    await seedTokens(doctors, patients, appointments, leaveIndices);
    await seedPrescriptions(doctors, patients);
    await seedDiagnosisLogs(doctors);

    console.log(
      "\n\x1b[32m╔══════════════════════════════════════════════╗\x1b[0m",
    );
    console.log(
      "\x1b[32m║  ✅  Database seeded successfully!            ║\x1b[0m",
    );
    console.log(
      "\x1b[32m╚══════════════════════════════════════════════╝\x1b[0m",
    );
    console.log("\n\x1b[36mDemo Login Credentials (password: demo1234)\x1b[0m");
    console.log("─────────────────────────────────────────────");
    console.log("  Admin         → admin@smartcare.com");
    console.log("  Super Admin   → superadmin@smartcare.com");
    console.log("  Doctor        → ahmed.khan@smartcare.com");
    console.log("  Receptionist  → reception1@smartcare.com");
    console.log("─────────────────────────────────────────────");
    console.log("\n\x1b[36mPatient UID Login (password: demo1234)\x1b[0m");
    console.log("─────────────────────────────────────────────");
    patients.forEach((p) => {
      console.log(`  ${p.uid}  →  ${p.fullName} (${p.gender}, ${p.age}y)`);
    });
    console.log("─────────────────────────────────────────────\n");
  } catch (err) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
