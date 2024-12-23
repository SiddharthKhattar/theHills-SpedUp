 
const axios = require('axios');
const fs = require('fs');
const logFilePath1 = 'flag_deletion_log.txt'; // 1
 
// Read the objective ID from the log file
const logFilePath = 'objectivelogs.txt';
let ObjectiveID;
 
// Function to extract the last Objective ID from the log file
function getLastObjectiveID(logFile = 'objectivelogs.txt') {
    try {
        const logData = fs.readFileSync(logFile, 'utf-8');
 
        // Find all occurrences of JSON objects in the file using a regex for "id"
        const regex = /"id":"([a-fA-F0-9-]{36})","description":"[^"]+"/g;
        let match;
        let lastObjectiveId = null;
 
        // Iterate through all matches and keep updating lastObjectiveId
        while ((match = regex.exec(logData)) !== null) {
            lastObjectiveId = match[1];
        }
 
        if (lastObjectiveId) {
            console.log(`Last extracted Objective ID: ${lastObjectiveId}`);
            return lastObjectiveId;
        } else {
            console.log("No Objective ID found.");
            return null;
        }
 
    } catch (error) {
        console.error(`Log file '${logFile}' not found or cannot be read:`, error.message);
        return null;
    }
}
 
// Function to log the deletion event in the same log file
function logDeletion(ObjectiveId, logFile = 'objectivelogs.txt') {
    const deletionLog = {
        Objective_id: ObjectiveId,
        deletion_status: 'Deleted',
        // logTimeIST: getCurrentISTTime()
    };
 
    fs.appendFileSync(logFile, JSON.stringify(deletionLog) + "\n", 'utf-8'); // Append the log entry
}
 
let Flag_delete; //2

// Function to delete the object
async function deleteObjective (ObjectiveID) {
    const baseUrl = "https://sales2.vlab.crm.cloud.sap/sap/c4c/api/v1/visit-objective-task-service/objectives/";
    const url = baseUrl + ObjectiveID;
 
    const headers = {
        'Authorization': 'Basic dXNzYWxlc3JlcDAxOk5vcnRoJHRhcjE=' // Ensure credentials are correct
    };
 
    try {
        const response = await axios.delete(url, { headers });
        
        if (response.status === 204) { // 204 means success with no content
            console.log(`objective ${ObjectiveID} successfully deleted.`);
            Flag_delete = 0;
            logDeletion(ObjectiveID); // Log the deletion after success
        } else {
            console.log(`Failed to delete objective ${ObjectiveID}. Response: ${response.data}`);
            Flag_delete = 1;
        }
 
        return response.status;
    } catch (error) {
        console.error(`Error deleting objective ${ObjectiveID}:`, error.message);
        Flag_delete = 1;
        return error.response ? error.response.status : 500;
    }
}
 
// Main execution
(async () => {
    const ObjectiveID = getLastObjectiveID(); // Get the last created Objective ID from log
    if (ObjectiveID) {
        console.log(`Attempting to delete Objective with ID: ${ObjectiveID}`);
        await deleteObjective(ObjectiveID);
    } else {
        console.log("No Objective ID found to delete.");
    }
    fs.writeFileSync(logFilePath1, Flag_delete.toString(), 'utf-8'); // 6
     console.log(`Flag_delete value logged: ${Flag_delete}`); //7
})();
 
 
 