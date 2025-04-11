function generateFormFromSchema(schema) {
    const container = document.querySelector('.container');
    const outputSection = document.querySelector('.output-section');
    const generatorTab = document.getElementById('generator-tab');
    
    // Clear existing sections in the generator tab
    while (generatorTab.children.length > 1) { // Keep the disclaimer box
        generatorTab.removeChild(generatorTab.lastChild);
    }

    // Generate sections for each property in the schema
    for (const [key, value] of Object.entries(schema.properties)) {
        const section = createSection(key, value);
        generatorTab.appendChild(section);
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
        
        // Set up tab switching
        setupTabNavigation();
        
        console.log('Successfully loaded schema from Klarna API');
        return schema;
    } catch (error) {
        console.error('Error loading EMD schema:', error);
        alert('Failed to load latest schema from Klarna. Please try refreshing the page.');
        throw error;
    }
}

// Setup tab navigation
function setupTabNavigation() {
    // Set initial tab state
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            switchTab(tabId);
        });
    });
    
    // Initialize with generator tab active
    switchTab('generator');
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
            
            // Ensure all dropdowns have a selection
            ensureDropdownsHaveSelection(form);
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
        
        // Special validation for passenger_id
        if (input.name === 'passenger_id') {
            // Check if it's in proper array format like [1,2,3]
            const arrayPattern = /^\[\s*\d+(?:\s*,\s*\d+)*\s*\]$/;
            
            if (!arrayPattern.test(input.value)) {
                isValid = false;
                messages.push('Must be in format [1], [1,2], [1,2,3], etc.');
            } else {
                // Check individual values in the array
                try {
                    const parsed = JSON.parse(input.value);
                    if (!Array.isArray(parsed) || parsed.some(id => !Number.isInteger(id) || id <= 0)) {
                        isValid = false;
                        messages.push('All values must be positive integers');
                    }
                } catch (e) {
                    isValid = false;
                    messages.push('Invalid array format');
                }
            }
        }
        // Type validation
        else if (schemaRules.type === 'integer' || schemaRules.type === 'number') {
            const num = Number(input.value);
            
            // Basic number validation
            if (isNaN(num)) {
                isValid = false;
                messages.push(`Must be a ${schemaRules.type}`);
            }
            
            // Price validation (must be positive)
            if (schemaRules.description?.includes('price') && num < 0) {
                isValid = false;
                messages.push(`Must be a positive ${schemaRules.type}`);
            }
            
            // ID validation (must be positive integer)
            if ((input.name === 'id' || schemaRules.description?.includes('id')) && 
                (!Number.isInteger(num) || num <= 0)) {
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
    // Track the "Generate EMD" button click in Google Analytics using the offline-aware function
    sendAnalyticsEvent('generate_emd', {
        'event_category': 'EMD Actions',
        'event_label': 'Generate EMD Button Click',
        'value': 1
    });
    
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
            'Trip Reservation Details': 'trip_reservation_details',
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
                        const value = processFieldValue(input.value, fieldSchema, key);
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
                                const value = processFieldValue(input.value, fieldSchema, key);
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
            
            // Process nested objects
            item.querySelectorAll('.nested-object').forEach(nestedObj => {
                const objKey = nestedObj.querySelector('.nested-object-label').textContent
                    .toLowerCase()
                    .replace(/\s+/g, '_');
                    
                const objSchema = itemSchema.properties?.[objKey];
                if (!objSchema || objSchema.type !== 'object') return;
                
                const nestedData = {};
                
                // Process all inputs in the nested object
                nestedObj.querySelectorAll('.form-group > input, .form-group > select').forEach(input => {
                    if (input.value) {
                        const key = input.name || input.id;
                        const fieldSchema = objSchema.properties?.[key];
                        
                        if (fieldSchema) {
                            const value = processFieldValue(input.value, fieldSchema, key);
                            if (value !== undefined) {
                                nestedData[key] = value;
                            }
                        }
                    }
                });
                
                if (Object.keys(nestedData).length > 0) {
                    itemData[objKey] = nestedData;
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
    
    // Round all price values to avoid floating-point precision issues
    const roundedOutput = roundAllPriceValues(output);
    
    // Only update output if we have data
    if (Object.keys(roundedOutput).length > 0) {
        document.getElementById('output').textContent = JSON.stringify(roundedOutput, null, 2);
    } else {
        console.error('No data collected from form');
    }
}

// Function to handle floating-point precision issues for price values
function roundPriceValue(value) {
    // For price values, round to 2 decimal places to avoid floating-point precision issues
    // This is especially important for values like 3390.9999999999995 which should be 3391.00
    if (typeof value !== 'number' || isNaN(value)) {
        return value;
    }
    
    // Round to 2 decimal places for most currencies
    // For currencies without decimal places (like JPY), this won't affect the value
    return Math.round(value * 100) / 100;
}

// Function to recursively round all price values in an object
function roundAllPriceValues(data) {
    // If data is not an object or is null, return it as is
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    
    // If data is an array, process each item
    if (Array.isArray(data)) {
        return data.map(item => roundAllPriceValues(item));
    }
    
    // Process each property in the object
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        // Round price values and other monetary fields
        if ((key.endsWith('_price') || key.includes('price') || key === 'total_amount_paid_purchases') && typeof value === 'number') {
            result[key] = roundPriceValue(value);
        } 
        // Recursively process nested objects
        else if (typeof value === 'object' && value !== null) {
            result[key] = roundAllPriceValues(value);
        } 
        // Keep other values as is
        else {
            result[key] = value;
        }
    }
    
    return result;
}

// Helper function to process field values according to schema
function processFieldValue(value, schema, key) {
    if (!value) return undefined;
    
    switch (schema.type) {
        case 'integer':
        case 'number':
            const num = Number(value);
            // Ensure positive numbers for prices and IDs
            if (schema.description?.includes('price') && num < 0) {
                return undefined;
            }
            if (schema.description?.includes('id') && (!Number.isInteger(num) || num <= 0)) {
                return undefined;
            }
            
            // Handle floating-point precision issues for price fields
            if (schema.description?.includes('price') || key === 'total_amount_paid_purchases') {
                return roundPriceValue(num);
            }
            
            return isNaN(num) ? undefined : num;
            
        case 'boolean':
            return value === 'true';
            
        case 'array':
            if (schema.items?.type === 'integer') {
                // Special handling for passenger_id
                if (schema.description?.includes('passenger')) {
                    try {
                        // Try to parse it as JSON first (for array format [1,2,3])
                        if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
                            const parsed = JSON.parse(value);
                            if (Array.isArray(parsed) && parsed.every(n => Number.isInteger(n) && n > 0)) {
                                return parsed;
                            }
                        }
                    } catch (e) {
                        // Failed to parse as JSON, try comma-separated format
                    }
                }
                
                // Fallback to comma-separated format
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

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeEMDSchema().catch(error => {
        console.error('Failed to initialize EMD schema:', error);
    });
});

// Tab switching functionality
function switchTab(tabId) {
    // Track tab switching in Google Analytics
    sendAnalyticsEvent('switch_tab', {
        'event_category': 'Navigation',
        'event_label': `Switch to ${tabId} Tab`,
        'value': 1
    });
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show the selected tab content
    const selectedTab = document.getElementById(`${tabId}-tab`);
    selectedTab.classList.add('active');
    
    // Activate the selected tab button
    const selectedButton = document.querySelector(`.tab-button[onclick="switchTab('${tabId}')"]`);
    selectedButton.classList.add('active');
    
    // Update the output section visibility based on the active tab
    const outputSection = document.querySelector('.output-section');
    if (tabId === 'generator') {
        outputSection.style.display = 'block';
    } else {
        outputSection.style.display = 'none';
    }
}

// Validate format-specific constraints
function validateFormat(value, format, path) {
    const errors = [];
    
    switch (format) {
        case 'date':
            // Check if it's a valid date in YYYY-MM-DD format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                errors.push({
                    path,
                    message: `Invalid date format. Expected YYYY-MM-DD`
                });
            } else {
                // Check if it's a valid date
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errors.push({
                        path,
                        message: `Invalid date: ${value}`
                    });
                }
            }
            break;
            
        case 'time':
            // Check if it's a valid time in HH:MM format
            if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
                errors.push({
                    path,
                    message: `Invalid time format. Expected HH:MM (24-hour)`
                });
            }
            break;
            
        case 'email':
            // Simple email validation
            if (!/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
                errors.push({
                    path,
                    message: `Invalid email format`
                });
            }
            break;
            
        case 'uri':
            try {
                new URL(value);
            } catch (e) {
                errors.push({
                    path,
                    message: `Invalid URI format`
                });
            }
            break;
    }
    
    return errors;
}

