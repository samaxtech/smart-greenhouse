// Get last state
getLastState();

var wait_time = 5000;  // Set Arduino's server (ESP-01) response time for correctness and performance

// Progress bar, for time interval actuator switch
var barProgress;
var current_width;

function move(time_length, width=1) {
  var elem = document.getElementById("myBar");
  elem.style.backgroundColor = "406fce";
  barProgress = setInterval(frame, time_length/100);
  function frame() {
    if (width >= 100) {
      clearInterval(barProgress);
    } else {
      width++;
      current_width = width;
      localStorage.setItem("currentWidth", current_width);
      elem.style.width = width + '%';
    }
  }
}


// clearStorage(): Clear local storage
function clearStorage() {
     localStorage.clear();
     console.log("local storage erased");

     if (future_state == "ON") {
      changeState("watering");
     }

     $.get("/control/server.php", {server:0});
}


// Retrieve last actuator state from ThingSpeak server to ensure state correctness.
function retrieveData() {

              fetch("https://api.thingspeak.com/channels/745199/fields/3.json?api_key=ULZDAIJ4V116DC9L&results=1")
                    .then(function(resp) {
                    return resp.json();
                })
                .then(function(data) {
                  console.log("Checking ThingSpeak sever state");
                    console.log(data.feeds[0]["field3"]);

            if (data.feeds[0]["field3"] == 1.00 && future_state == "OFF"){
                      document.getElementById("ledState1").firstChild.data = "ON";
                      document.getElementById("ledState1_prev").firstChild.data = " ";
                      future_state = "ON";

                      // Save future_state into local storage
                    localStorage.setItem("futureState", future_state);

                    }
                    else if (data.feeds[0]["field3"] == 0.00 && future_state == "ON"){
                      document.getElementById("ledState1").firstChild.data = "OFF";
                      document.getElementById("ledState1_prev").firstChild.data = " ";
                      future_state = "OFF";

                      // Save future_state into local storage
                    localStorage.setItem("futureState", future_state);
                    }

                });
}



// blockButtons(): For Arduino's server time response purposes, block ON/OFF, Start Timer and Restart buttons for 'wait_time' seconds
function blockButtons(block_time=wait_time) {
    // Allow user to set another timer only after 'wait_time' seconds after timer ends
                document.getElementById("led1_timer").disabled = true;
                document.getElementById("led1_timer").style.background='#d8d8d8';

                setTimeout(function() {
                               document.getElementById("led1_timer").disabled = false;
                               document.getElementById("led1_timer").style.background='#3D4C53';
                $(".start-timer").hover(function(){
                                    $(this).css("background-color", "#fffefc");
                                    $(this).css("color", "#3D4C53");
                                    }, function(){
                                    $(this).css("background-color", "#3D4C53");
                                    $(this).css("color", "#fffefc");
                                });

                        }, block_time);



                // Allow user to press ON/OFF again only after 'wait_time' seconds after timer ends
                document.getElementById("watering").disabled = true;
                document.getElementById("watering").style.background='#d8d8d8';

                setTimeout(function() {
                               document.getElementById("watering").disabled = false;
                               document.getElementById("watering").style.background='#3D4C53';
               $(".led").hover(function(){
                                    $(this).css("background-color", "#fffefc");
                                    $(this).css("color", "#3D4C53");
                                    }, function(){
                                    $(this).css("background-color", "#3D4C53");
                                    $(this).css("color", "#fffefc");
                                });
                         }, block_time);

                // Allow user to press restart again only after 'wait_time' seconds after timer ends
                document.getElementById("timerRestartId").disabled = true;
                document.getElementById("timerRestartId").style.background='#d8d8d8';

                setTimeout(function() {
                               document.getElementById("timerRestartId").disabled = false;
                               document.getElementById("timerRestartId").style.background='#fffefc'; // Restart button has WHITE background
              $(".bRestart").hover(function(){
                                    $(this).css("background-color", "#3D4C53");
                                    }, function(){
                                    $(this).css("background-color", "#fffefc");
                                });
                         }, block_time);

                // Allow user to press "Retrieve Last ThingSpeak State" again only after 'wait_time' seconds after timer ends
                document.getElementById("thingSpeakButton").disabled = true;
                document.getElementById("thingSpeakButton").style.background='#d8d8d8';

                setTimeout(function() {
                               document.getElementById("thingSpeakButton").disabled = false;
                               document.getElementById("thingSpeakButton").style.background='#fffefc'; // Restart button has WHITE background
             $(".lastState").hover(function(){
                                    $(this).css("background-color", "#3D4C53");
                                    }, function(){
                                    $(this).css("background-color", "#fffefc");
                                });
                         }, block_time);



                // Allow user to press cancel again only after 'wait_time' seconds after timer ends
                document.getElementById("timerCancelId").disabled = true;
                document.getElementById("timerCancelId").style.background='#d8d8d8';

                setTimeout(function() {
                               document.getElementById("timerCancelId").disabled = false;
                               document.getElementById("timerCancelId").style.background='#fffefc'; // Restart button has WHITE background
               $(".bCancel").hover(function(){
                                    $(this).css("background-color", "#3D4C53");
                                    }, function(){
                                    $(this).css("background-color", "#fffefc");
                                });
                         }, block_time);

}


