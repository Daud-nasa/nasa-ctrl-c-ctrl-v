FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace
COPY . .
RUN chmod +x ./gradlew && ./gradlew --no-daemon clean test bootJar

FROM eclipse-temurin:21-jre-jammy

WORKDIR /app
RUN groupadd --system spring && useradd --system --gid spring spring
COPY --from=build --chown=spring:spring /workspace/build/libs/lunar-shift-backend-0.1.0.jar /app/app.jar
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
