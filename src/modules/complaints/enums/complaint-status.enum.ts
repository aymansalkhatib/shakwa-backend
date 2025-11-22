/**
 * Lifecycle status of a complaint.
 */
export enum ComplaintStatus {
  /** Newly created and not yet reviewed by staff */
  NEW = 'new',

  /** Under initial review / triage */
  IN_REVIEW = 'in_review',

  /** Being actively processed / handled */
  IN_PROGRESS = 'in_progress',

  /** Staff requested additional information from the citizen */
  NEED_MORE_INFO = 'need_more_info',

  /** Resolved successfully */
  RESOLVED = 'resolved',

  /** Rejected (not valid, out of scope, etc.) */
  REJECTED = 'rejected',

  /** Cancelled voluntarily by the citizen */
  CANCELLED = 'cancelled',
}
