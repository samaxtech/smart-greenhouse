#include "SoftwareSerial.h"
#include <EEPROM.h>

SoftwareSerial softSerial(2, 3); // RX, TX 

// --------------------------------------------------
// PARAMETERS
// --------------------------------------------------

// ESP-01 Module - Wifi Credentials & Connection parameters
char* SSDI = ""; // Network name
char* password = ""; // Password

unsigned char connection = 0;
unsigned char attempts = 0;

// Server ON/OFF LED pin
int serverstate_pin = 10;

// Actuator pins
int watering_pin = 11;
int ledlamp_pin = 12;
int vent_pin = 13;

// The current address in the EEPROM 
int addr = 0;

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












// --------------------------------------------------
// SET UP
// --------------------------------------------------
void setup()
{
   Serial.begin(9600);
   softSerial.begin(9600);

    // Configure ESP-01 Module to connect to wifi and launch a webserver on port 5010
   sendCommand("AT+RST\r\n",1000);
   sendCommand("AT+CWMODE=3\r\n",1000);

   connectWifi(SSDI, password);
    
    // Watering pin
    pinMode(watering_pin, OUTPUT);
    // LED pin
    pinMode(ledlamp_pin, OUTPUT);
    // Ventilation pin
    pinMode(vent_pin, OUTPUT);

     // Recover last actuator state (only applicable to LED Lamps and Ventilation).
     byte last_pin = EEPROM.read(addr);
     int last_pin_int = (int) last_pin;

     Serial.print("\nNumero recuperado de memoria:");
     Serial.print(last_pin_int);
     Serial.print("\n");
     
     if(last_pin_int == ledlamp_pin + 1){
        Serial.print("\nActivating LED lamps from last state...\n");
        digitalWrite(ledlamp_pin, HIGH);
        EEPROM.write(addr, 0);
     }
     else if(last_pin_int == vent_pin + 1){
        Serial.print("\nActivating ventilation from last state...\n");
        digitalWrite(vent_pin, HIGH);
        EEPROM.write(addr, 0);
     }
     else if(last_pin_int == watering_pin + 1){
        Serial.print("\nActivating watering from last state...\n");
        digitalWrite(watering_pin, HIGH);
        EEPROM.write(addr, 0);
     }

     delay(2000);
     sendCommand("AT+CIPMUX=1\r\n",1000); // Allow multiple connections
     sendCommand("AT+CIPSERVER=1,5010\r\n",1000); // Webserver on port 5010

     // Server ON/OFF LED pin
     pinMode(serverstate_pin,OUTPUT);
     digitalWrite(serverstate_pin, HIGH); // Server ON
 }


// --------------------------------------------------
// LOOP
// -------------------------------------------------- 
void loop()
{

    if(softSerial.available()) // check if the esp is sending a message 
      {
     
        //readSerial();
        if(softSerial.find("+IPD,"))
        {

         delay(1000); // wait for the serial buffer to fill up (read all the serial data)

         int connectionId = softSerial.read()-48; // subtract 48 because the read() function returns 
                                               // the ASCII decimal value and 0 (the first decimal number) starts at 48
              
         softSerial.find("pin="); // advance cursor to "pin="
    
         int pinNumber;
    
         pinNumber = (softSerial.read()-48)*10; // get first number i.e. if the pin 13 then the 1st number is 1, then multiply to get 10
         pinNumber += (softSerial.read()-48); // get second number, i.e. if the pin number is 13 then the 2nd number is 3, then add to the first number

         if(digitalRead(pinNumber) == LOW){
              EEPROM.write(addr, pinNumber + 1);
              Serial.print("\nNumero guardado en memoria:");
              Serial.print(pinNumber + 1);
         }    
         else{
              int garbage_int = 39847;
              EEPROM.write(addr, garbage_int);
              Serial.print("\nNumero guardado en memoria:");

         }
         
         Serial.print("\n");
         Serial.print("Pin: ");
         Serial.print(pinNumber);
         Serial.print("\n");

         // make close command
         String closeCommand = "AT+CIPCLOSE="; 
         closeCommand+=connectionId; // append connection id
         closeCommand+="\r\n";
         
         sendCommand(closeCommand,1000); // close connection
         Serial.flush();

         digitalWrite(pinNumber, !digitalRead(pinNumber)); // toggle pin 

         /*
         // IMPORTANT IF STATEMENT:
         if(pinNumber == watering_pin){ // If the pin corresponds to a motor (e.g. watering)
          
               delay(motor_time);
         
               digitalWrite(pinNumber, !digitalRead(pinNumber)); // toggle pin 
               
               digitalWrite(serverstate_pin, LOW); // Server OFF
               Serial.println("\n\n");

               delay(2000);
               resetFunc(); 
         }
         else{
               digitalWrite(pinNumber, !digitalRead(pinNumber)); // toggle pin 
         }
         */
         
        }
      }

}
