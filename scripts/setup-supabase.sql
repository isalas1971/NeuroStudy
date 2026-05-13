-- ============================================================
-- NeuroStudy - Schema completo
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- TABLAS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  profile_picture TEXT,
  accessibility_profile TEXT DEFAULT 'none',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accessibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dyslexia_mode BOOLEAN DEFAULT FALSE,
  adhd_mode BOOLEAN DEFAULT FALSE,
  autism_mode BOOLEAN DEFAULT FALSE,
  increased_spacing BOOLEAN DEFAULT FALSE,
  reduced_animations BOOLEAN DEFAULT FALSE,
  text_to_speech BOOLEAN DEFAULT FALSE,
  word_highlighting BOOLEAN DEFAULT FALSE,
  color_theme TEXT DEFAULT 'default',
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_type TEXT DEFAULT 'brown_noise',
  sound_volume NUMERIC DEFAULT 0.5,
  session_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  goal TEXT,
  duration_minutes INTEGER,
  points_earned INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_name TEXT,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_pet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  pet_name TEXT,
  pet_type TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  hunger INTEGER DEFAULT 50,
  happiness INTEGER DEFAULT 50,
  last_fed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLAS ESCOLARES
-- ============================================================

CREATE TABLE IF NOT EXISTS school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vincula alumnos y docentes a sus clases
CREATE TABLE IF NOT EXISTS class_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Registros de asistencia diarios
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id, date)
);

-- Eventos de calendario (escolares, de clase o personales)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT DEFAULT 'event' CHECK (event_type IN ('exam', 'homework', 'event', 'reminder')),
  is_personal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tareas de alumnos (creadas por ellos o asignadas por docentes)
CREATE TABLE IF NOT EXISTS student_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas de docentes sobre alumnos
CREATE TABLE IF NOT EXISTS teacher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_classes(id) ON DELETE SET NULL,
  note_type TEXT DEFAULT 'neutral' CHECK (note_type IN ('positive', 'neutral', 'concern')),
  content TEXT NOT NULL,
  is_visible_to_student BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_pet ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS: schools
-- ============================================================

CREATE POLICY "Cualquier autenticado puede ver escuelas" ON schools
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins pueden crear escuelas" ON schools
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- POLÍTICAS: user_profiles
-- ============================================================

CREATE POLICY "Usuarios ven su propio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Docentes ven perfiles de sus alumnos" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_memberships cm_teacher
      JOIN class_memberships cm_student ON cm_teacher.class_id = cm_student.class_id
      WHERE cm_teacher.user_id = auth.uid()
        AND cm_teacher.role = 'teacher'
        AND cm_student.user_id = user_profiles.id
    )
  );

CREATE POLICY "Usuarios actualizan su propio perfil" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios crean su propio perfil" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- POLÍTICAS: accessibility_settings
-- ============================================================

CREATE POLICY "Usuarios ven su configuracion" ON accessibility_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan su configuracion" ON accessibility_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean su configuracion" ON accessibility_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLÍTICAS: study_sessions
-- ============================================================

CREATE POLICY "Usuarios ven sus sesiones" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sesiones" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan sus sesiones" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLÍTICAS: user_achievements
-- ============================================================

CREATE POLICY "Usuarios ven sus logros" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus logros" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLÍTICAS: study_pet
-- ============================================================

CREATE POLICY "Usuarios ven su mascota" ON study_pet
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean su mascota" ON study_pet
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios actualizan su mascota" ON study_pet
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- POLÍTICAS: school_classes
-- ============================================================

CREATE POLICY "Miembros ven sus clases" ON school_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = school_classes.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Docentes crean clases" ON school_classes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Docentes actualizan sus clases" ON school_classes
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================
-- POLÍTICAS: class_memberships
-- ============================================================

CREATE POLICY "Usuarios ven sus membresías" ON class_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Docentes ven miembros de sus clases" ON class_memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_memberships cm
      WHERE cm.class_id = class_memberships.class_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'teacher'
    )
  );

CREATE POLICY "Docentes agregan miembros a sus clases" ON class_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_memberships cm
      WHERE cm.class_id = class_memberships.class_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'teacher'
    )
  );

-- ============================================================
-- POLÍTICAS: attendance_records
-- ============================================================

CREATE POLICY "Alumnos ven su propia asistencia" ON attendance_records
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Docentes ven asistencia de su clase" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = attendance_records.class_id
        AND user_id = auth.uid()
        AND role = 'teacher'
    )
  );

CREATE POLICY "Docentes registran asistencia en su clase" ON attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = attendance_records.class_id
        AND user_id = auth.uid()
        AND role = 'teacher'
    )
  );

CREATE POLICY "Docentes actualizan asistencia en su clase" ON attendance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = attendance_records.class_id
        AND user_id = auth.uid()
        AND role = 'teacher'
    )
  );

-- ============================================================
-- POLÍTICAS: calendar_events
-- ============================================================

CREATE POLICY "Usuarios ven sus eventos personales" ON calendar_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios ven eventos de sus clases" ON calendar_events
  FOR SELECT USING (
    class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = calendar_events.class_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios crean eventos personales" ON calendar_events
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_personal = TRUE);

CREATE POLICY "Docentes crean eventos de clase" ON calendar_events
  FOR INSERT WITH CHECK (
    is_personal = FALSE AND EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = calendar_events.class_id
        AND user_id = auth.uid()
        AND role = 'teacher'
    )
  );

CREATE POLICY "Creadores actualizan sus eventos" ON calendar_events
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Creadores eliminan sus eventos" ON calendar_events
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- POLÍTICAS: student_tasks
-- ============================================================

CREATE POLICY "Alumnos ven sus tareas" ON student_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Docentes ven tareas de sus alumnos" ON student_tasks
  FOR SELECT USING (
    class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_id = student_tasks.class_id
        AND user_id = auth.uid()
        AND role = 'teacher'
    )
  );

CREATE POLICY "Alumnos crean sus tareas" ON student_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Alumnos actualizan sus tareas" ON student_tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Alumnos eliminan sus tareas" ON student_tasks
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- POLÍTICAS: teacher_notes
-- ============================================================

CREATE POLICY "Docentes ven sus propias notas" ON teacher_notes
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Alumnos ven notas visibles sobre ellos" ON teacher_notes
  FOR SELECT USING (
    student_id = auth.uid() AND is_visible_to_student = TRUE
  );

CREATE POLICY "Docentes crean notas en sus clases" ON teacher_notes
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND (
      class_id IS NULL OR EXISTS (
        SELECT 1 FROM class_memberships
        WHERE class_id = teacher_notes.class_id
          AND user_id = auth.uid()
          AND role = 'teacher'
      )
    )
  );

CREATE POLICY "Docentes actualizan sus notas" ON teacher_notes
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Docentes eliminan sus notas" ON teacher_notes
  FOR DELETE USING (teacher_id = auth.uid());