// Show last actuator state
function getLastState() {

    future_state = localStorage.getItem("futureState");

        fetch("./actuator_state.json")
              .then(function(resp) {
                            return resp.json();
                })
          .then(function(data) {
                // Change state displayed
                var prev_state = document.getElementById("ledState1_prev");

                if (future_state == "ON"){
                        prev_state.firstChild.data = "ON";

                 }
                 else if (future_state == "OFF") {
                        prev_state.firstChild.data = "OFF";

                 }
                 else {
                    console.log("YEPA");
                    prev_state.firstChild.data = "OFF";
                    future_state = "OFF";
                 }

          });

 }


// getRequest(): Make HTTP GET request to Arduino's webserver.
function getRequest(send_data)
{
            $.ajax({ type: "GET",
                     url: "http://sipollo.ddns.net:5010/",
                     data: send_data
            });
}



// changeState(sendGet): Changes actuator state (ON/OFF)
var future_state;

function changeState()
{

        // Actuator state and pin on Arduino, based on actuator id
        var actuator_state = "ledState1";
        var arduino_pin = 11;

        // Send HTTP GET request to Arduino's webserver
        var response = '';
        var send_data = {pin: arduino_pin};

        getRequest(send_data);

      // Change state
      fetch("./actuator_state.json")
        .then(function(resp) {
          return resp.json();
        })
        .then(function(data) {
          console.log(data.actuator);
          console.log(data.state);

                      var led_state = document.getElementById(actuator_state);

                      var prev_state = document.getElementById(actuator_state_prev);
                      var curr_state = document.getElementById(actuator_state_curr);

                      console.log(data.state);
                      console.log(future_state);

                      // Refresh the page (ensure future requests to ESP Webserver will be executed)
                      var block_time_refresh = 5000;

                      setTimeout(function() {
                                window.location.reload();
                      }, block_time_refresh);

                      if (future_state == "OFF"){
                        future_state = "ON"; // Update FUTURE state to be displayed
                        setTimeout(function(){
                            led_state.firstChild.data = "ON"; // Change state displayed after 1 second
                          }, 1000);

                          // Stop showing last state once it's changed
                          prev_state.firstChild.data = " ";
                          curr_state.firstChild.data = "Current state:";
                          console.log("PUTA");
                      }
                      else if (future_state == "ON"){
                        future_state = "OFF"; // Update FUTURE state to be displayed
                        setTimeout(function(){
                              led_state.firstChild.data = "OFF"; // Change state displayed after 1 second
                          }, 1000);

                          // Stop showing last state once it's changed
                          prev_state.firstChild.data = " ";
                          curr_state.firstChild.data = "Current state:";
                          console.log("PUTA MADRE");
                      }


                  // Update actuator log (.txt) and future state file (.JSON)
                  $.get("receiver.php", {actuator:"watering", state:future_state});

                  // Save future_state into local storage
                  localStorage.setItem("futureState", future_state);

        });
}

