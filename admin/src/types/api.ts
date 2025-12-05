// API Types based on simplified API

export interface NumberTypeAvailability {
  country_code: string;
  country: string;
  local: boolean;
  toll_free: boolean;
  mobile: boolean;
  national: boolean;
  voip: boolean;
  shared_cost: boolean;
  machine_to_machine: boolean;
  beta: boolean;
  last_updated: string;
}

export interface SyncJob {
  job_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  countries_processed: number;
  countries_total: number | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export interface SyncRequest {
  // Twilio credentials are now loaded from environment variables
  // This interface is kept for compatibility but fields are not required
}

export interface SyncResponse {
  job_id: string;
  status: string;
}

export type CountriesResponse = NumberTypeAvailability[];

export interface SyncJobsResponse {
  jobs: SyncJob[];
}

// Requirements detailed types
export interface DetailedField {
  friendly_name: string;
  machine_name: string;
  description: string;
  constraint: string;
}

export interface EndUserRequirement {
  name: string;
  type: string;
  requirement_name: string;
  detailed_fields: DetailedField[];
  fields: string[];
  url: string;
  constraint?: string;
}

export interface AcceptedDocument {
  name: string;
  type: string;
  url: string;
  detailed_fields: DetailedField[];
  fields: string[];
  constraint: string;
}

export interface SupportingDocument {
  name: string;
  description: string;
  requirement_name: string;
  type: string;
  accepted_documents: AcceptedDocument[];
}

export interface Requirements {
  end_user?: EndUserRequirement[];
  supporting_document?: SupportingDocument[][];
}

export interface Regulation {
  sid: string;
  friendly_name: string | null;
  iso_country: string | null;
  number_type: string | null;
  end_user_type: string;
  requirements: Requirements | null;
  url: string | null;
  last_updated: string;
}

export type RegulationsResponse = Regulation[];

// Number Search types
export interface PhoneNumberCapabilities {
  mms: boolean | null;
  sms: boolean | null;
  voice: boolean | null;
  fax: boolean | null;
}

export interface AvailableNumber {
  phone_number: string | null;
  friendly_name: string | null;
  capabilities: PhoneNumberCapabilities | null;
  iso_country: string | null;
  address_requirements: string | null;
  beta: boolean | null;
  lata: string | null;
  locality: string | null;
  rate_center: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  postal_code: string | null;
}

export interface NumberSearchRequest {
  country_code: string;
  number_type: 'mobile' | 'local' | 'toll-free';
  sms_enabled?: boolean;
  voice_enabled?: boolean;
}

export type NumberSearchResponse = AvailableNumber[];

// Sync type enum for UI (simplified)
export type SyncType = 'number-types' | 'regulations';

