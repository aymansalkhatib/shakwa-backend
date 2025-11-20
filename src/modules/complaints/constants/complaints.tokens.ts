/**
 * Injection tokens for repositories.
 * Using Symbol keeps tokens unique across the app.
 */
export const COMPLAINTS_REPOSITORY_TOKEN = Symbol('IComplaintsRepository');
export const COMPLAINT_HISTORY_REPOSITORY_TOKEN = Symbol('IComplaintHistoryRepository');