// Simple actuator ON/OFF switch
$(document).ready(function(){

$(".led").click(function(){
      if (timer_process == false)
        {
                // Get actuator id (associated to pin13, pin12, pin11... in Arduino)
                var actuator_id = $(this).attr('id');

                // Change the actuator state
                changeState(actuator_id);

                // Block buttons
                blockButtons();

         }
         else{
          alert('A timer is active. Please restart, cancel or wait until it ends before toggling the actuator again.');
         }

});

});


// Start button, to set a timer
var timeOut;
var bar_finished;
var timer_process = false;
var time_length;
var time_interval;
var time_unit;

$(document).ready(function(){

$(".start-timer").click(function(){
// Get actuator id (associated to pin13, pin12, pin11... in Arduino)
var actuator_id = $(this).attr('id');
        localStorage.setItem("currentActuator", actuator_id);


        // Get time interval to toggle actuator
        time_interval = document.getElementById("timerAct_1").value; // Get time interval
        time_unit = document.getElementById("unitAct_1").value; // Get input time unit

        // Get last actuator state
        fetch("./actuator_state.json")
            .then(function(resp) {
                   return resp.json();
            })
            .then(function(data) {

                var min_length_timer = 10;

                // Debug
                console.log(data.state);

                if (future_state == "ON" && timer_process == false)
                {
                    alert("The actuator is already ON. Please turn it OFF to set a timer.");
                }
                else if (future_state == "ON" && timer_process == true)
                {
                    alert("A timer already started. Please restart, cancel or wait until it ends.");
                }
                else if (time_interval == null || time_interval == "")
                {
                  alert("Please enter a time interval.");
                }
                else if (time_unit == "seconds" && time_interval < min_length_timer)
                {
                  alert("Please enter a minimum of 10 seconds.");
                }
                else if (time_unit == "minutes" && time_interval < (min_length_timer)/60)
                {
                  alert("Please enter a minimum of 0.2 minutes.");
                }
                else if (time_unit == "hours" && time_interval < (min_length_timer)/3600)
                {
                  alert("Please enter a minimum of 0.003 hours.");
                }
                else
                {


                    var time_sent;  // Time sent to Arduino (seconds)

                    if (time_unit == "seconds"){  // Time input was in seconds:
                        time_length = time_interval*1000;
                        localStorage.setItem("timeLength", time_length);
                        time_sent = time_interval;
                    }
                    else if (time_unit == "minutes"){  // Time input was in minutes:
                        time_length = (60*time_interval)*1000;
                        localStorage.setItem("timeLength", time_length);
                        time_sent = 60*time_interval;
                    }
                    else if (time_unit == "hours"){  // Time input was in hours:
                        time_length = (3600*time_interval)*1000;
                        localStorage.setItem("timeLength", time_length);
                        time_sent = 3600*time_interval;
                    }


                    //changeState(actuator_id, 1, time_sent);
                    changeState(actuator_id);
                    move(time_length);
                    document.getElementById("timerProgress").innerHTML = "Timer in progress...";
                    timer_process = true; // The timer process starts (true)
                    localStorage.setItem("timerProcess", timer_process);

                    // Set pause state to localStorage
                    timer_paused = false;
                    localStorage.setItem("timerPaused", timer_paused);
                    cancelled = false;

                    // Allow user to press the restart button only after 'wait_time' seconds after timer starts
                    document.getElementById("timerRestartId").disabled = true;

                    setTimeout(function() {
                            document.getElementById("timerRestartId").disabled = false;
                        }, wait_time);

                    // Block buttons
                    blockButtons();

                    timeOut = new Timer(function(){
                                changeState(actuator_id);
                                bar_finished = 1;
                                document.getElementById("myBar").style.backgroundColor = "85f76f";  // Turn progress bar green
                                document.getElementById("timerProgress").innerHTML = "Timer finished!";  // Display that the timer finished

                                // The timer process has ended (becomes false).
                                timer_process = false;
                                localStorage.setItem("timerProcess", timer_process);
                                timer_paused = false;
                                localStorage.setItem("timerPaused", timer_paused);

                    // Block buttons
                    blockButtons();

                    }, time_length);

                }

            });

});

});



