#include "SoftwareSerial.h"
#include <dht.h>

SoftwareSerial softSerial(2, 3); // RX, TX

// --------------------------------------------------
// PARAMETERS
// --------------------------------------------------

// Sending Data Pin
int sending_pin = 9;

// ESP-01 Module - Wifi Credentials & Connection parameters
char* SSDI = ""; // Network name
char* password = ""; // Password

unsigned char connection = 0;
unsigned char attempts = 0;

// DHT11 Sensor: Temperature and Humidity
dht DHT;
#define DHT11_PIN 6

// LDR Light Sensor
int ldr_pin = 2;
int value = 0;

// Rain Level Sensor
int pin_rain = 0;

// Water Level Sensor
int pin_water = 1;

// Soil Moisture Sensor
int pin_soil = 3;

// Watering Actuator 
int watering_pin = 11;

// Ventilation Actuator 
int vent_pin = 5;

// LED Lamps Actuator 
int leds_pin = 10;






// ThingSpeak API Keys
String APIKey_sensor = ""; // Sensor data channel
String APIKey_act = "";    // Actuator data channel
  
// Sensor data vector:
float sensor_data[6] = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0}; /*
                                                          pos 0: Temperature  
                                                          pos 1: Humidity
                                                          pos 2: Brightness
                                                          pos 3: Rain level
                                                          pos 4: Water level
                                                          pos 5: Soil Moisture
                                                        */

// Actuator data vector:
int act_data[3] = {0, 0, 0}; /*
                                pos 0: Watering  
                                pos 1: Ventilation
                                pos 2: LED State
                              */



// Time interval variables:
unsigned long previousMillis = 0;
const long interval = 35000;


// --------------------------------------------------
// FUNCTIONS
// --------------------------------------------------

// sendCommand: Send AT command to ESP-01 module and print response on serial monitor
String sendCommand(String command, const int timeout)
{
  
        String response = "";
        long int time = millis();
        
        softSerial.print(command); // Sends AT command
        
        while( (time+timeout) > millis())
        {
          while(softSerial.available())
          {
            char c = softSerial.read();  // Gets response
            response+=c;
          }  
        }

        Serial.print(response); // Prints response

        return response; // Returns response
}


// readSerial: Read from serial buffer (e.g. for displaying AT commands responses).
void readSerial(int buffer_read=1000)
{
    int count = 0;
       
    while (count < buffer_read){
        
         if (softSerial.available())
         {
            Serial.print((char)softSerial.read());
         }
         if (Serial.available())
         {
            softSerial.print((char)Serial.read());
         }

        count++; 
    }
}


// connectWifi(): Connects ESP-01 Module to a WiFi network an input SSID/password.
void connectWifi(char* SSDI, char* password)
{
         Serial.flush();
         while(connection == 0) {
               Serial.print("+");

               softSerial.write("AT+CWJAP=\"");
               softSerial.write(SSDI);
               softSerial.write("\",\"");
               softSerial.write(password);
               softSerial.write("\"\r\n"); 

               softSerial.setTimeout(5000);
               
           if(softSerial.find("WIFI CONNECTED\r\n")==1)
               {
                   Serial.println("WIFI CONNECTED");
                   delay(2000);
                   readSerial();  // Display response.
                   break;
               }
           attempts++;
           
           if(attempts > 3) 
               {
                  attempts=0;
                  Serial.println("Reconnecting...");
                }
            }
      
        delay(2000);  
        softSerial.write("AT+CIFSR\r\n"); // Display IP and MAC address once connected.
        readSerial();
}



// readSensorData: Read sensor data (temperature, humidity, etc)
void readSensorData(float sensor_data[])
{
    Serial.print("\n-----------------------------");
    Serial.print("SENSOR DATA");
    Serial.print("-----------------------------");
    
    // Read Temperature and Humidity values from DHT11 Sensor
    int chk = DHT.read11(DHT11_PIN);
    sensor_data[0] = DHT.temperature;
    sensor_data[1] = DHT.humidity;
    
    Serial.print("\nTemperature = ");
    Serial.println(sensor_data[0]);
    Serial.print("Humidity = ");
    Serial.println(sensor_data[1]);
    
    // Read Brightness values from LDR Light Sensor
    sensor_data[2] = analogRead(ldr_pin);
    Serial.print("Brightness = ");
    Serial.println(sensor_data[2], DEC);

    // Read Rain Level from water level sensor
    sensor_data[3] = analogRead(pin_rain);
    Serial.print("Rain level = ");
    Serial.println(sensor_data[3]);

    // Read Water Level from water level sensor
    sensor_data[4] = analogRead(pin_water);
    Serial.print("Water level = ");
    Serial.println(sensor_data[4]);

    // Read Soil Moisture from sensor
    sensor_data[5] = analogRead(pin_soil);
    Serial.print("Soil Moisture = ");
    Serial.println(sensor_data[5]);

}



// readActuatorState: Read actuator state (0-1)
void readActuatorState(int act_data[]) {
  
      // Watering
      if (digitalRead(watering_pin) == HIGH) {    
          act_data[0] = 1;
      }
      else if (digitalRead(watering_pin) == LOW) {
          act_data[0] = 0;
      }

      // Ventilation
      if (digitalRead(vent_pin) == HIGH) {   
          act_data[1] = 1;
      }
      else if (digitalRead(vent_pin) == LOW) {
          act_data[1] = 0;
      }

      // LED Lamps
      if (digitalRead(leds_pin) == HIGH) {   
          act_data[2] = 1;
      }
      else if (digitalRead(leds_pin) == LOW) {
          act_data[2] = 0;
      }

      Serial.print("\n");
                    
      Serial.print("-----------------------------");
      Serial.print("ACTUATOR DATA");
      Serial.print("-----------------------------\n");
      
      Serial.print("Watering State = ");
      Serial.println(act_data[0]);
      Serial.print("Ventilation State = ");
      Serial.println(act_data[1]);
      Serial.print("LED Lamps State = ");
      Serial.println(act_data[2]);  


}


