package org.lunarshift.backend.exception;

public class InvalidGameRequestException extends RuntimeException {
  public InvalidGameRequestException(String message) {
    super(message);
  }
}
