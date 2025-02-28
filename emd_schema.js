function generateFormFromSchema(schema) {
    const container = document.querySelector('.container');
    const outputSection = document.querySelector('.output-section');
    const header = container.querySelector('h1');
    const disclaimer = container.querySelector('.disclaimer-box');
    
    // Clear existing sections except header, disclaimer, and output
    Array.from(container.children).forEach(child => {
        if (child !== header && 
            child !== disclaimer && 
            !child.classList.contains('output-section')) {
            child.remove();
        }
    });

    // Generate sections for each property in the schema
    for (const [key, value] of Object.entries(schema.properties)) {
        const section = createSection(key, value);
        container.insertBefore(section, outputSection);
    }
}

// Update the schema URL to always point to Klarna's latest version
const KLARNA_SCHEMA_URL = 'https://docs.klarna.com/api/extra-merchant-data.json';

// Fetch and initialize the EMD schema
async function initializeEMDSchema() {
    try {
        const response = await fetch(KLARNA_SCHEMA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch EMD schema: ${response.statusText}`);
        }
        const schema = await response.json();
        
        // Store schema globally for validation
        window.emdSchema = schema;
        
        // Generate form using the fetched schema
        generateFormFromSchema(schema);
        
        console.log('Successfully loaded schema from Klarna API');
        return schema;
    } catch (error) {
        console.error('Error loading EMD schema:', error);
        alert('Failed to load latest schema from Klarna. Please try refreshing the page.');
        throw error;
    }
}

function createSection(key, schema) {
    const section = document.createElement('div');
    section.className = 'section';
    
    const header = document.createElement('div');
    header.className = 'section-header';
    
    // Add appropriate Windows 95 icon based on section type
    const iconSpan = document.createElement('span');
    iconSpan.className = 'win98-icon';
    
    // Choose appropriate icon based on key
    if (key.includes('air') || key.includes('flight')) {
        iconSpan.classList.add('win98-plane');
    } else if (key.includes('hotel')) {
        iconSpan.classList.add('win98-building');
    } else if (key.includes('train')) {
        iconSpan.classList.add('win98-sync');
    } else if (key.includes('car')) {
        iconSpan.classList.add('win98-properties');
    } else if (key.includes('event')) {
        iconSpan.classList.add('win98-calendar');
    } else if (key.includes('marketplace')) {
        iconSpan.classList.add('win98-shopping-cart');
    } else if (key.includes('payment')) {
        iconSpan.classList.add('win98-dollar');
    } else if (key.includes('customer')) {
        iconSpan.classList.add('win98-user');
    } else if (key.includes('voucher')) {
        iconSpan.classList.add('win98-file-text');
    } else {
        iconSpan.classList.add('win98-document-file');
    }
    
    header.appendChild(iconSpan);
    header.appendChild(document.createTextNode(' ' + formatTitle(key)));
    
    const content = document.createElement('div');
    content.className = 'section-content';
    
    // Add description if available
    if (schema.description) {
        const description = document.createElement('div');
        description.className = 'description';
        description.textContent = schema.description;
        content.appendChild(description);
    }

    // Generate form fields based on schema type
    if (schema.type === 'array') {
        content.appendChild(createArrayFields(key, schema.items));
    }

    section.appendChild(header);
    section.appendChild(content);
    return section;
}

function createArrayFields(key, itemSchema) {
    const container = document.createElement('div');
    container.className = 'array-container';
    
    // Add array description if available
    if (itemSchema.description) {
        const description = document.createElement('div');
        description.className = 'description';
        description.textContent = itemSchema.description;
        container.appendChild(description);
    }

    // Create container for array items
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'array-items';
    itemsContainer.dataset.arrayKey = key;

    // Add button to add new items
    const addButton = document.createElement('button');
    addButton.className = 'add-btn';
    addButton.textContent = `Add ${formatTitle(key.replace(/s$/, ''))}`;
    addButton.onclick = () => addArrayItem(itemsContainer, itemSchema);

    // Add button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(addButton);

    container.appendChild(buttonContainer);
    container.appendChild(itemsContainer);
    return container;
}

function addArrayItem(container, schema) {
    const item = document.createElement('div');
    item.className = 'array-item';

    // Add header with remove button
    const itemHeader = document.createElement('div');
    itemHeader.className = 'array-item-header';
    
    const itemTitle = document.createElement('span');
    itemTitle.textContent = `${formatTitle(container.dataset.arrayKey.replace(/s$/, ''))} ${container.children.length + 1}`;
    itemHeader.appendChild(itemTitle);

    const removeButton = document.createElement('button');
    removeButton.className = 'remove-btn';
    removeButton.textContent = '×';
    removeButton.onclick = () => {
        item.remove();
        updateArrayItemNumbers(container);
    };
    itemHeader.appendChild(removeButton);
    
    item.appendChild(itemHeader);

    // Add fields based on schema type
    if (schema.type === 'object') {
        const form = createFormForObject(schema);
        item.appendChild(form);
    } else {
        // Handle non-object array items
        const field = createField(container.dataset.arrayKey, schema);
        item.appendChild(field);
    }

    container.appendChild(item);
    updateArrayItemNumbers(container);
}

function updateArrayItemNumbers(container) {
    const items = container.getElementsByClassName('array-item');
    Array.from(items).forEach((item, index) => {
        const title = item.querySelector('.array-item-header span');
        if (title) {
            title.textContent = `${formatTitle(container.dataset.arrayKey.replace(/s$/, ''))} ${index + 1}`;
        }
    });
}

function createFormForObject(schema) {
    const form = document.createElement('div');
    form.className = 'form-container';

    // Add test data checkbox at the top of each object form
    const testDataDiv = document.createElement('div');
    testDataDiv.className = 'test-data-container';
    
    const testDataCheckbox = document.createElement('input');
    testDataCheckbox.type = 'checkbox';
    testDataCheckbox.className = 'test-data-checkbox';
    testDataCheckbox.id = `test-data-${Math.random().toString(36).substr(2, 9)}`;
    
    const testDataLabel = document.createElement('label');
    testDataLabel.htmlFor = testDataCheckbox.id;
    testDataLabel.textContent = 'Use Test Data';
    testDataLabel.className = 'test-data-label';
    
    testDataCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            fillWithTestData(form, schema);
        } else {
            clearFormData(form);
        }
    });

    testDataDiv.appendChild(testDataCheckbox);
    testDataDiv.appendChild(testDataLabel);
    form.appendChild(testDataDiv);

    for (const [key, prop] of Object.entries(schema.properties)) {
        if (prop.type === 'array') {
            // Create nested array fields
            const arrayContainer = document.createElement('div');
            arrayContainer.className = 'nested-array';
            
            const arrayLabel = document.createElement('label');
            arrayLabel.className = 'form-label';
            arrayLabel.textContent = formatTitle(key);
            
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'array-items';
            itemsContainer.dataset.arrayKey = key;

            const addButton = document.createElement('button');
            addButton.className = 'add-btn';
            addButton.textContent = `Add ${formatTitle(key.replace(/s$/, ''))}`;
            addButton.onclick = () => addArrayItem(itemsContainer, prop.items);

            arrayContainer.appendChild(arrayLabel);
            arrayContainer.appendChild(addButton);
            arrayContainer.appendChild(itemsContainer);
            form.appendChild(arrayContainer);
        } else if (prop.type === 'object') {
            // Create nested object fields
            const objectContainer = document.createElement('div');
            objectContainer.className = 'nested-object';
            
            const objectLabel = document.createElement('div');
            objectLabel.className = 'nested-object-label';
            objectLabel.textContent = formatTitle(key);
            
            objectContainer.appendChild(objectLabel);
            objectContainer.appendChild(createFormForObject(prop));
            form.appendChild(objectContainer);
        } else {
            form.appendChild(createField(key, prop));
        }
    }

    return form;
}

function createField(key, schema) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = formatTitle(key);
    
    if (schema.description) {
        const helpText = document.createElement('div');
        helpText.className = 'help-text';
        helpText.innerHTML = schema.description.replace(/\n/g, '<br>');
        group.appendChild(helpText);
    }

    let input;
    
    // Special handling for boolean type
    if (schema.type === 'boolean') {
        input = document.createElement('select');
        input.className = 'form-control';
        
        // Add default empty option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select...';
        input.appendChild(defaultOption);
        
        // Add true/false options
        const trueOption = document.createElement('option');
        trueOption.value = 'true';
        trueOption.textContent = 'True';
        
        const falseOption = document.createElement('option');
        falseOption.value = 'false';
        falseOption.textContent = 'False';
        
        input.appendChild(trueOption);
        input.appendChild(falseOption);
    } else if (schema.enum) {
        // Existing enum handling
        input = document.createElement('select');
        input.className = 'form-control';
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Select...';
        input.appendChild(emptyOption);

        schema.enum.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            input.appendChild(option);
        });
    } else {
        // Regular input handling
        input = document.createElement('input');
        input.className = 'form-control';
        input.type = getInputType(schema);
        
        if (schema.minLength) input.minLength = schema.minLength;
        if (schema.maxLength) input.maxLength = schema.maxLength;
        if (schema.pattern) input.pattern = schema.pattern;
        if (schema.format === 'date-time') {
            input.placeholder = 'YYYY-MM-DDThh:mm';
        }
        
        if (schema.description && schema.description.includes('Example:')) {
            const example = schema.description.match(/Example:.*?`(.*?)`/);
            if (example) {
                input.placeholder = example[1];
            }
        }
    }

    input.id = key;
    input.name = key;

    // Rest of the validation code...
    const validationMsg = document.createElement('div');
    validationMsg.className = 'validation-message';
    
    // Add validation rules text
    const validationRules = [];
    if (schema.minLength || schema.maxLength) {
        if (schema.minLength === schema.maxLength) {
            validationRules.push(`Must be exactly ${schema.minLength} characters`);
        } else {
            if (schema.minLength) validationRules.push(`Minimum ${schema.minLength} characters`);
            if (schema.maxLength) validationRules.push(`Maximum ${schema.maxLength} characters`);
        }
    }
    if (schema.pattern) {
        if (schema.format === 'date-time') {
            validationRules.push('Format: YYYY-MM-DDThh:mm[:ss][Z]');
        }
    }
    if (schema.type === 'boolean') {
        validationRules.push('Select True or False');
    }

    if (validationRules.length > 0) {
        const rulesText = document.createElement('div');
        rulesText.className = 'validation-rules';
        rulesText.textContent = validationRules.join(' | ');
        group.appendChild(rulesText);
    }

    input.addEventListener('input', () => validateField(input, schema, validationMsg));
    input.addEventListener('blur', () => validateField(input, schema, validationMsg));

    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(validationMsg);
    return group;
}

function validateField(input, schema, validationMsg) {
    let isValid = true;
    let messages = [];

    input.classList.remove('is-invalid', 'is-valid');

    if (input.value) {
        // Always use the latest schema from Klarna for validation
        const schemaRules = window.emdSchema?.properties?.[input.name] || schema;
        
        // Type validation
        if (schemaRules.type === 'integer' || schemaRules.type === 'number') {
            const num = Number(input.value);
            
            // Basic number validation
            if (isNaN(num)) {
                isValid = false;
                messages.push(`Must be a ${schemaRules.type}`);
            }
            
            // Passenger ID validation (must be positive integer)
            if ((input.name.includes('passenger_id') || input.name === 'id') && num <= 0) {
                isValid = false;
                messages.push('Must be a positive integer greater than 0');
            }
        }

        // String validation
        if (schemaRules.type === 'string') {
            // Length validation from schema
            if (schemaRules.minLength && input.value.length < schemaRules.minLength) {
                isValid = false;
                messages.push(`Must be at least ${schemaRules.minLength} characters`);
            }
            if (schemaRules.maxLength && input.value.length > schemaRules.maxLength) {
                isValid = false;
                messages.push(`Must not exceed ${schemaRules.maxLength} characters`);
            }

            // Pattern validation from schema
            if (schemaRules.pattern && !new RegExp(schemaRules.pattern).test(input.value)) {
                isValid = false;
                if (schemaRules.format === 'date-time') {
                    messages.push('Invalid date format. Must match YYYY-MM-DDThh:mm[:ss][Z]');
                } else {
                    messages.push('Invalid format');
                }
            }

            // Enum validation from schema
            if (schemaRules.enum && !schemaRules.enum.includes(input.value)) {
                isValid = false;
                messages.push(`Must be one of: ${schemaRules.enum.join(', ')}`);
            }
        }

        // Array validation from schema
        if (schemaRules.type === 'array') {
            const values = input.value.split(',').map(v => v.trim());
            
            if (schemaRules.items?.type === 'integer') {
                const hasInvalidNumbers = values.some(v => {
                    const num = parseInt(v);
                    return isNaN(num) || num <= 0 || !Number.isInteger(num);
                });
                if (hasInvalidNumbers) {
                    isValid = false;
                    messages.push('All values must be positive integers greater than 0');
                }
            }
        }
    }

    // Apply validation results
    input.classList.add(isValid ? 'is-valid' : 'is-invalid');
    validationMsg.textContent = messages.join('. ');
    validationMsg.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
    
    return isValid;
}

function getInputType(schema) {
    if (schema.format === 'date-time') return 'datetime-local';
    switch (schema.type) {
        case 'number':
        case 'integer':
            return 'number';
        case 'boolean':
            return 'select';
        default:
            return 'text';
    }
}

function formatTitle(key) {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Variable to store the last generated EMD
let lastGeneratedEMD = null;

// Add this function to handle EMD generation
function generateEMD() {
    const output = {};
    
    // Get all sections
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const sectionHeader = section.querySelector('.section-header').textContent;
        
        // Map section keys exactly as they appear in Klarna's schema
        const sectionKeyMap = {
            'Air Reservation Details': 'air_reservation_details',
            'Hotel Reservation Details': 'hotel_reservation_details',
            'Train Reservation Details': 'train_reservation_details',
            'Ferry Reservation Details': 'ferry_reservation_details',
            'Bus Reservation Details': 'bus_reservation_details',
            'Car Rental Reservation Details': 'car_rental_reservation_details',
            'Event': 'event',
            'Voucher': 'voucher',
            'Marketplace Seller Info': 'marketplace_seller_info',
            'Marketplace Winner Info': 'marketplace_winner_info',
            'Customer Account Info': 'customer_account_info',
            'Payment History Full': 'payment_history_full',
            'Payment History Simple': 'payment_history_simple',
            'In Store Payment': 'in_store_payment',
            'Customer Tokens': 'customer_tokens',
            'Other Delivery Address': 'other_delivery_address'
        };
        
        const schemaKey = sectionKeyMap[sectionHeader];
        if (!schemaKey || !window.emdSchema.properties[schemaKey]) {
            console.error(`Invalid section key: ${sectionHeader}`);
            return;
        }

        const items = [];
        
        // Get all array items in this section
        section.querySelectorAll('.array-item').forEach(item => {
            const itemData = {};
            const itemSchema = window.emdSchema.properties[schemaKey].items;
            
            // Process main level fields
            item.querySelectorAll('.form-group > input, .form-group > select').forEach(input => {
                if (input.value) {
                    const key = input.name || input.id;
                    const fieldSchema = itemSchema.properties?.[key];
                    
                    if (fieldSchema) {
                        const value = processFieldValue(input.value, fieldSchema);
                        if (value !== undefined) {
                            itemData[key] = value;
                        }
                    }
                }
            });
            
            // Process nested arrays
            item.querySelectorAll('.nested-array').forEach(nestedArray => {
                const arrayKey = nestedArray.querySelector('.form-label').textContent
                    .toLowerCase()
                    .replace(/\s+/g, '_');
                    
                const arraySchema = itemSchema.properties?.[arrayKey];
                if (!arraySchema || arraySchema.type !== 'array') return;
                
                const nestedItems = [];
                
                nestedArray.querySelectorAll('.array-item').forEach(nestedItem => {
                    const nestedData = {};
                    nestedItem.querySelectorAll('.form-group > input, .form-group > select').forEach(input => {
                        if (input.value) {
                            const key = input.name || input.id;
                            const fieldSchema = arraySchema.items?.properties?.[key];
                            
                            if (fieldSchema) {
                                const value = processFieldValue(input.value, fieldSchema);
                                if (value !== undefined) {
                                    nestedData[key] = value;
                                }
                            }
                        }
                    });
                    
                    if (Object.keys(nestedData).length > 0) {
                        nestedItems.push(nestedData);
                    }
                });
                
                if (nestedItems.length > 0) {
                    itemData[arrayKey] = nestedItems;
                }
            });
            
            if (Object.keys(itemData).length > 0) {
                items.push(itemData);
            }
        });
        
        if (items.length > 0) {
            output[schemaKey] = items;
        }
    });

    // Add debug logging
    console.log('Generated EMD:', output);
    
    // Only update output if we have data
    if (Object.keys(output).length > 0) {
        const formattedOutput = JSON.stringify(output, null, 2);
        document.getElementById('output').textContent = formattedOutput;
        
        // Store the generated EMD and enable the reset button
        lastGeneratedEMD = formattedOutput;
        document.getElementById('resetEMDBtn').disabled = false;
    } else {
        console.error('No data collected from form');
    }
}

// Function to reset the EMD to the last generated version
function resetEMD() {
    if (lastGeneratedEMD) {
        document.getElementById('output').textContent = lastGeneratedEMD;
    }
}

// Helper function to process field values according to schema
function processFieldValue(value, schema) {
    switch (schema.type) {
        case 'number':
        case 'integer':
            const num = Number(value);
            // Ensure positive numbers for prices and IDs
            if (schema.description?.includes('price') && num < 0) {
                return undefined;
            }
            if (schema.description?.includes('id') && (!Number.isInteger(num) || num <= 0)) {
                return undefined;
            }
            return !isNaN(num) ? num : undefined;
            
        case 'boolean':
            return value === 'true';
            
        case 'array':
            if (schema.items?.type === 'integer') {
                const nums = value.split(',')
                    .map(v => parseInt(v.trim()))
                    .filter(v => !isNaN(v));
                // Validate passenger_id array values
                if (schema.description?.includes('passenger') && 
                    nums.some(n => n <= 0 || !Number.isInteger(n))) {
                    return undefined;
                }
                return nums;
            }
            return undefined;
            
        case 'string':
            if (schema.enum && !schema.enum.includes(value)) {
                return undefined;
            }
            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                return undefined;
            }
            // Validate string length
            if (schema.minLength && value.length < schema.minLength) {
                return undefined;
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                return undefined;
            }
            return value;
            
        default:
            return value;
    }
}

// Initialize the schema when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeEMDSchema().catch(error => {
        console.error('Failed to initialize EMD schema:', error);
    });
});

// The EMD will now only generate when the button is clicked 

function showSerializedEMD() {
    const output = document.getElementById('output').textContent;
    if (!output) {
        alert('Please generate EMD first');
        return;
    }
    
    try {
        // Parse the current EMD output and then stringify it to create a serialized string
        const emdData = JSON.parse(output);
        
        // Create a serialized version (single line, no whitespace)
        const serialized = JSON.stringify(emdData);
        
        // Add escaping for quotes to make it compatible with HTML attributes
        const finalSerialized = serialized.replace(/"/g, '\\"');
        
        document.getElementById('serializePopup').style.display = 'block';
        const serializedOutput = document.getElementById('serializedOutput');
        serializedOutput.textContent = finalSerialized;
    } catch (error) {
        alert('Error serializing EMD: ' + error.message + '\n\nPlease check for syntax errors in your edited EMD.');
    }
}

function closeSerializePopup() {
    document.getElementById('serializePopup').style.display = 'none';
}

// Add this function to copy the serialized EMD
function copySerializedEMD() {
    const serializedOutput = document.getElementById('serializedOutput');
    const textToCopy = serializedOutput.textContent;
    
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    
    try {
        // Select and copy the text
        textarea.select();
        document.execCommand('copy');
        
        // Show feedback
        const copyBtn = document.querySelector('.popup-footer .generate-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    } finally {
        // Clean up
        document.body.removeChild(textarea);
    }
}

// Function to show EMD in Klarna Payments ready format
function showEMDKPReady() {
    const output = document.getElementById('output').textContent;
    if (!output) {
        alert('Please generate EMD first');
        return;
    }
    
    try {
        // Parse the current EMD output
        const emdData = JSON.parse(output);
        
        // Create a serialized version (single line, no whitespace)
        const serialized = JSON.stringify(emdData);
        
        // Create the KP ready format
        const kpReadyFormat = {
            "attachment": {
                "content_type": "application/vnd.klarna.internal.emd-v2+json",
                "body": serialized
            }
        };
        
        // Format the KP ready JSON with indentation
        const formattedKPReady = JSON.stringify(kpReadyFormat, null, 2);
        
        // Show the popup and populate it
        document.getElementById('emdKPReadyPopup').style.display = 'block';
        const kpReadyOutput = document.getElementById('emdKPReadyOutput');
        kpReadyOutput.textContent = formattedKPReady;
    } catch (error) {
        alert('Error generating KP Ready EMD: ' + error.message + '\n\nPlease check for syntax errors in your edited EMD.');
    }
}

function closeEMDKPReadyPopup() {
    document.getElementById('emdKPReadyPopup').style.display = 'none';
}

function copyEMDKPReady() {
    const kpReadyOutput = document.getElementById('emdKPReadyOutput');
    const textToCopy = kpReadyOutput.textContent;
    
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    
    try {
        // Select and copy the text
        textarea.select();
        document.execCommand('copy');
        
        // Show feedback
        const copyBtn = document.querySelector('#emdKPReadyPopup .popup-footer .generate-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    } finally {
        // Clean up
        document.body.removeChild(textarea);
    }
}

// Add this function to copy the generated EMD
function copyGeneratedEMD() {
    const output = document.getElementById('output');
    if (!output.textContent) {
        alert('Please generate EMD first');
        return;
    }
    
    try {
        // Validate that the content is valid JSON first
        JSON.parse(output.textContent);
        
        // Use a temporary textarea element for copy
        const textarea = document.createElement('textarea');
        textarea.value = output.textContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Change the button text temporarily
        const copyBtn = document.querySelector('.output-section .generate-btn:nth-child(4)');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        alert('Error copying EMD: ' + error.message + '\n\nPlease check for syntax errors in your edited EMD.');
    }
}

// Add schema-specific validation for special fields
function validateSpecialFields(data, schema) {
    if (!data || !schema) return true;

    for (const [key, value] of Object.entries(data)) {
        const fieldSchema = schema.properties?.[key];
        if (!fieldSchema) continue;

        // Validate passenger_id array
        if (key === 'passenger_id' && Array.isArray(value)) {
            const invalidIds = value.filter(id => !Number.isInteger(id) || id <= 0);
            if (invalidIds.length > 0) {
                console.error('Invalid passenger IDs:', invalidIds);
                return false;
            }
        }

        // Validate date-time format
        if (fieldSchema.format === 'date-time' && fieldSchema.pattern) {
            const pattern = new RegExp(fieldSchema.pattern);
            if (!pattern.test(value)) {
                console.error(`Invalid date-time format for ${key}:`, value);
                return false;
            }
        }

        // Validate IATA codes
        if ((key === 'departure' || key === 'arrival') && 
            fieldSchema.minLength === 3 && fieldSchema.maxLength === 3) {
            if (!/^[A-Z]{3}$/.test(value)) {
                console.error(`Invalid IATA code for ${key}:`, value);
                return false;
            }
        }

        // Validate carrier codes
        if (key === 'carrier' && fieldSchema.minLength === 2 && fieldSchema.maxLength === 2) {
            if (!/^[A-Z]{2}$/.test(value)) {
                console.error(`Invalid carrier code:`, value);
                return false;
            }
        }
    }

    return true;
}

// Add function to fill form with test data
function fillWithTestData(form, schema) {
    Object.entries(schema.properties).forEach(([key, prop]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) return;

        // Get example from schema description
        const example = prop.description?.match(/Example:.*?`(.*?)`/)?.[1];
        
        if (example) {
            if (prop.type === 'number' || prop.type === 'integer') {
                input.value = example.replace(/[^0-9.-]/g, '');
            } else if (prop.type === 'boolean') {
                input.value = example.toLowerCase();
            } else if (prop.enum) {
                input.value = prop.enum[0];
            } else {
                input.value = example;
            }
        } else {
            // Fallback test data if no example is found
            switch (prop.type) {
                case 'string':
                    if (prop.format === 'date-time') {
                        input.value = '2024-12-24T12:00';
                    } else if (prop.minLength === 3 && prop.maxLength === 3) {
                        input.value = 'ABC'; // IATA code
                    } else if (prop.minLength === 2 && prop.maxLength === 2) {
                        input.value = 'AB'; // Carrier code
                    } else {
                        input.value = 'Test Value';
                    }
                    break;
                case 'number':
                case 'integer':
                    input.value = prop.description?.includes('price') ? '10000' : '1';
                    break;
                case 'boolean':
                    input.value = 'true';
                    break;
                case 'array':
                    if (prop.items?.type === 'integer') {
                        input.value = '1,2,3';
                    }
                    break;
            }
        }

        // Trigger validation
        input.dispatchEvent(new Event('input'));
    });

    // Generate EMD after filling test data
    setTimeout(generateEMD, 100);
}

// Add function to clear form data
function clearFormData(form) {
    form.querySelectorAll('input, select').forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input'));
    });
}

// Add styles for the test data checkbox
const style = document.createElement('style');
style.textContent = `
    .test-data-container {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        padding: 5px;
        background: var(--win95-gray);
        border: 2px solid var(--win95-dark);
    }
    
    .test-data-checkbox {
        margin-right: 8px;
    }
    
    .test-data-label {
        font-size: 12px;
        color: var(--win95-dark);
        user-select: none;
    }
`;
document.head.appendChild(style);

// Function to validate the EMD against the schema
function validateEMD() {
    const output = document.getElementById('output');
    if (!output.textContent.trim()) {
        alert('Please generate or enter EMD first');
        return;
    }
    
    try {
        // Parse the current EMD output
        const emdData = JSON.parse(output.textContent);
        
        // Validate against schema
        const validationResults = validateEMDAgainstSchema(emdData);
        
        if (validationResults.valid) {
            // Show success message
            alert('EMD validation successful! The JSON is valid according to Klarna\'s schema.');
        } else {
            // Show validation errors
            let errorMessage = 'EMD validation failed with the following errors:\n\n';
            validationResults.errors.forEach((error, index) => {
                errorMessage += `${index + 1}. ${error}\n`;
            });
            alert(errorMessage);
        }
    } catch (error) {
        alert('Error validating EMD: ' + error.message + '\n\nPlease check for syntax errors in your JSON.');
    }
}

// Function to validate EMD data against schema
function validateEMDAgainstSchema(emdData) {
    const errors = [];
    
    // Check if emdData is an object
    if (typeof emdData !== 'object' || emdData === null || Array.isArray(emdData)) {
        errors.push('EMD data must be a JSON object');
        return { valid: false, errors };
    }
    
    // Validate each section in the EMD data
    for (const [sectionKey, sectionData] of Object.entries(emdData)) {
        // Check if section exists in schema
        if (!window.emdSchema.properties[sectionKey]) {
            errors.push(`Unknown section: "${sectionKey}"`);
            continue;
        }
        
        // Check if section data is an array
        if (!Array.isArray(sectionData)) {
            errors.push(`Section "${sectionKey}" must be an array`);
            continue;
        }
        
        // Get schema for this section
        const sectionSchema = window.emdSchema.properties[sectionKey];
        
        // Validate each item in the section array
        sectionData.forEach((item, itemIndex) => {
            if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                errors.push(`Item ${itemIndex + 1} in "${sectionKey}" must be an object`);
                return;
            }
            
            // Validate item properties against schema
            validateObject(item, sectionSchema.items, `${sectionKey}[${itemIndex}]`, errors);
        });
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Recursive function to validate an object against a schema
function validateObject(obj, schema, path, errors) {
    if (!schema || !schema.properties) return;
    
    // Check for required properties if specified in schema
    if (schema.required) {
        schema.required.forEach(requiredProp => {
            if (obj[requiredProp] === undefined) {
                errors.push(`Missing required property "${requiredProp}" in ${path}`);
            }
        });
    }
    
    // Validate each property in the object
    for (const [propKey, propValue] of Object.entries(obj)) {
        const propPath = `${path}.${propKey}`;
        const propSchema = schema.properties[propKey];
        
        // Skip validation if property isn't in schema
        if (!propSchema) {
            errors.push(`Unknown property "${propKey}" in ${path}`);
            continue;
        }
        
        // Validate based on property type
        switch (propSchema.type) {
            case 'string':
                if (typeof propValue !== 'string') {
                    errors.push(`Property ${propPath} must be a string`);
                } else {
                    // Check string constraints
                    if (propSchema.minLength && propValue.length < propSchema.minLength) {
                        errors.push(`Property ${propPath} must be at least ${propSchema.minLength} characters`);
                    }
                    if (propSchema.maxLength && propValue.length > propSchema.maxLength) {
                        errors.push(`Property ${propPath} must not exceed ${propSchema.maxLength} characters`);
                    }
                    if (propSchema.pattern && !new RegExp(propSchema.pattern).test(propValue)) {
                        errors.push(`Property ${propPath} does not match required pattern`);
                    }
                    if (propSchema.enum && !propSchema.enum.includes(propValue)) {
                        errors.push(`Property ${propPath} must be one of: ${propSchema.enum.join(', ')}`);
                    }
                }
                break;
                
            case 'number':
            case 'integer':
                if (typeof propValue !== 'number') {
                    errors.push(`Property ${propPath} must be a ${propSchema.type}`);
                } else if (propSchema.type === 'integer' && !Number.isInteger(propValue)) {
                    errors.push(`Property ${propPath} must be an integer`);
                }
                break;
                
            case 'boolean':
                if (typeof propValue !== 'boolean') {
                    errors.push(`Property ${propPath} must be a boolean`);
                }
                break;
                
            case 'array':
                if (!Array.isArray(propValue)) {
                    errors.push(`Property ${propPath} must be an array`);
                } else {
                    // Validate array items
                    propValue.forEach((item, itemIndex) => {
                        if (propSchema.items.type === 'object') {
                            validateObject(item, propSchema.items, `${propPath}[${itemIndex}]`, errors);
                        } else {
                            validatePrimitive(item, propSchema.items, `${propPath}[${itemIndex}]`, errors);
                        }
                    });
                }
                break;
                
            case 'object':
                if (typeof propValue !== 'object' || propValue === null || Array.isArray(propValue)) {
                    errors.push(`Property ${propPath} must be an object`);
                } else {
                    validateObject(propValue, propSchema, propPath, errors);
                }
                break;
        }
    }
}

// Validate primitive types (string, number, integer, boolean)
function validatePrimitive(value, schema, path, errors) {
    switch (schema.type) {
        case 'string':
            if (typeof value !== 'string') {
                errors.push(`Value at ${path} must be a string`);
            }
            break;
        case 'number':
            if (typeof value !== 'number') {
                errors.push(`Value at ${path} must be a number`);
            }
            break;
        case 'integer':
            if (typeof value !== 'number' || !Number.isInteger(value)) {
                errors.push(`Value at ${path} must be an integer`);
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                errors.push(`Value at ${path} must be a boolean`);
            }
            break;
    }
}