// sendData: Send sensor data to ThingSpeak server
boolean sendData(float sensor_data[], int act_data[]){ 

      digitalWrite(sending_pin, HIGH); // Turn ON Sending Data pin
      
      /**********************************************************************
       *                           SENSOR DATA
       **********************************************************************/
      Serial.print("\nSending SENSOR data block to ThingSpeak server...\n");
   
      // Start TCP connection with ThingSpeak server
      String cmd = "AT+CIPSTART=\"TCP\",\"";                  
      cmd += "184.106.153.149"; // api.thingspeak.com IP address
      cmd += "\",80";
      softSerial.println(cmd); 
      Serial.println(cmd);
      if(softSerial.find("Error")){
           // Serial.println("AT+CIPSTART Error (Could not establish TCP connection).");
           return false;
      }  

      // Prepare HTTP GET Request to ThingSpeak API using API Key, with sensor data on each field
      String getStr = "GET /update?api_key=";   
      getStr += APIKey_sensor;  
      getStr +="&field1=";
      getStr += String(sensor_data[0]); // Temperature
      getStr +="&field2=";
      getStr += String(sensor_data[1]); // Humidity
      getStr +="&field3=";
      getStr += String(sensor_data[2]); // Brightness
      getStr +="&field4=";
      getStr += String(sensor_data[3]); // Rain level
      getStr +="&field5=";
      getStr += String(sensor_data[4]); // Water level
      getStr +="&field6=";
      getStr += String(sensor_data[5]); // Soil Moisture State
      getStr +="&field7=";
      getStr += String(sensor_data[6]); // LED Lamps State
      getStr += "\r\n\r\n";

      Serial.flush();
      delay(1000);
      // Send HTTP GET Request
      cmd = "AT+CIPSEND=";
      cmd += String(getStr.length());
      softSerial.println(cmd);
      Serial.println(cmd); 
       
      delay(100);
      
      // Print success/failure of request
      if(softSerial.find(">")){
          softSerial.print(getStr);
          Serial.print(getStr); 
          delay(200);
          readSerial();         
      }
      else{
          softSerial.write("AT+CIPCLOSE");
          Serial.println("AT+CIPCLOSE");
          // setup();
          return false;
      }

      delay(2000);



      /**********************************************************************
       *                            ACTUATOR DATA
       **********************************************************************/
      Serial.print("\nSending ACTUATOR data block to ThingSpeak server...\n");

      // Start TCP connection with ThingSpeak server
      cmd = "AT+CIPSTART=\"TCP\",\"";                  
      cmd += "184.106.153.149"; // api.thingspeak.com IP address
      cmd += "\",80";
      softSerial.println(cmd); 
      Serial.println(cmd);
      if(softSerial.find("Error")){
           // Serial.println("AT+CIPSTART Error (Could not establish TCP connection).");
           return false;
      }  

      // Prepare HTTP GET Request to ThingSpeak API using API Key, with sensor data on each field
      getStr = "GET /update?api_key=";   
      getStr += APIKey_act;  
      getStr +="&field1=";
      getStr += String(act_data[0]); // Watering
      getStr +="&field2=";
      getStr += String(act_data[1]); // Ventilation
      getStr +="&field3=";
      getStr += String(act_data[2]); // LED Lamps
      getStr += "\r\n\r\n";

      Serial.flush();
      delay(1000);
      // Send HTTP GET Request
      cmd = "AT+CIPSEND=";
      cmd += String(getStr.length());
      softSerial.println(cmd);
      Serial.println(cmd); 
       
      delay(100);
      
      // Print success/failure of request
      if(softSerial.find(">")){
          softSerial.print(getStr);
          Serial.print(getStr); 
          delay(200);
          readSerial();         
      }
      else{
          softSerial.write("AT+CIPCLOSE");
          Serial.println("AT+CIPCLOSE");
          return false;
      }

      digitalWrite(sending_pin, LOW);
      
      return true;
}




// --------------------------------------------------
// SET UP
// --------------------------------------------------

void setup()
{
   Serial.begin(9600);
   softSerial.begin(9600);

   // Configure ESP-01 Module as client
   sendCommand("AT+RST\r\n",1000);
   sendCommand("AT+CWMODE=2\r\n",1000);  
   sendCommand("AT+CWMODE=1\r\n",1000);
   
   connectWifi(SSDI, password);
   
    // Start reading sensor data
    pinMode(pin_water, INPUT); // Water level pin

    // Start reading sensor data
    pinMode(vent_pin, INPUT); // Ventilation pin

    // Start reading sensor data
    pinMode(leds_pin, INPUT); // LED Lamps pin

    // Sending Data pin
    pinMode(sending_pin, OUTPUT); 
    digitalWrite(sending_pin, LOW); 
    
 }







// --------------------------------------------------
// LOOP
// -------------------------------------------------- 
void loop()
{
  
  unsigned long currentMillis = millis();
    
  if (currentMillis - previousMillis >= interval) {

    // save the last time you blinked the LED
    previousMillis = currentMillis;

    readSensorData(sensor_data); // Get sensor data
    readActuatorState(act_data); // Get Actuator data
    sendData(sensor_data, act_data); // Send data over to ThingSpeak server
    
  }

}
