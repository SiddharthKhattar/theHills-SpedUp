const axios = require('axios');
const fs = require('fs');

// Read the text file and extract the "id" field from the last JSON object
fs.readFile('visit_creation_log.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Log the entire content of the file to check if it's read correctly
  console.log('File content:', data);

  // Split the file content into separate lines, and filter out empty lines
  const lines = data.trim().split('\n').filter(line => line.trim() !== '');

  console.log('Number of non-empty lines:', lines.length); // Log the number of valid lines

  // Ensure there is at least one valid line
  if (lines.length === 0) {
    console.error('No valid JSON objects found in the file.');
    return;
  }

  // Get the last line
  const lastLine = lines[lines.length - 1];
  console.log('Using last line for visitId:', lastLine); // Log the last line being used

  // Parse the last line as JSON
  let visitId;
  try {
    const lastJsonObject = JSON.parse(lastLine);
    visitId = lastJsonObject.id;  // Get the 'id' from the last JSON object
    console.log('Using visitId:', visitId); // Log the visitId being used
  } catch (e) {
    console.error('Invalid JSON in the last line:', lastLine);
    console.error('Error details:', e.message); // Log error details
    return;
  }

  let payload = JSON.stringify({
    "description": "sample task 2",
    "priority": "IMMEDIATE",
    "taskCategory": "0002",
    "status": "OPEN",
    "isMandatory": false,
    "visitId": visitId  // Use the visitId from the last valid JSON object
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://sales2.vlab.crm.cloud.sap/sap/c4c/api/v1/visit-objective-task-service/objectives',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Basic VVNTQUxFU1JFUDAxOk5vcnRoJHRhcjE=' // Make sure this token is valid
    },
    data: payload
  };

  axios.request(config)
    .then((response) => {
      const logMessage = `${JSON.stringify(response.data)}\n`;
      // Append the successful response to objectivelogs.txt
      fs.appendFile('objectivelogs.txt', logMessage, (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        } else {
          console.log('Response successfully logged.');
        }
      });
    })
    .catch((error) => {
      const errorMessage = `Error: ${new Date().toISOString()} - ${error.message}\n`;
      // Append the error message to objectivelogs.txt
      fs.appendFile('objectivelogs.txt', errorMessage, (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        } else {
          console.log('Error successfully logged.');
        }
      }); 
    });
});