// Function to check for floating-point precision issues in price fields
function checkPriceFieldPrecision(data, path = '') {
    const warnings = [];
    
    // If data is not an object or array, return empty warnings
    if (typeof data !== 'object' || data === null) {
        return warnings;
    }
    
    // If data is an array, check each item
    if (Array.isArray(data)) {
        data.forEach((item, index) => {
            const itemPath = path ? `${path}[${index}]` : `[${index}]`;
            const itemWarnings = checkPriceFieldPrecision(item, itemPath);
            warnings.push(...itemWarnings);
        });
        return warnings;
    }
    
    // Check each property in the object
    for (const [key, value] of Object.entries(data)) {
        const propertyPath = path ? `${path}.${key}` : key;
        
        // Check if this is a price field or other monetary field
        if ((key.endsWith('_price') || key.includes('price') || key === 'total_amount_paid_purchases') && typeof value === 'number') {
            const roundedValue = roundPriceValue(value);
            if (roundedValue !== value) {
                warnings.push({
                    path: propertyPath,
                    message: `Floating-point precision issue detected: ${value} should be rounded to ${roundedValue}`
                });
            }
        }
        
        // Recursively check nested objects and arrays
        if (typeof value === 'object' && value !== null) {
            const nestedWarnings = checkPriceFieldPrecision(value, propertyPath);
            warnings.push(...nestedWarnings);
        }
    }
    
    return warnings;
}

