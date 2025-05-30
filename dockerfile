FROM eclipse-mosquitto:2.0

COPY mqtt.conf /mosquitto/config/mosquitto.conf

EXPOSE 1883
EXPOSE 9001

CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]