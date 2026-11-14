package org.lunarshift.backend.exception;

public class MissionNotFoundException extends RuntimeException {
  public MissionNotFoundException(String missionId) {
    super("Mission '" + missionId + "' was not found.");
  }
}