// EMD Validation functionality
function validateEMD() {
    // Track the "Validate EMD" button click in Google Analytics
    sendAnalyticsEvent('validate_emd', {
        'event_category': 'EMD Actions',
        'event_label': 'Validate EMD Button Click',
        'value': 1
    });
    
    const inputArea = document.getElementById('emd-input');
    const statusElement = document.getElementById('validation-status');
    const errorsElement = document.getElementById('validation-errors');
    
    // Clear previous validation results
    statusElement.textContent = '';
    statusElement.className = 'validation-status';
    errorsElement.innerHTML = '';
    
    try {
        // Parse the input JSON
        const emdData = JSON.parse(inputArea.value);
        
        // Check if schema is available
        if (!window.emdSchema) {
            statusElement.textContent = '✗ Schema not loaded';
            statusElement.classList.add('invalid');
            return;
        }
        
        // Special handling for train_reservation_details
        if (emdData.train_reservation_details) {
            // Pre-process passenger_id fields to ensure they're treated correctly
            emdData.train_reservation_details.forEach(reservation => {
                if (reservation.itinerary) {
                    reservation.itinerary.forEach(segment => {
                        // Ensure passenger_id is treated as an array of integers
                        if (segment.passenger_id && Array.isArray(segment.passenger_id)) {
                            // No need to modify, our special handling will take care of it
                        }
                    });
                }
            });
        }
        
        // Validate against the schema
        const validationResult = validateAgainstSchema(emdData, window.emdSchema);
        
        if (validationResult.valid) {
            // Show success message
            statusElement.textContent = '✓ Valid EMD JSON';
            statusElement.classList.add('valid');
            
            // Store the validated EMD for reference
            window.validatedEMD = emdData;
            
            // Check for floating-point precision warnings in price fields
            const priceWarnings = checkPriceFieldPrecision(emdData);
            if (priceWarnings.length > 0) {
                // Add warnings to the validation results
                const warningHeader = document.createElement('div');
                warningHeader.className = 'warning-header';
                warningHeader.textContent = 'Warnings (these do not invalidate the EMD):';
                errorsElement.appendChild(warningHeader);
                
                priceWarnings.forEach(warning => {
                    const warningItem = document.createElement('div');
                    warningItem.className = 'warning-item';
                    
                    const warningPath = document.createElement('div');
                    warningPath.className = 'warning-path';
                    warningPath.textContent = `Path: ${warning.path}`;
                    
                    const warningMessage = document.createElement('div');
                    warningMessage.className = 'warning-message';
                    warningMessage.textContent = warning.message;
                    
                    warningItem.appendChild(warningPath);
                    warningItem.appendChild(warningMessage);
                    errorsElement.appendChild(warningItem);
                });
            }
        } else {
            // Filter out passenger_id array type errors that are actually valid
            const filteredErrors = validationResult.errors.filter(error => {
                // Skip errors about passenger_id being an array when it actually is an array of integers
                return !(error.path.endsWith('passenger_id') && 
                       error.message.includes('Expected type') &&
                       error.message.includes('got array'));
            });
            
            if (filteredErrors.length === 0) {
                // If all errors were filtered out, the JSON is actually valid
                statusElement.textContent = '✓ Valid EMD JSON';
                statusElement.classList.add('valid');
                
                // Store the validated EMD for reference
                window.validatedEMD = emdData;
            } else {
                // Show error message with filtered errors
                statusElement.textContent = `✗ Invalid EMD JSON - ${filteredErrors.length} error(s) found`;
                statusElement.classList.add('invalid');
                
                // Display validation errors
                filteredErrors.forEach(error => {
                    const errorItem = document.createElement('div');
                    errorItem.className = 'error-item';
                    
                    const errorPath = document.createElement('div');
                    errorPath.className = 'error-path';
                    errorPath.textContent = `Path: ${error.path || 'root'}`;
                    
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'error-message';
                    errorMessage.textContent = error.message;
                    
                    errorItem.appendChild(errorPath);
                    errorItem.appendChild(errorMessage);
                    errorsElement.appendChild(errorItem);
                });
            }
        }
    } catch (error) {
        // Handle JSON parsing errors
        statusElement.textContent = '✗ Invalid JSON format';
        statusElement.classList.add('invalid');
        
        const errorItem = document.createElement('div');
        errorItem.className = 'error-item';
        errorItem.textContent = `Error: ${error.message}`;
        errorsElement.appendChild(errorItem);
    }
}

