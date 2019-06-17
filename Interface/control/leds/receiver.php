<?php

$var1 = $_GET['actuator'];
$var2 = $_GET['state'];
$var3 = $_GET['server'];

// Get timestamp for log purposes
date_default_timezone_set('Europe/Madrid');
$date = new DateTime(date('m/d/Y h:i:s a', time()));
$date_str = $date -> format('d M Y g:i:s a');


// Save current actuator state in .JSON file
$actuator_state = array("actuator" => $var1, "state" => $var2, "timestamp" => $date_str, "server" => $var3);
$fp = fopen('actuator_state.json', 'w');
fwrite($fp, json_encode($actuator_state));
fclose($fp);
echo json_encode($actuator_state);


// Save actuator log info in .txt and .JSON file
$fileContent1 = "actuator: ".$var1.", state: ".$var2.", timestamp: ".$date_str.", server: ".$var3."\n";
$fileStatus = file_put_contents("actuator_log.txt", $fileContent1, FILE_APPEND); // .txt file

$fileContent2 = "".json_encode($actuator_state)."\n";
$fileStatus = file_put_contents("actuator_log.json", $fileContent2, FILE_APPEND); // .JSON file

if ($fileStatus != false)
{
	echo "\nSUCCESS: Eres un sipollo";
}
else
{
	echo "\nFAIL: Q pollas";
}

?>