# Klarna EMD Generator

A Windows 95-styled web tool for generating and validating Extra Merchant Data (EMD) for Klarna's API.

## Overview

This tool helps merchants create and validate Extra Merchant Data (EMD) according to Klarna's specifications. It automatically fetches and uses the latest schema from Klarna's official documentation to ensure compliance with current requirements.

## Features

- **Live Schema Updates**: Automatically fetches the latest EMD schema from Klarna's API
- **Real-time Validation**: Validates input according to Klarna's specifications
- **Windows 95 Interface**: Nostalgic and user-friendly design
- **Multiple Output Formats**: 
  - Formatted JSON for readability
  - Serialized format for API requests
- **Clipboard Support**: Easy copying of both formatted and serialized outputs

## How to Use

1. **Fill in Data**:
   - Navigate through different sections (Air Reservation, Hotel, etc.)
   - Click "Add" buttons to create new entries
   - Fill in the relevant fields

2. **Generate EMD**:
   - Click "Generate EMD" to create the JSON structure
   - Use "Copy EMD to Clipboard" for the formatted version
   - Use "Serialize EMD" for the API-ready format

3. **Validation**:
   - Fields are validated in real-time
   - Red indicators show validation errors
   - Hover over fields for validation rules

## Technical Details

- **Schema Source**: https://docs.klarna.com/api/extra-merchant-data.json
- **No Backend Required**: All processing happens in the browser
- **No Data Storage**: No data is sent to any server

## Local Development

1. Clone the repository: 