// Timer(callback, delay): Makes it possible to cancel/pause/resume the timer
var timerId, start, remaining;
function Timer(callback, delay) {

remaining = delay;
    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
        localStorage.setItem("timeRemaining", remaining);
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
        localStorage.setItem("timeRemaining", remaining);

        return remaining;
    };

    this.clear = function () {
        clearTimeout(timerId);
    };

    this.resume();
}



// Cancel timer button
var cancelled;
$(document).ready(function(){

$(".bCancel").click(function(){
      // Only cancel if there is a timer in process (true)
        if (timer_process == true)
        {
            cancelled = true;

                // Get actuator id (associated to pin13, pin12, pin11... in Arduino)
                var actuator_id = $(this).attr('id');
                localStorage.setItem("currentActuator", actuator_id);

                if (refreshed_from_paused != 1){
                   // Prevent actuator timer from finishing
                   timeOut.clear();
                }

                // Stop progress bar
                clearInterval(barProgress);

                // Declare that the bar has not finished (since the user has cancelled the timer)
                bar_finished = 0;

                // Unless bar_finished=1 (i.e. the timer ended without 'cancel'), change color to red (a.k.a. the most cancel-color ever haha) and change actuator state.

                if (bar_finished != 1 && timer_process == true) {
                      document.getElementById("myBar").style.backgroundColor = "red";
                      changeState(actuator_id);

                      // Display that the timer process was aborted
                      document.getElementById("timerProgress").innerHTML = "Aborted";

                      // After cancelling and changing the actuator and bar states, the timer process has ended (becomes false).
                      timer_process = false;
                      localStorage.setItem("timerProcess", timer_process);
                }

                timer_paused = false;
                localStorage.setItem("timerPaused", timer_paused);

                // Block buttons
                blockButtons();


        }


});

});



// Pause timer button
var timer_paused;

$(document).ready(function(){

$(".bPause").click(function(){
      // Only pause if there is a timer in process (true)
        if (timer_process == true)
        {
                // Stop progress bar
                clearInterval(barProgress);

                // Pause actuator timer
                timeOut.pause();

                // Save pause state to localStorage
                timer_paused = true;
                localStorage.setItem("timerPaused", timer_paused);

                // Display that the timer is paused
                document.getElementById("timerProgress").innerHTML = "Paused";
        }

});

});


// Restart timer button
$(document).ready(function(){

$(".bRestart").click(function(){

          // Only restart if there is a timer in process (true) and to avoid timer conflicts, only restart after pausing
          if ((timer_process == true && timer_paused == true) || cancelled == true || (timer_process == false && bar_finished == 1))
          {

                      // Get actuator id (associated to pin13, pin12, pin11... in Arduino)
                      var actuator_id = $(this).attr('id');
                      localStorage.setItem("currentActuator", actuator_id);

                      // If there is a timer process running (timer_process == true), go back to initial state (OFF).
                      // If not, there's no need to change the state since that means it's already OFF
                      if (timer_process == true){
                          changeState(actuator_id);

                          var there_was_timer = true;
                      }

                      // Critical case:
                      if (refreshed_from_paused != 1){
                            // Stop previous timer
                            timeOut.clear();

                            // Stop progress bar
                            clearInterval(barProgress);
                      }

                      // Start new progress bar
                      move(time_length);

                      // Block buttons
                      blockButtons();

                      // Save pause state to localStorage
                      timer_paused = false;
                      localStorage.setItem("timerPaused", timer_paused);
                      cancelled = false;

                      // Display that the timer has restarted
                      document.getElementById("timerProgress").innerHTML = "Restarting...";

                      // After 1 second, show the current state after restarting, stop the current timer and start a new timer with
                      // current 'time_interval' variable, and display that the timer is in progress.
                      timer_process = true; // The timer process starts (true)
                      localStorage.setItem("timerProcess", timer_process);

                      setTimeout(
                          function() {
                              if (there_was_timer == true){
                                  setTimeout(function(){
                                      changeState(actuator_id);
                                  }, wait_time);
                              }
                              else {
                                  changeState(actuator_id);
                              }


                              // Allow user to press the restart button only after 'wait_time' seconds after timer starts
                              document.getElementById("timerRestartId").disabled = true;

                              setTimeout(function() {
                                      document.getElementById("timerRestartId").disabled = false;
                                  }, wait_time);

                              timeOut = new Timer(function(){
                                              changeState(actuator_id);
                                              bar_finished = 1;
                                              document.getElementById("myBar").style.backgroundColor = "85f76f";  // Turn progress bar green
                                              document.getElementById("timerProgress").innerHTML = "Timer finished!";  // Display that the timer finished

                                              // The timer process has ended (becomes false).
                                              timer_process = false;
                                              localStorage.setItem("timerProcess", timer_process);
                                              timer_paused = false;
                                              localStorage.setItem("timerPaused", timer_paused);

                                              // Block buttons
                                              blockButtons();


                                          }, time_length);
                              document.getElementById("timerProgress").innerHTML = "Timer in progress...";
                          }, 1000);

          }
          else{
                 alert('Please pause, cancel or wait until the timer ends before restarting. If no timer is in running, please set one up.');
          }

});

});





// Resume timer button
$(document).ready(function(){

$(".bResume").click(function(){

        // Get actuator id (associated to pin13, pin12, pin11... in Arduino)
var actuator_id = $(this).attr('id');

        // Only resume if there is a timer in process (true)
        if (timer_process == true)
        {
              // Resume actuator timer
              var time_remaining_local;
              var actuator_id_local;

              if (refreshed_from_paused == 1){  // If coming from page-refreshed-from-paused, start a new timer with the previous remaining time
                        time_remaining_local = time_remaining;
                        document.getElementById("timerProgress").innerHTML = "Timer in progress...";

                        timer_process = true;  // There was previously a timer process running
                        localStorage.setItem("timerProcess", timer_process);

                        actuator_id_local = prev_actuator;

                        // Allow user to press the restart button only after 'wait_time' seconds after timer starts
                        document.getElementById("timerRestartId").disabled = true;

                        setTimeout(function() {
                                document.getElementById("timerRestartId").disabled = false;
                            }, wait_time);

                        timeOut = new Timer(function(){

                                  changeState(actuator_id_local);
                                        bar_finished = 1;
                                        document.getElementById("myBar").style.backgroundColor = "85f76f";  // Turn progress bar green
                                        document.getElementById("timerProgress").innerHTML = "Timer finished!";  // Display that the timer finished

                                        // The timer process has ended (becomes false).
                                        timer_process = false;
                                        localStorage.setItem("timerProcess", timer_process);

                                        // Block buttons
                            blockButtons();

                        }, time_remaining_local);
              }

              // In any other case, resume the current timer (variable timeOut)
              else {
                  time_remaining_local = timeOut.resume();
              }


              // Update pause state and save it to localStorage
              timer_paused = false;
              localStorage.setItem("timerPaused", timer_paused);

              // Resume progress bar
              move(time_remaining_local, current_width);

              // Display that the timer is running again
              document.getElementById("timerProgress").innerHTML = "Timer in progress...";
        }

});

});


// Actuator state Chart
document.getElementById("timeInput_start").defaultValue = "01:00";
document.getElementById("timeInput_end").defaultValue = "00:00";

