import { Injectable } from '@angular/core';
import { Client } from 'paho-mqtt';

@Injectable({
  providedIn: 'root'
})
export class MqttService {
  private client: Client;
  private isConnected = false;
  private callbacks: { [topic: string]: (payload: any) => void } = {};
  private queue: { topic: string; payload: string }[] = [];

  constructor() {
    this.client = new Client('localhost', 9001, 'angular_' + Math.random().toString(16).substr(2, 8));
    
    this.client.onConnectionLost = (responseObject: any) => {
      console.error('Conexión MQTT perdida:', responseObject.errorMessage);
      this.isConnected = false;
    };

    this.client.onMessageArrived = (message: any) => {
      const topic = message.destinationName;
      const payload = message.payloadString;
      if (this.callbacks[topic]) {
        this.callbacks[topic](payload);
      }
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.connect({
        onSuccess: () => {
          this.isConnected = true;
          this.processQueue();
          resolve();
        },
        onFailure: (err) => {
          this.isConnected = false;
          reject(err.errorMessage);
        }
      });
    });
  }

  private processQueue(): void {
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      if (message) {
        this.publish(message.topic, message.payload);
      }
    }
  }

  subscribe(topic: string, callback: (payload: any) => void): void {
    if (!this.isConnected) {
      console.error('No conectado al broker MQTT');
      return;
    }
    this.callbacks[topic] = callback;
    this.client.subscribe(topic);
  }

  publish(topic: string, payload: string): void {
    if (!this.isConnected) {
      console.warn('MQTT no conectado, encolando mensaje');
      this.queue.push({ topic, payload });
      return;
    }

    try {
      const message = new Paho.MQTT.Message(payload);
      message.destinationName = topic;
      this.client.send(message);
    } catch (err) {
      console.error('Error al publicar mensaje MQTT:', err);
    }
  }
}