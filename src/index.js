import Tesseract from 'tesseract.js';

document.getElementById('processButton').addEventListener('click', () => {
  const imageInput = document.getElementById('imageInput');
  const statusDiv = document.getElementById('status');

  if (imageInput.files.length === 0) {
    alert('Please select an image.');
    return;
  }

  console.log("Processing image...");
  const imageFile = imageInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const imageData = e.target.result;
    statusDiv.innerText = 'Processing image...';

    Tesseract.recognize(
      imageData,
      'eng',
      { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
      console.log('OCR Output:', text);
      statusDiv.innerText = 'Processing complete.';
      // Parse the text to extract workout data
      const parsedData = parseWorkoutData(text);
      if (parsedData) {
        console.log('Parsed Data:', parsedData);
        // Send data to Google Apps Script
        sendDataToGoogleSheet(parsedData);
      } else {
        alert('Failed to parse workout data.');
      }
    }).catch(err => {
      console.error(err);
      statusDiv.innerText = 'An error occurred.';
    });
  };

  reader.readAsDataURL(imageFile);
});

function cleanUpValue(value) {
  // Remove unwanted characters
  let cleanedValue = value.replace(/[^\d:.'"/a-zA-Z]/g, '').replace('PM', 'BPM');

  // Handle heart rate: If it's a number and greater than 3 digits, shorten it
  if (cleanedValue.includes('BPM')) {
    const heartRate = cleanedValue.replace('BPM', '').trim();
    // Ensure heart rate is 3 digits and within a reasonable range
    if (heartRate.length > 3 || heartRate > 250) {
      cleanedValue = heartRate.slice(0, 3) + 'BPM';
    }
  }

  return cleanedValue;
}

function parseWorkoutData(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
  const workoutDetails = {};
  const splits = [];
  let parsingSplits = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes('Workout Details')) {
      i += 1; // Skip 'Workout Details' line
    } else if (line.includes('Workout Time') && line.includes('Distance')) {
      const valuesLine = lines[i + 1] || '';
      const values = valuesLine.split(/\s+/);
      workoutDetails.time = values[0] || '';
      workoutDetails.distance = values[1] || '';
      i += 2;
    } else if (line.includes('Active Calories') && line.includes('Total Calories')) {
      const valuesLine = lines[i + 1] || '';
      const values = valuesLine.split(/\s+/);
      workoutDetails.activeCalories = values[0] || '';
      workoutDetails.totalCalories = values[1] || '';
      i += 2;
    } else if (line.includes('Elevation Gain') && line.includes('Avg. Power')) {
      const valuesLine = lines[i + 1] || '';
      const values = valuesLine.split(/\s+/);
      workoutDetails.elevationGain = values[0] || '';
      workoutDetails.avgPower = values[1] || '';
      i += 2;
    } else if (line.includes('Avg. Cadence') && line.includes('Avg. Pace')) {
      const valuesLine = lines[i + 1] || '';
      const values = valuesLine.split(/\s+/);
      workoutDetails.avgCadence = values[0] || '';
      workoutDetails.avgPace = values[1] || '';
      i += 2;
    } else if (line.includes('Avg. Heart Rate')) {
      workoutDetails.avgHeartRate = lines[i + 1] || '';
      i += 2;
    } else if (line.includes('Splits')) {
      parsingSplits = true;
      i += 1; // Move to the next line
    } else if (parsingSplits) {
      if (line.includes('Time') && line.includes('Pace') && line.includes('Heart Rate')) {
        // Skip the header line in splits
        i += 1;
      } else if (/^\d/.test(line)) {
        const splitData = line.split(/\s+/);
        if (splitData.length >= 4) {
          splits.push({
            splitNumber: splitData[0],
            time: splitData[1],
            pace: splitData[2],
            heartRate: cleanUpValue(splitData[3])
          });
        }
        i += 1;
      } else {
        // End of splits
        parsingSplits = false;
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  // Clean up workout details
  for (let key in workoutDetails) {
    workoutDetails[key] = cleanUpValue(workoutDetails[key]);
  }

  if (Object.keys(workoutDetails).length === 0) {
    return null;
  }

  return { workoutDetails, splits };
}

function sendDataToGoogleSheet(data) {
  const googleSheetInput = document.getElementById('googleSheetInput').value;
  const scriptURL = 'https://script.google.com/macros/s/AKfycbyR8YTU_a_NdMD3axJadZfzZPsFT4mFhmY1bKPlWOx8e_6nZg85-Z1RKa-ZRPVQo3lL/exec'; // Replace with your Apps Script URL

  // If user provides a Google Sheet ID or URL, extract the ID and update the scriptURL
  if (googleSheetInput) {
    const sheetId = googleSheetInput.match(/[-\w]{25,}/); // Extracts the sheet ID from the URL or uses it as is
    if (sheetId) {
      scriptURL = `https://script.google.com/macros/s/YOUR_DYNAMIC_SCRIPT_ID/exec?sheetId=${sheetId[0]}`;
    }
  }

  console.log('Sending request to:', scriptURL);

  const formData = new URLSearchParams();
  formData.append('data', JSON.stringify(data));

  fetch(scriptURL, {
    method: 'POST',
    body: formData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response type:', response.type);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(json => {
      console.log('Response JSON:', json);
      if (json.status === 'success') {
        alert('Data successfully inserted into Google Sheet.');
      } else {
        alert('Failed to insert data into Google Sheet: ' + json.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while sending data to Google Sheet.');
    });
}
