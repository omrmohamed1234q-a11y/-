// Educational constants for Egyptian curriculum system

export const CURRICULUM_TYPES = [
  { value: 'egyptian_arabic', label: 'المنهج المصري (عربي)' },
  { value: 'egyptian_languages', label: 'المنهج المصري (لغات)' },
  { value: 'azhar', label: 'الأزهر الشريف' },
  { value: 'igcse', label: 'IG (IGCSE)' },
  { value: 'american', label: 'American Diploma' },
  { value: 'ib', label: 'IB (International Baccalaureate)' },
  { value: 'stem', label: 'مدارس STEM' },
] as const;

export const SUBJECTS = [
  { value: 'arabic', label: 'عربي' },
  { value: 'math', label: 'رياضيات' },
  { value: 'science', label: 'علوم' },
  { value: 'chemistry', label: 'كيمياء' },
  { value: 'physics', label: 'فيزياء' },
  { value: 'biology', label: 'أحياء' },
  { value: 'social_studies', label: 'دراسات اجتماعية' },
  { value: 'geography', label: 'جغرافيا' },
  { value: 'history', label: 'تاريخ' },
  { value: 'english', label: 'إنجليزي' },
  { value: 'french', label: 'فرنسي' },
  { value: 'technology', label: 'تكنولوجيا' },
  { value: 'economics', label: 'اقتصاد / إحصاء' },
  { value: 'research', label: 'البحث العلمي (STEM)' },
  { value: 'tok', label: 'TOK (IB)' },
  { value: 'other', label: 'مواد أخرى' },
] as const;

export const GRADE_LEVELS = [
  // Primary (الابتدائي)
  { value: 'primary_1', label: 'الأول الابتدائي', stage: 'primary' },
  { value: 'primary_2', label: 'الثاني الابتدائي', stage: 'primary' },
  { value: 'primary_3', label: 'الثالث الابتدائي', stage: 'primary' },
  { value: 'primary_4', label: 'الرابع الابتدائي', stage: 'primary' },
  { value: 'primary_5', label: 'الخامس الابتدائي', stage: 'primary' },
  { value: 'primary_6', label: 'السادس الابتدائي', stage: 'primary' },
  
  // Preparatory (الإعدادي)
  { value: 'prep_7', label: 'الأول الإعدادي', stage: 'preparatory' },
  { value: 'prep_8', label: 'الثاني الإعدادي', stage: 'preparatory' },
  { value: 'prep_9', label: 'الثالث الإعدادي', stage: 'preparatory' },
  
  // Secondary (الثانوي)
  { value: 'secondary_10', label: 'الأول الثانوي', stage: 'secondary' },
  { value: 'secondary_11', label: 'الثاني الثانوي', stage: 'secondary' },
  { value: 'secondary_12', label: 'الثالث الثانوي', stage: 'secondary' },
  
  // University (الجامعي)
  { value: 'university', label: 'جامعي', stage: 'university' },
] as const;

export const PRODUCT_TYPES = [
  { value: 'book', label: 'كتاب ورقي' },
  { value: 'pdf', label: 'PDF للتحميل' },
  { value: 'summaries', label: 'ملخصات' },
  { value: 'notes', label: 'مذكرات شرح' },
  { value: 'worksheets', label: 'أوراق عمل' },
  { value: 'exams', label: 'امتحانات سابقة' },
  { value: 'solutions', label: 'حلول نموذجية' },
] as const;

export const COVER_TYPES = [
  { value: 'color', label: 'غلاف ملون' },
  { value: 'black_white', label: 'أبيض وأسود' },
] as const;

export const DOWNLOAD_LIMITS = [
  { value: 'once', label: 'مرة واحدة' },
  { value: 'unlimited', label: 'غير محدود' },
] as const;

// Helper functions
export const getCurriculumLabel = (value: string) => {
  return CURRICULUM_TYPES.find(item => item.value === value)?.label || value;
};

export const getSubjectLabel = (value: string) => {
  return SUBJECTS.find(item => item.value === value)?.label || value;
};

export const getGradeLevelLabel = (value: string) => {
  return GRADE_LEVELS.find(item => item.value === value)?.label || value;
};

export const getProductTypesLabels = (values: string[]) => {
  return values.map(value => 
    PRODUCT_TYPES.find(item => item.value === value)?.label || value
  );
};

export const getStageByGrade = (gradeLevel: string) => {
  return GRADE_LEVELS.find(item => item.value === gradeLevel)?.stage || '';
};