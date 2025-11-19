// File: src/modules/your-bucket-name/enums/complaint-authority.enum.ts

/**
 * Government authorities that can receive your-bucket-name.
 * These values are stored as strings for flexibility.
 */
export enum ComplaintAuthority {
  /** Municipalities (roads, lighting, cleanliness, sidewalks, etc.) */
  MUNICIPALITY = 'municipality',

  /** Electricity company (outages, billing, meter issues, etc.) */
  ELECTRICITY_COMPANY = 'electricity_company',

  /** Water company (outages, leaks, billing, etc.) */
  WATER_COMPANY = 'water_company',

  /** Telecommunication company (landline, mobile, etc.) */
  TELECOM_COMPANY = 'telecom_company',

  /** Internet service provider */
  INTERNET_PROVIDER = 'internet_provider',

  /** Ministry of Health (policies, public hospitals, etc.) */
  MINISTRY_OF_HEALTH = 'ministry_of_health',

  /** Specific public hospital */
  PUBLIC_HOSPITAL = 'public_hospital',

  /** Ministry of Education / basic education */
  MINISTRY_OF_EDUCATION = 'ministry_of_education',

  /** Public school */
  PUBLIC_SCHOOL = 'public_school',

  /** Public university */
  PUBLIC_UNIVERSITY = 'public_university',

  /** Traffic police / traffic directorate */
  TRAFFIC_POLICE = 'traffic_police',

  /** Public transport authority (buses, routes, etc.) */
  PUBLIC_TRANSPORT_AUTHORITY = 'public_transport_authority',

  /** Ministry of Social Affairs / social care */
  SOCIAL_AFFAIRS_MINISTRY = 'social_affairs_ministry',

  /** Consumer protection authority */
  CONSUMER_PROTECTION = 'consumer_protection',

  /** Tax / finance authority */
  TAX_AUTHORITY = 'tax_authority',

  /** Passports and immigration */
  PASSPORTS_AND_IMMIGRATION = 'passports_and_immigration',

  /** Civil registry / civil status */
  CIVIL_REGISTRY = 'civil_registry',

  /** Ministry of Interior / public security (generic your-bucket-name) */
  MINISTRY_OF_INTERIOR = 'ministry_of_interior',

  /** Environment authority / environmental protection */
  ENVIRONMENT_DEPARTMENT = 'environment_department',

  /** Generic authority for uncategorized your-bucket-name */
  OTHER_GOVERNMENT_ENTITY = 'other_government_entity',
}
