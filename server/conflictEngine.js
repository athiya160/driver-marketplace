/**
 * SARATHI CONFLICT PREVENTION ENGINE
 * Enforces strict temporal non-overlap rules for driver bookings.
 * Adds a 30-minute buffer window between consecutive trips for transit.
 */

export function parseBookingTimestamps(dateStr, timeStr, durationHours) {
  // dateStr format: 'YYYY-MM-DD', timeStr format: 'HH:mm'
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const endTime = new Date(startTime.getTime() + (Number(durationHours) * 3600 * 1000));
  
  return { startTime, endTime };
}

/**
 * Checks if a proposed booking collides with any of the driver's existing active or scheduled bookings
 * @param {string} driverId - Driver UUID
 * @param {string} proposedDate - 'YYYY-MM-DD'
 * @param {string} proposedTime - 'HH:mm'
 * @param {number} proposedDurationHours - e.g. 4
 * @param {Array} existingBookings - List of all bookings in the system
 * @param {string|null} excludeBookingId - Current booking id to exclude (e.g. for updates)
 * @returns {Object} { hasConflict: boolean, reason?: string, conflictingBooking?: Object }
 */
export function checkDriverBookingConflict({
  driverId,
  proposedDate,
  proposedTime,
  proposedDurationHours,
  existingBookings = [],
  excludeBookingId = null
}) {
  if (!driverId) {
    return { hasConflict: false };
  }

  const { startTime: newStart, endTime: newEnd } = parseBookingTimestamps(
    proposedDate,
    proposedTime,
    proposedDurationHours
  );

  // Transit buffer: 30 minutes in milliseconds
  const BUFFER_MS = 30 * 60 * 1000;
  const newStartWithBuffer = new Date(newStart.getTime() - BUFFER_MS);
  const newEndWithBuffer = new Date(newEnd.getTime() + BUFFER_MS);

  // Active status set where driver is committed
  const ACTIVE_STATUSES = ['accepted', 'driver_en_route', 'arrived', 'in_progress'];

  for (const booking of existingBookings) {
    if (booking.id === excludeBookingId) continue;
    if (booking.driverId !== driverId) continue;
    if (!ACTIVE_STATUSES.includes(booking.status)) continue;

    const { startTime: existingStart, endTime: existingEnd } = parseBookingTimestamps(
      booking.startDate,
      booking.startTime,
      booking.durationHours
    );

    // Check overlap: (StartA < EndB) and (EndA > StartB)
    const isOverlapping = (newStartWithBuffer < existingEnd) && (newEndWithBuffer > existingStart);

    if (isOverlapping) {
      return {
        hasConflict: true,
        reason: `Driver already has a booked trip (${booking.bookingReference}) on ${booking.startDate} from ${booking.startTime} for ${booking.durationHours} hours.`,
        conflictingBooking: {
          id: booking.id,
          reference: booking.bookingReference,
          date: booking.startDate,
          time: booking.startTime,
          duration: booking.durationHours,
          status: booking.status
        }
      };
    }
  }

  return { hasConflict: false };
}
