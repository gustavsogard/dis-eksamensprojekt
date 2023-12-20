// emitToLocation takes in the io object, the mapping, the locationName, the event, and the message
// and emits the event to all the sockets connected to that location
function emitToLocation(io, mapping, locationName, event, message) {
  mapping.forEach((locName, socketId) => {
      if (locName === locationName) {
        io.to(socketId).emit(event, message);
      }
    });
  }

module.exports = emitToLocation;