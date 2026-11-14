package org.lunarshift.backend.exception;

import org.lunarshift.backend.dto.ApiError;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MissionNotFoundException.class)
  public ResponseEntity<ApiError> handleMissionNotFound(MissionNotFoundException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ApiError("mission_not_found", exception.getMessage()));
  }

  @ExceptionHandler({InvalidGameRequestException.class, MethodArgumentNotValidException.class,
      HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
      MissingServletRequestParameterException.class})
  public ResponseEntity<ApiError> handleBadRequest(Exception exception) {
    String message = exception instanceof InvalidGameRequestException
        ? exception.getMessage()
        : "The request body is invalid or incomplete.";
    return ResponseEntity.badRequest().body(new ApiError("invalid_request", message));
  }

  @ExceptionHandler(NasaApiException.class)
  public ResponseEntity<ApiError> handleNasaApi(NasaApiException exception) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(new ApiError("nasa_api_unavailable", exception.getMessage()));
  }

  @ExceptionHandler(RestClientException.class)
  public ResponseEntity<ApiError> handleUpstreamFailure(RestClientException exception) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .body(new ApiError("upstream_error", "An upstream service request failed."));
  }
}
