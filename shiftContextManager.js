function buildShiftContext({ clientName = "", session = null, fieldContext = null } = {}) {
  return {
    clientName,
    date: session?.selectedDateLabel || session?.serviceDate || "",
    shiftType: fieldContext?.label || fieldContext?.source || "",
    staffName: session?.staffName || session?.dspName || session?.enteredBy || "",
  };
}

module.exports = {
  buildShiftContext,
};
