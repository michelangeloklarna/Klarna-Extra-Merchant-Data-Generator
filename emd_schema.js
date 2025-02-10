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
    header.textContent = formatTitle(key);
    
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

// Add this function to handle EMD generation
function generateEMD() {
    const output = {};
    
    // Get all sections
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const sectionHeader = section.querySelector('.section-header').textContent;
        
        // Map section keys exactly as they appear in Klarna's schema
        const sectionKeyMap = {
            'Air Reservation': 'air_reservation_details',
            'Hotel Reservation': 'hotel_reservation_details',
            'Train Reservation': 'train_reservation_details',
            'Ferry Reservation': 'ferry_reservation_details',
            'Bus Reservation': 'bus_reservation_details',
            'Car Rental': 'car_rental_reservation_details',
            'Event Tickets': 'event',
            'Voucher Details': 'voucher',
            'Marketplace Seller': 'marketplace_seller_info',
            'Marketplace Winner': 'marketplace_winner_info',
            'Customer Account': 'customer_account_info',
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
        
        // Get all main items in this section
        section.querySelectorAll('.array-item').forEach(item => {
            const itemData = {};
            const itemSchema = window.emdSchema.properties[schemaKey].items;
            
            // Process main level fields
            item.querySelectorAll('> .form-container > .form-group > input, > .form-container > .form-group > select').forEach(input => {
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
            
            // Process nested arrays according to schema
            item.querySelectorAll('.nested-array').forEach(nestedArray => {
                const arrayKey = nestedArray.querySelector('.form-label').textContent
                    .toLowerCase()
                    .replace(/\s+/g, '_');
                    
                const arraySchema = itemSchema.properties?.[arrayKey];
                if (!arraySchema || arraySchema.type !== 'array') return;
                
                const nestedItems = [];
                
                nestedArray.querySelectorAll('.array-item').forEach(nestedItem => {
                    const nestedData = {};
                    nestedItem.querySelectorAll('input, select').forEach(input => {
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
    
    // Validate against schema before outputting
    const validation = validateEMDOutput(output);
    if (!validation.isValid) {
        console.error('EMD Validation Errors:', validation.errors);
        alert('EMD validation failed. Check console for details.');
        return;
    }
    
    document.getElementById('output').textContent = JSON.stringify(output, null, 2);
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
        // Double stringify to create a JSON string that can be used as a string value
        const serialized = JSON.stringify(JSON.stringify(emdData));
        
        // Remove the outer quotes that double stringify adds
        const finalSerialized = serialized.slice(1, -1);
        
        // Show the serialized string in the popup
        const serializedOutput = document.getElementById('serializedOutput');
        serializedOutput.textContent = finalSerialized;
        
        // Show the popup
        const popup = document.getElementById('serializePopup');
        popup.style.display = 'block';
    } catch (error) {
        console.error('Error serializing EMD:', error);
        alert('Error serializing EMD data');
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

// Add this function to copy the generated EMD
function copyGeneratedEMD() {
    const output = document.getElementById('output');
    if (!output.textContent) {
        alert('Please generate EMD first');
        return;
    }
    
    const textarea = document.createElement('textarea');
    textarea.value = output.textContent;
    document.body.appendChild(textarea);
    
    try {
        textarea.select();
        document.execCommand('copy');
        
        const copyBtn = document.querySelector('.output-section .generate-btn:last-child');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    } finally {
        document.body.removeChild(textarea);
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