'use strict';
const ACTIVITY_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
};
ACTIVITY_STATUS.all = [ACTIVITY_STATUS.UPCOMING, ACTIVITY_STATUS.ONGOING, ACTIVITY_STATUS.COMPLETED];
Object.freeze(ACTIVITY_STATUS);

function deriveStatus(startDate, endDate, now = new Date()) {
  if (startDate && now < new Date(startDate)) return ACTIVITY_STATUS.UPCOMING;
  if (endDate && now > new Date(endDate)) return ACTIVITY_STATUS.COMPLETED;
  return ACTIVITY_STATUS.ONGOING;
}

module.exports = { ACTIVITY_STATUS, deriveStatus };
