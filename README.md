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

- **Clipboard Support**: 
  - Easy copying of both formatted and serialized outputs
  - One-click copy functionality
  - Visual feedback on copy operations

## How to Use

1. **Fill in Data**:
   - Navigate through different sections (Air Reservation, Hotel, etc.)
   - Click "Add" buttons to create new entries
   - Fill in the relevant fields
   - Real-time validation ensures data correctness

2. **Generate EMD**:
   - Click "Generate EMD" to create the JSON structure
   - Use "Copy EMD to Clipboard" for the formatted version
   - Use "Serialize EMD" for the API-ready string format
   - Use "Klarna Payment ready EMD" for the Payment API attachment format
   - Preview the output before using it

3. **Output Formats**:
   - Standard EMD: Complete JSON structure for validation and debugging
   - Serialized EMD: Escaped string format for API integration
   - Klarna Payment ready EMD: Formatted with attachment structure for direct use in Payment API

4. **Validation**:
   - Fields are validated in real-time
   - Red indicators show validation errors
   - Hover over fields for validation rules
   - All validations follow Klarna's specifications

## Use Cases

- **Travel Agencies**: Create EMD for flight, hotel, and transportation bookings
- **Event Organizers**: Generate EMD for event tickets and venue information
- **Marketplaces**: Include seller and buyer information
- **Hotels**: Provide detailed booking and guest information
- **Transportation**: Handle bus, train, and ferry ticket reservations

## Technical Details

- **Schema Source**: https://docs.klarna.com/api/extra-merchant-data.json
- **No Backend Required**: All processing happens in the browser
- **No Data Storage**: No data is sent to any server
- **Validation**: Uses Klarna's official schema for validation rules
- **Output Format**: Generates EMD in both readable and API-ready formats
- **Payment API Support**: Creates output formatted for direct use in Klarna Payment API with proper attachment structure:
  ```json
  "attachment": {
    "content_type": "application/vnd.klarna.internal.emd-v2+json",
    "body": "{\"serialized_emd_data\"}"
  }
  ```

## Local Development

1. Clone the repository: