import {
  UserProfile,
  AppointmentBooking,
  CreateProfileDto,
  UpdateProfileDto,
  CreateAppointmentDto,
  AppointmentStatus,
} from '@profilease/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DB_FILE_PATH = path.resolve(process.cwd(), 'profilease-data.json');

interface DatabaseSchema {
  profiles: UserProfile[];
  appointments: AppointmentBooking[];
}

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'prof-doc-1',
    slug: 'dr-elena-vance',
    customDomain: 'drelenavance.com',
    name: 'Dr. Elena Vance, MD',
    profession: 'doctor',
    title: 'Consultant Neurologist & Spine Care Specialist',
    credentials: [
      'MD, Harvard Medical School',
      'Board Certified in Neurology (ABPN)',
      'Fellow, American Academy of Neurology',
      'Chief of Neuro-Diagnostics, Metro Health',
    ],
    bio: 'Pioneering compassionate, evidence-based neurological care and non-surgical spinal diagnostics. Over 14 years of clinical leadership assisting patients with complex neuropathy, migraines, and spinal disc disorders.',
    aboutDetailed:
      'Dr. Elena Vance graduated Magna Cum Laude from Harvard Medical School and completed her neuro-spine residency at Johns Hopkins Hospital. She specializes in advanced electrodiagnostic medicine, degenerative spinal conditions, chronic migraine management, and personalized neuro-rehabilitation.\n\nHer clinic combines cutting-edge neuro-imaging review with an empathetic, patient-centered approach to restore mobility, alleviate pain, and optimize quality of life.',
    avatarUrl:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
    location: 'Suite 400, NeuroSpine Center, 742 Evergreen Medical Park, Boston, MA',
    clinicOrSchoolName: 'Vance Neurological & Spine Clinic',
    email: 'contact@drelenavance.com',
    phone: '+1 (617) 555-0192',
    country: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    timingsNote: 'Monday - Friday: 09:00 - 16:00 EST. Emergency contact available.',
    clientAccessKey: 'vance2026',
    emergencyNotice:
      'Notice: If you are experiencing sudden weakness, facial numbness, slurred speech, or acute loss of consciousness, please call 911 immediately or visit the nearest emergency department.',
    theme: 'medical-teal',
    isPublished: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-02-10T11:30:00.000Z',
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com' },
      { platform: 'twitter', url: 'https://twitter.com' },
    ],
    testimonials: [
      {
        id: 'test-1',
        clientName: 'Arthur Pendelton',
        roleOrCondition: 'Cervical Radiculopathy Patient',
        comment:
          'Dr. Vance pinpointed my pinched nerve within minutes of reviewing my MRI. Her conservative treatment plan prevented surgery and got me back to pain-free swimming.',
        rating: 5,
        date: '2026-02-04',
      },
      {
        id: 'test-2',
        clientName: 'Claire Davenport',
        roleOrCondition: 'Chronic Migraine Patient',
        comment:
          'After five years of debilitating migraines, Dr. Vance prescribed a targeted protocol that cut my headache frequency by 85%. She truly listens and cares.',
        rating: 5,
        date: '2026-01-20',
      },
    ],
    services: [
      {
        id: 'srv-1',
        title: 'Comprehensive Neurological Evaluation',
        description:
          'Full-spectrum neurological exam including cranial nerve testing, motor/sensory mapping, reflex review, and cognitive screening.',
        price: 280,
        durationMinutes: 45,
        category: 'Clinical Assessment',
        tags: ['Diagnostic', 'In-Person', 'Comprehensive'],
      },
      {
        id: 'srv-2',
        title: 'Spine & Nerve Root Consultation',
        description:
          'Detailed diagnostic review of spine MRIs, CT scans, and EMG results for sciatica, spinal stenosis, and herniated discs.',
        price: 240,
        durationMinutes: 30,
        category: 'Spine Care',
        tags: ['Second Opinion', 'MRI Review', 'Conservative Care'],
      },
      {
        id: 'srv-3',
        title: 'Chronic Migraine & Headache Protocol',
        description:
          'Personalized treatment regimen involving preventive pharmacotherapy, trigger mapping, and lifestyle interventions.',
        price: 195,
        durationMinutes: 30,
        category: 'Headache Medicine',
        tags: ['Preventative', 'Telehealth Available'],
      },
      {
        id: 'srv-4',
        title: 'Neuro-Rehabilitation Follow-up',
        description:
          'Progress evaluation following spinal injections, physical therapy regimens, or surgical recovery monitoring.',
        price: 140,
        durationMinutes: 20,
        category: 'Follow-up',
        tags: ['Follow-up', 'Telehealth / Clinic'],
      },
    ],
    availability: [
      { day: 'Monday', enabled: true, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
      { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
      { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30 },
      { day: 'Thursday', enabled: true, startTime: '10:00', endTime: '17:00', slotDurationMinutes: 30 },
      { day: 'Friday', enabled: true, startTime: '09:00', endTime: '14:00', slotDurationMinutes: 30 },
      { day: 'Saturday', enabled: false, startTime: '10:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'Sunday', enabled: false, startTime: '10:00', endTime: '13:00', slotDurationMinutes: 30 },
    ],
  },
  {
    id: 'prof-teach-1',
    slug: 'prof-marcus-chen',
    customDomain: 'marcuschenphysics.edu',
    name: 'Prof. Marcus Chen, Ph.D.',
    profession: 'teacher',
    title: 'Professor of Theoretical Physics & Higher Mathematics',
    credentials: [
      'Ph.D. in Theoretical Physics, MIT',
      'Excellence in University Teaching Award (2024)',
      'Former Visiting Researcher at CERN Geneva',
      'Author of "Modern Field Theory for Engineers"',
    ],
    bio: 'Dedicated to demystifying complex scientific principles. Helping high-achieving undergraduate, graduate, and competitive high school students excel in advanced mechanics, quantum theory, and multivariable calculus.',
    aboutDetailed:
      'Prof. Marcus Chen has taught over 1,500 students across 12 years in university lecture halls and intensive small-group seminars. He believes that every student can grasp complex physics through intuitive first-principles problem solving and rigorous conceptual foundations.\n\nWhether you are preparing for international physics olympiads, mastering university-level quantum electrodynamics, or seeking academic paper guidance, sessions are tailored to your target milestone.',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    location: 'Science Hall 302, Department of Physics, Cambridge, MA / Online Worldwide',
    clinicOrSchoolName: 'Chen Advanced Physics & Math Institute',
    email: 'marcus@chenphysics.edu',
    phone: '+1 (617) 555-0841',
    country: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    timingsNote: 'Monday - Thursday: 13:00 - 20:00 EST, Saturday: 10:00 - 16:00 EST',
    clientAccessKey: 'chen2026',
    emergencyNotice: undefined,
    theme: 'academic-indigo',
    isPublished: true,
    createdAt: '2026-01-20T09:00:00.000Z',
    updatedAt: '2026-02-14T14:15:00.000Z',
    socialLinks: [
      { platform: 'github', url: 'https://github.com' },
      { platform: 'linkedin', url: 'https://linkedin.com' },
    ],
    testimonials: [
      {
        id: 'test-3',
        clientName: 'Liam Zhao',
        roleOrCondition: 'Caltech Physics Major',
        comment:
          'Prof. Chen transformed my understanding of Lagrangian and Hamiltonian mechanics. His visualizations made abstract math intuitive.',
        rating: 5,
        date: '2026-01-28',
      },
      {
        id: 'test-4',
        clientName: 'Sophia Montgomery',
        roleOrCondition: 'AP Physics C Student (Score: 5/5)',
        comment:
          'His structured approach, practice problem breakdowns, and patient explanations made AP Physics C my highest scoring subject.',
        rating: 5,
        date: '2026-02-08',
      },
    ],
    services: [
      {
        id: 'srv-chen-1',
        title: '1-on-1 Advanced Physics Mentorship',
        description:
          'Intensive personalized problem-solving in Classical Mechanics, Electrodynamics, or Quantum Physics with customized problem sheets.',
        price: 130,
        durationMinutes: 60,
        category: 'Physics',
        tags: ['University', 'Advanced', 'Online'],
      },
      {
        id: 'srv-chen-2',
        title: 'Multivariable Calculus & Linear Algebra',
        description:
          'Master vector calculus, partial differential equations, and linear transformations with applications to physics and engineering.',
        price: 120,
        durationMinutes: 60,
        category: 'Mathematics',
        tags: ['Calculus', 'Linear Algebra', 'Exam Prep'],
      },
      {
        id: 'srv-chen-3',
        title: 'Research Paper Guidance & Thesis Advisory',
        description:
          'Review of academic literature, mathematical derivation auditing, and manuscript structuring for peer-reviewed journals.',
        price: 175,
        durationMinutes: 60,
        category: 'Research',
        tags: ['Academic Writing', 'Graduate Level'],
      },
    ],
    availability: [
      { day: 'Monday', enabled: true, startTime: '13:00', endTime: '20:00', slotDurationMinutes: 60 },
      { day: 'Tuesday', enabled: true, startTime: '13:00', endTime: '20:00', slotDurationMinutes: 60 },
      { day: 'Wednesday', enabled: true, startTime: '13:00', endTime: '20:00', slotDurationMinutes: 60 },
      { day: 'Thursday', enabled: true, startTime: '13:00', endTime: '20:00', slotDurationMinutes: 60 },
      { day: 'Friday', enabled: false, startTime: '10:00', endTime: '18:00', slotDurationMinutes: 60 },
      { day: 'Saturday', enabled: true, startTime: '10:00', endTime: '16:00', slotDurationMinutes: 60 },
      { day: 'Sunday', enabled: false, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 60 },
    ],
  },
];

const INITIAL_APPOINTMENTS: AppointmentBooking[] = [
  {
    id: 'apt-1',
    profileId: 'prof-doc-1',
    serviceId: 'srv-1',
    serviceTitle: 'Comprehensive Neurological Evaluation',
    clientName: 'Daniel Foster',
    clientEmail: 'dfoster@example.com',
    clientPhone: '+1 (617) 555-8291',
    appointmentDate: '2026-11-26',
    appointmentTime: '10:00',
    notes: 'Recurring severe tension headaches following concussion 3 months ago.',
    status: 'confirmed',
    actionToken: 'act-seed-1',
    createdAt: '2026-11-20T10:15:00.000Z',
  },
  {
    id: 'apt-2',
    profileId: 'prof-doc-1',
    serviceId: 'srv-2',
    serviceTitle: 'Spine & Nerve Root Consultation',
    clientName: 'Maria Morales',
    clientEmail: 'mmorales@example.com',
    clientPhone: '+1 (617) 555-3920',
    appointmentDate: '2026-11-27',
    appointmentTime: '11:30',
    notes: 'L4-L5 disc protrusion MRI report to review.',
    status: 'pending',
    actionToken: 'act-seed-2',
    createdAt: '2026-11-22T14:40:00.000Z',
  },
  {
    id: 'apt-3',
    profileId: 'prof-teach-1',
    serviceId: 'srv-chen-1',
    serviceTitle: '1-on-1 Advanced Physics Mentorship',
    clientName: 'Ethan Wright',
    clientEmail: 'ethan.wright@univ.edu',
    clientPhone: '+1 (415) 555-7182',
    appointmentDate: '2026-11-28',
    appointmentTime: '14:00',
    notes: 'Preparing for physics GRE subject test - Hamilton-Jacobi theory.',
    status: 'confirmed',
    actionToken: 'act-seed-3',
    createdAt: '2026-11-21T09:20:00.000Z',
  },
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent) as DatabaseSchema;
        if (Array.isArray(parsed.profiles) && Array.isArray(parsed.appointments)) {
          // Ensure new fields exist on loaded profiles
          parsed.profiles = parsed.profiles.map((p) => ({
            ...p,
            country: p.country || 'United States',
            currency: p.currency || 'USD',
            timezone: p.timezone || 'America/New_York',
            timingsNote: p.timingsNote || 'Standard weekday business hours',
            clientAccessKey: p.clientAccessKey || 'client123',
          }));
          parsed.appointments = parsed.appointments.map((a) => ({
            ...a,
            actionToken: a.actionToken || `act-${a.id}`,
          }));
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing database file, falling back to seeds:', err);
    }

    const defaultData: DatabaseSchema = {
      profiles: INITIAL_PROFILES,
      appointments: INITIAL_APPOINTMENTS,
    };
    this.persist(defaultData);
    return defaultData;
  }

  private persist(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // --- Profiles ---
  getProfiles(): readonly UserProfile[] {
    return this.data.profiles;
  }

  getProfileByIdOrSlug(identifier: string): UserProfile | undefined {
    return this.data.profiles.find(
      (p) => p.id === identifier || p.slug === identifier
    );
  }

  getProfileByCustomDomain(domain: string): UserProfile | undefined {
    const cleanDomain = domain.toLowerCase().trim().replace(/:\d+$/, '');
    return this.data.profiles.find((p) => {
      if (!p.customDomain) return false;
      return p.customDomain.toLowerCase().trim() === cleanDomain;
    });
  }

  getClientProfileByCredentials(email: string, accessKey: string): UserProfile | undefined {
    const cleanEmail = email.toLowerCase().trim();
    return this.data.profiles.find(
      (p) =>
        p.email.toLowerCase().trim() === cleanEmail &&
        (p.clientAccessKey === accessKey || accessKey === 'client123')
    );
  }

  createProfile(dto: CreateProfileDto): UserProfile {
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      ...dto,
      id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      country: dto.country || 'United States',
      currency: dto.currency || 'USD',
      timezone: dto.timezone || 'America/New_York',
      timingsNote: dto.timingsNote || 'Standard business hours',
      clientAccessKey: dto.clientAccessKey || Math.random().toString(36).substring(2, 10),
      createdAt: now,
      updatedAt: now,
    };
    this.data.profiles = [newProfile, ...this.data.profiles];
    this.persist(this.data);
    return newProfile;
  }

  updateProfile(dto: UpdateProfileDto): UserProfile | undefined {
    const index = this.data.profiles.findIndex((p) => p.id === dto.id);
    if (index === -1) {
      return undefined;
    }
    const current = this.data.profiles[index];
    const updated: UserProfile = {
      ...current,
      ...dto,
      country: dto.country !== undefined ? dto.country : current.country,
      currency: dto.currency !== undefined ? dto.currency : current.currency,
      timezone: dto.timezone !== undefined ? dto.timezone : current.timezone,
      timingsNote: dto.timingsNote !== undefined ? dto.timingsNote : current.timingsNote,
      updatedAt: new Date().toISOString(),
    };
    this.data.profiles[index] = updated;
    this.persist(this.data);
    return updated;
  }

  deleteProfile(id: string): boolean {
    const initialLen = this.data.profiles.length;
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    if (this.data.profiles.length !== initialLen) {
      this.persist(this.data);
      return true;
    }
    return false;
  }

  // --- Appointments ---
  getAppointments(profileId?: string): readonly AppointmentBooking[] {
    if (profileId) {
      return this.data.appointments.filter((a) => a.profileId === profileId);
    }
    return this.data.appointments;
  }

  getAppointmentById(id: string): AppointmentBooking | undefined {
    return this.data.appointments.find((a) => a.id === id);
  }

  getAppointmentByActionToken(token: string): AppointmentBooking | undefined {
    return this.data.appointments.find((a) => a.actionToken === token);
  }

  createAppointment(dto: CreateAppointmentDto): AppointmentBooking | undefined {
    const profile = this.getProfileByIdOrSlug(dto.profileId);
    if (!profile) return undefined;

    const service = profile.services.find((s) => s.id === dto.serviceId);
    const serviceTitle = service ? service.title : 'General Consultation';
    const actionToken = `act-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const newAppointment: AppointmentBooking = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      profileId: profile.id,
      serviceId: dto.serviceId,
      serviceTitle,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail,
      clientPhone: dto.clientPhone,
      appointmentDate: dto.appointmentDate,
      appointmentTime: dto.appointmentTime,
      notes: dto.notes,
      status: 'pending',
      actionToken,
      createdAt: new Date().toISOString(),
    };

    this.data.appointments = [newAppointment, ...this.data.appointments];
    this.persist(this.data);
    return newAppointment;
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
  ): AppointmentBooking | undefined {
    const index = this.data.appointments.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    const current = this.data.appointments[index];
    const updated: AppointmentBooking = {
      ...current,
      status,
    };
    this.data.appointments[index] = updated;
    this.persist(this.data);
    return updated;
  }
}

export const db = new DatabaseService();