$(".actChart").click(function(){

            var chart = "3"; // LED Lamp chart id
            var chart_title = "LED Lamps";

            start_date = document.getElementById("date_start").value;
            start_time = document.getElementById("timeInput_start").value;
            end_date = document.getElementById("date_end").value;
            end_time = document.getElementById("timeInput_end").value;

            // Correct ThingSpeak time difference (1 hour)
            var hours_start = start_time.split(":");
            var hours_end = end_time.split(":");

            console.log(start_date);
            console.log(start_time);
            console.log(end_date);
            console.log(end_time);
            console.log(hours_start);
            console.log(hours_end);


            console.log(parseInt(hours_start[0]));
            console.log(parseInt(hours_end[0]));

            if (hours_start[0] == 0){
              hours_start[0] = (23).toString();
            }
            else {
              hours_start[0] = (parseInt(hours_start[0]) - 2).toString();
            }

            if (hours_end[0] == 0){
              hours_end[0] = (23).toString();
            }
            else {
              hours_end[0] = (parseInt(hours_end[0]) - 2).toString();
            }


            if (hours_start[0] < 10) {hours_start[0] = "0" + hours_start[0];}
            if (hours_end[0] < 10) {hours_end[0] = "0" + hours_end[0];}

            start_time = hours_start.join(":");
            end_time = hours_end.join(":");

            console.log(start_time);
            console.log(end_time);

            // Prepare GET Request
            var start = "&start=" + start_date + "%20" + start_time + ":00";
            var end = "&end=" + end_date + "%20" + end_time + ":00";

            get_request = "https://api.thingspeak.com/channels/745199/charts/" + chart +
              "?api_key=ULZDAIJ4V116DC9L&title=" + chart_title + "&color=f64bfc&step=true&xaxis=Time&yaxis=State" + start + end;

            console.log(get_request);

            document.getElementById("actChart_id").src = get_request;



});


// Whenever the page refreshes, save strategic variables/states to ensure system/state correctness and optimal user experience.
// If the user refreshes AND before refreshing there was a timer in process, then retrieve previously stored
// variables/states and resume the timer. NOTE: In this case, the actuator state is NOT changed.

var refreshed_from_paused; // (Global)

if (performance.navigation.type == 1){

    var prev_process = localStorage.getItem("timerProcess");
    var prev_paused = localStorage.getItem("timerPaused");

    // If there was a timer process running and was NOT paused:
    if (prev_process == 'true' && prev_paused == 'false') {  // Since localStorage.getItem() stores the previous variable as a STRING,
                                                            // the variable previously boolean is now a string, therefore it should be compared
                                                            // in the if statement as such.

          // Get last progress bar width, time remaining and actuator id
          var prev_width = localStorage.getItem("currentWidth");
          var prev_remaining = localStorage.getItem("timeRemaining");
          var prev_actuator = localStorage.getItem("currentActuator");


          // Start a new timer, where time_length equals the time remaining from previous session/timer.
          move(prev_remaining, prev_width);
          document.getElementById("timerProgress").innerHTML = "Timer in progress...";

          timer_process = true;  // There was previously a timer process running
          localStorage.setItem("timerProcess", timer_process);

  // Allow user to press the restart button only after 'wait_time' seconds after timer starts
          document.getElementById("timerRestartId").disabled = true;

          setTimeout(function() {
                      document.getElementById("timerRestartId").disabled = false;
          }, wait_time);

          timeOut = new Timer(function(){
                    changeState(prev_actuator);
                          bar_finished = 1;
                          document.getElementById("myBar").style.backgroundColor = "85f76f";  // Turn progress bar green
                          document.getElementById("timerProgress").innerHTML = "Timer finished!";  // Display that the timer finished

                          // The timer process has ended (becomes false).
                          timer_process = false;
                          localStorage.setItem("timerProcess", timer_process);

                          // Block buttons
                      blockButtons();

                    }, prev_remaining);


       }

       // If there was a timer process running and WAS paused:
       else if (prev_process == 'true' && prev_paused != 'false')
       {

          // Remind the page that the timer was paused
          timer_paused = true;

          // Get last progress bar width, time_length and previous actuator id
          var prev_width = localStorage.getItem("currentWidth");
          current_width = parseInt(prev_width);
          time_length = parseInt(localStorage.getItem("timeLength"));
          var prev_actuator = localStorage.getItem("currentActuator");

          // Set global variable 'time_remaining' to the last stored time remaining and set refreshed_from_paused=1
          var time_remaining = localStorage.getItem("timeRemaining");
          refreshed_from_paused = 1;
          timer_process = true;  // There was previously a timer process running

          // Display last stored bar width using getElementById()
          document.getElementById("myBar").style.width = current_width + '%';

          // Display that the timer is still paused
          document.getElementById("timerProgress").innerHTML = "Paused";

       }


   console.info( "This page was reloaded" );
}
