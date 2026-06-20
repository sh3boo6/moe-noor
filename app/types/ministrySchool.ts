export type ColumnGroup
  = | 'identity'
    | 'students'
    | 'staff'
    | 'facilities'
    | 'building'
    | 'classification'
    | 'additional'
    | 'raw'

export interface IdentityData {
  id: string
  schoolName: string
  cityVillage: string
  educationDepartment: string
  administrativeRegion: string
  unifiedCode: string
  stage: string
  authority: string
  educationType: string
  studyTime: string
  gender: string
  foundingYear: string
  phone: string
  email: string
  mailAddress: string
}

export interface StudentStats {
  grade1: number
  grade2: number
  grade3: number
  grade4: number
  grade5: number
  grade6: number
  grade7: number
  grade8: number
  grade9: number
  grade10: number
  grade11: number
  grade12: number
  total: number
  saudi: number
  newcomers: number
  gradeTotal: number
  gradeTotalMismatch: number
  classes: number
  saudi1?: number
  saudi2?: number
  saudi3?: number
  saudi4?: number
  saudi5?: number
  saudi6?: number
  saudi7?: number
  saudi8?: number
  saudi9?: number
  saudi10?: number
  saudi11?: number
  saudi12?: number
  saudiBus?: number
  saudiNewcomers?: number
}

export interface StaffStats {
  teachers: number
  saudiTeachers: number
  admins: number
  saudiAdmins: number
  guidance: number
  agents: number
  managerName: string
  managerId: string
  managerPhone: string
  managerEmailOfficial: string
  managerEmailPersonal: string
}

export interface FacilityStats {
  computerLabs: number
  physicsLabs: number
  chemistryLabs: number
  englishRooms: number
  sewingRooms: number
  homeEconomicsRooms: number
  internet: boolean
  cafeteria: boolean
  water: boolean
}

export interface BuildingData {
  ownership: string
  rent: number
  latitude: number
  longitude: number
  roadStatus: string
  roadType: string
  subscriptionType: string
  independenceStatus: string
  nearestPrimaryDistance: number
  nearestMiddleDistance: number
  nearestHighDistance: number
}

export interface ClassificationData {
  earlyChildhood: boolean
  pathways: boolean
}

export interface AdditionalData {
  educationOffice: string
  schoolCount: number
  createdAt: string
  rooms: number
  serviceStaff: number
  workers: number
  governmentBuildings: number
  rentedBuildings: number
  address: string
  nearestPrimary: string
  distance1: number
  roadStatus1: string
  sameRegion1: boolean
  nearestMiddle: string
  distance2: number
  roadStatus2: string
  sameRegion2: boolean
  nearestHigh: string
  distance3: number
  roadStatus3: string
  sameRegion3: boolean
  asphaltDistance: number
  dirtDistance: number
  rockyDistance: number
  managersCount: number
  librariansCount: number
  labPreparersCount: number
  governorateNumber: string
  governorate: string
  administrativeCenterNumber: string
  administrativeCenter: string
  postalBox: string
  postalCode: string
  curriculumClassrooms: number
  schoolBase: string
  sharedSchoolMinistryNumber: string
  remote: boolean
  unitDepartmentOfficeCode: string
  userId: string
  investorName: string
  investorEmail: string
  investorPhone: string
  curriculum: string
  planType: string
  classesMerged: boolean
  schoolSystem: string
  englishSchoolName: string
  englishEducationDepartment: string
  educationDepartmentCode: string
  stageCode: string
  coordinateNumber: string
  associatedCoordinateSchoolName: string
  coordinateType: string
  schoolStatus: string
  closingDate: string
  maleStudentsInGirlsSchools: number
  maleClassesInGirlsSchools: number
  payroll: string
  licenseNumber: string
  commercialRegistration: string
  certificateSchoolName: string
  inComplex: boolean
  libraryExists: boolean
  waterStatus: string
  cars: number
  resourceManagersCount: number
  activityLeadersCount: number
  registrationOfficersCount: number
  studentCounselorsCount: number
  educationCategory: string
  siteClassification: string
  sectorCode: string
  sector: string
  farisSectorCode: string
  capacity: number
  femaleTeachersTeachingAssignedMaleStudents: number
  segment: string
}

export interface MinistrySchoolRecord {
  identity: IdentityData
  students: StudentStats
  staff: StaffStats
  facilities: FacilityStats
  building: BuildingData
  classification: ClassificationData
  additional: AdditionalData
  raw: Record<string, unknown>
  sourceRow: number
}

export interface MinistryExcelPayload {
  schools: MinistrySchoolRecord[]
  headers: string[]
  warningCount: number
}

export interface MinistryFilters {
  educationDepartment: string[]
  administrativeRegion: string[]
  stage: string[]
  gender: string[]
  authority: string[]
  buildingOwnership: string[]
  studyTime: string[]
  educationType: string[]
  governorate: string[]
}
