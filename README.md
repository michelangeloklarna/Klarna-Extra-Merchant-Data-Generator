# Klarna EMD Generator

A Windows 95-styled web tool for generating and validating Extra Merchant Data (EMD) for Klarna's API.

## Overview

This tool helps merchants create and validate Extra Merchant Data (EMD) according to Klarna's specifications. It automatically fetches and uses the latest schema from Klarna's official documentation to ensure compliance with current requirements.

## What is EMD?

Extra Merchant Data (EMD) is additional information that merchants can send to Klarna to provide more details about their orders. This data helps:
- Improve risk assessment
- Enable better customer experience
- Support specific industry requirements
- Provide detailed transaction information

The tool supports various EMD types including:
- Air Reservations
- Hotel Bookings
- Train Tickets
- Ferry Bookings
- Bus Tickets
- Event Tickets
- Car Rentals
- Marketplace Information
- Customer Account Details
- Payment History
- And more...

## Features

- **Live Schema Updates**: 
  - Automatically fetches the latest EMD schema from Klarna's API
  - Always up-to-date with Klarna's requirements
  - No need to manually update validation rules

- **Real-time Validation**: 
  - Validates input according to Klarna's specifications
  - Immediate feedback on validation errors
  - Helps prevent API submission errors

- **Windows 95 Interface**: 
  - Nostalgic and user-friendly design
  - Clear visual hierarchy
  - Intuitive form controls

- **Multiple Output Formats**: 
  - Formatted JSON for readability and debugging
  - Serialized format ready for API requests
  - Properly escaped strings for API submission
  - Klarna Payment API ready format with attachment structure
  - Base64 encoded output for specific integration needs

- **Clipboard Support**: 
  - Easy copying of all output formats
  - One-click copy functionality
  - Visual feedback on copy operations

- **Dedicated Validator**: 
  - Separate tab for validating existing EMD data
  - Detailed error reporting
  - Same validation rules as the generator
  - Multiple output options for validated data

## How to Use

### Generator Tab

1. **Fill in Data**:
   - Navigate through different sections (Air Reservation, Hotel, etc.)
   - Click "Add" buttons to create new entries
   - Fill in the relevant fields
   - Real-time validation ensures data correctness

2. **Generate EMD**:
   - Click "Generate EMD" to create the JSON structure
   - Use "Copy EMD to Clipboard" for the formatted version
   - Use "Serialize EMD" for the API-ready string format
   - Use "Encode Base64" for Base64 encoded output
   - Use "Klarna Payment ready EMD" for the Payment API attachment format
   - Preview the output before using it

### Validator Tab

1. **Validate Existing EMD**:
   - Paste your existing EMD JSON into the validator textarea
   - Click "Validate EMD" to check against Klarna's schema
   - Review any validation errors that are displayed
   - Fix issues based on detailed error messages

2. **Process Validated EMD**:
   - Use "Copy to Clipboard" to copy the validation results
   - Use "Serialize EMD" to get the serialized string format
   - Use "Encode Base64" for Base64 encoded output
   - Use "Klarna Payment ready EMD" for the Payment API format

## Output Formats

- **Standard EMD**: Complete JSON structure for validation and debugging
- **Serialized EMD**: Escaped string format for API integration
- **Base64 Encoded EMD**: Base64 encoded format for specific integration needs
- **Klarna Payment ready EMD**: Formatted with attachment structure for direct use in Payment API:
  ```json
  "attachment": {
    "content_type": "application/vnd.klarna.internal.emd-v2+json",
    "body": "{\"serialized_emd_data\"}"
  }
  ```

## Use Cases

- **Travel Agencies**: Create EMD for flight, hotel, and transportation bookings
- **Event Organizers**: Generate EMD for event tickets and venue information
- **Marketplaces**: Include seller and buyer information
- **Hotels**: Provide detailed booking and guest information
- **Transportation**: Handle bus, train, and ferry ticket reservations
- **Developers**: Validate existing EMD data against Klarna's schema

## Technical Details

- **Schema Source**: https://docs.klarna.com/api/extra-merchant-data.json
- **No Backend Required**: All processing happens in the browser
- **No Data Storage**: No data is sent to any server
- **Validation**: Uses Klarna's official schema for validation rules
- **Output Format**: Generates EMD in multiple formats (JSON, serialized, Base64, Payment API)
- **Payment API Support**: Creates output formatted for direct use in Klarna Payment API with proper attachment structure

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/klarna-emd-generator.git
```

2. Open the project:
```bash
cd klarna-emd-generator
```

3. Start a local server:
```bash
python -m http.server 8000
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Browser Compatibility

The tool is compatible with all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## Privacy

- No data is sent to any server
- All processing happens locally in your browser
- No cookies or local storage is used to store your data
- Your EMD data is never saved or transmitted

## License

This project is open source and available under the MIT License.