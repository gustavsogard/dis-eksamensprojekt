function emitToLocation(io, mapping, locationName, event, message) {
  mapping.forEach((locName, socketId) => {
      if (locName === locationName) {
        io.to(socketId).emit(event, message);
      }
    });
  }

module.exports = emitToLocation;