// Function to copy validation results to clipboard
function copyValidationResults() {
    const statusElement = document.getElementById('validation-status');
    const errorsElement = document.getElementById('validation-errors');
    const copyButton = document.getElementById('copy-validation-btn');
    
    // Check if there are validation results to copy
    if (!statusElement.textContent && errorsElement.innerHTML === '') {
        alert('Please validate EMD first');
        return;
    }
    
    // Create a text representation of the validation results
    let resultText = statusElement.textContent + '\n\n';
    
    // Add error details if any
    const errorItems = errorsElement.querySelectorAll('.error-item');
    if (errorItems.length > 0) {
        errorItems.forEach(item => {
            const path = item.querySelector('.error-path');
            const message = item.querySelector('.error-message');
            
            if (path && message) {
                resultText += `${path.textContent}\n${message.textContent}\n\n`;
            } else {
                resultText += `${item.textContent}\n\n`;
            }
        });
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(resultText)
        .then(() => {
            // Provide visual feedback
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            
            // Reset button text after a delay
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy validation results:', err);
            alert('Failed to copy validation results to clipboard');
        });
}

// Clear the validator input and results
function clearValidatorInput() {
    const inputArea = document.getElementById('emd-input');
    const statusElement = document.getElementById('validation-status');
    const errorsElement = document.getElementById('validation-errors');
    
    inputArea.value = '';
    statusElement.textContent = '';
    statusElement.className = 'validation-status';
    errorsElement.innerHTML = '';
    
    // Clear the stored validated EMD
    window.validatedEMD = null;
}

// Validate JSON against the EMD schema
function validateAgainstSchema(data, schema, path = '') {
    const errors = [];
    
    // Check if data is an object
    if (typeof data !== 'object' || data === null) {
        return {
            valid: false,
            errors: [{ path, message: 'Expected an object' }]
        };
    }
    
    // Check required properties if defined in schema
    if (schema.required) {
        for (const requiredProp of schema.required) {
            if (!(requiredProp in data)) {
                errors.push({
                    path: path ? `${path}.${requiredProp}` : requiredProp,
                    message: `Missing required property: ${requiredProp}`
                });
            }
        }
    }
    
    // Validate properties
    if (schema.properties) {
        for (const [propName, propValue] of Object.entries(data)) {
            const propSchema = schema.properties[propName];
            
            if (!propSchema) {
                // Unknown property
                if (schema.additionalProperties === false) {
                    errors.push({
                        path: path ? `${path}.${propName}` : propName,
                        message: `Unknown property: ${propName}`
                    });
                }
                continue;
            }
            
            // Validate property value
            const propPath = path ? `${path}.${propName}` : propName;
            const propErrors = validateProperty(propValue, propSchema, propPath);
            errors.push(...propErrors);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// Validate a property against its schema
function validateProperty(value, schema, path) {
    const errors = [];
    
    // Special handling for passenger_id which is an array of integers
    if (path.endsWith('passenger_id')) {
        // Check if it's an array
        if (!Array.isArray(value)) {
            errors.push({
                path,
                message: `Expected an array of integers, got ${typeof value}`
            });
            return errors;
        }
        
        // Check if all items are integers
        for (let i = 0; i < value.length; i++) {
            if (!Number.isInteger(value[i])) {
                errors.push({
                    path: `${path}[${i}]`,
                    message: `Expected an integer, got ${typeof value[i]}`
                });
            }
        }
        
        return errors;
    }
    
    // Check type
    if (schema.type) {
        const typeValid = checkType(value, schema.type);
        if (!typeValid) {
            errors.push({
                path,
                message: `Expected type ${schema.type}, got ${Array.isArray(value) ? 'array' : typeof value}`
            });
            return errors; // Stop validation if type is wrong
        }
    }
    
    // Validate string constraints
    if (schema.type === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({
                path,
                message: `String is too short (${value.length} chars), minimum is ${schema.minLength}`
            });
        }
        
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({
                path,
                message: `String is too long (${value.length} chars), maximum is ${schema.maxLength}`
            });
        }
        
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
            errors.push({
                path,
                message: `String does not match pattern: ${schema.pattern}`
            });
        }
        
        // Check enum values
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push({
                path,
                message: `Value must be one of: ${schema.enum.join(', ')}`
            });
        }
    }
    
    // Validate number constraints
    if (schema.type === 'number' || schema.type === 'integer') {
        if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push({
                path,
                message: `Value ${value} is less than minimum ${schema.minimum}`
            });
        }
        
        if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push({
                path,
                message: `Value ${value} is greater than maximum ${schema.maximum}`
            });
        }
        
        if (schema.type === 'integer' && !Number.isInteger(value)) {
            errors.push({
                path,
                message: `Value ${value} is not an integer`
            });
        }
        
        // Check for floating-point precision issues in price fields
        if (path.endsWith('_price') || path.includes('price') || path === 'total_amount_paid_purchases') {
            const roundedValue = roundPriceValue(value);
            if (roundedValue !== value) {
                // This is just a warning, not an error that would invalidate the EMD
                console.warn(`Floating-point precision issue detected at ${path}: ${value} rounded to ${roundedValue}`);
                
                // We don't add this to errors because we want to allow the validation to pass
                // but we want to log it for debugging purposes
            }
        }
        
        // Check multipleOf
        if (schema.multipleOf !== undefined) {
            const remainder = value % schema.multipleOf;
            if (remainder !== 0) {
                errors.push({
                    path,
                    message: `Value ${value} is not a multiple of ${schema.multipleOf}`
                });
            }
        }
    }
    
    // Validate array
    if (schema.type === 'array' && schema.items) {
        // Handle array of integers specifically
        if (schema.items.type === 'integer') {
            for (let i = 0; i < value.length; i++) {
                if (!Number.isInteger(value[i])) {
                    errors.push({
                        path: `${path}[${i}]`,
                        message: `Expected an integer, got ${typeof value[i]}`
                    });
                }
            }
        } else {
            // Regular array validation
            value.forEach((item, index) => {
                const itemPath = `${path}[${index}]`;
                const itemErrors = validateProperty(item, schema.items, itemPath);
                errors.push(...itemErrors);
            });
        }
        
        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push({
                path,
                message: `Array has too few items (${value.length}), minimum is ${schema.minItems}`
            });
        }
        
        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push({
                path,
                message: `Array has too many items (${value.length}), maximum is ${schema.maxItems}`
            });
        }
        
        // Check uniqueItems
        if (schema.uniqueItems === true) {
            const uniqueValues = new Set();
            const duplicates = [];
            
            value.forEach((item, index) => {
                const itemStr = JSON.stringify(item);
                if (uniqueValues.has(itemStr)) {
                    duplicates.push(index);
                } else {
                    uniqueValues.add(itemStr);
                }
            });
            
            if (duplicates.length > 0) {
                errors.push({
                    path,
                    message: `Array must have unique items. Duplicates found at indices: ${duplicates.join(', ')}`
                });
            }
        }
    }
    
    // Validate object
    if (schema.type === 'object' && schema.properties) {
        const objErrors = validateAgainstSchema(value, schema, path).errors;
        errors.push(...objErrors);
    }
    
    // Handle format validations (common in EMD schema)
    if (schema.format) {
        const formatErrors = validateFormat(value, schema.format, path);
        errors.push(...formatErrors);
    }
    
    return errors;
}

// Check if a value matches the expected type
function checkType(value, expectedType) {
    // Handle array type
    if (expectedType === 'array') {
        return Array.isArray(value);
    }
    
    // Handle integer type
    if (expectedType === 'integer') {
        return typeof value === 'number' && Number.isInteger(value);
    }
    
    // Handle number type
    if (expectedType === 'number') {
        return typeof value === 'number';
    }
    
    // Handle object type
    if (expectedType === 'object') {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    
    // Handle boolean type
    if (expectedType === 'boolean') {
        return typeof value === 'boolean';
    }
    
    // Handle null type
    if (expectedType === 'null') {
        return value === null;
    }
    
    // Default to typeof check for other types
    return typeof value === expectedType;
}

// Add this function to copy the serialized EMD
function copySerializedEMD() {
    const serializedOutput = document.getElementById('serializedOutput');
    const text = serializedOutput.textContent;
    
    if (!text) {
        alert('No serialized EMD to copy');
        return;
    }
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(text)
        .then(() => {
            // Provide visual feedback that the copy was successful
            const copyBtn = document.querySelector('#serializePopup .popup-footer .generate-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            
            // Reset the button text after a short delay
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
}

// Add this function to copy the generated EMD
function copyGeneratedEMD() {
    // Track the "Copy EMD to Clipboard" button click in Google Analytics
    sendAnalyticsEvent('copy_emd', {
        'event_category': 'EMD Actions',
        'event_label': 'Copy EMD Button Click',
        'value': 1
    });
    
    const output = document.getElementById('output');
    const text = output.textContent;
    
    if (!text) {
        alert('No EMD to copy');
        return;
    }
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(text)
        .then(() => {
            // Provide visual feedback that the copy was successful
            const copyBtn = document.querySelector('.button-group .generate-btn:nth-child(2)');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            
            // Reset the button text after a short delay
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
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

// Generate EMD after filling test data
function generateAfterFillTestData() {
    // Ensure all dropdowns have selections across the entire form
    const formSections = document.querySelectorAll('.section');
    formSections.forEach(section => {
        ensureDropdownsHaveSelection(section);
    });
    
    // Generate the EMD data
    generateEMD();
}

// Function to ensure all dropdowns have a value selected
function ensureDropdownsHaveSelection(form) {
    // Process all dropdown/select elements in the form
    const dropdowns = form.querySelectorAll('select');
    dropdowns.forEach(dropdown => {
        // If dropdown has no value selected but has options available
        if (!dropdown.value && dropdown.options.length > 1) {
            // Select the first non-empty option
            for (let i = 1; i < dropdown.options.length; i++) {
                if (dropdown.options[i].value) {
                    dropdown.value = dropdown.options[i].value;
                    
                    // Trigger change event to update any dependent fields
                    const event = new Event('change', { bubbles: true });
                    dropdown.dispatchEvent(event);
                    break;
                }
            }
        }
    });
    
    // Process nested forms in arrays
    const arrayItems = form.querySelectorAll('.array-item');
    arrayItems.forEach(item => {
        ensureDropdownsHaveSelection(item);
    });
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
                // Always select the first non-empty enum value for dropdowns
                const firstValue = prop.enum[0];
                input.value = firstValue;
                
                // Trigger a change event to update any dependent fields
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
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
    setTimeout(generateAfterFillTestData, 100);
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
    
    .warning-header {
        margin-top: 10px;
        font-weight: bold;
        color: #ff8c00; /* Dark orange for warnings */
    }
    
    .warning-item {
        margin: 5px 0;
        padding: 5px;
        border-left: 3px solid #ff8c00;
        background-color: #fff8e1;
    }
    
    .warning-path {
        font-weight: bold;
        margin-bottom: 3px;
    }
    
    .warning-message {
        color: #ff8c00;
    }
`;
document.head.appendChild(style);

function copyKlarnaPaymentReadyEMD() {
    const klarnaPaymentReadyOutput = document.getElementById('klarnaPaymentReadyOutput');
    const text = klarnaPaymentReadyOutput.textContent;
    
    if (!text) {
        alert('No Klarna Payment ready EMD to copy');
        return;
    }
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(text)
        .then(() => {
            // Provide visual feedback that the copy was successful
            const copyBtn = document.querySelector('#klarnaPaymentReadyPopup .popup-footer .generate-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            
            // Reset the button text after a short delay
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
}

// Common function to serialize EMD data
function serializeEMDData() {
    const output = document.getElementById('output').textContent;
    if (!output) {
        alert('Please generate EMD first');
        return null;
    }

    try {
        // Track the "Convert to String" button click in Google Analytics
        sendAnalyticsEvent('serialize_emd', {
            'event_category': 'EMD Actions',
            'event_label': 'Convert to String Button Click',
            'value': 1
        });
        
        // Parse the current EMD output and then stringify it to create a serialized string
        const emdData = JSON.parse(output);
        // Double stringify to create a JSON string that can be used as a string value
        const serialized = JSON.stringify(JSON.stringify(emdData));
        
        // Remove the outer quotes that double stringify adds
        return serialized.slice(1, -1);
    } catch (error) {
        console.error('Error serializing EMD:', error);
        alert('Error serializing EMD data');
        return null;
    }
}

function showSerializedEMD() {
    // Track the "Convert to String" button click in Google Analytics
    sendAnalyticsEvent('serialize_emd', {
        'event_category': 'EMD Actions',
        'event_label': 'Convert to String Button Click',
        'value': 1
    });
    
    const finalSerialized = serializeEMDData();
    if (!finalSerialized) return;
    
    // Show the serialized string in the popup
    const serializedOutput = document.getElementById('serializedOutput');
    serializedOutput.textContent = finalSerialized;
    
    // Show the popup with a smooth animation
    const popup = document.getElementById('serializePopup');
    popup.style.display = 'flex';
    
    // Force a reflow before adding the class to trigger animation
    void popup.offsetWidth;
    
    // Ensure window is scrolled to top to see the popup properly
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function showKlarnaPaymentReadyEMD() {
    // Track the "Klarna Payment ready EMD" button click in Google Analytics
    sendAnalyticsEvent('klarna_payment_ready_emd', {
        'event_category': 'EMD Actions',
        'event_label': 'Klarna Payment Ready EMD Button Click',
        'value': 1
    });
    
    const output = document.getElementById('output').textContent;
    if (!output) {
        alert('Please generate EMD first');
        return;
    }

    try {
        // Parse the current EMD output
        const emdData = JSON.parse(output);
        
        // Create the Klarna payment ready structure
        const paymentReadyEMD = {
            attachment: {
                content_type: "application/vnd.klarna.internal.emd-v2+json",
                body: JSON.stringify(emdData)
            }
        };
        
        // Format the JSON with indentation for display
        const formattedPaymentReadyEMD = JSON.stringify(paymentReadyEMD, null, 2);
        
        // Remove the first { and the last two closing braces }} to get just the content
        // Find the position of the second-to-last closing brace
        const lastIndex = formattedPaymentReadyEMD.lastIndexOf('}');
        const secondLastIndex = formattedPaymentReadyEMD.lastIndexOf('}', lastIndex - 1);
        
        // Extract content without the first { and last two }}
        const contentWithoutBraces = formattedPaymentReadyEMD
            .substring(1, secondLastIndex + 1)
            .trim();
        
        // Show the modified content in the popup
        const klarnaPaymentReadyOutput = document.getElementById('klarnaPaymentReadyOutput');
        klarnaPaymentReadyOutput.textContent = contentWithoutBraces;
        
        // Show the popup with a smooth animation
        const popup = document.getElementById('klarnaPaymentReadyPopup');
        popup.style.display = 'flex';
        
        // Force a reflow before adding the class to trigger animation
        void popup.offsetWidth;
        
        // Ensure window is scrolled to top to see the popup properly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error creating Klarna Payment ready EMD:', error);
        alert('Error creating Klarna Payment ready EMD');
    }
}

function closeSerializePopup() {
    const popup = document.getElementById('serializePopup');
    popup.style.display = 'none';
}

function closeKlarnaPaymentReadyPopup() {
    const popup = document.getElementById('klarnaPaymentReadyPopup');
    popup.style.display = 'none';
}

// Function to show serialized EMD from validator
function showSerializedValidatorEMD() {
    const inputArea = document.getElementById('emd-input');
    
    // Check if there's input to serialize
    if (!inputArea.value.trim()) {
        alert('Please enter EMD JSON and validate it first');
        return;
    }
    
    try {
        // Parse the input JSON
        const emdData = JSON.parse(inputArea.value);
        
        // Double stringify to create a JSON string that can be used as a string value
        const serialized = JSON.stringify(JSON.stringify(emdData));
        
        // Remove the outer quotes that double stringify adds
        const finalSerialized = serialized.slice(1, -1);
        
        // Show the serialized string in the popup
        const serializedOutput = document.getElementById('serializedOutput');
        serializedOutput.textContent = finalSerialized;
        
        // Show the popup with a smooth animation
        const popup = document.getElementById('serializePopup');
        popup.style.display = 'flex';
        
        // Force a reflow before adding the class to trigger animation
        void popup.offsetWidth;
        
        // Ensure window is scrolled to top to see the popup properly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error serializing EMD:', error);
        alert('Error serializing EMD data. Please ensure your JSON is valid.');
    }
}

// Function to show Klarna payment ready EMD from validator
function showKlarnaPaymentReadyValidatorEMD() {
    const inputArea = document.getElementById('emd-input');
    
    // Check if there's input to format
    if (!inputArea.value.trim()) {
        alert('Please enter EMD JSON and validate it first');
        return;
    }
    
    try {
        // Parse the input JSON
        const emdData = JSON.parse(inputArea.value);
        
        // Create the Klarna payment ready structure
        const paymentReadyEMD = {
            attachment: {
                content_type: "application/vnd.klarna.internal.emd-v2+json",
                body: JSON.stringify(emdData)
            }
        };
        
        // Format the JSON with indentation for display
        const formattedPaymentReadyEMD = JSON.stringify(paymentReadyEMD, null, 2);
        
        // Remove the first { and the last two closing braces }} to get just the content
        // Find the position of the second-to-last closing brace
        const lastIndex = formattedPaymentReadyEMD.lastIndexOf('}');
        const secondLastIndex = formattedPaymentReadyEMD.lastIndexOf('}', lastIndex - 1);
        
        // Extract content without the first { and last two }}
        const contentWithoutBraces = formattedPaymentReadyEMD
            .substring(1, secondLastIndex + 1)
            .trim();
        
        // Show the modified content in the popup
        const klarnaPaymentReadyOutput = document.getElementById('klarnaPaymentReadyOutput');
        klarnaPaymentReadyOutput.textContent = contentWithoutBraces;
        
        // Show the popup with a smooth animation
        const popup = document.getElementById('klarnaPaymentReadyPopup');
        popup.style.display = 'flex';
        
        // Force a reflow before adding the class to trigger animation
        void popup.offsetWidth;
        
        // Ensure window is scrolled to top to see the popup properly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error creating Klarna Payment ready EMD:', error);
        alert('Error creating Klarna Payment ready EMD. Please ensure your JSON is valid.');
    }
}

// Function to encode EMD to Base64 from generator
function encodeBase64EMD() {
    // Track the "Encode Base64" button click in Google Analytics
    sendAnalyticsEvent('base64_encode_emd', {
        'event_category': 'EMD Actions',
        'event_label': 'Encode Base64 Button Click',
        'value': 1
    });
    
    const output = document.getElementById('output').textContent;
    if (!output) {
        alert('Please generate EMD first');
        return;
    }

    try {
        // Parse the current EMD output
        const emdData = JSON.parse(output);
        
        // Convert to JSON string and then to Base64
        const jsonString = JSON.stringify(emdData);
        const base64Encoded = btoa(jsonString);
        
        // Show the Base64 encoded string in the popup
        const base64Output = document.getElementById('base64Output');
        base64Output.textContent = base64Encoded;
        
        // Show the popup
        const popup = document.getElementById('base64Popup');
        popup.style.display = 'flex';
        
        // Force a reflow before adding the class to trigger animation
        void popup.offsetWidth;
        
        // Ensure window is scrolled to top to see the popup properly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error encoding EMD to Base64:', error);
        alert('Error encoding EMD to Base64');
    }
}

// Function to encode EMD to Base64 from validator
function encodeBase64ValidatorEMD() {
    const inputArea = document.getElementById('emd-input');
    
    // Check if there's input to encode
    if (!inputArea.value.trim()) {
        alert('Please enter EMD JSON first');
        return;
    }
    
    try {
        // Parse the input JSON to validate it
        const emdData = JSON.parse(inputArea.value);
        
        // Convert to JSON string and then to Base64
        const jsonString = JSON.stringify(emdData);
        const base64Encoded = btoa(jsonString);
        
        // Show the Base64 encoded string in the popup
        const base64Output = document.getElementById('base64Output');
        base64Output.textContent = base64Encoded;
        
        // Show the popup
        const popup = document.getElementById('base64Popup');
        popup.style.display = 'flex';
        
        // Force a reflow before adding the class to trigger animation
        void popup.offsetWidth;
        
        // Ensure window is scrolled to top to see the popup properly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } catch (error) {
        console.error('Error encoding EMD to Base64:', error);
        alert('Error encoding EMD to Base64. Please ensure your JSON is valid.');
    }
}

// Function to copy Base64 encoded EMD to clipboard
function copyBase64EMD() {
    const base64Output = document.getElementById('base64Output');
    const text = base64Output.textContent;
    
    if (!text) {
        alert('No Base64 encoded EMD to copy');
        return;
    }
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(text)
        .then(() => {
            // Provide visual feedback that the copy was successful
            const copyBtn = document.querySelector('#base64Popup .popup-footer .generate-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            
            // Reset the button text after a short delay
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
}

// Function to close the Base64 popup
function closeBase64Popup() {
    document.getElementById('base64Popup').style.display = 'none';
}

// Add this function at the top of your file to handle offline analytics
function sendAnalyticsEvent(eventName, eventParams) {
    if (typeof gtag === 'function') {
        // Check if browser is online
        if (navigator.onLine) {
            gtag('event', eventName, eventParams);
            console.log('GA Event sent:', eventName);
        } else {
            console.warn('Browser is offline. Event not sent to Google Analytics:', eventName);
            
            // Store event in localStorage to send later when online
            try {
                const offlineEvents = JSON.parse(localStorage.getItem('offlineGAEvents') || '[]');
                offlineEvents.push({
                    eventName: eventName,
                    eventParams: eventParams,
                    timestamp: new Date().getTime()
                });
                localStorage.setItem('offlineGAEvents', JSON.stringify(offlineEvents));
                console.log('Event stored for later sending:', eventName);
            } catch (e) {
                console.error('Failed to store offline event:', e);
            }
        }
    } else {
        console.warn('Google Analytics not available - event not sent:', eventName);
    }
}

// Add event listener to send stored events when coming back online
window.addEventListener('online', function() {
    try {
        const offlineEvents = JSON.parse(localStorage.getItem('offlineGAEvents') || '[]');
        if (offlineEvents.length > 0) {
            console.log('Back online. Sending stored events:', offlineEvents.length);
            
            offlineEvents.forEach(event => {
                if (typeof gtag === 'function') {
                    gtag('event', event.eventName, event.eventParams);
                    console.log('Sent stored event:', event.eventName);
                }
            });
            
            // Clear stored events
            localStorage.removeItem('offlineGAEvents');
        }
    } catch (e) {
        console.error('Failed to process offline events:', e);
    }
});

function convertStringToJSON() {
    // Track the "Convert String to JSON" button click in Google Analytics
    sendAnalyticsEvent('convert_string_to_json', {
        'event_category': 'EMD Actions',
        'event_label': 'Convert String to JSON Button Click',
        'value': 1
    });
    
    const inputArea = document.getElementById('emd-input');
    const inputValue = inputArea.value.trim();
    
    if (!inputValue) {
        alert('Please enter a string to convert to JSON');
        return;
    }
    
    try {
        // Handle different input formats
        let jsonData;
        
        // Check if the input is already valid JSON
        try {
            JSON.parse(inputValue);
            alert('Input is already valid JSON. No conversion needed.');
            return;
        } catch (e) {
            // Not valid JSON, continue with conversion
        }
        
        // Process the input as a serialized string
        let processedInput = inputValue;
        
        // Remove any leading/trailing quotes if present
        if ((processedInput.startsWith('"') && processedInput.endsWith('"')) || 
            (processedInput.startsWith("'") && processedInput.endsWith("'"))) {
            processedInput = processedInput.slice(1, -1);
        }
        
        // Handle different escape patterns
        
        // 1. Replace escaped quotes with actual quotes
        processedInput = processedInput.replace(/\\"/g, '"');
        
        // 2. Handle double-escaped characters (e.g., \\n -> \n)
        processedInput = processedInput.replace(/\\\\n/g, '\\n');
        processedInput = processedInput.replace(/\\\\r/g, '\\r');
        processedInput = processedInput.replace(/\\\\t/g, '\\t');
        processedInput = processedInput.replace(/\\\\\//g, '\\/');
        processedInput = processedInput.replace(/\\\\b/g, '\\b');
        processedInput = processedInput.replace(/\\\\f/g, '\\f');
        
        // 3. Handle double-escaped backslashes
        processedInput = processedInput.replace(/\\\\\\\\/g, '\\\\');
        
        try {
            jsonData = JSON.parse(processedInput);
        } catch (parseError) {
            // If standard parsing fails, try an alternative approach
            try {
                // For strings that might be JSON.stringify'd multiple times
                // This is a common pattern in some API responses
                const evalSafe = (str) => {
                    // Using Function constructor is safer than eval
                    return (new Function('return ' + str))();
                };
                
                // Only attempt this if the string looks like it might be valid JSON
                if (/^\{.*\}$/.test(processedInput) || /^\[.*\]$/.test(processedInput)) {
                    jsonData = evalSafe(processedInput);
                } else {
                    throw new Error('Input does not appear to be valid JSON structure');
                }
            } catch (evalError) {
                throw new Error('Unable to parse the string as JSON. Please check the format.');
            }
        }
        
        // Format the JSON with proper indentation
        const formattedJSON = JSON.stringify(jsonData, null, 2);
        
        // Update the input area with the formatted JSON
        inputArea.value = formattedJSON;
        
        // Show success message
        const statusElement = document.getElementById('validation-status');
        const errorsElement = document.getElementById('validation-errors');
        
        statusElement.textContent = '✓ Successfully converted string to JSON';
        statusElement.className = 'validation-status valid';
        errorsElement.innerHTML = '';
        
    } catch (error) {
        console.error('Error converting string to JSON:', error);
        
        // Show error message
        const statusElement = document.getElementById('validation-status');
        const errorsElement = document.getElementById('validation-errors');
        
        statusElement.textContent = '✗ Error converting string to JSON';
        statusElement.className = 'validation-status invalid';
        errorsElement.innerHTML = `<div class="error-item">
            <span class="error-message">${error.message}</span>
        </div>`;
    }
}